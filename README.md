# Grove

A native macOS desktop app for organizing, labeling, and managing many concurrent **Claude Code** terminal sessions in a customizable visual workspace.

> Spawn real `claude` CLI sessions inside resizable panels, drag them anywhere on a free-position canvas, label each with a name + color + tags, switch between five product-faithful themes (Claude / ChatGPT / Gemini / Linear / Custom), and persist everything across launches.

---

## What it does

- **Real PTY-backed terminals.** Each panel runs an actual `claude` process via `node-pty`, rendered through `xterm.js` with WebGL acceleration.
- **Free-position canvas.** Drag panels anywhere via `@dnd-kit`. Resize from any of 8 handles. Pan with middle-mouse / Space-drag, zoom with Cmd+scroll, fit-all with Cmd+Shift+F.
- **Labels.** Color, name (inline-rename via dbl-click), and any number of tags. Click a tag in the sidebar to filter the canvas.
- **5 themes × light + dark = 10 truthful palettes.** Each theme matches the actual product UI: Claude.ai's warm orange + charcoal, ChatGPT's neutrals + green, Gemini's gradient blues, Linear's compact violet hairlines.
- **Persistence.** Sessions, tags, theme, window state, canvas pan/zoom, and every setting survive quit/relaunch via `electron-store`.
- **Native macOS feel.** Hidden-inset titlebar with sidebar vibrancy, full menu bar, native confirm/folder picker dialogs, all shortcuts use Cmd.

---

## Requirements

- macOS (Apple Silicon or Intel — universal `.dmg`)
- The `claude` CLI on your `PATH` (or one of `~/.local/bin/claude`, `/usr/local/bin/claude`, `/opt/homebrew/bin/claude`). Falls back to `$SHELL` if not found, with a banner.

---

## Install (end users)

Grab `Grove-X.Y.Z-universal.dmg` from the Releases tab, double-click, drag Grove to Applications.

First launch: right-click → Open (since builds are unsigned for now).

---

## Develop

```bash
git clone https://github.com/fahim-mohi/Grove.git grove
cd grove
npm install     # also runs electron-builder install-app-deps to rebuild node-pty
npm run dev     # opens Electron with hot reload
```

### Useful scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start electron-vite dev (renderer HMR + Electron auto-restart on main/preload changes) |
| `npm run typecheck` | Both `tsconfig.node.json` and `tsconfig.web.json` |
| `npm run build` | Production build of main / preload / renderer into `out/` |
| `npm run package` | Build then `electron-builder` to produce a universal `.dmg` in `dist-app/` |
| `python3 scripts/build-icons.py` | Regenerate `assets/icon.png` and `assets/icon.icns` from the concept reference |
| `node scripts/check-contrast.mjs` | Audit every theme's WCAG contrast pairs |

---

## Project layout

```
electron/        Main process — PTY manager, IPC handlers, native menu, store wrapper
shared/          Type-only contracts (GroveApi, PersistedState) — both sides import from here
src/
  hooks/         useTerminal, useSession, useShortcuts
  store/         Zustand workspace + settings stores, persistence bridge, migrations
  themes/        5 themes × light/dark, registry, runtime xterm color sync
  components/    SessionPanel, SessionHeader, Sidebar, Toolbar, ResizeHandles,
                 ColorPicker, TagBadge, TagPickerInline, ContextMenu, MiniMap,
                 settings/ (6 tabs)
  styles/        globals.css with claude default + motion / z-index tokens
assets/          icon.png, icon.icns, concepts/, entitlements
scripts/         build-icons.py, check-contrast.mjs, smoke-pty.mjs
```

`DESIGN.md` documents the full visual system (1,600+ lines). `BUILD-PLAN.md` is the 16-phase implementation roadmap that produced this codebase.

---

## Architecture quick-tour

- `electron/main.ts` owns the BrowserWindow, native menu, IPC handlers, and graceful PTY shutdown on quit.
- `electron/pty-manager.ts` is the **only** place `node-pty` is allowed to be imported. Everything else talks to it through IPC.
- `electron/preload.ts` exposes a typed `window.grove` surface (`pty.*`, `system.*`, `dialog.*`, `store.*`, `menu.*`) via `contextBridge`. Renderer never sees raw `ipcRenderer`.
- `shared/grove-api.ts` and `shared/types.ts` are the cross-boundary type contracts. Project-reference safe.
- `src/themes/registry.ts` keeps a live set of mounted xterm instances so theme switches re-color all terminals without re-mounting (no scrollback loss).
- `src/store/persistence.ts` debounces writes to `~/Library/Application Support/grove/config.json`. Hydration runs once before React mounts.

---

## Acknowledgements

Built on Electron, React, and TypeScript. Terminal rendering by [xterm.js](https://github.com/xtermjs/xterm.js). PTY by [node-pty](https://github.com/microsoft/node-pty). Drag mechanics by [@dnd-kit](https://dndkit.com). State by [zustand](https://github.com/pmndrs/zustand). Persistence by [electron-store](https://github.com/sindresorhus/electron-store). UI styled with [Tailwind CSS](https://tailwindcss.com). Packaged by [electron-builder](https://www.electron.build).

Grove is a wrapper around the [Claude Code](https://www.anthropic.com/claude-code) CLI by Anthropic.
