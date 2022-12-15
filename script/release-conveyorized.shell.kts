#!/usr/bin/env hshell

@file:DependsOn("org.kohsuke:github-api:1.303")

// This script uses an internal scripting language to automate the release. Don't try to run it yourself.
// TODO: Move creating a GitHub Release into Conveyor itself, and then we can scrap this script.

import hydraulic.types.progress.ImmutableProgress
import org.kohsuke.github.GHFileNotFoundException
import org.kohsuke.github.GitHubBuilder
import org.tinylog.kotlin.Logger.debug
import hydraulic.kotlin.utils.assertIsFile

@Option(names = ["-b", "--body"], description = ["What text to put in the body of the GitHub release."], defaultValue = "")
lateinit var releaseBody: String

@Option(names = ["--package-version"], description = ["What version to use for the packages."], required = true)
lateinit var packageVersion: String

@Option(names = ["--release-version"], description = ["What version to use for the GitHub Release."], required = true)
lateinit var githubReleaseVersion: String

@Option(names = ["--conveyor-path"], description = ["Conveyor command to use"], defaultValue = "conveyor")
lateinit var conveyorPath: String

echo(Info("Cloning and building ..."))

val appName = "github-desktop"

path("conveyor.conf").assertIsFile()

val hsmDriver = "/Library/Frameworks/eToken.framework/Versions/Current/libeToken.dylib"
val hsmParam = if (path(hsmDriver).exists())
    "-Kapp.windows.signing-key=$hsmDriver"
else
    ""

"conveyor -Kapp.version=$packageVersion $hsmParam make site"()
val gh = GitHubBuilder.fromPropertyFile().build()

val siteFiles = cd("output") {
    val (siteFiles, releaseFiles) = ls().partition {
        it.fileName.toString().let { name -> name.endsWith(".png") || name == "download.html" }
    }
    val totalSize = releaseFiles.sumOf { it.fileSize() }

    echo(Info("Releasing signed version %s  [%.2f megabytes total]".format(packageVersion, totalSize / 1024.0 / 1024.0)))

    val repo = gh.getRepository("hydraulic-software/$appName")
    val release = try {
        repo
            .createRelease(githubReleaseVersion)
            .name(githubReleaseVersion)
            .body("A demo release using Conveyor (version $githubReleaseVersion). Please use the [download page](https://downloads.hydraulic.dev/github-desktop/download.html).")
            .create()
    } catch (e: GHFileNotFoundException) {
        throw UserError("Your personal access token needs to have 'repo' scope.")
    }

    var progressReport: ImmutableProgress =
        ProgressReport("Uploading files to release", totalSize, units = hydraulic.types.progress.Progress.Units.BYTES)
    for (f in releaseFiles) {
        val name = f.fileName.toString()
        val mimeType = when {
            name.endsWith(".msix") -> "application/msix"
            name.endsWith(".appinstaller") -> "application/appinstaller"
            name in setOf("InRelease", "Packages", "Release") -> "text/plain"
            name.endsWith(".rss") -> "application/rss+xml"
            else -> "application/octet-stream"
        }

        f.inputStream().buffered().use { stream ->
            release.uploadAsset(name, stream.withProgress(progressTracker, progressReport), mimeType)
        }
        progressReport = progressReport.withIncremented(f.fileSize())
    }

    siteFiles
}

check(siteFiles.isNotEmpty())
for (f in siteFiles)
    cp(f, "docs")
"git commit -a -m 'Update download site' docs"()
