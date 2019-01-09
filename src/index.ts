import { ExtensionContext, LanguageClient, ServerOptions, workspace, services, TransportKind, LanguageClientOptions } from 'coc.nvim'
import path from 'path'

export async function activate(context: ExtensionContext): Promise<void> {
  let { subscriptions } = context
  const config = workspace.getConfiguration().get('html', {}) as any
  const enable = config.enable
  if (enable === false) return
  const file = context.asAbsolutePath('lib/server/htmlServerMain.js')
  const selector = config.filetypes || ['html', 'handlebars', 'razor']
  const embeddedLanguages = { css: true, javascript: true }

  let tagPaths: string[] = workspace.getConfiguration('html').get('experimental.custom.tags', [])
  let attributePaths: string[] = workspace.getConfiguration('html').get('experimental.custom.attributes', [])

  if (tagPaths && tagPaths.length > 0) {
    try {
      const workspaceRoot = workspace.rootPath
      tagPaths = tagPaths.map(d => {
        return path.resolve(workspaceRoot, d)
      })
    } catch (err) {
      tagPaths = []
    }
  }

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
      tagPaths,
      attributePaths

    }
  }

  let client = new LanguageClient('html', 'HTML language server', serverOptions, clientOptions)

  subscriptions.push(
    services.registLanguageClient(client)
  )
}
