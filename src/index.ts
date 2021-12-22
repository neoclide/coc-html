import { DocumentSelector, NotificationType, TextDocumentPositionParams, RequestType, ExtensionContext, LanguageClient, LanguageClientOptions, languages, ServerOptions, services, TransportKind, workspace } from 'coc.nvim'
import { Position, SelectionRange } from 'vscode-languageserver-types'
import {getCustomDataSource} from './customData'

import { activateTagClosing } from './tagClosing'

namespace CustomDataChangedNotification {
	export const type: NotificationType<string[]> = new NotificationType('html/customDataChanged');
}

namespace CustomDataContent {
	export const type: RequestType<string, string, any> = new RequestType('html/customDataContent');
}

namespace TagCloseRequest {
  export const type: RequestType<TextDocumentPositionParams, string, any> = new RequestType('html/tag')
}

function realActivate(context: ExtensionContext, filetypes:string[]) {
  let { subscriptions } = context
  const config = workspace.getConfiguration().get<any>('html', {}) as any
  const file = context.asAbsolutePath('lib/server.js')
  const selector: DocumentSelector = filetypes.map(id => {
    return {language: id}
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
		});
		client.onRequest(CustomDataContent.type, customDataSource.getContent)

    context.subscriptions.push(languages.registerSelectionRangeProvider(selector, {
      async provideSelectionRanges(document, positions: Position[]): Promise<SelectionRange[]> {
        const textDocument = { uri: document.uri }
        return await Promise.resolve(client.sendRequest<SelectionRange[]>('$/textDocument/selectionRanges', { textDocument, positions }))
      }
    }))

    const tagRequestor = (document, position: Position): Thenable<any> => {
      const param: TextDocumentPositionParams = {
        textDocument: {
          uri: document.uri,
        },
        position,
      }
      return client.sendRequest(TagCloseRequest.type as any, param)
    }
    context.subscriptions.push(
      activateTagClosing(tagRequestor, filetypes, 'html.autoClosingTags')
    )
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
