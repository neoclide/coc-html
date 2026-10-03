# Upstream sync ledger

## 2026-10-03

Source: `microsoft/vscode`, `extensions/html-language-features`.
Range: `d43a612ad8121ff1f7fe19a5ee13e237c3c5463c` (previous sync documented
in `.codex/coc-workflow.md`) to `67cb2a17e24d903be7d50486a70d9bd835e95ad6`.

| Commit | Decision |
| --- | --- |
| `041d1b6643a` | Adopt HTML service 6.0.0-next.2 and CSS service 7.0.0-next.2. Existing esbuild bundling supports ESM inputs while retaining the CommonJS server output. LSP 10.1.1, textdocument 1.0.14 and URI 3.2.0 are already present. |
| `2fede327f01` | Skip removal of VS Code's deprecated mirror-cursor setting: not part of the Coc manifest. |
| `3879d0e80fa` | Skip bracket-to-dot lint-only changes. |
| `e145e083f0f` | Skip upstream ESM build-script file URL conversion: Coc uses its own CommonJS build script. |
| `4d774f4417e`, `d04893d5077` | Skip unrelated upstream build lockfile updates. |

Preserve lazy activation, Coc settings and commands, client-owned formatting,
auto insertion and existing module-script/custom-data behavior. No VS Code
telemetry or language-client runtime is imported. Added a running-server
embedded CSS completion regression to cover ESM bundling compatibility.

Validation: build and type checking passed; Neovim 7/7 and Vim 7/7 passed;
contract inventory reported zero risks; diff whitespace check passed. The
existing tag-completion test now calls `feedkeys` as an Ex command because
current Vim returns void, which cannot be read through `nvim.call`.
