import { useState, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useWorkspaceStore } from '../store/workspace';
import { SessionListItem } from './SessionListItem';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { TagBadge } from './TagBadge';
import { ExternalSessionItem } from './ExternalSessionItem';

interface SidebarProps {
  onOpenNewSession: () => void;
}

export function Sidebar({ onOpenNewSession }: SidebarProps) {
  const sessionOrder = useWorkspaceStore((s) => s.sessionOrder);
  const sessionsMap = useWorkspaceStore((s) => s.sessions);
  const focusedId = useWorkspaceStore((s) => s.focusedSessionId);
  const collapsed = useWorkspaceStore((s) => s.sidebarCollapsed);
  const search = useWorkspaceStore((s) => s.searchQuery);
  const setSearch = useWorkspaceStore((s) => s.setSearchQuery);
  const focusSession = useWorkspaceStore((s) => s.focusSession);
  const bringToFront = useWorkspaceStore((s) => s.bringToFront);
  const reorderSessions = useWorkspaceStore((s) => s.reorderSessions);
  const removeSession = useWorkspaceStore((s) => s.removeSession);
  const tagOrder = useWorkspaceStore((s) => s.tagOrder);
  const tagsMap = useWorkspaceStore((s) => s.tags);
  const filterTagId = useWorkspaceStore((s) => s.filterTagId);
  const setFilterTag = useWorkspaceStore((s) => s.setFilterTag);
  const externalTmux = useWorkspaceStore((s) => s.externalTmuxSessions);
  const tmuxAvailable = useWorkspaceStore((s) => s.tmuxAvailable);
  const addSession = useWorkspaceStore((s) => s.addSession);

  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const visibleSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessionOrder
      .map((id) => sessionsMap[id])
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .filter((s) => (q ? s.name.toLowerCase().includes(q) : true));
  }, [sessionOrder, sessionsMap, search]);

  function handleDragEnd(e: DragEndEvent): void {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const oldIdx = sessionOrder.indexOf(activeId);
    const newIdx = sessionOrder.indexOf(overId);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = [...sessionOrder];
    next.splice(oldIdx, 1);
    next.splice(newIdx, 0, activeId);
    reorderSessions(next);
  }

  function handleSelect(id: string): void {
    focusSession(id);
    bringToFront(id);
  }

  function handleContextMenu(id: string, x: number, y: number): void {
    setContextMenu({ id, x, y });
  }

  function buildMenuItems(id: string): ContextMenuItem[] {
    const session = sessionsMap[id];
    if (!session) return [];
    return [
      {
        id: 'rename',
        label: 'Rename',
        shortcut: 'F2',
        onSelect: () => {
          // Focus the session first so the panel is visible + on top, then
          // dispatch the same custom event the F2 shortcut uses to put
          // SessionHeader into inline-rename mode.
          focusSession(id);
          bringToFront(id);
          window.dispatchEvent(
            new CustomEvent('grove:rename-session', { detail: { sessionId: id } }),
          );
        },
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        disabled: true, // Phase 11 — also needs persistent state copy
        onSelect: () => {},
      },
      {
        id: 'reveal',
        label: 'Reveal on canvas',
        onSelect: () => handleSelect(id),
        dividerAfter: true,
      },
      {
        id: 'kill',
        label: 'Kill session',
        shortcut: '⌘W',
        danger: true,
        onSelect: () => {
          void window.grove.pty.kill(id).then(() => removeSession(id));
        },
      },
    ];
  }

  if (collapsed) {
    return (
      <aside
        className="flex flex-shrink-0 flex-col items-center border-r border-edge bg-sidebar"
        style={{ width: 56 }}
      >
        <button
          type="button"
          onClick={onOpenNewSession}
          aria-label="New session"
          title="New session (⌘N)"
          className="mt-3 cursor-pointer rounded-control bg-accent p-2 text-text-onAccent transition-colors duration-fast ease-out hover:bg-accent-hover"
        >
          <PlusIcon />
        </button>
        <div className="mt-3 flex flex-1 flex-col items-center gap-2 overflow-y-auto py-2">
          {visibleSessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => handleSelect(session.id)}
              aria-label={session.name}
              title={session.name}
              className={`h-3 w-3 cursor-pointer rounded-pill transition-transform duration-fast ease-out hover:scale-125 ${
                focusedId === session.id ? 'ring-2 ring-offset-1' : ''
              }`}
              style={{
                backgroundColor: session.color,
                ...(focusedId === session.id
                  ? { boxShadow: `0 0 0 2px var(--bg-sidebar), 0 0 0 4px var(--accent-ring)` }
                  : {}),
              }}
            />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-shrink-0 flex-col border-r border-edge bg-sidebar"
      style={{ width: 'var(--sidebar-width)' }}
    >
      <div
        className="flex flex-shrink-0 items-center border-b border-edge px-3"
        style={{ height: 'var(--toolbar-height)' }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions"
          spellCheck={false}
          className="w-full rounded-control border border-edge bg-input px-2.5 py-1 font-ui text-[12px] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-accent"
        />
      </div>

      <div className="flex flex-shrink-0 items-center justify-between px-3 pb-1.5 pt-4">
        <span
          className="font-ui font-semibold uppercase"
          style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            color: 'var(--text-soft, var(--text-muted))',
          }}
        >
          Sessions
        </span>
        <span className="font-terminal text-[10px] text-text-muted">{visibleSessions.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto" role="list" aria-label="Sessions">
        {visibleSessions.length === 0 ? (
          <div className="mx-1.5 px-2 py-2 font-ui text-[12px] text-text-muted">
            {search ? `No sessions match "${search}"` : 'No sessions yet'}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={visibleSessions.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {visibleSessions.map((session) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  isFocused={focusedId === session.id}
                  onClick={() => handleSelect(session.id)}
                  onContextMenu={(x, y) => handleContextMenu(session.id, x, y)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {tmuxAvailable && externalTmux.length > 0 && (
        <div className="flex flex-shrink-0 flex-col gap-1 border-t border-edge px-2 py-3">
          <div className="flex items-center justify-between px-2">
            <span
              className="font-ui font-semibold uppercase"
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                color: 'var(--text-soft, var(--text-muted))',
              }}
            >
              In tmux
            </span>
            <span className="font-terminal text-[10px] text-text-muted">
              {externalTmux.length}
            </span>
          </div>
          <p className="px-2 pb-1 font-ui text-[10px] text-text-muted">
            Drag onto canvas to attach
          </p>
          <div className="flex flex-col gap-0.5">
            {externalTmux.map((s) => (
              <ExternalSessionItem
                key={s.name}
                session={s}
                onClick={() => {
                  // Click = quick-attach. Same effect as drag-into-canvas.
                  addSession({
                    name: s.name.startsWith('grove-') ? s.name.slice(6) : s.name,
                    color: '#22C55E',
                    kind: 'tmux',
                    tmuxName: s.name,
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {tagOrder.length > 0 && (
        <div className="flex flex-shrink-0 flex-col gap-1.5 border-t border-edge px-3 py-3">
          <span
            className="px-1 font-ui font-semibold uppercase"
            style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'var(--text-soft, var(--text-muted))',
            }}
          >
            Tags
          </span>
          <div className="flex flex-wrap gap-1">
            {tagOrder.map((id) => {
              const tag = tagsMap[id];
              if (!tag) return null;
              return (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  size="sm"
                  active={filterTagId === tag.id}
                  onClick={() => setFilterTag(filterTagId === tag.id ? null : tag.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onOpenNewSession}
        className="flex flex-shrink-0 items-center justify-center gap-2 border-t border-edge px-3 py-3 font-ui text-[13px] font-semibold text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
      >
        <PlusIcon />
        New Session
        <span className="ml-auto font-terminal text-[11px] text-text-muted">⌘N</span>
      </button>

      {contextMenu && (
        <ContextMenu
          open
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildMenuItems(contextMenu.id)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </aside>
  );
}

function PlusIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
