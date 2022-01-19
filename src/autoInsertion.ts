import { Disposable, Document, events, InsertChange, Position, snippetManager, TextDocument, Thenable, workspace } from 'coc.nvim'

export function activateAutoInsertion(provider: (kind: 'autoQuote' | 'autoClose', document: TextDocument, position: Position) => Thenable<string>, supportedLanguages: { [id: string]: boolean }, disposables: Disposable[]): void {

  let bufnr: number
  let anyIsEnabled = false
  let timeout: NodeJS.Timer | undefined
  const isEnabled = {
    'autoQuote': false,
    'autoClose': false
  }
  workspace.document.then(doc => {
    bufnr = doc.bufnr
    updateEnabledState(doc.bufnr)
  })

  function updateEnabledState(bufnr: number) {
    anyIsEnabled = false
    const document = workspace.getDocument(bufnr)
    if (!document || !document.attached) return
    if (!supportedLanguages[document.textDocument.languageId]) {
      return
    }
    const configurations = workspace.getConfiguration('html', document.uri)
    isEnabled['autoQuote'] = configurations.get<boolean>('autoCreateQuotes') ?? false
    isEnabled['autoClose'] = configurations.get<boolean>('autoClosingTags') ?? false
    anyIsEnabled = isEnabled['autoQuote'] || isEnabled['autoClose']
  }

  events.on('BufEnter', async bn => {
    bufnr = bn
    if (timeout) clearTimeout(timeout)
    let doc = workspace.getDocument(bufnr)
    if (!doc) {
      doc = await workspace.document
    }
    updateEnabledState(doc ? doc.bufnr : -1)
  }, null, disposables)

  events.on('TextInsert', (bufnr: number, info: InsertChange, character: string) => {
    if (!anyIsEnabled) return
    let doc = workspace.getDocument(bufnr)
    if (!doc || !doc.attached || !supportedLanguages[doc.textDocument.languageId]) return
    if (timeout) clearTimeout(timeout)
    let position: Position = {
      line: info.lnum - 1,
      character: info.pre.length
    }
    if (isEnabled['autoQuote'] && character === '=') {
      doAutoInsert('autoQuote', doc, position, character)
    } else if (isEnabled['autoClose'] && (character === '>' || character === '/')) {
      doAutoInsert('autoClose', doc, position, character)
    }
  }, null, disposables)

  function doAutoInsert(kind: 'autoQuote' | 'autoClose', document: Document, position: Position, character: string) {
    const changedtick = document.changedtick
      ;(document as any).patchChange(true)
    timeout = setTimeout(() => {
      provider(kind, document.textDocument, position).then(text => {
        if (text && isEnabled[kind]) {
          if (bufnr == document.bufnr && document.changedtick == changedtick) {
            let end:Position = {character: position.character, line: position.line}
            if (character === '/') {
              let line = document.getline(position.line)
              let next = line[position.character]
              if (next == '>') {
                end.character = position.character + 1
              }
            }
            workspace.nvim.call('coc#_cancel', [], true)
            snippetManager.insertSnippet(text, true, {start: position, end})
          }
        }
      })
      timeout = undefined
    }, 100)
  }
}
