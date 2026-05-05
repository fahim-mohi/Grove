// Shared domain types — visible to both the renderer (src/) and the
// Electron main process (electron/). All cross-boundary type imports
// resolve through this file so neither tsconfig has to include the other
// project's directory.

export type ThemePreset = 'claude' | 'chatgpt' | 'gemini' | 'linear' | 'custom';
export type DarkMode = 'light' | 'dark' | 'system';
export type CursorStyle = 'block' | 'underline' | 'bar';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// 'local' = traditional fresh PTY spawned by Grove (legacy / tmux-missing path).
// 'tmux'  = the PTY just runs `tmux attach -t tmuxName`. Detach is non-destructive.
export type SessionKind = 'local' | 'tmux';

export interface Session {
  id: string;
  name: string;
  color: string;
  tags: string[];
  position: Vec2;
  size: Size;
  sortOrder: number;
  cwd?: string;
  command?: string;
  createdAt: number;
  isMinimized: boolean;
  // Tmux-backed when set. The tmux server holds the actual PTY +
  // claude process; Grove only attaches.
  kind?: SessionKind;
  tmuxName?: string;
  // True while a Grove panel is currently attached to the tmux session.
  // When false, the session is "out in the wild" — running in tmux,
  // not visible in any Grove panel.
  attached?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface NewSessionInput {
  name: string;
  color: string;
  tags?: string[];
  cwd?: string;
  command?: string;
  position?: Vec2;
  size?: Size;
  kind?: SessionKind;
  tmuxName?: string;
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}
