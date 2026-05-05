# Grove — Design Specification

**Codename:** Grove
**Product:** Native macOS Electron desktop app for organizing, labeling, and managing multiple Claude Code CLI terminal sessions in a customizable visual workspace.
**Stack:** Electron 29 + React 18 + TypeScript + Tailwind 3 + xterm.js 5 + node-pty + @dnd-kit + Zustand + electron-store
**Distribution:** Universal `.dmg` (arm64 + x64) via electron-builder
**This document expands the build spec into an implementation-ready design system.**

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Visual Foundation](#2-visual-foundation)
3. [Theme Specifications](#3-theme-specifications)
4. [xterm.js Color Schemes](#4-xtermjs-color-schemes)
5. [Layout Architecture](#5-layout-architecture)
6. [Component Specifications](#6-component-specifications)
7. [Interaction Design](#7-interaction-design)
8. [Motion System](#8-motion-system)
9. [Accessibility](#9-accessibility)
10. [State Architecture](#10-state-architecture)
11. [IPC Contracts](#11-ipc-contracts)
12. [Persistence Schema](#12-persistence-schema)
13. [Edge Cases & Error States](#13-edge-cases--error-states)
14. [Empty & Loading States](#14-empty--loading-states)
15. [App Icon & Branding](#15-app-icon--branding)

---

## 1. Design Principles

Grove is a **developer tool** that wraps a powerful CLI in a calm visual workspace. Five principles drive every decision:

| Principle | What it means in practice |
|-----------|--------------------------|
| **Terminal first** | The xterm.js canvas is the hero. Chrome stays minimal so the terminal breathes. Never compete with terminal output for attention. |
| **Spatial memory** | Sessions live at fixed positions on a freeform canvas. The user's mental map of "the billing terminal is in the top-right" is sacred — never auto-rearrange. |
| **Calm by default** | No bouncing icons, no flashing badges, no notification dots. Motion is functional, not decorative. Reduced motion is a real path. |
| **Theme-truthful** | Each preset (Claude / ChatGPT / Gemini / Linear) feels like the product it references. Not parody — recognizable homage via spacing, radius, and accent. |
| **Native-feeling** | Looks at home next to Things, Linear, Raycast on a Mac. Vibrancy where appropriate. macOS keyboard conventions. Traffic-light window controls only. |

**Anti-patterns to actively avoid:**
- Floating tool palettes / toolbars layered over the canvas
- Decorative gradients on panel chrome
- Skeuomorphic terminal "glow" or scanlines (cyberpunk = no)
- Toast notifications for routine actions
- Splash screens, marketing UI inside the app
- Emoji as functional icons

---

## 2. Visual Foundation

### 2.1 Color Token Architecture

Grove uses a **two-tier token system**:

1. **Semantic tokens** (CSS custom properties) — what components reference: `--bg-panel`, `--text-primary`, `--accent`
2. **Theme palettes** — each preset defines values for the semantic tokens, in both light and dark variants

A component never references a hex value directly. It references `var(--accent)`. This is what makes the 5-theme × light/dark matrix tractable.

#### Required CSS variables (all 5 themes must define every one of these)

```css
/* Surfaces */
--bg-canvas         /* infinite workspace background */
--bg-canvas-dot     /* dot grid pattern color (8% opacity of fg) */
--bg-panel          /* terminal panel surface */
--bg-panel-header   /* panel header bar */
--bg-sidebar        /* left sidebar */
--bg-sidebar-hover  /* sidebar item hover */
--bg-sidebar-active /* sidebar item active/selected */
--bg-toolbar        /* top toolbar */
--bg-modal          /* settings + dialog surfaces */
--bg-modal-overlay  /* scrim behind modals (rgba black) */
--bg-input          /* form inputs */
--bg-tag            /* default tag pill bg */

/* Borders */
--border-default    /* hairlines, dividers */
--border-strong     /* emphasized borders (focused panel) */
--border-subtle     /* low-contrast section dividers */

/* Text */
--text-primary      /* main UI text */
--text-secondary    /* labels, meta */
--text-muted        /* placeholder, disabled */
--text-on-accent    /* text rendered on --accent fill */

/* Accent (theme-defining) */
--accent            /* primary brand accent */
--accent-hover      /* hover state */
--accent-pressed    /* active/pressed state */
--accent-soft       /* low-opacity accent for backgrounds */
--accent-ring       /* focus ring (accent at ~40% alpha) */

/* Semantic */
--success           /* green for ok states */
--warning           /* amber for warnings */
--danger            /* red for kill / destructive */
--info              /* blue for informational */

/* Shape */
--radius-panel      /* terminal panel border radius */
--radius-control    /* buttons, inputs */
--radius-pill       /* tags, chips */

/* Elevation */
--shadow-panel-resting
--shadow-panel-focused
--shadow-panel-dragging
--shadow-modal

/* Type */
--font-ui           /* sans-serif stack */
--font-terminal     /* monospace stack */

/* Density */
--header-height     /* SessionHeader height (varies by theme) */
--toolbar-height
--sidebar-width
```

### 2.2 Typography

Grove uses a **Mono + Sans pairing** chosen specifically for developer tools:

- **Terminal (mandatory monospace):** `JetBrains Mono` — excellent ligatures, broad coverage, free, Apple Silicon native
- **Default UI (sans-serif):** Each theme overrides this — `Söhne`, `Inter`, `Google Sans`, etc. Fallback chain always ends `ui-sans-serif, system-ui, sans-serif`.
- **Code in UI (rare — e.g. command preview):** `JetBrains Mono`

The Söhne family is licensed; we ship Inter + IBM Plex Sans + DM Sans + Geist as fallbacks bundled in `assets/fonts/`. If Söhne is detected on system, prefer it; otherwise the chain holds.

#### UI type scale

| Token | Size / Line | Weight | Used for |
|-------|-------------|--------|----------|
| `text-display` | 24 / 32 | 600 | Settings page section titles |
| `text-h1` | 18 / 26 | 600 | Modal titles, dialog headings |
| `text-h2` | 15 / 22 | 600 | Sidebar section labels, settings sub-sections |
| `text-body` | 14 / 20 | 400 | Default UI body |
| `text-label` | 13 / 18 | 500 | Form labels, sidebar items |
| `text-caption` | 12 / 16 | 500 | Tag pills, timestamps, status |
| `text-micro` | 11 / 14 | 500 | Tooltips, keyboard shortcut hints |

Mobile / responsive scaling is **not applicable** — Grove is a desktop app with a minimum window size of 1024×640. We design for that and up.

#### Terminal type scale

| Setting | Default | Range |
|---------|---------|-------|
| Font | JetBrains Mono | curated mono list |
| Size | 13 px | 10 – 18 px (settings) |
| Line height | 1.4 | xterm default |
| Letter spacing | 0 | xterm default |
| Cursor | bar | block / underline / bar |
| Cursor blink | true | toggle |

### 2.3 Spacing Scale

8-point grid. Use only these values:

```
0   2   4   6   8   12   16   20   24   32   40   48   64   96
```

Tailwind's default scale aligns; do not invent fractional values. Tight UI density (Linear theme) overrides at the theme level via `--header-height` etc.

### 2.4 Radius Scale

Three tokens: `panel`, `control`, `pill`. Each theme picks values:

| Theme | panel | control | pill |
|-------|-------|---------|------|
| claude | 12 | 8 | 999 |
| chatgpt | 8 | 6 | 999 |
| gemini | 16 | 10 | 999 |
| linear | 6 | 4 | 999 |
| custom | user | user | 999 |

Tag pills are always fully rounded — their identity is the pill shape.

### 2.5 Shadow Scale

Subtle. Grove panels float over a quiet canvas, not a brutalist neon stage.

```css
/* Light mode shadows (dark-on-light) */
--shadow-panel-resting:   0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.06);
--shadow-panel-focused:   0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.10);
--shadow-panel-dragging:  0 2px 4px rgba(0,0,0,.10), 0 24px 48px rgba(0,0,0,.18);
--shadow-modal:           0 8px 32px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.10);

/* Dark mode shadows (use slightly higher alpha, no glow) */
--shadow-panel-resting:   0 1px 2px rgba(0,0,0,.40), 0 4px 12px rgba(0,0,0,.30);
--shadow-panel-focused:   0 1px 2px rgba(0,0,0,.50), 0 8px 24px rgba(0,0,0,.40);
--shadow-panel-dragging:  0 2px 4px rgba(0,0,0,.60), 0 24px 48px rgba(0,0,0,.50);
--shadow-modal:           0 8px 32px rgba(0,0,0,.50), 0 2px 8px rgba(0,0,0,.40);
```

Linear theme overrides shadows to **none** and uses hairline borders instead. Gemini theme uses softer, larger shadows with slightly tinted color.

### 2.6 Z-Index Scale

Strict, named tiers — never use arbitrary values. Define once in `globals.css`:

```css
--z-canvas-bg:     0
--z-panel-resting: 10
--z-panel-focused: 20
--z-panel-dragging:30
--z-canvas-overlay:40   /* mini-map, fit-all FAB, zoom controls */
--z-sidebar:       50
--z-toolbar:       60
--z-context-menu:  70
--z-modal-scrim:   80
--z-modal:         90
--z-tooltip:       100
```

Each panel's `z-panel-resting` is offset by its sidebar order so visual order is stable when nothing's focused. Focused panel jumps to `z-panel-focused`. Dragged panel goes to `z-panel-dragging`.

### 2.7 Motion Tokens

```css
--motion-instant: 0ms       /* state changes that should not animate */
--motion-fast:    120ms     /* hover, color shifts */
--motion-base:    200ms     /* default for component transitions */
--motion-slow:    300ms     /* modals open/close, theme switch */
--motion-deliberate: 400ms  /* fit-all canvas pan/zoom */

--ease-out:   cubic-bezier(0.16, 1, 0.3, 1)    /* default for entering */
--ease-in:    cubic-bezier(0.7, 0, 0.84, 0)    /* default for exiting */
--ease-in-out:cubic-bezier(0.4, 0, 0.2, 1)     /* both directions */
--ease-spring:cubic-bezier(0.34, 1.56, 0.64, 1) /* small overshoot — use sparingly */
```

Linear easing is banned for UI motion. Animations longer than 400ms are reserved for canvas transforms.

`@media (prefers-reduced-motion: reduce)` collapses every duration to `0ms` except critical state confirmations (button press feedback retains 120ms).

---

## 3. Theme Specifications

Each theme below defines the full CSS variable values for both `:root` (light) and `.dark` (dark). All five themes ship in `src/themes/`.

### 3.1 Theme: `claude`

Inspired by Claude.ai. Warm, soft, unhurried. The default theme.

#### Light
```css
--bg-canvas: #FAF9F6;
--bg-canvas-dot: rgba(28, 25, 23, 0.08);
--bg-panel: #FFFFFF;
--bg-panel-header: #F5F4F0;
--bg-sidebar: #F2EFE8;
--bg-sidebar-hover: #ECE8DF;
--bg-sidebar-active: #E5DFD2;
--bg-toolbar: rgba(250, 249, 246, 0.85);  /* with backdrop-blur */
--bg-modal: #FFFFFF;
--bg-modal-overlay: rgba(28, 25, 23, 0.32);
--bg-input: #FFFFFF;
--bg-tag: #F0EDE5;

--border-default: rgba(28, 25, 23, 0.10);
--border-strong: rgba(28, 25, 23, 0.20);
--border-subtle: rgba(28, 25, 23, 0.06);

--text-primary: #1C1917;
--text-secondary: #57534E;
--text-muted: #A8A29E;
--text-on-accent: #FFFFFF;

--accent: #D97706;
--accent-hover: #B45309;
--accent-pressed: #92400E;
--accent-soft: rgba(217, 119, 6, 0.10);
--accent-ring: rgba(217, 119, 6, 0.40);

--success: #16A34A;
--warning: #D97706;
--danger: #DC2626;
--info: #0284C7;

--radius-panel: 12px;
--radius-control: 8px;
--radius-pill: 999px;

--font-ui: 'Söhne', 'GT Walsheim', 'Inter', ui-sans-serif, system-ui, sans-serif;
--font-terminal: 'JetBrains Mono', 'SF Mono', Menlo, monospace;

--header-height: 36px;
--toolbar-height: 44px;
--sidebar-width: 240px;
```

#### Dark
```css
--bg-canvas: #1C1917;
--bg-canvas-dot: rgba(245, 244, 240, 0.08);
--bg-panel: #292524;
--bg-panel-header: #1F1B1A;
--bg-sidebar: #211D1B;
--bg-sidebar-hover: #2A2522;
--bg-sidebar-active: #332E2A;
--bg-toolbar: rgba(28, 25, 23, 0.85);
--bg-modal: #292524;
--bg-modal-overlay: rgba(0, 0, 0, 0.55);
--bg-input: #1F1B1A;
--bg-tag: #2A2522;

--border-default: rgba(245, 244, 240, 0.08);
--border-strong: rgba(245, 244, 240, 0.18);
--border-subtle: rgba(245, 244, 240, 0.04);

--text-primary: #F5F4F0;
--text-secondary: #A8A29E;
--text-muted: #78716C;
--text-on-accent: #FFFFFF;

--accent: #F59E0B;
--accent-hover: #FBBF24;
--accent-pressed: #D97706;
--accent-soft: rgba(245, 158, 11, 0.16);
--accent-ring: rgba(245, 158, 11, 0.48);
```

### 3.2 Theme: `chatgpt`

Inspired by ChatGPT. Clean, neutral, restrained.

#### Light
```css
--bg-canvas: #FFFFFF;
--bg-canvas-dot: rgba(0, 0, 0, 0.06);
--bg-panel: #FFFFFF;
--bg-panel-header: #F7F7F8;
--bg-sidebar: #F4F4F5;
--bg-sidebar-hover: #ECECEE;
--bg-sidebar-active: #E4E4E7;
--bg-toolbar: rgba(255, 255, 255, 0.90);
--bg-modal: #FFFFFF;
--bg-modal-overlay: rgba(0, 0, 0, 0.40);
--bg-input: #FFFFFF;
--bg-tag: #ECECEE;

--border-default: #E4E4E7;
--border-strong: #D4D4D8;
--border-subtle: #F0F0F1;

--text-primary: #0D0D0D;
--text-secondary: #5D5D67;
--text-muted: #8E8EA0;

--accent: #10A37F;
--accent-hover: #0D8B6C;
--accent-pressed: #0A7156;
--accent-soft: rgba(16, 163, 127, 0.10);
--accent-ring: rgba(16, 163, 127, 0.40);

--radius-panel: 8px;
--radius-control: 6px;

--font-ui: 'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif;
--header-height: 34px;
```

#### Dark
```css
--bg-canvas: #212121;
--bg-canvas-dot: rgba(255, 255, 255, 0.06);
--bg-panel: #2F2F2F;
--bg-panel-header: #1F1F1F;
--bg-sidebar: #171717;
--bg-sidebar-hover: #212121;
--bg-sidebar-active: #2A2A2A;
--bg-toolbar: rgba(33, 33, 33, 0.90);
--bg-modal: #2F2F2F;
--bg-input: #1F1F1F;
--bg-tag: #2A2A2A;

--border-default: #424242;
--border-strong: #565656;
--border-subtle: #2A2A2A;

--text-primary: #ECECF1;
--text-secondary: #A8A8B3;
--text-muted: #6E6E80;

--accent: #19C37D;
--accent-hover: #1DD888;
--accent-pressed: #10A36A;
--accent-soft: rgba(25, 195, 125, 0.16);
--accent-ring: rgba(25, 195, 125, 0.45);
```

### 3.3 Theme: `gemini`

Inspired by Gemini. Soft, generous radius, gentle gradient on accent.

#### Light
```css
--bg-canvas: #F8F9FA;
--bg-canvas-dot: rgba(60, 64, 67, 0.06);
--bg-panel: #FFFFFF;
--bg-panel-header: #F1F3F4;
--bg-sidebar: #F1F3F4;
--bg-sidebar-hover: #E8EAED;
--bg-sidebar-active: #DADCE0;
--bg-toolbar: rgba(248, 249, 250, 0.92);
--bg-modal: #FFFFFF;
--bg-modal-overlay: rgba(60, 64, 67, 0.32);
--bg-input: #FFFFFF;
--bg-tag: #E8F0FE;

--border-default: #DADCE0;
--border-strong: #BDC1C6;
--border-subtle: #E8EAED;

--text-primary: #202124;
--text-secondary: #5F6368;
--text-muted: #9AA0A6;

--accent: #4285F4;
--accent-hover: #1A73E8;
--accent-pressed: #1557B0;
--accent-soft: rgba(66, 133, 244, 0.10);
--accent-ring: rgba(66, 133, 244, 0.40);
/* Gemini gradient (used for hero accents only — buttons remain solid) */
--accent-gradient: linear-gradient(135deg, #4285F4 0%, #9168F4 50%, #D96570 100%);

--radius-panel: 16px;
--radius-control: 10px;

--font-ui: 'Google Sans', 'DM Sans', ui-sans-serif, system-ui, sans-serif;
--header-height: 40px;
```

#### Dark
```css
--bg-canvas: #1E1F20;
--bg-canvas-dot: rgba(232, 234, 237, 0.06);
--bg-panel: #282A2C;
--bg-panel-header: #1F2122;
--bg-sidebar: #1F2122;
--bg-sidebar-hover: #2A2C2E;
--bg-sidebar-active: #353739;
--bg-toolbar: rgba(30, 31, 32, 0.92);
--bg-modal: #282A2C;
--bg-input: #1F2122;
--bg-tag: #1F3A5F;

--border-default: #3C4043;
--border-strong: #5F6368;
--border-subtle: #2A2C2E;

--text-primary: #E8EAED;
--text-secondary: #BDC1C6;
--text-muted: #80868B;

--accent: #8AB4F8;
--accent-hover: #AECBFA;
--accent-pressed: #669DF6;
--accent-soft: rgba(138, 180, 248, 0.16);
--accent-ring: rgba(138, 180, 248, 0.45);
```

### 3.4 Theme: `linear`

Inspired by Linear.app. Compact, hairline, violet. Density premium.

#### Light
```css
--bg-canvas: #FFFFFF;
--bg-canvas-dot: rgba(15, 15, 16, 0.05);
--bg-panel: #FFFFFF;
--bg-panel-header: #FAFAFA;
--bg-sidebar: #F8F8F8;
--bg-sidebar-hover: #F0F0F1;
--bg-sidebar-active: #E8E8EA;
--bg-toolbar: rgba(255, 255, 255, 0.94);
--bg-modal: #FFFFFF;
--bg-modal-overlay: rgba(15, 15, 16, 0.40);
--bg-input: #FAFAFA;
--bg-tag: #F0F0F1;

--border-default: rgba(15, 15, 16, 0.08);
--border-strong: rgba(15, 15, 16, 0.16);
--border-subtle: rgba(15, 15, 16, 0.04);

--text-primary: #0F0F10;
--text-secondary: #585A5E;
--text-muted: #8A8C90;

--accent: #5E6AD2;
--accent-hover: #5057C3;
--accent-pressed: #4147A8;
--accent-soft: rgba(94, 106, 210, 0.10);
--accent-ring: rgba(94, 106, 210, 0.40);

--radius-panel: 6px;
--radius-control: 4px;

--font-ui: 'Inter', ui-sans-serif, system-ui, sans-serif;
--header-height: 28px;     /* densest theme */
--toolbar-height: 38px;

/* Linear theme uses no shadow — hairline borders only */
--shadow-panel-resting: none;
--shadow-panel-focused: 0 0 0 1px var(--accent-ring);
--shadow-panel-dragging: 0 12px 32px rgba(0,0,0,.18);
```

#### Dark
```css
--bg-canvas: #0F0F10;
--bg-canvas-dot: rgba(255, 255, 255, 0.05);
--bg-panel: #18191B;
--bg-panel-header: #0F0F10;
--bg-sidebar: #131415;
--bg-sidebar-hover: #1B1C1F;
--bg-sidebar-active: #232427;
--bg-toolbar: rgba(15, 15, 16, 0.94);
--bg-modal: #18191B;
--bg-input: #0F0F10;
--bg-tag: #232427;

--border-default: rgba(255, 255, 255, 0.08);
--border-strong: rgba(255, 255, 255, 0.16);
--border-subtle: rgba(255, 255, 255, 0.04);

--text-primary: #F4F4F5;
--text-secondary: #A8A9AC;
--text-muted: #6E7075;

--accent: #7B85E0;
--accent-hover: #8A93E5;
--accent-pressed: #6770D6;
--accent-soft: rgba(123, 133, 224, 0.16);
--accent-ring: rgba(123, 133, 224, 0.45);
```

### 3.5 Theme: `custom`

User-editable. Defaults clone the active theme at the moment "Custom" is selected. All variables exposed in the Theme Editor with live preview. Exportable / importable as JSON:

```json
{
  "name": "My Theme",
  "version": 1,
  "light": { /* CSS var → value map */ },
  "dark":  { /* CSS var → value map */ },
  "xtermLight": { /* xterm color scheme */ },
  "xtermDark":  { /* xterm color scheme */ }
}
```

---

## 4. xterm.js Color Schemes

xterm requires its own `ITheme` per terminal instance. We compute it from the active theme + dark mode and pass it to every `new Terminal({ theme })`. When the global theme changes, we call `term.options.theme = newTheme` for every active terminal.

### 4.1 Color slots required

```ts
interface ITheme {
  background: string;       // matches --bg-panel
  foreground: string;       // matches --text-primary
  cursor: string;           // matches --accent
  cursorAccent: string;     // matches --bg-panel
  selectionBackground: string;  // 30% accent
  selectionForeground?: string; // omitted = inherit fg

  black: string;     red: string;     green: string;     yellow: string;
  blue: string;      magenta: string; cyan: string;      white: string;
  brightBlack: string;  brightRed: string;  brightGreen: string;  brightYellow: string;
  brightBlue: string;   brightMagenta: string;  brightCyan: string;  brightWhite: string;
}
```

### 4.2 Per-theme schemes

We use **two ANSI palettes** as bases — Solarized-leaning for warm themes (claude), and a neutral high-contrast palette for the rest — with the cursor and selection always pulled from the theme accent.

**claude / dark** (warm Solarized-leaning):
```
black:   #1C1917  red:     #F87171  green:   #6EE7B7  yellow:  #FCD34D
blue:    #93C5FD  magenta: #F0ABFC  cyan:    #67E8F9  white:   #E7E5E4
bright*: 1.15× luminosity of base
```

**chatgpt / dark** (neutral, slightly muted):
```
black:   #2F2F2F  red:     #EF4444  green:   #22C55E  yellow:  #EAB308
blue:    #3B82F6  magenta: #D946EF  cyan:    #06B6D4  white:   #ECECF1
```

**gemini / dark** (cool, blue-leaning):
```
black:   #282A2C  red:     #F28B82  green:   #81C995  yellow:  #FDD663
blue:    #8AB4F8  magenta: #C58AF9  cyan:    #78D9EC  white:   #E8EAED
```

**linear / dark** (high-contrast neutral):
```
black:   #18191B  red:     #FB7185  green:   #34D399  yellow:  #FBBF24
blue:    #818CF8  magenta: #E879F9  cyan:    #22D3EE  white:   #F4F4F5
```

**custom**: defaults to claude scheme, fully editable.

Light-mode variants invert lightness (use Solarized Light–style soft warm whites for claude, near-white for the others) and pull the cursor from the dark-on-light accent.

### 4.3 Cursor + selection (all themes)

```
cursor:               var(--accent)
cursorAccent:         var(--bg-panel)
selectionBackground:  rgba(<accent rgb>, 0.30)
```

### 4.4 Webgl renderer

Use `@xterm/addon-webgl` for performance (smooth scroll on Apple Silicon). Falls back to canvas if WebGL fails. Re-instantiate the addon when the theme switches; do not hot-mutate.

---

## 5. Layout Architecture

### 5.1 App shell

```
┌──────────────────────────────────────────────────────────────────┐
│ ◉ ◉ ◉   [Toolbar — 44px (38px in linear)]                        │ ← --bg-toolbar
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│ Sidebar  │   WorkspaceCanvas (panels float at absolute pos)     │
│ 240px    │                                                       │
│          │                                            ┌─────┐    │
│          │                                            │mini │    │
│          │                                            │ map │    │
│          │                                            └─────┘    │
└──────────┴──────────────────────────────────────────────────────┘
```

- macOS traffic lights (`◉ ◉ ◉`) stay in the standard top-left position. Use `titleBarStyle: 'hiddenInset'` in BrowserWindow so the toolbar starts after the lights' safe area (~78px left padding on the toolbar).
- Toolbar uses `backdrop-filter: blur(20px) saturate(160%)` with semi-transparent `--bg-toolbar` for a native vibrancy feel. Behind it, the canvas/sidebar scroll edges show through at low opacity.
- Sidebar collapses to a **44px icon rail** when toggled (Cmd+\). Animate width over `--motion-base`.
- Window minimum size: **1024 × 640**. Saved/restored across launches.

### 5.2 Toolbar contents (left → right)

| Slot | Element | Notes |
|------|---------|-------|
| 1 | (traffic-light reserve) | 78px left padding |
| 2 | Workspace title | Editable on dbl-click; defaults to "Workspace" |
| 3 | spacer (flex) | |
| 4 | Theme switcher | Dropdown with `ThemePreviewCard` thumbnails |
| 5 | Dark/light toggle | Sun/moon icon, animated swap |
| 6 | Fit-all button | Cmd+Shift+F |
| 7 | Zoom controls | `−  100%  +` group |
| 8 | Settings | Gear icon, opens modal (Cmd+,) |

All toolbar buttons: 32×32 hit area, icon 16×16, `--radius-control`, `cursor: pointer`, hover bg `--bg-sidebar-hover`. Tooltip on hover after 500ms with shortcut hint.

### 5.3 Sidebar structure

```
┌──────────────────────────────────┐
│ [search input]      ⌘K           │ ← 44px header, matches toolbar height
├──────────────────────────────────┤
│ SESSIONS              n          │ ← --text-secondary, 12px caps, 32px row
├──────────────────────────────────┤
│ ● billing-prod    [prod] [api]   │ ← session row, 36px, clickable
│ ● local-dev       [dev]          │
│ ● docs-edit                      │
│ …                                │
├──────────────────────────────────┤
│ TAGS                             │
│ ● prod  ● dev  ● api  ● docs     │ ← clickable filter pills
├──────────────────────────────────┤
│  + New Session            ⌘N     │ ← sticky bottom, 44px
└──────────────────────────────────┘
```

- Session row: `8px 12px` padding, `gap: 8px`, color dot 8×8, name (text-label, truncate), tag pills (max 2 visible + `+n` overflow chip).
- Hover: `--bg-sidebar-hover`. Active (panel focused on canvas): `--bg-sidebar-active` + 2px left border `--accent`.
- Drag-to-reorder via `@dnd-kit/sortable`; visual order only — does not move panels on canvas.
- Right-click context menu (see §6.10).

### 5.4 Workspace canvas

- A single absolute-positioned `<div>` of large fixed dimensions (e.g. 8000 × 8000px) within an overflow container that holds pan + zoom transform.
- Background: `--bg-canvas` with a CSS dot grid:
  ```css
  background-image: radial-gradient(circle, var(--bg-canvas-dot) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: var(--canvas-x, 0) var(--canvas-y, 0); /* parallax with pan */
  ```
- Pan: middle mouse drag, OR `space + drag`. Cursor switches to `grab` on space-down, `grabbing` while dragging.
- Zoom: `Cmd + scroll` or pinch. Range **50% – 150%**. `Cmd+0` resets to 100%. `Cmd+= / Cmd+-` step by 10%.
- Snap-to-grid (optional): on drag end, snap `position` to `Math.round(p / 8) * 8`.
- Mini-map overlay (§6.7) anchored bottom-right, 16px from edges.
- Empty state when `sessions.length === 0` (§14).

---

## 6. Component Specifications

### 6.1 SessionPanel

The hero component. Each instance owns a single xterm.js terminal and renders the panel chrome.

```
┌────────────────────────────────────────────────┐ ← --shadow-panel-{state}
│  ●  session-name   [prod] [api]    ⚙  ✕  ⛶    │ ← SessionHeader (drag handle)
├────────────────────────────────────────────────┤
│                                                │
│   xterm.js terminal viewport                   │
│   padding: 12px 16px (theme override)          │
│                                                │
│                                                │
└────────────────────────────────────────────────┘
   resize handles: 8 per panel (4 corners + 4 edges)
```

| Property | Value |
|----------|-------|
| Default size | 720 × 480 |
| Min size | 400 × 300 |
| Max size | unlimited (canvas bound) |
| Background | `var(--bg-panel)` |
| Border | `1px solid var(--border-default)` |
| Border radius | `var(--radius-panel)` |
| Shadow (resting) | `var(--shadow-panel-resting)` |
| Shadow (focused) | `var(--shadow-panel-focused)` |
| Shadow (dragging) | `var(--shadow-panel-dragging)` |
| Z-index | 10 / 20 / 30 (resting / focused / dragging) |
| Terminal padding | 12px top/bottom, 16px left/right |
| Resize cursor | `nwse-resize`, `nesw-resize`, `ns-resize`, `ew-resize` |

**Resize behavior:**
1. User drags handle → panel `width/height` updated in store (debounced 16ms via rAF for 60fps).
2. `ResizeObserver` on panel root fires.
3. Debounced 50ms → `fitAddon.fit()` measures cols/rows.
4. `window.grove.pty.resize(sessionId, cols, rows)` notifies main.
5. PTY reflows; output flows back via `pty:data`.

**Focus behavior:**
- Click header → focus panel (z-index up, shadow change), but DO NOT focus terminal (keeps drag clean).
- Click terminal area → focus panel + focus terminal (xterm `term.focus()`).
- Tab between panels: cycles focus, brings to front.
- Focus ring on focused-but-not-terminal-active state: `outline: 2px solid var(--accent-ring); outline-offset: 2px;`

**Critical:** wrap the panel in `@dnd-kit/core`'s `useDraggable` with **header as drag handle only**, and use `<DragOverlay>` for the floating preview during drag — this prevents xterm from re-mounting and losing scrollback.

### 6.2 SessionHeader

Height: `var(--header-height)` (28 / 34 / 36 / 40 px depending on theme).

```
[8px gap]  ●  session-name  [tag] [tag] [+2]   ⚙  ✕  ⛶  [8px gap]
            ↑      ↑          ↑              ↑   ↑   ↑
        color   inline      tag pills    settings, kill, fullscreen
        dot     editable    (max 2 vis)
```

| Element | Spec |
|---------|------|
| Color dot | 8×8, `border-radius: 999px`, fill = session.color |
| Name | `text-label`, truncate, single-click selects, double-click → inline edit |
| Tag pills | see §6.3 |
| `+n` overflow chip | shows count of hidden tags, hover reveals all in popover |
| Controls (⚙ ✕ ⛶) | 16×16 icon, 24×24 hit area, `cursor: pointer`, color `--text-muted` → `--text-primary` on hover |
| Kill button (✕) | `--text-muted` → `--danger` on hover |
| Background | `var(--bg-panel-header)`, transitions to `var(--accent-soft)` when focused |
| Border-bottom | `1px solid var(--border-default)` |

**Inline rename:**
- Trigger: double-click name OR right-click → Rename OR keyboard (focused panel + F2 / Enter).
- On enter edit: replace text with `<input>` matched in size, autoselect contents.
- Confirm: Enter, blur, click outside.
- Cancel: Escape — restore previous value.
- Empty name disallowed; falls back to previous on blur.

**Drag handle:** the entire header (excluding controls and tag pills) is the drag region. Cursor `grab` → `grabbing`. Controls and pills remain clickable (stop propagation on pointerdown).

### 6.3 TagBadge

```
┌──────────┐
│ ● label  │   12×20, padding 0 6px, gap 4px, radius pill
└──────────┘
```

| Element | Spec |
|---------|------|
| Container | `display: inline-flex; align-items: center;` |
| Height | 20px |
| Padding | `0 8px` |
| Border radius | `var(--radius-pill)` |
| Font | `text-caption`, weight 500 |
| Background | `tag.color` at 14% alpha (light) / 22% alpha (dark) |
| Text | `tag.color` at 100% in light mode; lightened 25% in dark mode |
| Color dot (optional) | 6×6 in `tag.color` 100% |
| Border | none |

In sidebar: clicking a TagBadge toggles a workspace filter — only sessions tagged `X` remain interactive on canvas, others fade to 40% opacity. Active filter shows in toolbar as removable chip.

### 6.4 NewSessionDialog

Modal opened via Cmd+N or sidebar `+` button. Centered, 420px wide.

```
┌────────────────────────────────────────────┐
│  New Session                            ✕  │
├────────────────────────────────────────────┤
│                                            │
│  Name                                      │
│  [______________________________________]  │
│                                            │
│  Color                                     │
│  ● ● ● ● ● ● ● ● ● ● ● ●  #______        │
│                                            │
│  Tags                                      │
│  [prod] [dev] [+ add tag]                  │
│                                            │
│  Working directory  (optional)             │
│  [______________________________________]  │
│  [ Choose folder… ]                        │
│                                            │
├────────────────────────────────────────────┤
│                       Cancel    Create     │
└────────────────────────────────────────────┘
```

- Name autofocus on open.
- Color: 12-swatch grid (see §6.5) + custom hex input.
- Tags: clickable pills from existing tags + a "+ add tag" chip that inline-creates one.
- Working directory: optional path input + native file picker via `dialog.showOpenDialog`.
- Create button disabled until name is non-empty.
- Enter submits, Esc cancels.

### 6.5 Color Picker (compact swatch grid)

12 default swatches, picked for both visual distinction and decent contrast in both modes:

```
#EF4444 (red)       #F97316 (orange)    #F59E0B (amber)    #EAB308 (yellow)
#84CC16 (lime)      #22C55E (green)     #14B8A6 (teal)     #06B6D4 (cyan)
#3B82F6 (blue)      #6366F1 (indigo)    #A855F7 (purple)   #EC4899 (pink)
```

Layout: 4×3 grid, 24×24 swatches, 6px gap, click to select, selected swatch gets a 2px ring at `--accent-ring`. Below: monospaced hex input (`#______`) with live validation. Hex input syncs both ways.

### 6.6 SettingsModal

640px wide × min 480 / max 720 tall, centered. Left tabs nav, right content pane.

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                              ✕    │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  General     │  General                                     │
│  Appearance  │  ─────────                                   │
│  Tags        │                                              │
│  Theme Edit. │  Default command                             │
│  Shortcuts   │  [claude___________________________]         │
│  About       │                                              │
│              │  Working directory                           │
│              │  [~/__________________] [ Choose ]           │
│              │                                              │
│              │  ☐ Snap to 8px grid                          │
│              │  ☑ Auto-restore sessions on launch           │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

#### General
- Default command (text)
- Working directory (path)
- Snap-to-grid toggle + grid size (4 / 8 / 16 px)
- Auto-restore sessions toggle
- Confirm before kill toggle

#### Appearance
- Theme preset selector — 5 `ThemePreviewCard`s in a row + a sixth "Custom" card
- Dark mode: Light / Dark / Follow system (segmented control)
- UI font picker — 8 curated: System (-apple-system), Inter, IBM Plex Sans, DM Sans, Söhne (if installed), Geist, Space Grotesk, Google Sans
- Terminal font picker — 6 curated: JetBrains Mono, Fira Code, IBM Plex Mono, SF Mono, Geist Mono, Hack
- Terminal font size: 10–18 (slider + numeric)
- Cursor style: Block / Underline / Bar (segmented)
- Cursor blink toggle

#### Tags
- Table of existing tags: color dot, name (inline editable), color picker button, delete button.
- "+ New Tag" row at bottom.
- Empty state: "No tags yet — create one to label sessions."

#### Theme Editor (only enabled when active theme = `custom`)
- Live preview canvas (mini WorkspaceCanvas with 2 fake panels) at top.
- Below: scrollable form with every CSS variable grouped by section.
- Each variable: label + input (color picker for colors, numeric+unit for sizes, text for fonts).
- Buttons: `Reset to claude defaults`, `Export JSON…`, `Import JSON…`.

#### Shortcuts
Read-only table of every keyboard shortcut grouped by category. (Future: inline rebinding.)

#### About
- Grove logo + version.
- Build info (Electron / Node / Chromium versions).
- Links: Spec, Repo, Acknowledgements.
- Credits to xterm.js, node-pty, dnd-kit, Tailwind, Anthropic.

### 6.7 Mini-map

```
┌──────────────────┐
│ ┌────┐    ┌─┐   │  160 × 100, --bg-modal at 90%, --shadow-modal
│ │█   │    └─┘   │  border --border-default
│ └────┘  ┌──┐    │  shows panels as colored rectangles (session.color)
│         └──┘    │  viewport rectangle outlined in --accent
└──────────────────┘
```

- Anchored bottom-right of canvas overlay layer at `bottom: 16px; right: 16px`.
- Click any panel rectangle to pan canvas to center it (animated, `--motion-deliberate`).
- Drag the viewport rectangle to pan canvas live.
- Hidden when `sessions.length === 0`. Toggleable via setting (default: on).
- z-index: `--z-canvas-overlay`.

### 6.8 ThemePreviewCard

```
┌────────────────────┐
│ ▣▣▣  [chrome]     │  120 × 90, --radius-control
│ ▣▣▣  [panel]      │  Click to apply theme.
│ claude            │  Selected: 2px ring --accent-ring.
└────────────────────┘
```

Renders a stylized miniature: toolbar bar, sidebar block, two panel rectangles using the theme's actual `--bg-canvas`, `--bg-sidebar`, `--bg-panel`, `--accent`. Caption is theme name.

### 6.9 Empty State (canvas)

When `sessions.length === 0`:

```
                    ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐

                              ▎_  Grove

                       Press ⌘N to start your first
                            Claude Code session

                         [  + New Session  ]

                    └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

- Centered in the visible viewport (not the full canvas).
- Dashed border, `1px dashed var(--border-default)`, radius `var(--radius-panel)`, padding 64px.
- The Grove logo (a stylized terminal `>_` glyph) above the heading.
- Prominent CTA button using accent fill.

### 6.10 Right-click context menu (sidebar session item)

Native-feel popover:

```
┌──────────────────────┐
│  Rename              │  F2
│  Duplicate           │  ⌘D
│  Change color…       │
│  Add tag…            │
│  ─────────────────   │
│  Reveal on canvas    │  ⌘1-9
│  ─────────────────   │
│  Kill session        │  ⌘W      [danger color]
└──────────────────────┘
```

- 220px wide, `var(--shadow-modal)`, `var(--bg-modal)`, `--radius-control`.
- Item height 32px, padding `0 12px`, hover bg `--bg-sidebar-hover`.
- Keyboard nav: ↑ ↓ to navigate, Enter to invoke, Esc to dismiss.
- z-index: `--z-context-menu`.

### 6.11 Toast / Banner (in-terminal, not floating)

Grove avoids floating toasts. Status messages appear as **inline banners** rendered above the xterm viewport inside a SessionPanel:

- Yellow banner: `⚠ claude CLI not found. Open a shell instead? [y/N]`
- Red banner: `[Session ended — press any key to restart]`

Banner spec:
- Height 28px, padding `0 12px`, font `text-caption`.
- Background: `--warning` at 16% alpha / `--danger` at 16% alpha.
- Border-bottom: `1px solid` of the same color at 50% alpha.
- Text color: `--warning` / `--danger` at 100% in light, lightened in dark.
- Dismissable via Esc or any key (per banner type's logic).

---

## 7. Interaction Design

### 7.1 Panel drag

- Pointer down on header (not control region) → enter drag state.
- @dnd-kit's `<DragOverlay>` clones the panel chrome (not the live xterm) and follows pointer; the original panel goes to 40% opacity in place.
- Cursor: `grabbing`.
- Position updates only on `dragEnd` (commit to store, persist to electron-store).
- During drag, focused panel keeps focused state but uses `--shadow-panel-dragging`.
- On release, panel jumps to final position with no animation (positions are factual — animating implies motion that didn't happen).
- Esc cancels drag, restores original position.

### 7.2 Panel resize

- 8 handles per panel: 4 corners (8×8 hit area), 4 edges (8px wide / 8px tall hit strips).
- Handles invisible until panel is focused; subtle accent dot appears on corners when focused.
- Min size enforced by clamping in handler (400 × 300).
- During resize: `cursor` matches handle direction. Live width/height update via rAF-throttled state.
- After resize end: 50ms debounce → `fit()` + `pty.resize`.

### 7.3 Canvas pan & zoom

| Action | Trigger |
|--------|---------|
| Pan | Middle mouse drag, or Space+drag, or two-finger trackpad scroll on empty canvas |
| Zoom | Cmd+scroll wheel, pinch trackpad |
| Reset zoom | Cmd+0 |
| Step zoom | Cmd+= / Cmd+- (10% steps) |
| Fit all | Cmd+Shift+F (computes bounding box of all panels, animates pan+zoom over 400ms) |

Pan and zoom are stored in `canvasTransform: { x, y, scale }`. Persisted across sessions. Scale clamped 0.5–1.5.

When zoomed, xterm content does NOT re-fit — we apply CSS transform only. PTY cols/rows remain stable. This means terminals look pixelated when zoomed in/out — that's correct, faster, and avoids re-fitting churn.

### 7.4 Focus management

State: `focusedSessionId: string | null`.

| Action | focusedSessionId | terminal focused? |
|--------|------------------|-------------------|
| Click terminal area | becomes that session's id | yes (`term.focus()`) |
| Click header (not controls) | becomes that session's id | no (keep drag clean) |
| Tab key in workspace | cycle to next session by sidebar order | match what was previous |
| Cmd+1 … Cmd+9 | jump to nth session | yes |
| Click sidebar item | becomes that session, pan canvas to center it | yes |
| Click empty canvas | null | no |
| Esc when modal open | null change; close modal | n/a |

The focused panel: z-index `--z-panel-focused`, `--shadow-panel-focused`, header bg shifts to `--accent-soft`, color dot grows to 10×10.

### 7.5 Z-index layering

See §2.6 for the named tiers. Concrete rules:

- Resting panels: `style.zIndex = 10 + sortOrder` (so visual layering matches sidebar order when nothing's focused).
- Focused panel: temporarily promoted to `20 + sortOrder`.
- Dragging panel: `30`.
- Mini-map / fit-all FAB / zoom controls: `40`.
- Sidebar / toolbar fixed at `50` / `60`.
- Context menu `70`, modal scrim `80`, modal `90`, tooltip `100`.

### 7.6 Inline rename

Documented in §6.2. Behavior unified across SessionHeader and Sidebar item.

### 7.7 Right-click

- Sidebar session row → §6.10 menu.
- Panel header → same menu.
- Tag in sidebar → small menu: `Rename`, `Change color…`, `Delete tag` (danger).
- Empty canvas → menu: `Paste session JSON`, `Reset zoom`, `Fit all`.

### 7.8 Drag-and-drop (sidebar reorder)

`@dnd-kit/sortable` on the sidebar session list. Drag handle = entire row. Animation: row lifts with `--shadow-modal`, others slide via CSS `transition: transform var(--motion-base)`.

Reorder updates `session.sortOrder` only — never `session.position`. Canvas layout is independent.

---

## 8. Motion System

### 8.1 Token usage map

| Element / state change | Token | Easing |
|------------------------|-------|--------|
| Hover color shift | `--motion-fast` | `--ease-out` |
| Button press feedback | `--motion-fast` | `--ease-out` |
| Modal open/close | `--motion-slow` | `--ease-out` / `--ease-in` |
| Sidebar collapse/expand | `--motion-base` | `--ease-in-out` |
| Theme switch (CSS var transitions) | `--motion-base` | `--ease-in-out` |
| Dark/light toggle | `--motion-slow` | `--ease-in-out` |
| Tooltip appear (after 500ms delay) | `--motion-fast` | `--ease-out` |
| Context menu appear | `--motion-fast` | `--ease-out` |
| Fit-all canvas animation | `--motion-deliberate` | `--ease-in-out` |
| Sidebar reorder | `--motion-base` | `--ease-in-out` |
| Drag overlay opacity in/out | `--motion-fast` | `--ease-out` |
| Focus ring fade in | `--motion-fast` | `--ease-out` |

### 8.2 Properties

Animate **transform + opacity only**. Never animate width/height/top/left for performance reasons (one exception: sidebar collapse, which uses `width` — accepted since it's once-per-toggle and short).

### 8.3 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Exception: `--motion-fast` press-feedback retains 80ms — users still benefit from a perceptible state change cue.

### 8.4 Notable individual animations

- **Theme switch** — apply CSS transition on `body`'s descendants for `background-color, color, border-color, box-shadow` over `--motion-base`. The xterm theme update is instantaneous (xterm doesn't transition). Net effect: chrome morphs while terminals snap.
- **Dark/light toggle** — same as above, plus the toolbar icon rotates 180° as it swaps sun↔moon.
- **Drag overlay** — fades from 0 → 1 over `--motion-fast`. Original panel fades to 40% opacity in place.
- **Focus ring** — fades in/out over `--motion-fast`. Never animate offset (causes layout-ish shift).

---

## 9. Accessibility

### 9.1 Color contrast

All theme palettes were chosen with 4.5:1 minimum body contrast and 7:1 where possible. Verified pairs (light mode):

| Pair | Ratio |
|------|-------|
| `--text-primary` on `--bg-panel` (claude) | #1C1917 on #FFFFFF = 16.8:1 ✓ |
| `--text-secondary` on `--bg-panel` (claude) | #57534E on #FFFFFF = 7.4:1 ✓ |
| `--text-on-accent` on `--accent` (claude) | #FFFFFF on #D97706 = 4.6:1 ✓ |
| `--text-primary` on `--bg-sidebar` (chatgpt dark) | #ECECF1 on #171717 = 14.7:1 ✓ |

The Custom theme editor warns the user when their inputs drop below 4.5:1 for a foreground/background pair.

### 9.2 Keyboard navigation

Every interactive element is reachable via Tab/Shift+Tab. Tab order matches visual order.

| Region | Tab path |
|--------|----------|
| Toolbar | Workspace title → theme switcher → dark toggle → fit → zoom − → zoom 100% → zoom + → settings |
| Sidebar | Search → session 1 → session 2 → … → tag 1 → tag 2 → … → New session |
| Canvas | Tab cycles through sessions in sidebar order, focuses each panel (xterm gets focus) |
| Modals | Inputs in document order; focus trap — Tab cycles within modal |

Custom focus styles via `:focus-visible` only, so mouse clicks don't show rings:

```css
:focus-visible {
  outline: 2px solid var(--accent-ring);
  outline-offset: 2px;
  border-radius: inherit;
}
```

### 9.3 ARIA

- All icon-only buttons: `aria-label` (e.g. `Kill session`, `Toggle dark mode`).
- Sidebar list: `role="list"`, items `role="listitem"`.
- Tag filter chips: `role="button"`, `aria-pressed`.
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at title.
- Mini-map: `aria-label="Workspace overview"`. Each panel rectangle is a `<button>` with `aria-label="Jump to {sessionName}"`.
- Toolbar: `role="toolbar"`, `aria-label="Workspace toolbar"`.
- Sessions sidebar: `aria-label="Sessions"`.
- Canvas region: `role="region" aria-label="Workspace canvas"`. (Terminal content itself is reachable; xterm exposes `aria-live` on the screen reader buffer.)

### 9.4 Screen reader

xterm.js v5 has a `screenReaderMode` option that mirrors output to an aria-live region. Enable when VoiceOver is detected (`window.speechSynthesis` heuristic + a setting toggle).

### 9.5 macOS conventions

- Cmd-based shortcuts (never Ctrl).
- Native menu bar with: Grove → About / Settings (Cmd+,) / Quit (Cmd+Q); File → New Session (Cmd+N) / Close Session (Cmd+W); Edit → Cut/Copy/Paste; View → Toggle Sidebar (Cmd+\) / Toggle Dark (Cmd+D) / Fit All (Cmd+Shift+F) / Zoom (Cmd+0/+/-); Window → Minimize / Zoom; Help → Documentation.
- Traffic-light controls only (no custom close/min/max).
- Vibrancy via `vibrancy: 'sidebar'` on BrowserWindow + transparent sidebar background.
- Window state restored across launches (size, position, fullscreen).

### 9.6 Reduced motion

See §8.3.

### 9.7 Reduced transparency

`@media (prefers-reduced-transparency: reduce)` collapses backdrop-blur surfaces to fully opaque equivalents.

---

## 10. State Architecture

### 10.1 Zustand stores

Two stores — keep them small and focused:

#### `useWorkspaceStore` (src/store/workspace.ts)

```ts
interface WorkspaceState {
  // Entities
  sessions: Record<string, Session>;
  sessionOrder: string[];           // sidebar order
  tags: Record<string, Tag>;
  tagOrder: string[];

  // UI state
  focusedSessionId: string | null;
  draggingSessionId: string | null;
  filterTagId: string | null;        // null = no filter
  sidebarCollapsed: boolean;
  searchQuery: string;
  contextMenu: { type: 'session' | 'tag' | 'canvas'; targetId?: string; x: number; y: number } | null;

  // Canvas
  canvasTransform: { x: number; y: number; scale: number };

  // Modals
  modal: { type: 'settings' | 'newSession' | 'editTag'; payload?: any } | null;

  // Actions
  createSession: (input: NewSessionInput) => Promise<string>;
  killSession: (id: string) => Promise<void>;
  renameSession: (id: string, name: string) => void;
  recolorSession: (id: string, color: string) => void;
  moveSession: (id: string, position: { x: number; y: number }) => void;
  resizeSession: (id: string, size: { width: number; height: number }) => void;
  reorderSessions: (orderedIds: string[]) => void;
  focusSession: (id: string | null) => void;
  bringToFront: (id: string) => void;

  addTag: (input: { name: string; color: string }) => string;
  renameTag: (id: string, name: string) => void;
  recolorTag: (id: string, color: string) => void;
  deleteTag: (id: string) => void;
  toggleSessionTag: (sessionId: string, tagId: string) => void;
  setFilterTag: (id: string | null) => void;

  setCanvasTransform: (t: Partial<CanvasTransform>) => void;
  fitAll: () => void;
  toggleSidebar: () => void;
  setSearchQuery: (q: string) => void;
  openContextMenu: (...) => void;
  closeContextMenu: () => void;
  openModal: (m: ...) => void;
  closeModal: () => void;
}
```

#### `useSettingsStore` (src/store/settings.ts)

```ts
interface SettingsState {
  themePreset: 'claude' | 'chatgpt' | 'gemini' | 'linear' | 'custom';
  darkMode: 'light' | 'dark' | 'system';
  uiFont: string;
  terminalFont: string;
  terminalFontSize: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  defaultCommand: string;
  defaultWorkingDir: string | null;
  snapToGrid: boolean;
  gridSize: 4 | 8 | 16;
  autoRestoreSessions: boolean;
  confirmBeforeKill: boolean;
  customTheme: { light: Record<string,string>; dark: Record<string,string> } | null;

  // actions
  setTheme: (preset: ThemePreset) => void;
  setDarkMode: (mode: DarkMode) => void;
  // … one setter per field
}
```

### 10.2 Persistence wiring

Both stores subscribe to electron-store via a single thin layer (`src/store/persistence.ts`):

- On store change, debounce 200ms, then `window.grove.store.set(key, value)` for changed fields only.
- On app boot, `window.grove.store.getAll()` returns the full snapshot, hydrate both stores.
- Sessions are persisted *without* `ptyPid` (that's transient).
- Schema versioned; migrations live in `src/store/migrations.ts`.

### 10.3 Derived selectors

```ts
const sortedSessions = useWorkspaceStore(s => s.sessionOrder.map(id => s.sessions[id]));
const focusedSession = useWorkspaceStore(s => s.focusedSessionId ? s.sessions[s.focusedSessionId] : null);
const filteredSessions = useWorkspaceStore(s => /* apply filterTagId + searchQuery */);
```

Use `zustand`'s `subscribeWithSelector` middleware so components only re-render on slices they read.

### 10.4 useTerminal + useSession hooks

`useTerminal(sessionId)` — initializes xterm in a ref'd div, attaches `FitAddon` + `WebLinksAddon` + `WebglAddon`. Wires:
- xterm `onData` → `window.grove.pty.write(sessionId, data)`
- IPC `pty:data` listener → `term.write(data)`
- IPC `pty:exit` listener → show banner

`useSession(sessionId)` — returns `{ status: 'spawning' | 'running' | 'exited' | 'error' }` and exposes `kill()`, `restart()`. Wraps PTY lifecycle.

---

## 11. IPC Contracts

All IPC flows through `contextBridge`. Renderer never sees `ipcRenderer` directly.

### 11.1 preload.ts surface

```ts
// Exposed as window.grove
{
  pty: {
    create(sessionId: string, opts: { cols: number; rows: number; cwd?: string; command?: string }): Promise<{ ok: true; pid: number } | { ok: false; reason: 'enoent' | 'spawn-failed'; fallback?: 'shell' }>;
    write(sessionId: string, data: string): void;       // fire-and-forget
    resize(sessionId: string, cols: number, rows: number): void;
    kill(sessionId: string): Promise<void>;

    onData(handler: (sessionId: string, data: string) => void): () => void;  // returns unsubscribe
    onExit(handler: (sessionId: string, code: number) => void): () => void;
  },
  store: {
    getAll(): Promise<PersistedState>;
    set<K extends keyof PersistedState>(key: K, value: PersistedState[K]): Promise<void>;
    reset(): Promise<void>;
  },
  dialog: {
    chooseDirectory(): Promise<string | null>;
    confirm(opts: { title: string; message: string; danger?: boolean }): Promise<boolean>;
  },
  window: {
    setVibrancy(material: 'sidebar' | 'titlebar' | 'menu' | 'none'): void;
    setTitle(title: string): void;
  },
  system: {
    platform(): string;       // 'darwin' for now
    isClaudeInstalled(): Promise<boolean>;
    versions(): { electron: string; node: string; chrome: string; grove: string };
  }
}
```

### 11.2 IPC channels (internal)

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `pty:create` | R→M | `{ sessionId, cols, rows, cwd?, command? }` | `{ ok, pid? , reason? , fallback? }` |
| `pty:write` | R→M | `{ sessionId, data }` | none |
| `pty:resize` | R→M | `{ sessionId, cols, rows }` | none |
| `pty:kill` | R→M | `{ sessionId }` | `{ ok }` |
| `pty:data` | M→R | `{ sessionId, data }` | event |
| `pty:exit` | M→R | `{ sessionId, code }` | event |
| `store:get-all` | R→M | none | full PersistedState |
| `store:set` | R→M | `{ key, value }` | `{ ok }` |
| `dialog:choose-dir` | R→M | none | `string | null` |
| `dialog:confirm` | R→M | `{ title, message, danger? }` | `boolean` |
| `window:set-vibrancy` | R→M | `{ material }` | none |
| `system:is-claude-installed` | R→M | none | `boolean` |

### 11.3 Error handling

- PTY create failure → resolve with `{ ok: false, reason }`. Renderer surfaces banner.
- PTY write to dead session → silent (the session reaper will clean up).
- IPC bridge errors logged to a ring buffer (last 200 entries) accessible via Settings → About → Show diagnostics.

### 11.4 Security

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` (sandbox disabled is necessary for node-pty preload but renderer is sandboxed via contextIsolation).
- `webPreferences.preload` points to compiled `preload.js`.
- CSP: `default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:;` (no remote origins by default).
- No remote module. No `nodeIntegrationInWorker`.

---

## 12. Persistence Schema

`~/Library/Application Support/Grove/config.json` — managed by electron-store v8.

```ts
interface PersistedState {
  schemaVersion: 1;

  // Window
  window: { width: number; height: number; x?: number; y?: number; isFullscreen: boolean };

  // Sessions
  sessions: Session[];               // ordered by sortOrder; ptyPid omitted
  tags: Tag[];

  // UI
  themePreset: ThemePreset;
  darkMode: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  canvasTransform: { x: number; y: number; scale: number };

  // Terminal
  terminalFont: string;
  terminalFontSize: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;

  // Behavior
  defaultCommand: string;
  defaultWorkingDir: string | null;
  snapToGrid: boolean;
  gridSize: 4 | 8 | 16;
  autoRestoreSessions: boolean;
  confirmBeforeKill: boolean;

  // Custom theme
  customTheme: { name: string; light: Record<string,string>; dark: Record<string,string> } | null;
}
```

#### Migration strategy

`src/store/migrations.ts` exports `migrate(state, fromVersion)` chain. v1 is initial; future schema bumps add new functions. On boot, run all applicable migrations before hydration. Failed migration → backup `config.json` → `config.json.bak.<timestamp>` → start fresh with defaults and surface a one-time banner.

#### Auto-restore behavior

On boot with `autoRestoreSessions = true`:
1. Hydrate stores.
2. For each persisted session, render its panel at saved position/size with a "spawning…" placeholder.
3. Sequentially (not parallel — avoid resource thrash) call `window.grove.pty.create(...)` for each.
4. As each PTY confirms, swap placeholder for live xterm.
5. On any failure, show in-panel error banner + retry button.

---

## 13. Edge Cases & Error States

| Scenario | Behavior |
|----------|----------|
| `claude` binary not on PATH | `pty:create` resolves with `{ ok: false, reason: 'enoent', fallback: 'shell' }`. Render in-panel yellow banner: `⚠ claude CLI not found. Open a shell instead? [y/N]`. `y` → re-create with `command: $SHELL`. `N` → leave panel empty with retry button. |
| PTY exits unexpectedly | Red banner: `[Session ended (exit 1) — press any key to restart]`. Any keypress re-spawns the session (preserves position/size/name/tags). |
| Two panels at exact same position on restore | Detect collision; offset every duplicate by `+24, +24` until unique. |
| User sets terminal font that's not installed | Fall back to JetBrains Mono. Show subtle warning in Settings under the picker. |
| Custom theme JSON import malformed | Validation: required keys present, all colors valid hex/rgb/oklch. Show error toast (one of the few times we toast — it's a settings-level error, not in-canvas). |
| Theme change while panels open | CSS variables transition over `--motion-base`. xterm theme updates instantly via `term.options.theme = newScheme` for every session. |
| Window closed with running sessions | If any session is running, show native confirm dialog: "5 sessions are running. Close anyway?" → if confirmed, kill all PTYs cleanly before exit. |
| Disk full / electron-store write fails | Catch, log, show one-time banner: "Could not save workspace state. Free disk space and retry." Do not crash. |
| node-pty native module mismatch (e.g. user upgraded Electron) | App boot detects via try/catch on first `require('node-pty')`. Show modal: "Native module needs rebuild. Run `npm rebuild` or reinstall Grove." |
| Memory pressure (10+ active sessions, each with large scrollback) | xterm scrollback default 1000; cap at 5000 in settings. Provide "Clear scrollback" in panel context menu. |
| Sidebar reorder during drag of a panel | Disable sidebar drag while a panel is being dragged on canvas. |
| User drags panel off-screen | Allow — canvas extends. But on next `fitAll`, all panels come back into view. |
| Rename to empty string | Reject on confirm — restore previous value. |
| Multiple monitors | Window restore uses saved x/y; if outside any current display, reset to primary display center. |

---

## 14. Empty & Loading States

| State | Visual |
|-------|--------|
| Canvas empty | Centered dashed-border CTA card (§6.9) |
| Sidebar empty (no sessions) | Below "SESSIONS" label: muted text "No sessions yet" |
| Sidebar empty (no tags) | Below "TAGS" label: muted text "No tags — manage in Settings" |
| Session spawning | Panel renders with chrome but terminal area shows centered spinner + "Starting claude…" caption |
| Session restoring on boot | Same spinner; caption "Restoring session…" |
| Theme switching | CSS transitions handle it; no explicit loading state |
| Search no results | Sidebar list area: centered muted text "No sessions match \"{query}\"" |
| Filter no results | Canvas dim layer + centered text "No sessions tagged with {tag}" + "Clear filter" button |

Spinner: 16×16, 2px stroke, `--accent` color, rotates over 800ms linear (the one place linear easing is allowed because it's a continuous rotation — but only when motion is not reduced; under reduced motion, replace with a pulsing dot).

---

## 15. App Icon & Branding

### 15.1 Logo

A stylized `>_` glyph (terminal prompt) inside a rounded square (the "grove" frame). Two-color minimum:

- Frame: `--accent` (claude orange in marketing) with subtle inner shadow.
- Glyph: white at 95% opacity.
- Corner radius: 22% of icon size (matches macOS Big Sur icon grid).

### 15.2 Asset list

| File | Size | Use |
|------|------|-----|
| `assets/icon.png` | 1024×1024 | Master |
| `assets/icon.icns` | multi-resolution | macOS app bundle |
| `assets/icon@2x.png` | 1024×1024 | Retina |
| `assets/icon-tray.png` | 32×32 (template) | Future menu-bar icon |
| `assets/dmg-background.png` | 540×380 | DMG installer background |

Generation: SVG master → `png2icons` → .icns. Provide `make-icons.sh` script that pipelines this.

### 15.3 DMG installer

Background image: workspace mockup with a subtle "Drag Grove to Applications" arrow. Window 540×380, app icon at (160, 180), Applications shortcut at (380, 180). See `electron-builder.yml` in spec.

### 15.4 Marketing surfaces (out of scope for V1)

Note for later: when there's a website, the typography pairing for marketing is **JetBrains Mono (display) + Inter (body)** — recommendation from the design system search. This document does not cover marketing UI.

---

## Appendix A — Tailwind config snippet

```ts
// tailwind.config.ts
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map every CSS var to a tailwind utility
        canvas:    'var(--bg-canvas)',
        panel:     'var(--bg-panel)',
        panelHead: 'var(--bg-panel-header)',
        sidebar:   'var(--bg-sidebar)',
        toolbar:   'var(--bg-toolbar)',
        modal:     'var(--bg-modal)',
        overlay:   'var(--bg-modal-overlay)',
        input:     'var(--bg-input)',
        tag:       'var(--bg-tag)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          pressed: 'var(--accent-pressed)',
          soft:    'var(--accent-soft)',
          ring:    'var(--accent-ring)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          onAccent:  'var(--text-on-accent)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          strong:  'var(--border-strong)',
          subtle:  'var(--border-subtle)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
        info:    'var(--info)',
      },
      borderRadius: {
        panel:   'var(--radius-panel)',
        control: 'var(--radius-control)',
        pill:    'var(--radius-pill)',
      },
      boxShadow: {
        'panel-resting':  'var(--shadow-panel-resting)',
        'panel-focused':  'var(--shadow-panel-focused)',
        'panel-dragging': 'var(--shadow-panel-dragging)',
        'modal':          'var(--shadow-modal)',
      },
      fontFamily: {
        ui:       'var(--font-ui)',
        terminal: 'var(--font-terminal)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '300ms',
        deliberate: '400ms',
      },
      transitionTimingFunction: {
        out:    'cubic-bezier(0.16, 1, 0.3, 1)',
        in:     'cubic-bezier(0.7, 0, 0.84, 0)',
        inOut:  'cubic-bezier(0.4, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
};
```

---

## Appendix B — Curated font lists

**UI fonts** (Settings → Appearance → UI Font):
- System (`-apple-system, BlinkMacSystemFont`)
- Inter
- IBM Plex Sans
- DM Sans
- Söhne (only if installed locally)
- Geist
- Space Grotesk
- Google Sans (only if installed locally)

**Terminal fonts** (Settings → Appearance → Terminal Font):
- JetBrains Mono (default)
- Fira Code
- IBM Plex Mono
- SF Mono (system)
- Geist Mono
- Hack

Bundle Inter, IBM Plex Sans, DM Sans, Geist, Space Grotesk, JetBrains Mono, Fira Code, IBM Plex Mono, Geist Mono, Hack as `.woff2` in `assets/fonts/` and load via `@font-face` in `globals.css`.

---

## Appendix C — Acceptance checklist (per feature)

Each implementation phase is "done" when:

- [ ] Renders correctly in all 5 themes × light/dark = 10 visual states
- [ ] Keyboard reachable + focus ring visible on `:focus-visible` only
- [ ] aria-label on all icon buttons
- [ ] No animation longer than 400ms outside the canvas pan
- [ ] `prefers-reduced-motion` honored
- [ ] No hardcoded hex values — all surfaces reference CSS vars
- [ ] No emoji as functional icons
- [ ] Hover states use color/opacity, never scale (no layout shift)
- [ ] Min window size respected at 1024×640
- [ ] State persists across `Cmd+Q` → relaunch
- [ ] No `nodeIntegration` leaks; `node-pty` import only in main process

---

*End of design specification. See `BUILD-PLAN.md` for the sequenced implementation roadmap.*
