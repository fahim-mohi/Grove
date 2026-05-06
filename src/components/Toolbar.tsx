import { useWorkspaceStore } from '../store/workspace';
import { TagBadge } from './TagBadge';

interface ToolbarProps {
  sessionCount: number;
  claudeInstalled: boolean | null;
  onOpenSettings?: () => void;
  onNewSession?: () => void;
  onFitCanvas?: () => void;
  onOpenCommandPalette?: () => void;
}

export function Toolbar({
  sessionCount,
  claudeInstalled,
  onNewSession,
  onFitCanvas,
  onOpenCommandPalette,
}: ToolbarProps) {
  const filterTagId = useWorkspaceStore((s) => s.filterTagId);
  const filterTag = useWorkspaceStore((s) => (filterTagId ? s.tags[filterTagId] : null));
  const setFilterTag = useWorkspaceStore((s) => s.setFilterTag);

  return (
    <header
      className="drag-region relative flex flex-shrink-0 items-center justify-between border-b border-edge bg-toolbar px-4 backdrop-blur"
      style={{ height: 'var(--toolbar-height)', paddingLeft: '88px', zIndex: 60 }}
    >
      <div className="flex items-center gap-3">
        <GroveBrandMark />
        <span className="font-ui text-[14px] font-semibold tracking-tight text-text-primary">
          Grove
        </span>
        <span aria-hidden className="hidden h-4 w-px bg-edge sm:block" />
        <span className="hidden items-center gap-1.5 font-ui text-[12px] text-text-muted sm:flex">
          <span
            aria-hidden
            className="inline-block rounded-pill"
            style={{
              width: 6,
              height: 6,
              background: claudeInstalled ? 'var(--success)' : 'var(--text-muted)',
              animation: claudeInstalled ? 'grove-pulse 2s ease-in-out infinite' : undefined,
            }}
          />
          <span className="font-terminal text-[11px]">
            {sessionCount} session{sessionCount === 1 ? '' : 's'}
          </span>
        </span>
        {filterTag && (
          <span className="no-drag flex items-center gap-1.5">
            <span aria-hidden className="hidden h-4 w-px bg-edge sm:block" />
            <span className="font-ui text-[11px] text-text-muted">filter:</span>
            <TagBadge
              tag={filterTag}
              size="sm"
              active
              removable
              onRemove={() => setFilterTag(null)}
            />
          </span>
        )}
      </div>

      <div className="no-drag flex items-center gap-2">

        {/* Two-button cluster matching the asset pack toolbar:
            Fit Canvas (ghost) + New Session (primary). Theme picker,
            dark mode toggle, command palette, and settings all live
            behind ⌘K — keeps the chrome quiet. */}
        {onFitCanvas && (
          <ToolbarButton aria-label="Fit canvas" title="Fit all panels  ⌘⇧F" onClick={onFitCanvas}>
            <FitIcon />
          </ToolbarButton>
        )}

        {onOpenCommandPalette && (
          <ToolbarButton
            aria-label="Command palette"
            title="Command palette  ⌘K"
            onClick={onOpenCommandPalette}
          >
            <CommandIcon />
          </ToolbarButton>
        )}

        {onNewSession && (
          <button
            type="button"
            onClick={onNewSession}
            className="ml-1 cursor-pointer rounded-control bg-accent px-3 py-1 font-ui text-[12px] font-semibold text-text-onAccent transition-colors duration-base ease-out hover:bg-accent-hover"
            title="New session  ⌘N"
          >
            + New
          </button>
        )}
      </div>
    </header>
  );
}

function ToolbarButton({
  children,
  ...rest
}: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-control p-1.5 text-text-secondary transition-colors duration-fast ease-out hover:bg-sidebarHover hover:text-text-primary"
      {...rest}
    >
      {children}
    </button>
  );
}

// Brand mark — the canonical Grove icon as a 22×22 inline SVG. Drops
// the claude-orange rounded square + branching nodes glyph straight into
// the toolbar so the title bar reads as Grove visually, not just by name.
function GroveBrandMark() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 120 120"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
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

function FitIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4" />
    </svg>
  );
}

function CommandIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 3a3 3 0 1 0-3 3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12" />
    </svg>
  );
}

