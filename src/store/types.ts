// Domain types for Grove. Mirrors DESIGN.md §6.1 (Session) and §6.3 (Tag),
// plus a few fields used by the workspace store. The full set of types
// (LayoutConfig, ThemePreset palette shape, etc.) lives across this file
// and the corresponding theme/persistence files as those phases land.

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

export interface Session {
  id: string;
  name: string;
  color: string;            // hex; user-chosen accent
  tags: string[];           // tag ids
  position: Vec2;           // canvas-space absolute coords
  size: Size;
  sortOrder: number;        // sidebar ordering (lower = higher in list)
  cwd?: string;
  command?: string;         // overrides global default if set
  createdAt: number;
  isMinimized: boolean;
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
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}
