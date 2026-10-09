## 1.9.1

- ci: add daily automated release workflow (e8bb2cc)
- docs: remove upstream sync ledger (1f1450a)
- chore: standardize npm and shared dependency versions (#65) (bf3e52f)
- Merge pull request #64 from neoclide/codex/upstream-sync-20261003 (b056e89)
- chore: sync documentation branch with merged HTML changes (d946aed)
- Update coc-html (b4ccf68)
- feat: sync upstream HTML and CSS language services (#63) (21bbc07)
- docs: clarify local upstream baseline provenance (eb1ae3d)
- feat: sync upstream HTML and CSS language services (7e585d6)

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
