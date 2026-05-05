interface EmptyCanvasProps {
  onCreate: () => void;
}

// Shown on the WorkspaceCanvas when sessions.length === 0.
// DESIGN.md §6.9 / §14.
export function EmptyCanvas({ onCreate }: EmptyCanvasProps) {
  return (
    <div className="pointer-events-none flex h-full w-full items-center justify-center">
      <div
        className="pointer-events-auto flex flex-col items-center gap-4 rounded-panel border border-dashed border-edge px-12 py-16 text-center"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <span
          className="font-terminal font-bold text-accent"
          style={{ fontSize: 56, lineHeight: 1 }}
        >
          {'>_'}
        </span>
        <h2 className="font-ui text-[18px] font-semibold text-text-primary">Grove</h2>
        <p className="max-w-[260px] font-ui text-[13px] text-text-secondary">
          Press{' '}
          <kbd className="rounded-control border border-edge bg-modal px-1.5 py-0.5 font-terminal text-[11px] text-text-primary">
            ⌘N
          </kbd>{' '}
          to start your first Claude Code session.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-2 cursor-pointer rounded-control bg-accent px-4 py-2 font-ui text-[13px] font-semibold text-text-onAccent transition-colors duration-fast ease-out hover:bg-accent-hover"
        >
          + New Session
        </button>
      </div>
    </div>
  );
}
