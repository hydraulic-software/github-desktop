import * as React from 'react'
import { ReleaseNote, ReleaseSummary } from '../../models/release-notes'
import { LinkButton } from '../lib/link-button'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { RichText } from '../lib/rich-text'
import { shell } from '../../lib/app-shell'
import { ReleaseNotesUri } from '../lib/releases'
import { DesktopFakeRepository } from '../../lib/desktop-fake-repository'
import {
  ReleaseNoteHeaderLeftUri,
  ReleaseNoteHeaderRightUri,
} from '../../lib/release-notes'
import { SandboxedMarkdown } from '../lib/sandboxed-markdown'
import { Button } from '../lib/button'

interface IReleaseNotesProps {
  readonly onDismissed: () => void
  readonly emoji: Map<string, string>
  readonly newReleases: ReadonlyArray<ReleaseSummary>
}

/**
 * The dialog to show with details about the newest release
 */
export class ReleaseNotes extends React.Component<IReleaseNotesProps, {}> {
  private renderList(
    releaseEntries: ReadonlyArray<ReleaseNote>,
    header: string
  ): JSX.Element | null {
    if (releaseEntries.length === 0) {
      return null
    }

    const options = new Array<JSX.Element>()

    for (const [i, entry] of releaseEntries.entries()) {
      options.push(
        <li key={i}>
          <RichText
            text={entry.message}
            emoji={this.props.emoji}
            renderUrlsAsLinks={true}
            repository={DesktopFakeRepository}
          />
        </li>
      )
    }

    return (
      <div className="section">
        <p className="header">
          <strong>{header}</strong>
        </p>
        <ul className="entries">{options}</ul>
      </div>
    )
  }

  private drawSingleColumnLayout(release: ReleaseSummary): JSX.Element {
    return (
      <div className="container">
        <div className="column">
          {this.renderList(release.bugfixes, 'Bugfixes')}
          {this.renderList(release.enhancements, 'Enhancements')}
          {this.renderList(release.other, 'Other')}
        </div>
      </div>
    )
  }

  private drawTwoColumnLayout(release: ReleaseSummary): JSX.Element {
    return (
      <div className="container">
        <div className="column">
          {this.renderList(release.enhancements, 'Enhancements')}
          {this.renderList(release.other, 'Other')}
        </div>
        <div className="column">
          {this.renderList(release.bugfixes, 'Bugfixes')}
        </div>
      </div>
    )
  }

  /**
   * If there is just one release, it returns it. If multiple, it merges the release notes.
   */
  private getDisplayRelease = () => {
    const { newReleases } = this.props

    const latestRelease = newReleases.at(0)
    const oldestRelease = newReleases.at(-1)

    if (
      latestRelease === undefined ||
      oldestRelease === undefined ||
      latestRelease === oldestRelease
    ) {
      return latestRelease
    }

    return {
      latestVersion: `${oldestRelease.latestVersion} - ${latestRelease.latestVersion}`,
      datePublished: `${oldestRelease.datePublished} to ${latestRelease.datePublished}`,
      enhancements: newReleases.flatMap(r => r.enhancements),
      bugfixes: newReleases.flatMap(r => r.bugfixes),
      pretext: newReleases.flatMap(r => r.pretext),
      other: [],
      thankYous: [],
    }
  }

  private renderPretext = (pretext: ReadonlyArray<ReleaseNote>) => {
    if (pretext.length === 0) {
      return
    }

    return (
      <SandboxedMarkdown
        markdown={pretext[0].message}
        emoji={this.props.emoji}
        onMarkdownLinkClicked={this.onMarkdownLinkClicked}
      />
    )
  }

  public render() {
    const release = this.getDisplayRelease()

    if (release === undefined) {
      return null
    }

    const { latestVersion, datePublished, enhancements, bugfixes, pretext } =
      release

    const contents =
      enhancements.length > 0 && bugfixes.length > 0
        ? this.drawTwoColumnLayout(release)
        : this.drawSingleColumnLayout(release)

    const dialogHeader = (
      <div className="release-notes-header">
        <img
          className="release-note-graphic-left"
          src={ReleaseNoteHeaderLeftUri}
          alt=""
        />
        <div className="title">
          <p className="version">Version {latestVersion}</p>
          <p className="date">{datePublished}</p>
        </div>
        <img
          className="release-note-graphic-right"
          src={ReleaseNoteHeaderRightUri}
          alt=""
        />
      </div>
    )

    return (
      <Dialog
        id="release-notes"
        onDismissed={this.props.onDismissed}
        title={dialogHeader}
      >
        <DialogContent>
          {this.renderPretext(pretext)}
          {contents}
        </DialogContent>
        <DialogFooter>
          <LinkButton onClick={this.showAllReleaseNotes}>
            View all release notes
          </LinkButton>
          <Button type="submit" onClick={this.props.onDismissed}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    )
  }

  private showAllReleaseNotes = () => {
    shell.openExternal(ReleaseNotesUri)
  }

  private onMarkdownLinkClicked = (url: string) => {
    shell.openExternal(url)
  }
}
