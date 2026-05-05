import { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspace';
import { TagBadge } from '../TagBadge';
import { SWATCHES } from '../ColorPicker';

export function TagsTab() {
  const tagOrder = useWorkspaceStore((s) => s.tagOrder);
  const tagsMap = useWorkspaceStore((s) => s.tags);
  const addTag = useWorkspaceStore((s) => s.addTag);
  const renameTag = useWorkspaceStore((s) => s.renameTag);
  const recolorTag = useWorkspaceStore((s) => s.recolorTag);
  const deleteTag = useWorkspaceStore((s) => s.deleteTag);

  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState<string>(SWATCHES[5] ?? '#22C55E');

  function handleCreate(): void {
    const name = draftName.trim();
    if (!name) return;
    addTag({ name, color: draftColor });
    setDraftName('');
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-4 py-1">
      <h3 className="font-ui text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Tags
      </h3>

      {tagOrder.length === 0 && !creating && (
        <p className="font-ui text-[13px] text-text-muted">
          No tags yet — create one to label sessions.
        </p>
      )}

      {tagOrder.length > 0 && (
        <div className="flex flex-col divide-y divide-edge rounded-control border border-edge">
          {tagOrder.map((id) => {
            const tag = tagsMap[id];
            if (!tag) return null;
            return (
              <TagRow
                key={tag.id}
                id={tag.id}
                name={tag.name}
                color={tag.color}
                onRename={(next) => renameTag(tag.id, next)}
                onRecolor={(next) => recolorTag(tag.id, next)}
                onDelete={async () => {
                  const ok = await window.grove.dialog.confirm({
                    title: `Delete tag ${tag.name}?`,
                    message: `Delete tag "${tag.name}"?`,
                    detail: 'It will be removed from every session that has it.',
                    danger: true,
                    okLabel: 'Delete',
                  });
                  if (ok) deleteTag(tag.id);
                }}
              />
            );
          })}
        </div>
      )}

      {creating ? (
        <div className="flex items-center gap-2 rounded-control border border-edge bg-input p-2">
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
            className="flex-1 border-none bg-transparent font-ui text-[13px] text-text-primary outline-none placeholder:text-text-muted"
          />
          <input
            type="color"
            value={draftColor}
            onChange={(e) => setDraftColor(e.target.value)}
            className="cursor-pointer border-none bg-transparent"
            style={{ width: 22, height: 22, padding: 0 }}
            aria-label="Tag color"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!draftName.trim()}
            className="cursor-pointer rounded-control bg-accent px-3 py-1 font-ui text-[12px] font-semibold text-text-onAccent transition-colors duration-fast ease-out hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setDraftName('');
            }}
            className="cursor-pointer rounded-control border border-edge bg-modal px-3 py-1 font-ui text-[12px] font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="self-start cursor-pointer rounded-control border border-edge bg-modal px-3 py-1.5 font-ui text-[13px] font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
        >
          + New tag
        </button>
      )}
    </div>
  );
}

function TagRow({
  id: _id,
  name,
  color,
  onRename,
  onRecolor,
  onDelete,
}: {
  id: string;
  name: string;
  color: string;
  onRename: (n: string) => void;
  onRecolor: (c: string) => void;
  onDelete: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function commit(): void {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    if (!trimmed) setDraft(name);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <TagBadge tag={{ id: 'preview', name: editing ? draft || name : name, color }} size="sm" />
      <div className="flex-1">
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              else if (e.key === 'Escape') {
                setDraft(name);
                setEditing(false);
              }
            }}
            autoFocus
            spellCheck={false}
            className="w-full rounded-control border border-edge bg-input px-2 py-1 font-ui text-[13px] text-text-primary outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setDraft(name);
            }}
            className="cursor-pointer text-left font-ui text-[13px] text-text-primary"
          >
            {name}
          </button>
        )}
      </div>
      <input
        type="color"
        value={color}
        onChange={(e) => onRecolor(e.target.value)}
        className="cursor-pointer border-none bg-transparent"
        style={{ width: 22, height: 22, padding: 0 }}
        aria-label="Recolor tag"
      />
      <button
        type="button"
        onClick={() => void onDelete()}
        aria-label="Delete tag"
        className="cursor-pointer rounded-control p-1.5 text-text-muted transition-colors duration-fast ease-out hover:text-danger"
      >
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>
    </div>
  );
}
