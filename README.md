# Conveyorized version of [GitHub Desktop](https://desktop.github.com)

This repository shows how to package a complex real world Electron app with [Conveyor](https://hydraulic.software/). It features:

- Automatic online updates, checked at each launch.
- Files released via GitHub Releases.
- The [generated download page](https://hydraulic-software.github.io/github-desktop/download.html) being hosted by GitHub pages.

Conveyor is a tool that makes distributing desktop apps easier. It builds, signs and notarizes self-updating
packages for you and offers many useful features, like cross-building/signing of packages, different update modes (silent/background and
update-at-launch), and [much more](https://conveyor.hydraulic.dev/).

## Packaging

There are three parts. Let's look at them in turn.

Open [conveyor.conf](conveyor.conf) where there are extensive comments. The package can be built by installing Conveyor and 
then running:

```
conveyor make site
```

The output directory will now contain packages for Windows, Mac Intel and Mac ARM along with update repository metadata and a generated
download page.

The `conveyor.conf` file imports the raw files to package from the output of a [GitHub Actions CI job](.github/workflows/ci.yml). This is
useful because even though GH Desktop is written in TypeScript the build system picks different node.js extensions and produces 
customized JS bundles depending on what OS you build it on. Conveyor can make packages for all supported OS' from whatever you choose to
run it on, and it would be possible to extend the GH Desktop build system to support the same feature to allow arbitrary cross-builds.

## Releasing

To do a release: 

* Run `conveyor make site --rerun=all`.
* Put the output files into a new GitHub release, except for the `download.html`.
* Put `download.html` into the `docs` subdirectory, commit and push.

## Packaging features used

This repo demos:

1. Importing `package.json` files to avoid redundant configuration.
2. Downloading the results of GitHub Actions.
3. Setting which operating systems and CPU architectures are supported.
4. [Aggressive updates](https://conveyor.hydraulic.dev/5.0/configs/#update-modes), which makes these packages check for new versions on every launch. Try downloading the old Mac release and then
   running it to see the update in action (on Windows the installer EXE will always install the latest version).
5. [Registering URL schemes](https://conveyor.hydraulic.dev/5.0/configs/os-integration/#url-handlers-deep-linking) for OAuth logins.
6. Setting [custom metadata and entitlements](https://conveyor.hydraulic.dev/5.0/configs/os-integration/#custom-integrations) for Mac apps.

These packages are code-signed but you can create self-signed projects if you want.

## Comparison to other tools

You can compare the config against the code needed to use other Electron packaging tools by reading the [script/build.ts] and [script/package.ts] files.
The `packageApp()` function in `build.ts` and everything reachable from it could be deleted, along with the whole of `package.ts`. You could
also delete all the code that sets up and instantiates the update manager, because Conveyor doesn't require you to do anything to initialize
the update system.

There are some feature differences vs apps packaged using Electron Forge/Squirrel. On Windows:

* Your app will update itself in the background even when not in use, using the same background transfer service Windows Update
  uses. As a consequence your app will be always up-to-date even if only used rarely.
* There is no .NET dependency.
* Enterprise rollouts are easier:
  * You don't need to do anything special for IT departments. The MSIX file Conveyor creates is sufficient to give them a good experience. 
  * Your app doesn't install itself to the user's home directory, which can cause problems with profile roaming on managed networks.
* Fractional rollouts aren't currently supported. You can have a beta channel though just by creating two different sites.

On macOS the [Sparkle 2 framework](https://sparkle-project.org/) is used instead of Squirrel.Mac.

## License

**[MIT](LICENSE)**

The MIT license grant is not for GitHub's trademarks, which include the logo
designs. GitHub reserves all trademark and copyright rights in and to all
GitHub trademarks. GitHub's logos include, for instance, the stylized
Invertocat designs that include "logo" in the file title in the following
folder: [logos](app/static/logos).

GitHub® and its stylized versions and the Invertocat mark are GitHub's
Trademarks or registered Trademarks. When using GitHub's logos, be sure to
follow the GitHub [logo guidelines](https://github.com/logos).
