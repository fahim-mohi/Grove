# Grove — Build Plan

Sequenced implementation roadmap. Pairs with `DESIGN.md` (design system) and the original spec PDF.

**Goal:** Universal `.dmg` macOS app, distributable, with all 13 features. Build skeleton-first, layer features.

---

## Phase 0 — Repo scaffold

**Outcome:** A `grove/` project that runs `npm run dev`, opens an Electron window, renders an empty React canvas with Tailwind active, theme variables loaded.

- [ ] `npm create electron-vite@latest grove -- --template react-ts` (run inside `~/Desktop/Grove/`)
- [ ] Install runtime deps:
  ```
  npm i xterm xterm-addon-fit xterm-addon-web-links xterm-addon-webgl
  npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers
  npm i zustand
  npm i electron-store
  npm i nanoid
  ```
- [ ] Install dev deps:
  ```
  npm i -D tailwindcss postcss autoprefixer electron-builder @types/node
  ```
- [ ] `node-pty` (native) — install + rebuild against Electron:
  ```
  npm i node-pty
  npx electron-rebuild -f -w node-pty
  ```
  Add `"postinstall": "electron-builder install-app-deps"` to package.json.
- [ ] Init Tailwind: `npx tailwindcss init -p`. Replace `tailwind.config.ts` with the snippet from DESIGN.md Appendix A. Set `darkMode: 'class'`.
- [ ] Create `src/styles/globals.css` with Tailwind base + claude theme `:root` + `.dark` blocks (use full variable values from DESIGN.md §3.1).
- [ ] Bundle fonts: drop `.woff2` files in `assets/fonts/` and add `@font-face` rules in globals.css for the 10 fonts listed in DESIGN.md Appendix B.
- [ ] Configure `electron-vite.config.ts` with three configs (main / preload / renderer) and Tailwind PostCSS pipeline for renderer.
- [ ] Set BrowserWindow defaults: `1280×800` initial, `1024×640` minimum, `titleBarStyle: 'hiddenInset'`, `vibrancy: 'sidebar'`, `webPreferences: { contextIsolation: true, nodeIntegration: false, preload }`.
- [ ] Verify `npm run dev` opens a styled blank window with claude theme variables applied.

**Definition of done:** body bg = `#FAF9F6` (claude light), no errors, devtools clean.

---

## Phase 1 — PTY manager + IPC bridge

**Outcome:** Main process can spawn `claude` PTYs and stream data to/from the renderer via a typed contextBridge API. Renderer has zero direct access to node-pty or ipcRenderer.

- [ ] `electron/pty-manager.ts` — class with `Map<sessionId, IPty>`, methods: `create`, `write`, `resize`, `kill`. Resolve `claude` binary via `which claude` (use `child_process.execSync` once, cache result). Fall back to `process.env.SHELL` with a structured response.
- [ ] `electron/main.ts` — register `ipcMain.handle('pty:create' | 'pty:kill')`, `ipcMain.on('pty:write' | 'pty:resize')`. Emit `pty:data` and `pty:exit` to the focused webContents.
- [ ] `electron/preload.ts` — expose `window.grove.pty.{create,write,resize,kill,onData,onExit}` as documented in DESIGN.md §11.1. Type the surface in `electron/types.ts` and re-export to renderer.
- [ ] `electron/store-manager.ts` — wrap electron-store; expose `store:get-all`, `store:set`, `store:reset`.
- [ ] Smoke test: a temporary debug button in the renderer creates one hardcoded PTY, dumps `pty:data` into a `<pre>`. Verify keystrokes round-trip.
- [ ] Add `asarUnpack: ["**/node_modules/node-pty/**"]` to package.json `build` config.

**Definition of done:** clicking the debug button shows the `claude` welcome banner in a `<pre>`.

---

## Phase 2 — Single SessionPanel with xterm

**Outcome:** Replace the debug `<pre>` with a real xterm.js panel. Keystrokes flow to claude; output renders crisply.

- [ ] `src/hooks/useTerminal.ts` — initialize xterm with FitAddon, WebLinksAddon, WebglAddon (with canvas fallback). Wire `term.onData` → `pty.write`. Subscribe to `pty.onData` → `term.write`. Run initial `fit()` inside `requestAnimationFrame`. Return refs and a `dispose()` method.
- [ ] `src/hooks/useSession.ts` — wraps PTY lifecycle. Returns `{ status, error, kill, restart }`. On mount, calls `pty.create`. On unmount, calls `pty.kill`.
- [ ] `src/components/SessionPanel.tsx` — fixed 720×480 wrapper. Header placeholder ("session") + terminal mount. Apply `var(--bg-panel)`, `var(--radius-panel)`, `var(--shadow-panel-resting)`. Use `ResizeObserver` (debounced 50ms) to call fit + pty.resize.
- [ ] Render exactly one panel from `App.tsx` (hardcoded session id).

