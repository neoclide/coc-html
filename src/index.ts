import { CancellationToken, Disposable, DocumentRangeSemanticTokensProvider, DocumentSelector, DocumentSemanticTokensProvider, ExtensionContext, FormattingOptions, LanguageClient, LanguageClientOptions, languages, NotificationType, ProviderResult, Range as LspRange, Range, RequestType, RequestType0, ServerOptions, services, TextDocument, TextDocumentIdentifier, TextEdit, TransportKind, workspace } from 'coc.nvim'
import { TextDecoder } from 'util'
import { DocumentRangeFormattingRequest } from 'vscode-languageserver-protocol'
import { Position } from 'vscode-languageserver-types'
import { activateAutoInsertion } from './autoInsertion'
import { getCustomDataSource } from './customData'
import { getNodeFileFS } from './nodeFs'
import { Runtime, serveFileSystemRequests } from './requests'

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

namespace SettingIds {
  export const linkedEditing = 'editor.linkedEditing'
  export const formatEnable = 'html.format.enable'
}

async function realActivate(context: ExtensionContext, filetypes: string[]): Promise<void> {
  let { subscriptions } = context
  const config = workspace.getConfiguration().get<any>('html', {}) as any
  const serverModule = context.asAbsolutePath('lib/server.js')
  const selector: DocumentSelector = filetypes.map(id => {
    return { language: id }
  })

  const timer = {
    setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable {
      const handle = setTimeout(callback, ms, ...args)
      return { dispose: () => clearTimeout(handle) }
    }
  }
  const runtime: Runtime = { fileFs: getNodeFileFS(), TextDecoder, timer }

  const embeddedLanguages = { css: true, javascript: true }
  let rangeFormatting: Disposable | undefined = undefined

  const debugOptions = { execArgv: ['--nolazy', '--inspect=' + (8000 + Math.round(Math.random() * 999))] }

  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc, options: { execArgv: config.execArgv || [] } },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  }

  let clientOptions: LanguageClientOptions = {
    documentSelector: selector,
    synchronize: {
      configurationSection: ['html', 'css', 'javascript']
    },
    outputChannelName: 'html',
    initializationOptions: {
      embeddedLanguages,
      handledSchemas: ['file'],
      provideFormatter: false, // tell the server to not provide formatting capability and ignore the `html.format.enable` setting.
      customCapabilities: { rangeFormatting: { editLimit: 10000 } }
    }
  }

  let client = new LanguageClient('html', 'HTML language server', serverOptions, clientOptions)
  await client.start()

  function updateFormatterRegistration() {
    const formatEnabled = workspace.getConfiguration().get(SettingIds.formatEnable)
    if (!formatEnabled && rangeFormatting) {
      rangeFormatting.dispose()
      rangeFormatting = undefined
    } else if (formatEnabled && !rangeFormatting) {
      rangeFormatting = languages.registerDocumentRangeFormatProvider(filetypes, {
        provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
          const params = { textDocument: { uri: document.uri }, range, options }
          return client.sendRequest(DocumentRangeFormattingRequest.type as any, params, token).catch((error) => {
              client.handleFailedRequest(DocumentRangeFormattingRequest.type as any, undefined, error, [])
              return Promise.resolve([]) as any
            }
          ) as Promise<TextEdit[]>
        }
      })
    }
  }

  subscriptions.push(serveFileSystemRequests(client, runtime))
  client.onReady().then(() => {
    // manually register / deregister format provider based on the `html.format.enable` setting avoiding issues with late registration. See #71652.
    updateFormatterRegistration()
    subscriptions.push({ dispose: () => rangeFormatting && rangeFormatting.dispose() })
    subscriptions.push(workspace.onDidChangeConfiguration(e => e.affectsConfiguration(SettingIds.formatEnable) && updateFormatterRegistration()))

    const customDataSource = getCustomDataSource(context.subscriptions)
    client.sendNotification(CustomDataChangedNotification.type, customDataSource.uris)
    customDataSource.onDidChange(() => {
      client.sendNotification(CustomDataChangedNotification.type, customDataSource.uris)
    })
    client.onRequest(CustomDataContent.type, customDataSource.getContent)

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
    const autoInsertionSupportedLanguages: { [id: string]: boolean } = Object.assign({}, ...filetypes.map((id) => ({ [id]: true })))
    activateAutoInsertion(insertRequestor, autoInsertionSupportedLanguages, context.subscriptions)

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
