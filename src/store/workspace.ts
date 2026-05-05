import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { NewSessionInput, Session, Size, Vec2 } from './types';

// Phase 3 subset of the full DESIGN.md §10.1 workspace store.
// Adds: sessions/order/focus/drag state + the 7 actions the canvas needs.
// Phases that follow expand this:
//   Phase 5  → reorder (sidebar drag), search, context menu state
//   Phase 6  → persistence-aware setters (debounced electron-store writes)
//   Phase 8  → tag CRUD + filterTagId
//   Phase 10 → canvasTransform + fitAll

const DEFAULT_SIZE: Size = { width: 720, height: 480 };
const DEFAULT_POSITION: Vec2 = { x: 80, y: 80 };
const DEFAULT_COLOR = '#D97706'; // claude orange
const STAGGER_OFFSET = 32;

export interface WorkspaceState {
  sessions: Record<string, Session>;
  sessionOrder: string[];

  focusedSessionId: string | null;
  draggingSessionId: string | null;

  // Actions
  addSession: (input: NewSessionInput) => string;
  removeSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  recolorSession: (id: string, color: string) => void;
  moveSession: (id: string, position: Vec2) => void;
  resizeSession: (id: string, size: Size) => void;
  focusSession: (id: string | null) => void;
  bringToFront: (id: string) => void;
  setDragging: (id: string | null) => void;

  // Selectors (functions returning derived data — read with shallow if needed)
  getSortedSessions: () => Session[];
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  sessions: {},
  sessionOrder: [],
  focusedSessionId: null,
  draggingSessionId: null,

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

  getSortedSessions() {
    const state = get();
    return state.sessionOrder
      .map((id) => state.sessions[id])
      .filter((s): s is Session => Boolean(s));
  },
}));
