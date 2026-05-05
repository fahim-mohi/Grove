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
