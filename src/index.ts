import { ExtensionContext, LanguageClient, ServerOptions, workspace, services, TransportKind, LanguageClientOptions } from 'coc.nvim'

export async function activate(context: ExtensionContext): Promise<void> {
  let { subscriptions } = context
  const config = workspace.getConfiguration().get('html', {}) as any
  const enable = config.enable
  if (enable === false) return
  const file = context.asAbsolutePath('lib/server/htmlServerMain.js')
  const selector = config.filetypes || ['html', 'handlebars', 'razor']
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
      embeddedLanguages
    }
  }

  let client = new LanguageClient('html', 'HTML language server', serverOptions, clientOptions)

  subscriptions.push(
    services.registLanguageClient(client)
  )
}
