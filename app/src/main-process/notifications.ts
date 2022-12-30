import {initializeNotifications, onNotificationEvent, terminateNotifications,} from 'desktop-notifications'
import {BrowserWindow} from 'electron'
import {DesktopAliveEvent} from '../lib/stores/alive-store'
import * as ipcWebContents from './ipc-webcontents'

let windowsToastActivatorClsid: string | undefined = undefined

export function initializeDesktopNotifications() {
  if (__LINUX__) {
    // notifications not currently supported
    return
  }

  if (__DARWIN__) {
    initializeNotifications({})
    return
  }

  // This CLSID is originally a hash of a string calculated by Squirrel, but we can just continue using it post Conveyorization.
  windowsToastActivatorClsid = '{27D44D0C-A542-5B90-BCDB-AC3126048BA2}'
  log.info(`Using toast activator CLSID ${windowsToastActivatorClsid}`)
  initializeNotifications({ toastActivatorClsid: windowsToastActivatorClsid })
}

export function terminateDesktopNotifications() {
  terminateNotifications()
}

export function installNotificationCallback(window: BrowserWindow) {
  onNotificationEvent<DesktopAliveEvent>((event, id, userInfo) => {
    ipcWebContents.send(
      window.webContents,
      'notification-event',
      event,
      id,
      userInfo
    )
  })
}
