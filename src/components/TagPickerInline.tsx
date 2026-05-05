import { useState } from 'react';
import { useWorkspaceStore } from '../store/workspace';
import { TagBadge } from './TagBadge';
import { SWATCHES } from './ColorPicker';

interface TagPickerInlineProps {
  // Selected tag IDs in this picker (controlled by parent — typically the
  // NewSessionDialog or a session's edit form).
  selectedIds: string[];
  onToggle: (tagId: string) => void;
}

// Inline tag picker. Renders all existing tags as toggleable pills + a
// "+ add tag" chip that expands into a name + color quick-create form.
export function TagPickerInline({ selectedIds, onToggle }: TagPickerInlineProps) {
  const tagOrder = useWorkspaceStore((s) => s.tagOrder);
  const tagsMap = useWorkspaceStore((s) => s.tags);
  const addTag = useWorkspaceStore((s) => s.addTag);

  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState<string>(SWATCHES[5] ?? '#22C55E');

  function handleCreate(): void {
    const name = draftName.trim();
    if (!name) return;
    const id = addTag({ name, color: draftColor });
    onToggle(id);
    setDraftName('');
    setCreating(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tagOrder.map((id) => {
        const tag = tagsMap[id];
        if (!tag) return null;
        return (
          <TagBadge
            key={tag.id}
            tag={tag}
            size="sm"
            active={selectedIds.includes(tag.id)}
            onClick={() => onToggle(tag.id)}
          />
        );
      })}

      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="cursor-pointer rounded-pill border border-dashed border-edge px-2 py-0.5 font-ui text-[11px] font-medium text-text-secondary transition-colors duration-fast ease-out hover:border-accent hover:text-accent"
          style={{ height: 20 }}
        >
          + add tag
        </button>
      ) : (
        <div className="flex items-center gap-1.5 rounded-pill border border-edge bg-input px-2 py-0.5" style={{ height: 22 }}>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              } else if (e.key === 'Escape') {
                setCreating(false);
                setDraftName('');
              }
            }}
            placeholder="tag name"
            autoFocus
            spellCheck={false}
            className="w-20 border-none bg-transparent font-ui text-[11px] outline-none placeholder:text-text-muted"
          />
          <input
            type="color"
            value={draftColor}
            onChange={(e) => setDraftColor(e.target.value)}
            className="cursor-pointer border-none bg-transparent"
            style={{ width: 14, height: 14, padding: 0 }}
            aria-label="Tag color"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!draftName.trim()}
            className="cursor-pointer text-accent transition-colors duration-fast ease-out hover:text-accent-hover disabled:cursor-not-allowed disabled:text-text-muted"
            aria-label="Create tag"
          >
            <svg
              width={11}
              height={11}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12l5 5 9-9" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setDraftName('');
            }}
            className="cursor-pointer text-text-muted transition-colors duration-fast ease-out hover:text-text-primary"
            aria-label="Cancel"
          >
            <svg
              width={11}
              height={11}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
