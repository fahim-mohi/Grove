import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { CanvasTransform, NewSessionInput, Session, Size, Tag, Vec2 } from './types';
import type { TmuxSessionInfo } from '../../shared/grove-api';

// Phase 3 subset of the full DESIGN.md §10.1 workspace store.
// Adds: sessions/order/focus/drag state + the 7 actions the canvas needs.
// Phases that follow expand this:
//   Phase 5  → reorder (sidebar drag), search, context menu state
//   Phase 6  → persistence-aware setters (debounced electron-store writes)
//   Phase 8  → tag CRUD + filterTagId
//   Phase 10 → canvasTransform + fitAll

const DEFAULT_SIZE: Size = { width: 640, height: 420 };
const DEFAULT_POSITION: Vec2 = { x: 80, y: 80 };
const DEFAULT_COLOR = '#D97745'; // grove warm orange
const STAGGER_OFFSET = 32;

export type ModalState =
  | { type: 'newSession' }
  | { type: 'settings' }
  | { type: 'commandPalette' }
  | null;

export interface WorkspaceState {
  sessions: Record<string, Session>;
  sessionOrder: string[];

  tags: Record<string, Tag>;
  tagOrder: string[];

  focusedSessionId: string | null;
  draggingSessionId: string | null;
  fullscreenSessionId: string | null;
  filterTagId: string | null;

  // UI
  sidebarCollapsed: boolean;
  searchQuery: string;
  modal: ModalState;
  canvasTransform: CanvasTransform;

  // Tmux integration runtime state
  tmuxAvailable: boolean;
  externalTmuxSessions: TmuxSessionInfo[]; // tmux sessions running outside Grove right now
  lastDetachedTmux: { tmuxName: string; sessionName: string; at: number } | null;
  // True while a panel is being dragged AND the cursor is hovering over
  // a region that would trigger detach-on-drop (currently the sidebar).
  // Lets the sidebar render an accent ring as visual confirmation.
  detachDropActive: boolean;

  // Session actions
  addSession: (input: NewSessionInput) => string;
  removeSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  recolorSession: (id: string, color: string) => void;
  moveSession: (id: string, position: Vec2) => void;
  resizeSession: (id: string, size: Size) => void;
  reorderSessions: (orderedIds: string[]) => void;
  focusSession: (id: string | null) => void;
  bringToFront: (id: string) => void;
  setDragging: (id: string | null) => void;
  toggleFullscreen: (id: string) => void;
  exitFullscreen: () => void;
  toggleSidebar: () => void;
  setSearchQuery: (q: string) => void;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;

  // Tmux runtime actions
  setTmuxAvailable: (v: boolean) => void;
  setExternalTmuxSessions: (sessions: TmuxSessionInfo[]) => void;
  setSessionAttached: (id: string, attached: boolean) => void;
  noteDetached: (info: { tmuxName: string; sessionName: string }) => void;
  clearDetachedNotice: () => void;
  setDetachDropActive: (active: boolean) => void;

  // Canvas transform actions
  setCanvasTransform: (next: Partial<CanvasTransform>) => void;
  panCanvas: (dx: number, dy: number) => void;
  zoomCanvasAt: (clientX: number, clientY: number, factor: number) => void;
  resetCanvas: () => void;
  fitAllToBounds: (bounds: { width: number; height: number }) => void;

  // Tag actions
  addTag: (input: { name: string; color: string }) => string;
  renameTag: (id: string, name: string) => void;
  recolorTag: (id: string, color: string) => void;
  deleteTag: (id: string) => void;
  toggleSessionTag: (sessionId: string, tagId: string) => void;
  setFilterTag: (id: string | null) => void;
  hydrateTags: (tags: Tag[]) => void;

  // Selectors
  getSortedSessions: () => Session[];
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  sessions: {},
  sessionOrder: [],
  tags: {},
  tagOrder: [],
  focusedSessionId: null,
  draggingSessionId: null,
  fullscreenSessionId: null,
  filterTagId: null,

  sidebarCollapsed: false,
  searchQuery: '',
  modal: null,
  canvasTransform: { x: 0, y: 0, scale: 1 },
  tmuxAvailable: false,
  externalTmuxSessions: [],
  lastDetachedTmux: null,
  detachDropActive: false,

