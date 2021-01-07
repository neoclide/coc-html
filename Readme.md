# coc-html

Html language server extension for [coc.nvim](https://github.com/neoclide/coc.nvim).

Code changed from html extension of [VSCode](https://github.com/Microsoft/vscode/tree/master/extensions/html-language-features)

## Supporting

If you like this extension, consider supporting me on Patreon or PayPal:

<a href="https://www.patreon.com/chemzqm"><img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" alt="Patreon donate button" /> </a>
<a href="https://www.paypal.com/paypalme/chezqm"><img src="https://werwolv.net/assets/paypal_banner.png" alt="PayPal donate button" /> </a>

## Install

In your vim/neovim, run command:

```
:CocInstall coc-html
```

## Features

- Completion provider
- Formatting
- Document Symbols & Highlights
- Document Links
- CSS mode
- Javascript mode

## Configuration options

- *html.experimental.custom.tags*:

	A list of JSON file paths that define custom tags.

- *html.experimental.custom.attributes*:

	A list of JSON file paths that define custom attributes.

- *html.enable*:

	 default: `true`

- *html.execArgv*:

	 default: `[]`

- *html.trace.server*:

	 default: `"off"`

	Valid options: ["off","messages","verbose"]

- *html.filetypes*:

	 default: `["html","handlebars","htmldjango","blade"]`

- *html.format.enable*:

	Enable/disable default HTML formatter,  default: `true`

- *html.format.wrapLineLength*:

	Maximum amount of characters per line (0 = disable).,  default: `120`

- *html.format.unformatted*:

	List of tags, comma separated, that shouldn't be reformatted. 'null' defaults to all tags listed at https://www.w3.org/TR/html5/dom.html#phrasing-content.,  default: `"wbr"`

- *html.format.contentUnformatted*:

	List of tags, comma separated, where the content shouldn't be reformatted. 'null' defaults to the 'pre' tag.,  default: `"pre,code,textarea"`

- *html.format.indentInnerHtml*:

	 default: `false`

- *html.format.preserveNewLines*:

	 default: `true`

- *html.format.maxPreserveNewLines*:

	List of tags, comma separated, that should have an extra newline before them. 'null',  default: `null`

- *html.format.indentHandlebars*:

	 default: `false`

- *html.format.endWithNewline*:

	 default: `false`

- *html.format.extraLiners*:

	List of tags, comma separated, that should have an extra newline before them.,  default: `"head, body, /html"`

- *html.format.wrapAttributes*:

	 default: `"auto"`

	Valid options: ["auto","force","force-aligned","force-expand-multiline"]

- *html.suggest.angular1*:

	Configures if the built-in HTML language support suggests Angular V1 tags and properties.,  default: `true`

- *html.suggest.ionic*:

	Configures if the built-in HTML language support suggests Ionic tags, properties and values.,  default: `true`

- *html.suggest.html5*:

	Configures if the built-in HTML language support suggests HTML5 tags, properties and values.,  default: `true`

- *html.validate.scripts*:

	Configures if the built-in HTML language support validates embedded scripts.,  default: `true`

- *html.validate.styles*:

	Configures if the built-in HTML language support validates embedded styles.,  default: `true`

- *html.validate.html*:

	Configures if the built-in HTML language support validates HTML.,  default: `true`

- *html.autoClosingTags*:

	Enable/disable autoClosing of HTML tags.,  default: `false`

Trigger completion in `coc-settings.json` for complete list.

## License

MIT
