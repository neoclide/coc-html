/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path'
import { Uri, workspace, extensions } from 'coc.nvim'

interface ExperimentalConfig {
  experimental?: {
    customData?: string[];
  }
}

export function getCustomDataPathsInAllWorkspaces(): string[] {
  const dataPaths: string[] = []
  const workspaceFolders = workspace.workspaceFolders

  if (!workspaceFolders) {
    return dataPaths
  }

  workspaceFolders.forEach(wf => {
    const allHtmlConfig = workspace.getConfiguration(undefined, wf.uri)
    const wfHtmlConfig = allHtmlConfig.inspect<ExperimentalConfig>('html') as any

    if (
      wfHtmlConfig &&
      wfHtmlConfig.workspaceFolderValue &&
      wfHtmlConfig.workspaceFolderValue.experimental &&
      wfHtmlConfig.workspaceFolderValue.experimental.customData
    ) {
      const customData = wfHtmlConfig.workspaceFolderValue.experimental.customData
      if (Array.isArray(customData)) {
        customData.forEach(t => {
          if (typeof t === 'string') {
            dataPaths.push(path.resolve(Uri.parse(wf.uri).fsPath, t))
          }
        })
      }
    }
  })

  return dataPaths
}

export function getCustomDataPathsFromAllExtensions(): string[] {
  const dataPaths: string[] = []

  for (const extension of extensions.all) {
    const contributes = extension.packageJSON && extension.packageJSON.contributes

    if (
      contributes &&
      contributes.html &&
      contributes.html.experimental.customData &&
      Array.isArray(contributes.html.experimental.customData)
    ) {
      const relativePaths: string[] = contributes.html.experimental.customData
      relativePaths.forEach(rp => {
        dataPaths.push(path.resolve(extension.extensionPath, rp))
      })
    }
  }

  return dataPaths
}
