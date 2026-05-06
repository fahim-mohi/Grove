interface EmptyCanvasProps {
  onCreate: () => void;
}

// Quiet centered empty state per UI spec §7 ("dashed border, soft muted
// text, no cartoon nonsense"). The Grove icon glyph above gentle copy +
// a single subtle CTA. No big orange button — that lives in the toolbar
// and command palette.
export function EmptyCanvas({ onCreate }: EmptyCanvasProps) {
  return (
    <div className="pointer-events-none flex h-full w-full items-center justify-center">
      <div className="pointer-events-auto flex flex-col items-center gap-3 px-8 py-10 text-center">
        <GroveMark />
        <p className="font-ui text-[13px] text-text-secondary">
          Press{' '}
          <kbd
            className="rounded-control border border-edge bg-modal px-1.5 py-0.5 font-terminal text-[11px] text-text-secondary"
            style={{ verticalAlign: 'middle' }}
          >
            ⌘N
          </kbd>{' '}
          or
          <button
            type="button"
            onClick={onCreate}
            className="ml-1 cursor-pointer text-accent underline-offset-2 hover:underline"
          >
            click to launch Claude Code
          </button>
        </p>
      </div>
    </div>
  );
}

function GroveMark() {
  // Compact 36px Grove icon — same SVG as the canonical brand mark,
  // muted in opacity so it reads as ambient rather than hero.
  return (
    <svg width="36" height="36" viewBox="0 0 120 120" aria-hidden style={{ opacity: 0.85 }}>
      <rect width="120" height="120" rx="26" fill="#D97745" />
      <path
        d="M22 53l14 10-14 10"
        stroke="#FFF7EF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M40 73h14" stroke="#FFF7EF" strokeWidth="5" strokeLinecap="round" />
      <circle cx="90" cy="36" r="7" fill="none" stroke="#FFF7EF" strokeWidth="4" />
      <circle cx="96" cy="66" r="7" fill="none" stroke="#FFF7EF" strokeWidth="4" />
      <circle cx="90" cy="94" r="7" fill="none" stroke="#FFF7EF" strokeWidth="4" />
      <path d="M72 60C72 60 75 38 83 36" stroke="#FFF7EF" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M72 60C72 60 82 60 89 66" stroke="#FFF7EF" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M72 60C72 60 75 80 83 94" stroke="#FFF7EF" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="72" cy="60" r="6" fill="#FFF7EF" />
    </svg>
  );
}
