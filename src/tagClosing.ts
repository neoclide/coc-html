/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace, Disposable, snippetManager } from 'coc.nvim'
import { TextDocumentContentChangeEvent, TextDocument, Position, Range } from 'vscode-languageserver-protocol'

export function activateTagClosing(
  tagProvider: (document: TextDocument, position: Position) => Thenable<string>,
  supportedLanguages: string[],
  configName: string
): Disposable {

  let disposables: Disposable[] = []
  workspace.onDidChangeTextDocument(event => {
    const document = workspace.getDocument(event.textDocument.uri)
    if (!document) {
      return
    }
    onDidChangeTextDocument(document.textDocument, event.contentChanges)
      .catch(() => {
        // noop
      })
  }, null, disposables)

  let isEnabled = false
  updateEnabledState().catch(() => {
    // noop
  })

  disposables.push(
    workspace.registerAutocmd({
      event: ['BufEnter'],
      request: false,
      callback: updateEnabledState,
    }),
  )

  let timeout: NodeJS.Timer | undefined

  async function updateEnabledState(): Promise<void> {
    isEnabled = false
    const doc = await workspace.document
    if (!doc) {
      return
    }
    const document = doc.textDocument
    if (supportedLanguages.indexOf(document.languageId) === -1) {
      return
    }
    if (!workspace.getConfiguration(undefined, document.uri).get<boolean>(configName)) {
      return
    }
    isEnabled = true
  }

  async function onDidChangeTextDocument(
    document: TextDocument,
    changes: readonly TextDocumentContentChangeEvent[]
  ): Promise<void> {
    if (!isEnabled) {
      return
    }
    const doc = await workspace.document
    if (!doc) {
      return
    }
    let activeDocument = doc.textDocument
    if (document.uri !== activeDocument.uri || changes.length === 0) {
      return
    }
    if (typeof timeout !== 'undefined') {
      clearTimeout(timeout)
    }
    let lastChange = changes[changes.length - 1]
    if (!Range.is(lastChange['range']) || !lastChange.text) {
      return
    }
    let lastCharacter = lastChange.text[lastChange.text.length - 1]
    if (lastCharacter !== '>' && lastCharacter !== '/') {
      return
    }
    let rangeStart = lastChange['range'].start
    let version = document.version
    timeout = setTimeout(async () => {
      let position = Position.create(rangeStart.line, rangeStart.character + lastChange.text.length)
      tagProvider(document, position).then(async text => {
        if (text && isEnabled) {
          const doc = await workspace.document
          if (!doc) {
            return
          }
          let activeDocument = doc.textDocument
          if (document.uri === activeDocument.uri && activeDocument.version === version) {
            snippetManager.insertSnippet(text, false, Range.create(position, position))
              .catch(() => {
                // noop
              })
          }
        }
      })
      timeout = undefined
    }, 0)
  }
  return Disposable.create(() => {
    disposables.forEach(disposable => {
      disposable.dispose()
    })
    disposables = []
  })
}

function emptyRange(range: Range): boolean {
  return range.start.line == range.end.line && range.start.character == range.end.character
}
