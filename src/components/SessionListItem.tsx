import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Session, Tag } from '../store/types';
import { useWorkspaceStore } from '../store/workspace';

interface SessionListItemProps {
  session: Session;
  isFocused: boolean;
  onClick: () => void;
  onContextMenu: (x: number, y: number) => void;
}

// Single-row sidebar item per asset pack: dot + name + (first tag as
// inline mini-pill on the right). 34px height. Active-row uses the
// accent-tinted bg + 2px left border. Tags beyond the first are
// summarized as +N. Matches the rendering in the asset pack §sidebar.
export function SessionListItem({
  session,
  isFocused,
  onClick,
  onContextMenu,
}: SessionListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
  });
  const tagsMap = useWorkspaceStore((s) => s.tags);

  const tags = useMemo<Tag[]>(
    () => session.tags.map((id) => tagsMap[id]).filter((t): t is Tag => Boolean(t)),
    [session.tags, tagsMap],
  );
  const firstTag = tags[0];
  const overflow = tags.length - 1;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        // Active-row tint per asset pack: rgba(217,119,69,0.12). The
        // CSS var already encodes this in light + dark modes.
        background: isFocused ? 'var(--bg-sidebar-active)' : undefined,
      }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e.clientX, e.clientY);
      }}
      {...attributes}
      {...listeners}
      className={`group relative mx-1.5 flex h-[34px] cursor-pointer items-center gap-2 rounded-control px-2 transition-colors duration-base ease-out ${
        isFocused ? 'text-text-primary' : 'text-text-secondary hover:bg-sidebarHover hover:text-text-primary'
      }`}
      role="listitem"
    >
      <span
        aria-hidden
        className="flex-shrink-0 rounded-pill"
        style={{ width: 8, height: 8, backgroundColor: session.color }}
      />
      <span className="min-w-0 flex-1 truncate font-ui text-[13px] font-medium">
        {session.name}
      </span>
      {firstTag && (
        <MiniTag
          name={firstTag.name}
          color={firstTag.color}
          extra={overflow > 0 ? `+${overflow}` : undefined}
        />
      )}
    </div>
  );
}

// Inline mini-tag — small rounded-rect (4px), 10px label, color-mix bg.
// Per asset pack §sidebar's `.sidebar-tag-mini`. Distinct from TagBadge
// (which is the full pill used elsewhere) — this is the compact form
// for tight sidebar/panel-header contexts.
function MiniTag({ name, color, extra }: { name: string; color: string; extra?: string }) {
  const tint = hexRgba(color, 0.15);
  return (
    <span
      className="flex-shrink-0 truncate font-ui text-[10px] font-semibold leading-none"
      style={{
        maxWidth: 70,
        padding: '3px 6px',
        borderRadius: 4,
        background: tint,
        color,
      }}
      title={name}
    >
      {name}
      {extra && <span style={{ opacity: 0.7, marginLeft: 4 }}>{extra}</span>}
    </span>
  );
}

function hexRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const expanded =
    c.length === 3 ? c[0]! + c[0]! + c[1]! + c[1]! + c[2]! + c[2]! : c;
  if (expanded.length !== 6) return hex;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