**Definition of done:** type `claude` (or `bash`) commands; arrow keys, ANSI colors, scrollback all work. Resize the panel and the terminal reflows.

---

## Phase 3 — Workspace canvas with @dnd-kit

**Outcome:** Free-position drag of multiple panels. Header = drag handle. Drag overlay prevents xterm re-mount.

- [ ] `src/components/WorkspaceCanvas.tsx` — `<DndContext>` wrapping an absolute-positioned canvas div (8000×8000). Each panel rendered with `useDraggable` keyed by sessionId. Header is the drag handle; controls and pills stop propagation.
- [ ] `<DragOverlay>` — render a static clone of the panel chrome (no live xterm) following pointer.
- [ ] On `dragEnd`, commit final position to store.
- [ ] Ability to add a second hardcoded session for visual testing.
- [ ] Resize handles: 8 per panel, abstracted into `ResizeHandle` component. Min size enforced (400×300).
- [ ] z-index: focused = 20+sortOrder, dragging = 30, otherwise 10+sortOrder.

**Definition of done:** drag two panels independently, resize each, terminal stays alive across drags.

---

## Phase 4 — SessionHeader, color picker, kill, rename

**Outcome:** Each panel has a fully usable header — color dot, inline-rename name, tag pills (placeholder), kill, settings, fullscreen.

- [ ] `src/components/SessionHeader.tsx` — layout per DESIGN.md §6.2. Full keyboard + screen reader support.
- [ ] Inline rename: double-click name → `<input>` autoselected. Enter / blur confirms; Esc cancels; empty rejects.
- [ ] `src/components/ColorPicker.tsx` — 12 preset swatches + hex input (DESIGN.md §6.5).
- [ ] Kill button (✕): hover → `--danger` color. On click, optionally show native confirm if `confirmBeforeKill`.
- [ ] Fullscreen button (⛶): toggles a panel-level flag that takes over the canvas viewport (panel grows to fill, others fade). Esc exits.

**Definition of done:** rename a panel, change its color, kill it, restore from sidebar (next phase).

---

## Phase 5 — Sidebar, search, new-session dialog

**Outcome:** Sidebar lists all sessions, supports search, opens NewSessionDialog. Click a session to focus and pan canvas to it.

- [ ] `src/components/Sidebar.tsx` — search input (top), session list (middle, sortable via `@dnd-kit/sortable`), tags strip, "+ New Session" sticky bottom.
- [ ] `src/components/SessionListItem.tsx` — color dot, name, up to 2 tag pills with `+n` overflow chip. Hover, active, focus states from DESIGN.md §5.3.
- [ ] `src/components/NewSessionDialog.tsx` — modal per DESIGN.md §6.4. Cmd+N opens. Enter creates.
- [ ] Click sidebar item → `focusSession(id)` + animate canvas pan to center the panel (`--motion-deliberate`).
- [ ] Right-click context menu (DESIGN.md §6.10).
- [ ] Sidebar collapse to 44px icon rail (Cmd+\). Animate width.

**Definition of done:** create a session via dialog; rename, recolor, kill via context menu; click a session in sidebar and canvas pans.

---

## Phase 6 — Persistence + auto-restore

**Outcome:** Quit and relaunch → all panels restore at exact positions/sizes/names/colors with new PTYs spawned (if `autoRestoreSessions`).

- [ ] `src/store/persistence.ts` — wraps `window.grove.store`. On any tracked store change, debounce 200ms then write only changed slices.
- [ ] `src/store/migrations.ts` — `migrate(state, fromVersion)` chain. v1 stub.
- [ ] On boot, hydrate stores from `store.getAll()`. Then if `autoRestoreSessions`, sequentially spawn PTYs (showing per-panel "Spawning…" placeholders).
- [ ] Window size/position persist via main-process listeners on `resize` / `move` / `enter-full-screen`.
- [ ] BrowserWindow restore — clamp to current displays on boot.
- [ ] Native confirm on app close if any sessions are running (DESIGN.md §13).

**Definition of done:** Cmd+Q with 3 sessions → relaunch → 3 panels back, terminals re-spawned, claude welcome shown.

---

## Phase 7 — Theme system + dark/light

