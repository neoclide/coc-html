import { DocumentRangeSemanticTokensProvider, DocumentSelector, DocumentSemanticTokensProvider, ExtensionContext, LanguageClient, LanguageClientOptions, languages, NotificationType, Range as LspRange, RequestType, RequestType0, ServerOptions, services, TextDocument, TextDocumentIdentifier, TransportKind, workspace } from 'coc.nvim'
import { Position, SelectionRange } from 'vscode-languageserver-types'
import { activateAutoInsertion } from './autoInsertion'
import { getCustomDataSource } from './customData'

// experimental: semantic tokens
interface SemanticTokenParams {
  textDocument: TextDocumentIdentifier
  ranges?: LspRange[]
}

interface AutoInsertParams {
  /**
   * The auto insert kind
   */
  kind: 'autoQuote' | 'autoClose'
  /**
   * The text document.
   */
  textDocument: TextDocumentIdentifier
  /**
   * The position inside the text document.
   */
  position: Position
}

namespace SemanticTokenLegendRequest {
  export const type: RequestType0<{ types: string[]; modifiers: string[] } | null, any> = new RequestType0('html/semanticTokenLegend')
}

namespace SemanticTokenRequest {
  export const type: RequestType<SemanticTokenParams, number[] | null, any> = new RequestType('html/semanticTokens')
}

namespace CustomDataChangedNotification {
  export const type: NotificationType<string[]> = new NotificationType('html/customDataChanged')
}

namespace CustomDataContent {
  export const type: RequestType<string, string, any> = new RequestType('html/customDataContent')
}

namespace AutoInsertRequest {
  export const type: RequestType<AutoInsertParams, string, any> = new RequestType('html/autoInsert')
}

function realActivate(context: ExtensionContext, filetypes: string[]) {
  let { subscriptions } = context
  const config = workspace.getConfiguration().get<any>('html', {}) as any
  const file = context.asAbsolutePath('lib/server.js')
  const selector: DocumentSelector = filetypes.map(id => {
    return { language: id }
  })
  const embeddedLanguages = { css: true, javascript: true }

  let serverOptions: ServerOptions = {
    module: file,
    args: ['--node-ipc'],
    transport: TransportKind.ipc,
    options: {
      cwd: workspace.root,
      execArgv: config.execArgv || []
    }
  }

  let clientOptions: LanguageClientOptions = {
    documentSelector: selector,
    synchronize: {
      configurationSection: ['html', 'css', 'javascript']
    },
    outputChannelName: 'html',
    initializationOptions: {
      embeddedLanguages,
      handledSchemas: ['file']
    }
  }

  let client = new LanguageClient('html', 'HTML language server', serverOptions, clientOptions)
  client.onReady().then(() => {
    const customDataSource = getCustomDataSource(context.subscriptions)

    client.sendNotification(CustomDataChangedNotification.type, customDataSource.uris)
    customDataSource.onDidChange(() => {
      client.sendNotification(CustomDataChangedNotification.type, customDataSource.uris)
    })
    client.onRequest(CustomDataContent.type, customDataSource.getContent)

    context.subscriptions.push(languages.registerSelectionRangeProvider(selector, {
      async provideSelectionRanges(document, positions: Position[]): Promise<SelectionRange[]> {
        const textDocument = { uri: document.uri }
        return await Promise.resolve(client.sendRequest<SelectionRange[]>('$/textDocument/selectionRanges', { textDocument, positions }))
      }
    }))

    const insertRequestor = (kind: 'autoQuote' | 'autoClose', document: TextDocument, position: Position): Promise<string> => {
      let param: AutoInsertParams = {
        kind,
        textDocument: {
          uri: document.uri
        },
        position
      }
      return client.sendRequest(AutoInsertRequest.type, param)
    }
    activateAutoInsertion(insertRequestor, { html: true, handlebars: true }, context.subscriptions)

    if (typeof languages.registerDocumentSemanticTokensProvider === 'function') {
      client.sendRequest(SemanticTokenLegendRequest.type).then(legend => {
        if (legend) {
          const provider: DocumentSemanticTokensProvider & DocumentRangeSemanticTokensProvider = {
            provideDocumentSemanticTokens(doc) {
              const params: SemanticTokenParams = {
                textDocument: { uri: doc.uri }
              }
              return client.sendRequest(SemanticTokenRequest.type, params).then(data => {
                return data && { data }
              })
            },
            provideDocumentRangeSemanticTokens(doc, range) {
              const params: SemanticTokenParams = {
                textDocument: {
                  uri: doc.uri
                },
                ranges: [range]
              }
              return client.sendRequest(SemanticTokenRequest.type, params).then(data => {
                return data && { data }
              })
            }
          }
          let lspLegend = { tokenTypes: legend.types, tokenModifiers: legend.modifiers }
          context.subscriptions.push(languages.registerDocumentSemanticTokensProvider(selector, provider, lspLegend))
          context.subscriptions.push(languages.registerDocumentRangeSemanticTokensProvider(selector, provider, lspLegend))
        }
      })
    }
  }, _e => {
    // noop
  })

  subscriptions.push(
    services.registLanguageClient(client)
  )
}

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration('html')
  const enable = config.get<boolean>('enable', true)
  if (enable === false) return
  const filetypes = config.get<string[]>('filetypes', ['html', 'handlebars', 'htmldjango', 'blade'])
  let activated = false
  for (let doc of workspace.textDocuments) {
    if (filetypes.includes(doc.languageId) && !activated) {
      activated = true
      realActivate(context, filetypes)
    }
  }
  if (!activated) {
    let disposable = workspace.onDidOpenTextDocument(e => {
      if (activated || !filetypes.includes(e.languageId)) return
      disposable.dispose()
      activated = true
      realActivate(context, filetypes)
    }, null, context.subscriptions)
  }
}