  addSession(input) {
    const id = nanoid();
    const now = Date.now();
    const order = get().sessionOrder;

    // Stagger so sessions don't pile up at exact same coords.
    const offset = order.length * STAGGER_OFFSET;
    const position = input.position ?? {
      x: DEFAULT_POSITION.x + offset,
      y: DEFAULT_POSITION.y + offset,
    };

    const session: Session = {
      id,
      name: input.name,
      color: input.color || DEFAULT_COLOR,
      tags: input.tags ?? [],
      position,
      size: input.size ?? DEFAULT_SIZE,
      sortOrder: order.length,
      cwd: input.cwd,
      command: input.command,
      createdAt: now,
      isMinimized: false,
      kind: input.kind ?? 'local',
      tmuxName: input.tmuxName,
      attached: true,
    };

    set((state) => ({
      sessions: { ...state.sessions, [id]: session },
      sessionOrder: [...state.sessionOrder, id],
      focusedSessionId: id,
    }));
    return id;
  },

  removeSession(id) {
    set((state) => {
      const next = { ...state.sessions };
      delete next[id];
      return {
        sessions: next,
        sessionOrder: state.sessionOrder.filter((x) => x !== id),
        focusedSessionId: state.focusedSessionId === id ? null : state.focusedSessionId,
        draggingSessionId: state.draggingSessionId === id ? null : state.draggingSessionId,
      };
    });
  },

