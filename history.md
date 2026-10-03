## 1.9.0

- Sync the HTML and embedded CSS language services with VS Code's September 2026 versions while retaining the Coc server bundle and settings.
- Require Node.js 22 and migrate development and CI workflows to npm.
- Improve embedded CSS and JavaScript handling, including isolated validation for module scripts.
- Include JSDoc summaries and tags in JavaScript hover content.
- Improve language-server activation recovery and automatic-insertion cleanup.
- Add Vim and Neovim integration tests.

## 1.8.0

- Remove configuration `html.format.endWithNewline`>
- Remove configuration `html.validate.html`.
- Remove configuration `html.enable`.
- Check format configuration before register formatter provider.
