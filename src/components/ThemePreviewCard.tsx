import type { Theme } from '../themes';
import type { ThemeVars } from '../themes/types';

interface ThemePreviewCardProps {
  theme: Theme;
  isDark: boolean;
  selected: boolean;
  onSelect: () => void;
}

// Each theme renders its own miniature UI — recognizable as Claude.ai,
// ChatGPT, Gemini, Linear, etc. — painted with the theme's actual CSS
// variable values so the preview is visually truthful, not generic.
export function ThemePreviewCard({ theme, isDark, selected, onSelect }: ThemePreviewCardProps) {
  const v = isDark ? theme.ui.dark : theme.ui.light;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${theme.label} theme`}
      aria-pressed={selected}
      className={`group relative cursor-pointer overflow-hidden rounded-control border transition-transform duration-fast ease-out hover:scale-[1.02]`}
      style={{
        width: 144,
        height: 108,
        background: v['--bg-canvas'],
        borderColor: selected ? v['--accent'] : v['--border-default'],
        ...(selected
          ? { boxShadow: `0 0 0 2px ${v['--accent-ring']}` }
          : {}),
      }}
    >
      <div className="absolute inset-0 flex flex-col">
        {renderMockup(theme.id, v)}
      </div>
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 px-2 pb-1 pt-2 text-left font-ui text-[10px] font-semibold"
        style={{
          color: v['--text-primary'],
          background: `linear-gradient(to top, ${v['--bg-canvas']} 60%, transparent)`,
        }}
      >
        {theme.label}
      </div>
    </button>
  );
}

function renderMockup(id: Theme['id'], v: ThemeVars): React.ReactNode {
  switch (id) {
    case 'claude':
      return <ClaudeMockup v={v} />;
    case 'chatgpt':
      return <ChatGPTMockup v={v} />;
    case 'gemini':
      return <GeminiMockup v={v} />;
    case 'linear':
      return <LinearMockup v={v} />;
    case 'custom':
      return <CustomMockup v={v} />;
  }
}

// ───────────────────────────────────────────────────────────────────
// Claude.ai — narrow sidebar with conversation list, centered chat
// with a long assistant bubble + a rounded composer at the bottom,
// warm orange accent on the user avatar dot and "Claude" header.
// ───────────────────────────────────────────────────────────────────
function ClaudeMockup({ v }: { v: ThemeVars }) {
  return (
    <>
      <div className="flex flex-1">
        <div
          style={{
            width: 28,
            background: v['--bg-sidebar'],
            borderRight: `1px solid ${v['--border-default']}`,
          }}
          className="flex flex-col gap-1 px-1.5 pt-2"
        >
          {/* recent convos */}
          <div style={{ height: 3, background: v['--bg-sidebar-active'], borderRadius: 2 }} />
          <div style={{ height: 3, background: v['--bg-sidebar-hover'], borderRadius: 2 }} />
          <div style={{ height: 3, background: v['--bg-sidebar-hover'], borderRadius: 2 }} />
          <div style={{ height: 3, background: v['--bg-sidebar-hover'], borderRadius: 2 }} />
        </div>
        <div className="relative flex-1 px-2 pt-2">
          {/* assistant bubble (full width-ish) */}
          <div
            style={{
              background: v['--bg-panel'],
              border: `1px solid ${v['--border-default']}`,
              borderRadius: 6,
              padding: 4,
            }}
            className="mb-1.5 flex flex-col gap-1"
          >
            <div style={{ width: '85%', height: 2, background: v['--text-muted'], opacity: 0.5, borderRadius: 1 }} />
            <div style={{ width: '70%', height: 2, background: v['--text-muted'], opacity: 0.5, borderRadius: 1 }} />
            <div style={{ width: '90%', height: 2, background: v['--text-muted'], opacity: 0.5, borderRadius: 1 }} />
          </div>
          {/* user message — small accent dot + line */}
          <div className="mb-1 flex items-center gap-1">
            <span
              style={{ width: 6, height: 6, borderRadius: 999, background: v['--accent'] }}
            />
            <div style={{ flex: 1, height: 2, background: v['--text-muted'], opacity: 0.6, borderRadius: 1 }} />
          </div>
          {/* composer */}
          <div
            style={{
              position: 'absolute',
              left: 6,
              right: 6,
              bottom: 14,
              height: 14,
              background: v['--bg-panel'],
              border: `1px solid ${v['--border-default']}`,
              borderRadius: 6,
            }}
            className="flex items-center justify-end pr-1"
          >
            <span
              style={{ width: 8, height: 8, borderRadius: 4, background: v['--accent'] }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────
// ChatGPT — dark sidebar with chat history, light/dark main area,
// chat messages, GPT green submit button on the composer.
// ───────────────────────────────────────────────────────────────────
function ChatGPTMockup({ v }: { v: ThemeVars }) {
  return (
    <div className="flex flex-1">
      <div
        style={{
          width: 32,
          background: v['--bg-sidebar'],
          borderRight: `1px solid ${v['--border-default']}`,
        }}
        className="flex flex-col gap-1 px-1.5 pt-2"
      >
        {/* "+ New chat" pill */}
        <div
          style={{
            height: 6,
            background: v['--bg-sidebar-hover'],
            borderRadius: 3,
            border: `1px solid ${v['--border-strong']}`,
          }}
        />
        <div style={{ height: 1, marginTop: 1, background: v['--border-default']}} />
        <div style={{ height: 2, background: v['--bg-sidebar-active'], borderRadius: 1 }} />
        <div style={{ height: 2, background: v['--bg-sidebar-hover'], borderRadius: 1 }} />
        <div style={{ height: 2, background: v['--bg-sidebar-hover'], borderRadius: 1 }} />
      </div>
      <div className="relative flex-1 flex flex-col px-2 pt-2">
        {/* user message — right-aligned bubble */}
        <div className="mb-1 flex justify-end">
          <div
            style={{
              background: v['--bg-tag'],
              borderRadius: 6,
              padding: '2px 4px',
            }}
          >
            <div style={{ width: 30, height: 2, background: v['--text-secondary'], borderRadius: 1 }} />
          </div>
        </div>
        {/* assistant — full width */}
        <div className="mb-1 flex flex-col gap-1">
          <div style={{ width: '90%', height: 2, background: v['--text-muted'], opacity: 0.55, borderRadius: 1 }} />
          <div style={{ width: '75%', height: 2, background: v['--text-muted'], opacity: 0.55, borderRadius: 1 }} />
          <div style={{ width: '85%', height: 2, background: v['--text-muted'], opacity: 0.55, borderRadius: 1 }} />
        </div>
        {/* composer with green submit */}
        <div
          style={{
            position: 'absolute',
            left: 6,
            right: 6,
            bottom: 14,
            height: 14,
            background: v['--bg-input'],
            border: `1px solid ${v['--border-default']}`,
            borderRadius: 7,
          }}
          className="flex items-center justify-end pr-1"
        >
          <span
            style={{ width: 8, height: 8, borderRadius: 999, background: v['--accent'] }}
          />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Gemini — generous rounded "Hello, [name]" hero gradient, side
// rail, large rounded composer pill at the bottom.
// ───────────────────────────────────────────────────────────────────
function GeminiMockup({ v }: { v: ThemeVars }) {
  return (
    <div className="flex flex-1">
      <div
        style={{
          width: 22,
          background: v['--bg-sidebar'],
        }}
        className="flex flex-col items-center gap-1 pt-2"
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            background: v['--bg-sidebar-hover'],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ width: 5, height: 1.5, background: v['--text-secondary'], borderRadius: 1 }} />
        </span>
        <div style={{ width: 12, height: 2, background: v['--bg-sidebar-hover'], borderRadius: 999 }} />
        <div style={{ width: 12, height: 2, background: v['--bg-sidebar-hover'], borderRadius: 999 }} />
      </div>
      <div className="relative flex-1 px-2 pt-3">
        {/* gradient hero text */}
        <div className="mb-1.5 flex flex-col gap-1">
          <div
            style={{
              width: '70%',
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #4285F4 0%, #9168F4 50%, #D96570 100%)',
            }}
          />
          <div
            style={{
              width: '45%',
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #4285F4 0%, #9168F4 100%)',
              opacity: 0.7,
            }}
          />
        </div>
        {/* suggestion chips */}
        <div className="mb-1 flex gap-1">
          <div
            style={{
              flex: 1,
              height: 8,
              background: v['--bg-panel'],
              border: `1px solid ${v['--border-default']}`,
              borderRadius: 4,
            }}
          />
          <div
            style={{
              flex: 1,
              height: 8,
              background: v['--bg-panel'],
              border: `1px solid ${v['--border-default']}`,
              borderRadius: 4,
            }}
          />
        </div>
        {/* large rounded composer */}
        <div
          style={{
            position: 'absolute',
            left: 6,
            right: 6,
            bottom: 14,
            height: 14,
            background: v['--bg-tag'],
            borderRadius: 999,
          }}
          className="flex items-center justify-between px-2"
        >
          <span
            style={{ width: 4, height: 4, borderRadius: 999, background: v['--text-muted'] }}
          />
          <span
            style={{ width: 8, height: 8, borderRadius: 999, background: v['--accent'] }}
          />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Linear — narrow project nav rail, dense issue list, hairline
// borders, violet accent. Compact density.
// ───────────────────────────────────────────────────────────────────
function LinearMockup({ v }: { v: ThemeVars }) {
  return (
    <div className="flex flex-1">
      <div
        style={{
          width: 26,
          background: v['--bg-sidebar'],
          borderRight: `1px solid ${v['--border-default']}`,
        }}
        className="flex flex-col gap-1 px-1 pt-2"
      >
        {/* workspace header */}
        <div
          style={{
            height: 5,
            background: v['--accent'],
            borderRadius: 2,
            opacity: 0.85,
          }}
        />
        {/* nav items */}
        <div style={{ height: 2, background: v['--bg-sidebar-hover'], borderRadius: 1, marginTop: 2 }} />
        <div style={{ height: 2, background: v['--bg-sidebar-hover'], borderRadius: 1 }} />
        <div style={{ height: 2, background: v['--bg-sidebar-active'], borderRadius: 1 }} />
        <div style={{ height: 2, background: v['--bg-sidebar-hover'], borderRadius: 1 }} />
        <div style={{ height: 2, background: v['--bg-sidebar-hover'], borderRadius: 1 }} />
      </div>
      <div className="relative flex-1 flex flex-col">
        {/* tabs bar */}
        <div
          style={{ borderBottom: `1px solid ${v['--border-default']}`, height: 12 }}
          className="flex items-end gap-2 px-2"
        >
          <div
            style={{
              width: 14,
              height: 6,
              background: v['--accent-soft'],
              borderRadius: 1,
              borderBottom: `2px solid ${v['--accent']}`,
            }}
          />
          <div style={{ width: 12, height: 2, background: v['--text-muted'], opacity: 0.5, borderRadius: 1 }} />
        </div>
        {/* issue rows */}
        <div className="flex flex-1 flex-col gap-0.5 px-2 pt-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 1,
                  background: i === 1 ? v['--accent'] : v['--text-muted'],
                  opacity: i === 1 ? 1 : 0.5,
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: v['--text-muted'],
                  opacity: 0.5,
                  borderRadius: 1,
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 2,
                  borderRadius: 999,
                  background: v['--bg-tag'],
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Custom — palette icon centered on canvas bg with the active accent
// as a halo. Implies "you control everything".
// ───────────────────────────────────────────────────────────────────
function CustomMockup({ v }: { v: ThemeVars }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: `radial-gradient(circle, ${v['--accent-soft']} 0%, transparent 70%)`,
        }}
        className="flex items-center justify-center"
      >
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={v['--accent']}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="13.5" cy="6.5" r=".5" fill={v['--accent']} />
          <circle cx="17.5" cy="10.5" r=".5" fill={v['--accent']} />
          <circle cx="8.5" cy="7.5" r=".5" fill={v['--accent']} />
          <circle cx="6.5" cy="12.5" r=".5" fill={v['--accent']} />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.79 0 1.5-.71 1.5-1.5 0-.39-.15-.74-.39-1-.23-.27-.38-.62-.38-1 0-.79.71-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.5-4.5-10-10-10z" />
        </svg>
      </div>
    </div>
  );
}