**Outcome:** All 5 themes selectable. Dark/light toggle. xterm color schemes update with theme.

- [ ] `src/themes/index.ts` — registry exporting `themes: Record<ThemePreset, { light: VarMap; dark: VarMap; xtermLight: ITheme; xtermDark: ITheme }>`. One file per theme.
- [ ] `src/themes/{claude,chatgpt,gemini,linear}.ts` — full var maps from DESIGN.md §3 and xterm schemes from §4.
- [ ] `src/themes/custom.ts` — defaults to claude; reads overrides from `customTheme` in settings.
- [ ] `src/components/ThemeProvider.tsx` — applies CSS vars to `:root` and toggles `.dark` class on `<html>`. Subscribes to `useSettingsStore`.
- [ ] xterm theme update — global function `applyXtermTheme(themePreset, mode)` walks active terminals and sets `term.options.theme = scheme`.
- [ ] Toolbar additions (DESIGN.md §5.2): theme dropdown with `ThemePreviewCard` thumbnails, dark/light toggle (animated icon swap).
- [ ] Honor `prefers-color-scheme` on first launch when `darkMode === 'system'`. Subscribe to `nativeTheme.on('updated')` from main and forward to renderer.

**Definition of done:** flip through all 5 themes × light/dark = 10 visuals. Terminal colors match. CSS transitions on chrome over 200ms.

---

## Phase 8 — Tag system

**Outcome:** Create, assign, filter by tags. Tags rendered as pill badges in headers + sidebar.

- [ ] `src/components/TagBadge.tsx` per DESIGN.md §6.3.
- [ ] Add tags to NewSessionDialog (existing pills + "+ add tag" inline create).
- [ ] Sidebar tags strip — clickable filter chips. Active filter shown as removable chip in toolbar.
- [ ] Filtered canvas: non-matching panels fade to 40% opacity, become non-interactive.
- [ ] Settings → Tags table: add, rename, recolor, delete.

**Definition of done:** create 3 tags, assign to sessions, click a tag to filter, clear filter restores all.

---

## Phase 9 — Settings modal (full)

**Outcome:** Every persisted setting editable via Settings (Cmd+,).

- [ ] `src/components/SettingsModal.tsx` — left tabs nav (General / Appearance / Tags / Theme Editor / Shortcuts / About), right content pane.
- [ ] General tab: default command (with "Detect claude" button), working directory (with native picker), snap-to-grid toggle + size, auto-restore toggle, confirm-before-kill toggle.
- [ ] Appearance tab: theme grid (5 + custom), dark mode segmented control, UI font picker, terminal font picker, terminal size slider, cursor style segmented, cursor blink toggle.
- [ ] Tags tab: per §6.6.
- [ ] Theme Editor tab: enabled only when active = custom. Live preview canvas (mini WorkspaceCanvas with 2 fake panels). Per-variable inputs grouped. Export/Import JSON. Validation warning if pair drops below 4.5:1 contrast.
- [ ] Shortcuts tab: read-only table.
- [ ] About tab: version, build info, links, credits.

**Definition of done:** can drive 100% of behavior from Settings without devtools.

---

## Phase 10 — Canvas extras: zoom, pan, mini-map, fit-all, snap-to-grid

**Outcome:** Polished canvas affordances.

- [ ] Pan: middle-mouse drag, Space+drag. Cursor flips to `grab`/`grabbing`.
- [ ] Zoom: Cmd+scroll, pinch trackpad, Cmd+= / Cmd+- step. Range 0.5–1.5. Cmd+0 reset.
- [ ] Apply `transform: translate(x,y) scale(s)` to canvas inner. Persist `canvasTransform`.
- [ ] Dot grid background respects transform (parallax via `background-position`).
- [ ] `src/components/MiniMap.tsx` per §6.7.
- [ ] Fit-all: compute bounding box of all panels, animate transform over 400ms with `--ease-in-out`.
- [ ] Snap-to-grid on drag end (8 / 4 / 16 px configurable).

**Definition of done:** all canvas affordances feel native. fit-all is smooth.

---

## Phase 11 — Keyboard shortcuts + native menu bar

**Outcome:** Every shortcut from DESIGN.md (and PDF spec §9) bound. Native macOS menu bar.

- [ ] `src/hooks/useShortcuts.ts` — global keybinding map. Use `Cmd` only (never Ctrl).
- [ ] Wire all shortcuts (table from DESIGN.md §9 implicit / PDF §9 explicit): Cmd+N, Cmd+W, Cmd+1-9, Cmd+Tab, Cmd+,, Cmd+Shift+F, Cmd+\, Cmd+D, Cmd+0, Cmd+= / -, Esc.
- [ ] Native `Menu` in main process: Grove → File → Edit → View → Window → Help. Forward menu actions to renderer via IPC.
- [ ] Tab / Shift+Tab cycles panels; Esc deselects.

