import { ExtensionContext, LanguageClient, LanguageClientOptions, languages, ServerOptions, services, TransportKind, workspace } from 'coc.nvim'
import { Position, SelectionRange } from 'vscode-languageserver-types'
import { getCustomDataPathsFromAllExtensions, getCustomDataPathsInAllWorkspaces } from './customData'
import { TextDocumentPositionParams, TextDocument, RequestType } from 'vscode-languageserver-protocol'

import { activateTagClosing } from './tagClosing'

namespace TagCloseRequest {
	export const type: RequestType<TextDocumentPositionParams, string, any, any> = new RequestType('html/tag')
}

export async function activate(context: ExtensionContext): Promise<void> {
  let { subscriptions } = context
  const config = workspace.getConfiguration().get<any>('html', {}) as any
  const enable = config.enable
  if (enable === false) return
  const file = context.asAbsolutePath('lib/server.js')
  const selector = config.filetypes || ['html', 'handlebars', 'htmldjango']
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

  let dataPaths = [
    ...getCustomDataPathsInAllWorkspaces(),
    ...getCustomDataPathsFromAllExtensions()
  ]

  let clientOptions: LanguageClientOptions = {
    documentSelector: selector,
    synchronize: {
      configurationSection: ['html', 'css', 'javascript']
    },
    outputChannelName: 'html',
    initializationOptions: {
      embeddedLanguages,
      dataPaths
    }
  }

  let client = new LanguageClient('html', 'HTML language server', serverOptions, clientOptions)
  client.onReady().then(() => {
    selector.forEach(selector => {
      context.subscriptions.push(languages.registerSelectionRangeProvider(selector, {
        async provideSelectionRanges(document: TextDocument, positions: Position[]): Promise<SelectionRange[]> {
          const textDocument = { uri: document.uri }
          return await Promise.resolve(client.sendRequest<SelectionRange[]>('$/textDocument/selectionRanges', { textDocument, positions }))
        }
      }))
    })

    const tagRequestor = (document: TextDocument, position: Position): Thenable<any> => {
      const param: TextDocumentPositionParams = {
        textDocument: {
          uri: document.uri,
        },
        position,
      }
      return client.sendRequest(TagCloseRequest.type as any, param)
    }
    context.subscriptions.push(
      activateTagClosing(tagRequestor, selector, 'html.autoClosingTags')
    )
  }, _e => {
    // noop
  })

  subscriptions.push(
    services.registLanguageClient(client)
  )
}
