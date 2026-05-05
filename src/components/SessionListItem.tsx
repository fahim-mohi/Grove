import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Session, Tag } from '../store/types';
import { useWorkspaceStore } from '../store/workspace';
import { TagBadge } from './TagBadge';

interface SessionListItemProps {
  session: Session;
  isFocused: boolean;
  onClick: () => void;
  onContextMenu: (x: number, y: number) => void;
}

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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const hasTags = tags.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e.clientX, e.clientY);
      }}
      {...attributes}
      {...listeners}
      className={`group relative mx-1 flex cursor-pointer flex-col gap-1 rounded-control px-2 py-1 transition-colors duration-base ease-out ${
        hasTags ? 'min-h-[44px]' : 'min-h-[34px]'
      } ${isFocused ? 'bg-sidebarActive' : 'hover:bg-sidebarHover'}`}
      role="listitem"
    >
      {isFocused && (
        <span
          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-hidden
        />
      )}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex-shrink-0 rounded-pill"
          style={{ width: 8, height: 8, backgroundColor: session.color }}
        />
        <span className="min-w-0 flex-1 truncate font-ui text-[13px] font-medium text-text-primary">
          {session.name}
        </span>
      </div>
      {hasTags && (
        <div className="flex flex-wrap gap-1 pl-[18px]">
          {tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag.id} tag={tag} size="xs" />
          ))}
          {tags.length > 3 && (
            <span className="font-ui text-[10px] text-text-muted">+{tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
