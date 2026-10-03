import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, describe, it } from 'node:test'
import { commands, ServiceStat, services, workspace } from 'coc.nvim'
import { getLanguageService } from 'vscode-html-languageservice'
import { TextDocument } from 'vscode-languageserver-textdocument'
import * as extension from '../src/index'
import { getDocumentRegions } from '../server/modes/embeddedSupport'

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-html-test-'))

after(() => {
  fs.rmSync(fixtureRoot, { recursive: true, force: true })
})

function embeddedContent(html: string, languageId: string): string {
  const document = TextDocument.create('test:///index.html', 'html', 0, html)
  return getDocumentRegions(getLanguageService(), document).getEmbeddedDocument(languageId).getText()
}

async function openHtml(name: string, content: string) {
  const filepath = path.join(fixtureRoot, name)
  fs.writeFileSync(filepath, content)
  const escaped = await workspace.nvim.call('fnameescape', [filepath]) as string
  await workspace.nvim.command('filetype on')
  await workspace.nvim.command(`edit ${escaped}`)
  return workspace.document
}

async function getHtmlClient() {
  const deadline = Date.now() + 15000
  let service = services.getService('html')
  while (!service && Date.now() < deadline) {
    await new Promise<void>(resolve => setImmediate(resolve))
    service = services.getService('html')
  }
  assert.ok(service, 'HTML language service was not registered')
  if (service.state !== ServiceStat.Running) {
    await new Promise<void>((resolve, reject) => {
      let subscription: { dispose(): void } | undefined
      const timer = setTimeout(() => {
        subscription?.dispose()
        reject(new Error('HTML language service did not become ready'))
      }, 15000)
      const done = () => {
        clearTimeout(timer)
        subscription?.dispose()
        resolve()
      }
      subscription = service.onServiceReady(done)
      if (service.state === ServiceStat.Running) done()
    })
  }
  assert.ok(service.client, 'HTML language client is unavailable')
  return service.client
}

async function waitUntil(condition: () => boolean | Promise<boolean>, message: string, timeout = 10000): Promise<void> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await condition()) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error(message)
}

async function waitForLine(expected: string): Promise<void> {
  await waitUntil(
    async () => await workspace.nvim.call('getline', [1]) === expected,
    `line did not become ${JSON.stringify(expected)}`
  )
}

describe('coc-html extension', () => {
  it('loads the source entry without eagerly starting the server', () => {
    assert.equal(typeof extension.activate, 'function')
    assert.equal(services.getService('html'), undefined)
  })

  it('preserves embedded CSS offsets while decoding escaped quotes', () => {
    assert.equal(
      embeddedContent('<div style="font-family: &quot;Arial&#34;"></div>', 'css'),
      '         __{font-family: "     Arial    "}       '
    )
  })

  it('converts each single-line HTML comment without changing JavaScript block comments', () => {
    assert.equal(
      embeddedContent('<script><!--a--> foo(); <!--b--> /* --> */</script>', 'javascript'),
      '        /* a */ foo(); /* b */ /* --> */         '
    )
  })

  it('starts lazily and isolates declarations in module scripts', async () => {
    const document = await openHtml('modules.html', [
      '<script>let value = 1;</script>',
      '<script type=MODULE>let value = 2;</script>',
      '<script type="module">let value = 3;</script>'
    ].join('\n'))
    assert.equal(document.languageId, 'html')
    assert.equal(document.attached, true)
    const client = await getHtmlClient()
    const report = await client.sendRequest<{ items: Array<{ code?: number | string; message: string }> }>(
      'textDocument/diagnostic',
      { textDocument: { uri: document.uri } }
    )
    assert.deepEqual(report.items, [])
  })

  it('serves embedded CSS completion from the bundled ESM language service', async () => {
    const text = '<style>.a { colo }</style>'
    const document = await openHtml('css-completion.html', text)
    const client = await getHtmlClient()
    const result = await client.sendRequest<{ items: Array<{ label: string }> }>(
      'textDocument/completion',
      {
        textDocument: { uri: document.uri },
        position: { line: 0, character: text.indexOf('colo') + 4 }
      }
    )
    assert.ok(result.items.some(item => item.label === 'color'))
  })

  it('returns JSDoc summaries and tags from script hovers', async () => {
    const document = await openHtml('hover.html', [
      '<script>',
      '/** Greets a person. @param name person to greet */',
      'function greet(name) { return `Hello ${name}`; }',
      'greet("world");',
      '</script>'
    ].join('\n'))
    const client = await getHtmlClient()
    const hover = await client.sendRequest<{ contents: string | { value: string } } | null>(
      'textDocument/hover',
      { textDocument: { uri: document.uri }, position: { line: 3, character: 2 } }
    )
    assert.ok(hover)
    const value = typeof hover.contents === 'string' ? hover.contents : hover.contents.value
    assert.match(value, /```typescript[\s\S]*greet[\s\S]*```/)
    assert.match(value, /Greets a person\./)
    assert.match(value, /@param[\s\S]*name[\s\S]*person to greet/)
  })

  it('completes and closes an HTML tag without an extra angle bracket', { timeout: 20000 }, async () => {
    const document = await openHtml('auto-close-completion.html', '')
    await getHtmlClient()

    try {
      await workspace.nvim.command("call feedkeys('i<ht', 't')")
      await waitForLine('<ht')
      await document.synchronize()
      await commands.executeCommand('editor.action.triggerSuggest')
      await waitUntil(async () => {
        if (await workspace.nvim.call('coc#pum#visible', []) !== 1) return false
        const winid = await workspace.nvim.call('coc#pum#winid', []) as number
        const words = await workspace.nvim.call('getwinvar', [winid, 'words']) as string[]
        return words.includes('html')
      }, 'HTML completion did not appear')
      const winid = await workspace.nvim.call('coc#pum#winid', []) as number
      const words = await workspace.nvim.call('getwinvar', [winid, 'words']) as string[]
      await workspace.nvim.call('coc#pum#select', [words.indexOf('html'), 1, 0])
      await waitForLine('<html')
      await workspace.nvim.call('coc#pum#close', ['confirm'])
      await waitUntil(
        async () => await workspace.nvim.call('coc#pum#visible', []) === 0,
        'HTML completion popup did not close after confirmation'
      )
      await waitForLine('<html')
      await workspace.nvim.command("call feedkeys('>', 't')")
      await waitForLine('<html></html>')
      assert.equal((await workspace.nvim.call('getline', [1]) as string).startsWith('<<'), false)
    } finally {
      await workspace.nvim.command('stopinsert')
    }
  })
})
