# coc-html

Html language server extension for [coc.nvim](https://github.com/neoclide/coc.nvim).

## Install

In your vim/neovim, run command:

```
:CocInstall coc-html
```

## Features

* Completion provider
* Formatting
* Document Symbols & Highlights
* Document Links
* CSS mode
* Javascript mode

## Configuration options

* `html.enable` set to `false` to disable html language server.
* `html.trace.server` trace LSP traffic in output channel.
* `html.execArgv` add `execArgv` to `child_process.spawn`
* `html.filetypes` default `[ "html", "handlebars", "razor" ]`.
* `html.format.enable` enable format support.
* `html.validate.scripts` validate for embedded scripts.
* `html.validate.styles` validate for embedded styles.

Trigger completion in `coc-settings.json` for complete list.

## License

MIT
