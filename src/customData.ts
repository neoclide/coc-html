/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace, extensions, Uri, Emitter, Disposable, fetch } from 'coc.nvim'
import fs from 'fs'
import { Utils } from 'vscode-uri'
import {TextDecoder, promisify} from 'util'

export function getCustomDataSource(toDispose: Disposable[]) {
  let localExtensionUris = new Set<string>()
  let externalExtensionUris = new Set<string>()
  const workspaceUris = new Set<string>()

  collectInWorkspaces(workspaceUris)
  collectInExtensions(localExtensionUris, externalExtensionUris)

  const onChange = new Emitter<void>()
  toDispose.push(
    extensions.onDidActiveExtension(_ => {
      const newLocalExtensionUris = new Set<string>()
      const newExternalExtensionUris = new Set<string>()
      collectInExtensions(newLocalExtensionUris, newExternalExtensionUris)
      if (
        hasChanges(newLocalExtensionUris, localExtensionUris) ||
        hasChanges(newExternalExtensionUris, externalExtensionUris)
      ) {
        localExtensionUris = newLocalExtensionUris
        externalExtensionUris = newExternalExtensionUris
        onChange.fire()
      }
    })
  )
  toDispose.push(
    workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('html.customData')) {
        workspaceUris.clear()
        collectInWorkspaces(workspaceUris)
        onChange.fire()
      }
    })
  )

  toDispose.push(
    workspace.onDidChangeTextDocument(e => {
      const path = e.textDocument.uri
      if (externalExtensionUris.has(path) || workspaceUris.has(path)) {
        onChange.fire()
      }
    })
  )

  return {
    get uris() {
      return [...localExtensionUris].concat(
        [...externalExtensionUris],
        [...workspaceUris]
      )
    },
    get onDidChange() {
      return onChange.event
    },
    getContent(uriString: string): Thenable<string> {
      const uri = Uri.parse(uriString)
      if (uri.scheme === 'file') {
        return promisify(fs.readFile)(uri.fsPath).then(buffer => {
          return new TextDecoder().decode(buffer)
        })
      }
      return fetch(uriString, { timeout: 5000, buffer: true }).then(res => {
        return new TextDecoder().decode(res as Buffer)
      })
    }
  }
}

function hasChanges(s1: Set<string>, s2: Set<string>) {
  if (s1.size !== s2.size) {
    return true
  }
  for (const uri of s1) {
    if (!s2.has(uri)) {
      return true
    }
  }
  return false
}

function isURI(uriOrPath: string) {
  return /^(?<scheme>\w[\w\d+.-]*):/.test(uriOrPath)
}

function collectInWorkspaces(workspaceUris: Set<string>): void {
  const workspaceFolders = workspace.workspaceFolders
  if (!workspaceFolders) return

  const collect = (uriOrPaths: string[] | undefined, rootUri: string) => {
    if (Array.isArray(uriOrPaths)) {
      for (const uriOrPath of uriOrPaths) {
        if (typeof uriOrPath === 'string') {
          if (!isURI(uriOrPath)) {
            // path in the workspace
            workspaceUris.add(
              Utils.resolvePath(Uri.parse(rootUri), uriOrPath).toString()
            )
          } else {
            // external uri
            workspaceUris.add(uriOrPath)
          }
        }
      }
    }
  }

  for (let i = 0; i < workspaceFolders.length; i++) {
    const folderUri = workspaceFolders[i].uri
    const allHtmlConfig = workspace.getConfiguration('html', folderUri)
    const customDataInspect = allHtmlConfig.inspect<string[]>('customData')
    if (customDataInspect) {
      collect(customDataInspect.workspaceValue, folderUri)
      if (i === 0) {
        collect(customDataInspect.globalValue, folderUri)
      }
    }
  }
}

function collectInExtensions(
  localExtensionUris: Set<string>,
  externalUris: Set<string>
): void {
  for (const extension of extensions.all) {
    const customData = extension.packageJSON?.contributes?.html?.customData
    if (Array.isArray(customData)) {
      for (const uriOrPath of customData) {
        if (!isURI(uriOrPath)) {
          let extensionUri = Uri.file(extension.extensionPath)
          // relative path in an extension
          localExtensionUris.add(
            Utils.joinPath(extensionUri, uriOrPath).toString()
          )
        } else {
          // external uri
          externalUris.add(uriOrPath)
        }
      }
    }
  }
}
