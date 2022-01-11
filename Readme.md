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

- **html.enable**:

  default: `true`

- **html.execArgv**:

  default: `[]`

- **html.filetypes**:

  default: `["html","handlebars","htmldjango","blade"]`

- **html.customData**:

  A list of relative file paths pointing to JSON files following the [custom data format](https://github.com/microsoft/vscode-html-languageservice/blob/master/docs/customData.md).\n\ncoc-html loads custom data on startup to enhance its HTML support for the custom HTML tags, attributes and attribute values you specify in the JSON files.\n\nThe file paths are relative to workspace and only workspace folder settings are considered.

  default: `[]`

- **html.completion.attributeDefaultValue**:

  Controls the default value for attributes when completion is accepted, default: `"doublequotes"`

  Valid options: ["doublequotes", "singlequotes", "empty"]

- **html.format.enable**:

  Enable/disable default HTML formatter,  default: `true`

- **html.format.wrapLineLength**:

  Maximum amount of characters per line (0 = disable).,  default: `120`

- **html.format.unformatted**:

  List of tags, comma separated, that shouldn't be reformatted. 'null' defaults to all tags listed at https://www.w3.org/TR/html5/dom.html#phrasing-content.,  default: `"wbr"`

- **html.format.contentUnformatted**:

  List of tags, comma separated, where the content shouldn't be reformatted. 'null' defaults to the 'pre' tag.,  default: `"pre,code,textarea"`

- **html.format.indentInnerHtml**:

  Indent `<head>` and `<body>` sections, default: `false`

- **html.format.preserveNewLines**:

  Controls whether existing line breaks before elements should be preserved. Only works before elements, not inside tags or for text, default: `true`

- **html.format.maxPreserveNewLines**:

  List of tags, comma separated, that should have an extra newline before them. 'null',  default: `null`

- **html.format.indentHandlebars**:

  Format and indent `{{#foo}}` and `{{/foo}}`, default: `false`

- **html.format.endWithNewline**:

  End with a newline, default: `false`

- **html.format.extraLiners**:

  List of tags, comma separated, that should have an extra newline before them. `null` defaults to `\"head, body, /html\"`, default: `"head, body, /html"`

- **html.format.wrapAttributes**:

  Wrap attributes, default: `"auto"`

  Valid options: ["auto", "force", "force-aligned", "force-expand-multiline", "aligned-multiple", "preserve", "preserve-aligned"]

- **html.format.wrapAttributesIndentSize**:

  Alignment size when using 'force aligned' and 'aligned multiple' in `#html.format.wrapAttributes#` or `null` to use the default indent size, default: `null`

- **html.format.templating**:

  Honor django, erb, handlebars and php templating language tags, default: `false`

- **html.format.unformattedContentDelimiter**:

  Keep text content together between this string, default: `""`

- **html.suggest.html5**:

  Configures if the built-in HTML language support suggests HTML5 tags, properties and values.,  default: `true`

- **html.validate.scripts**:

  Configures if the built-in HTML language support validates embedded scripts.,  default: `true`

- **html.validate.styles**:

  Configures if the built-in HTML language support validates embedded styles.,  default: `true`

- **html.validate.html**:

  Configures if the built-in HTML language support validates HTML.,  default: `true`

- **html.autoClosingTags**:

  Enable/disable autoClosing of HTML tags, default: `true`

- **html.autoCreateQuotes**:

  Enable/disable auto creation of quotes for HTML attribute assignment, default:
  `true`

- **html.hover.documentation**:

  Show tag and attribute documentation in hover, default: `true`

- **html.hover.references**:

  Show references to MDN in hover, default: `true`

- **html.trace.server**:

  Traces the communication between coc.nvim and the HTML language server, default: `"off"`

  Valid options: ["off","messages","verbose"]

Trigger completion in `coc-settings.json` for complete list.

## License

MIT