**Definition of done:** drive the app keyboard-only for a session.

---

## Phase 12 — Empty/error states + edge case polish

**Outcome:** Every state from DESIGN.md §13–§14 implemented.

- [ ] Empty canvas (§6.9, §14).
- [ ] In-panel banners (warning + danger) for claude-not-found, session ended, restore failure (§6.11).
- [ ] Sidebar empty + filter no-results states.
- [ ] Disk-full / electron-store write error toast.
- [ ] Native confirm on quit with running sessions.
- [ ] Multi-monitor restore clamping.
- [ ] node-pty mismatch boot-time guard.

**Definition of done:** intentionally trigger every edge case in §13 → matches spec'd behavior.

---

## Phase 13 — Accessibility audit

**Outcome:** WCAG AA across all 10 theme combos. VoiceOver workable.

- [ ] Run automated contrast check on every theme/mode pair. Fix any failures.
- [ ] Tab through every region; verify visual order matches Tab order.
- [ ] All icon-only buttons have `aria-label`.
- [ ] All modals are focus-trapped, escape-dismissible.
- [ ] Test with VoiceOver: announce session focus, tag filters, modals.
- [ ] Verify `prefers-reduced-motion`, `prefers-reduced-transparency`.
- [ ] xterm `screenReaderMode` toggleable in Settings.

**Definition of done:** clean run with the macOS accessibility inspector.

---

## Phase 14 — Iconography + DMG packaging

**Outcome:** Branded `.dmg` builds for arm64 + x64 universal.

- [ ] Create `assets/icon.svg` (stylized `>_` per DESIGN.md §15). Generate `.icns` via `png2icons` script.
- [ ] DMG background image at `assets/dmg-background.png`.
- [ ] Finalize `electron-builder.yml` per spec.
- [ ] `npm run package:mac` produces a working `.dmg`.
- [ ] Smoke test: install on Apple Silicon. Spawn 3 sessions, theme-switch, quit, relaunch, all restored.
- [ ] (If possible) test on Intel via Rosetta/native arch.

**Definition of done:** double-click DMG → drag to Applications → app launches and runs cleanly.

---

## Phase 15 — Polish, animations, final pass

**Outcome:** Hand-finishable for v1.0.

- [ ] All transitions tuned to motion tokens (DESIGN.md §8.1).
- [ ] All hover states use color/opacity (no scale layout shift).
- [ ] Verify no `z-[9999]` arbitrary values; only the named tier scale used.
- [ ] No emoji as functional icons; SVGs from Lucide / custom set.
- [ ] No hardcoded hex anywhere in `src/components/` (except theme files).
- [ ] All components from DESIGN.md §6 implemented.
- [ ] Run `npm run package:mac` → distribute test build to a second machine.

**Definition of done:** a stranger could open the app and figure it out without a manual.

---

## Out of scope for v1 (per spec)

- Windows / Linux builds
- Cloud sync / shared sessions
- Multiplayer collab
- Built-in AI chat sidebar (separate from terminal)
- Plugin system
- Auto-update wiring (electron-updater stays unconfigured)

---

## Notes & gotchas (collected from spec)

- `node-pty` import is **forbidden** in any `src/` file. Refactor immediately if seen.
- `electron-store` v8+ is ESM-only — use dynamic import in main process: `const Store = (await import('electron-store')).default;`
- `xterm.js` v5 dropped auto-focus — call `term.focus()` manually after `term.open()`.
- `fitAddon.fit()` must run inside `requestAnimationFrame` on first mount.
- Use `<DragOverlay>` for the drag preview to keep xterm alive across drags.
- Universal `.dmg` requires `node-pty` to compile for both arm64 and x64 — the `--universal` flag handles it but rebuild must succeed for both.

---

## Recommended cadence

- **Phases 0–3** (scaffold → drag canvas with one panel): one focused session. This is the riskiest stretch — PTY + xterm + dnd-kit interplay is the core spike.
- **Phases 4–7** (sidebar, persistence, theme): MVP usable.
- **Phases 8–11** (tags, settings, canvas extras, shortcuts): feature complete.
- **Phases 12–15** (states, a11y, packaging, polish): ship-ready.

Suggest: stop after Phase 6 for a manual sanity check. Most "wrongness" surfaces by then.