  renameSession(id, name) {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return state;
      return { sessions: { ...state.sessions, [id]: { ...session, name } } };
    });
  },

  recolorSession(id, color) {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return state;
      return { sessions: { ...state.sessions, [id]: { ...session, color } } };
    });
  },

  moveSession(id, position) {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return state;
      return { sessions: { ...state.sessions, [id]: { ...session, position } } };
    });
  },

  resizeSession(id, size) {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return state;
      return { sessions: { ...state.sessions, [id]: { ...session, size } } };
    });
  },

  focusSession(id) {
    set({ focusedSessionId: id });
  },

  bringToFront(id) {
    // Move id to the end of sessionOrder so its z-index becomes the highest.
    // Renumber sortOrder so persistence has a stable representation.
    set((state) => {
      if (!state.sessions[id]) return state;
      const filtered = state.sessionOrder.filter((x) => x !== id);
      const nextOrder = [...filtered, id];
      const nextSessions: Record<string, Session> = {};
      nextOrder.forEach((sid, idx) => {
        const s = state.sessions[sid];
        if (s) nextSessions[sid] = { ...s, sortOrder: idx };
      });
      return { sessions: nextSessions, sessionOrder: nextOrder };
    });
  },

  setDragging(id) {
    set({ draggingSessionId: id });
  },

  toggleFullscreen(id) {
    set((state) => ({
      fullscreenSessionId: state.fullscreenSessionId === id ? null : id,
      focusedSessionId: state.fullscreenSessionId === id ? state.focusedSessionId : id,
    }));
  },

  exitFullscreen() {
    set({ fullscreenSessionId: null });
  },

  reorderSessions(orderedIds) {
    set((state) => {
      const next: Record<string, Session> = {};
      orderedIds.forEach((id, idx) => {
        const s = state.sessions[id];
        if (s) next[id] = { ...s, sortOrder: idx };
      });
      // Preserve any sessions not in orderedIds (defensive)
      Object.keys(state.sessions).forEach((id) => {
        if (!next[id] && state.sessions[id]) next[id] = state.sessions[id];
      });
      return { sessions: next, sessionOrder: orderedIds };
    });
  },

  toggleSidebar() {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSearchQuery(q) {
    set({ searchQuery: q });
  },

  openModal(modal) {
    set({ modal });
  },

  closeModal() {
    set({ modal: null });
  },

  setTmuxAvailable(v) {
    set({ tmuxAvailable: v });
  },

  setExternalTmuxSessions(sessions) {
    set({ externalTmuxSessions: sessions });
  },

  setSessionAttached(id, attached) {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return state;
      return { sessions: { ...state.sessions, [id]: { ...session, attached } } };
    });
  },

  noteDetached(info) {
    set({ lastDetachedTmux: { ...info, at: Date.now() } });
  },

  clearDetachedNotice() {
    set({ lastDetachedTmux: null });
  },

  setDetachDropActive(active) {
    set({ detachDropActive: active });
  },

  setCanvasTransform(next) {
    set((state) => {
      const merged = { ...state.canvasTransform, ...next };
      // Clamp scale 0.5–1.5 per DESIGN.md §7.3.
      merged.scale = Math.max(0.5, Math.min(1.5, merged.scale));
      return { canvasTransform: merged };
    });
  },

  panCanvas(dx, dy) {
    set((state) => ({
      canvasTransform: {
        ...state.canvasTransform,
        x: state.canvasTransform.x + dx,
        y: state.canvasTransform.y + dy,
      },
    }));
  },

  zoomCanvasAt(clientX, clientY, factor) {
    set((state) => {
      const t = state.canvasTransform;
      const newScale = Math.max(0.5, Math.min(1.5, t.scale * factor));
      // Zoom anchored at the cursor position so the point under the
      // cursor stays put. Solve for new x/y:
      //   worldPoint = (clientX - t.x) / t.scale  must equal
      //   (clientX - newX) / newScale
      // ⇒ newX = clientX - worldPoint * newScale
      const worldX = (clientX - t.x) / t.scale;
      const worldY = (clientY - t.y) / t.scale;
      return {
        canvasTransform: {
          x: clientX - worldX * newScale,
          y: clientY - worldY * newScale,
          scale: newScale,
        },
      };
    });
  },

  resetCanvas() {
    set({ canvasTransform: { x: 0, y: 0, scale: 1 } });
  },

  fitAllToBounds(viewport) {
    const state = get();
    const sessions = state.sessionOrder
      .map((id) => state.sessions[id])
      .filter((s): s is Session => Boolean(s));
    if (sessions.length === 0) {
      set({ canvasTransform: { x: 0, y: 0, scale: 1 } });
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const s of sessions) {
      minX = Math.min(minX, s.position.x);
      minY = Math.min(minY, s.position.y);
      maxX = Math.max(maxX, s.position.x + s.size.width);
      maxY = Math.max(maxY, s.position.y + s.size.height);
    }
    const padding = 64;
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const scale = Math.max(
      0.5,
      Math.min(1.5, Math.min((viewport.width - padding * 2) / contentW, (viewport.height - padding * 2) / contentH)),
    );
    const x = padding - minX * scale + (viewport.width - padding * 2 - contentW * scale) / 2;
    const y = padding - minY * scale + (viewport.height - padding * 2 - contentH * scale) / 2;
    set({ canvasTransform: { x, y, scale } });
  },

  addTag(input) {
    const id = nanoid();
    const tag: Tag = { id, name: input.name.trim(), color: input.color };
    set((state) => ({
      tags: { ...state.tags, [id]: tag },
      tagOrder: [...state.tagOrder, id],
    }));
    return id;
  },

  renameTag(id, name) {
    set((state) => {
      const tag = state.tags[id];
      if (!tag) return state;
      const trimmed = name.trim();
      if (!trimmed) return state;
      return { tags: { ...state.tags, [id]: { ...tag, name: trimmed } } };
    });
  },

  recolorTag(id, color) {
    set((state) => {
      const tag = state.tags[id];
      if (!tag) return state;
      return { tags: { ...state.tags, [id]: { ...tag, color } } };
    });
  },

  deleteTag(id) {
    set((state) => {
      const nextTags = { ...state.tags };
      delete nextTags[id];
      // Strip the tag from any session that had it.
      const nextSessions: Record<string, Session> = {};
      for (const [sid, s] of Object.entries(state.sessions)) {
        if (s.tags.includes(id)) {
          nextSessions[sid] = { ...s, tags: s.tags.filter((t) => t !== id) };
        } else {
          nextSessions[sid] = s;
        }
      }
      return {
        tags: nextTags,
        tagOrder: state.tagOrder.filter((x) => x !== id),
        sessions: nextSessions,
        filterTagId: state.filterTagId === id ? null : state.filterTagId,
      };
    });
  },

  toggleSessionTag(sessionId, tagId) {
    set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;
      const has = session.tags.includes(tagId);
      const nextTags = has ? session.tags.filter((t) => t !== tagId) : [...session.tags, tagId];
      return {
        sessions: { ...state.sessions, [sessionId]: { ...session, tags: nextTags } },
      };
    });
  },

  setFilterTag(id) {
    set({ filterTagId: id });
  },

  hydrateTags(persistedTags) {
    const map: Record<string, Tag> = {};
    persistedTags.forEach((t) => {
      map[t.id] = t;
    });
    set({
      tags: map,
      tagOrder: persistedTags.map((t) => t.id),
    });
  },

  getSortedSessions() {
    const state = get();
    return state.sessionOrder
      .map((id) => state.sessions[id])
      .filter((s): s is Session => Boolean(s));
  },
}));
