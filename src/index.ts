import { ExtensionContext, languages, LanguageClient, ServerOptions, workspace, services, TransportKind, LanguageClientOptions } from 'coc.nvim'
import path from 'path'
import { getCustomDataPathsInAllWorkspaces, getCustomDataPathsFromAllExtensions } from './customData'
import { TextDocument, SelectionRange, Position } from 'vscode-languageserver-types'

export async function activate(context: ExtensionContext): Promise<void> {
  let { subscriptions } = context
  const config = workspace.getConfiguration().get<any>('html', {}) as any
  const enable = config.enable
  if (enable === false) return
  const file = context.asAbsolutePath('lib/server.js')
  const selector = config.filetypes || ['html', 'handlebars']
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
  }, _e => {
    // noop
  })

  subscriptions.push(
    services.registLanguageClient(client)
  )
}
