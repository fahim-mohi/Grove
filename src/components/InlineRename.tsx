import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface InlineRenameProps {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  inputClassName?: string;
  // External trigger — when true, the component enters edit mode.
  // Component still owns the toggle internally on dbl-click.
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  // Visual element to render when not editing. Defaults to the value.
  children?: React.ReactNode;
}

// Reusable inline-rename primitive. Double-click to enter edit, Enter or
// blur to confirm, Esc to cancel, empty string is rejected (restores prior).
export function InlineRename(props: InlineRenameProps) {
  const [internalEditing, setInternalEditing] = useState(false);
  const [draft, setDraft] = useState(props.value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const editing = props.editing ?? internalEditing;

  function setEditing(next: boolean): void {
    if (props.onEditingChange) props.onEditingChange(next);
    setInternalEditing(next);
  }

  useEffect(() => {
    if (editing) {
      setDraft(props.value);
      // Defer focus + select so the input has rendered.
      window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [editing, props.value]);

  function commit(): void {
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      cancel();
      return;
    }
    if (trimmed !== props.value) props.onCommit(trimmed);
    setEditing(false);
  }

  function cancel(): void {
    setDraft(props.value);
    setEditing(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        onPointerDown={(e) => e.stopPropagation()}
        spellCheck={false}
        className={props.inputClassName ?? 'rounded-control border border-edge bg-input px-1 py-0 font-ui text-[13px] font-medium text-text-primary outline-none'}
      />
    );
  }

  return (
    <span
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={props.className}
      title="Double-click to rename"
    >
      {props.children ?? props.value}
    </span>
  );
}
