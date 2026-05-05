import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Session } from '../store/types';

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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

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
      className={`group relative flex h-9 cursor-pointer items-center gap-2.5 px-3 py-1.5 transition-colors duration-fast ease-out ${
        isFocused
          ? 'bg-sidebarActive'
          : 'hover:bg-sidebarHover'
      }`}
      role="listitem"
    >
      {isFocused && (
        <span
          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-hidden
        />
      )}
      <span
        aria-hidden
        className="flex-shrink-0 rounded-pill"
        style={{ width: 8, height: 8, backgroundColor: session.color }}
      />
      <span className="min-w-0 flex-1 truncate font-ui text-[13px] font-medium text-text-primary">
        {session.name}
      </span>
    </div>
  );
}
