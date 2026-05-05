import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settings';

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
}

type Screen = 'welcome' | 'command' | 'workspace';

// First-run flow per UI design spec §18 — three screens, no nonsense.
// Welcome → choose default command → choose workspace folder → opens app.
// Persisted via the existing settings store: `defaultCommand`,
// `defaultWorkingDir`. Onboarding-completion stamp lives in the
// persisted state under `onboardingCompletedAt` so we don't show this
// again. Bypassable via Esc on any screen.
export function Onboarding({ open, onComplete }: OnboardingProps) {
  const [screen, setScreen] = useState<Screen>('welcome');
  const defaultCommand = useSettingsStore((s) => s.defaultCommand);
  const setDefaultCommand = useSettingsStore((s) => s.setDefaultCommand);
  const defaultWorkingDir = useSettingsStore((s) => s.defaultWorkingDir);
  const setDefaultWorkingDir = useSettingsStore((s) => s.setDefaultWorkingDir);
  const [draftCmd, setDraftCmd] = useState(defaultCommand || 'claude');
  const [draftDir, setDraftDir] = useState(defaultWorkingDir ?? '');

  useEffect(() => {
    if (!open) return;
    setScreen('welcome');
    setDraftCmd(defaultCommand || 'claude');
    setDraftDir(defaultWorkingDir ?? '');

    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation();
        // Skip onboarding entirely — accept whatever defaults are set.
        finish();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function finish(): void {
    setDefaultCommand(draftCmd.trim() || 'claude');
    if (draftDir.trim()) setDefaultWorkingDir(draftDir.trim());
    onComplete();
  }

  async function pickFolder(): Promise<void> {
    const path = await window.grove.dialog.chooseDirectory({
      title: 'Choose a default workspace folder',
      defaultPath: draftDir || undefined,
    });
    if (path) setDraftDir(path);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 95,
        background: 'var(--bg-canvas)',
      }}
    >
      <div
        className="flex flex-col items-center"
        style={{ width: 460, padding: '56px 40px 40px' }}
      >
        {/* Always-visible icon */}
        <div className="mb-8">
          <GroveIcon size={88} />
        </div>

        {screen === 'welcome' && (
          <>
            <h1 className="font-ui text-[24px] font-semibold tracking-tight text-text-primary">
              Welcome to Grove
            </h1>
            <p className="mt-3 text-center font-ui text-[14px] leading-relaxed text-text-secondary">
              A visual workspace for Claude Code and CLI sessions. Drag, label,
              and persist your sessions across launches.
            </p>
            <div className="mt-10 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={() => setScreen('command')}
                className="cursor-pointer rounded-control bg-accent py-2.5 font-ui text-[14px] font-semibold text-text-onAccent transition-colors duration-base ease-out hover:bg-accent-hover"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={finish}
                className="cursor-pointer py-1.5 font-ui text-[12px] text-text-muted transition-colors duration-base ease-out hover:text-text-secondary"
              >
                Skip — I know what I'm doing
              </button>
            </div>
          </>
        )}

        {screen === 'command' && (
          <>
            <h1 className="font-ui text-[20px] font-semibold tracking-tight text-text-primary">
              Choose your default command
            </h1>
            <p className="mt-2 text-center font-ui text-[13px] text-text-secondary">
              This is what spawns inside each new session. The default works for
              most people.
            </p>
            <input
              type="text"
              value={draftCmd}
              onChange={(e) => setDraftCmd(e.target.value)}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              autoFocus
              className="mt-8 w-full rounded-control border border-edge bg-input px-4 py-3 text-center font-terminal text-[15px] text-text-primary outline-none focus-visible:border-accent"
            />
            <p className="mt-3 font-ui text-[11px] text-text-muted">
              Falls back to <span className="font-terminal">$SHELL</span> if claude isn't on PATH.
            </p>
            <div className="mt-10 flex w-full gap-2">
              <button
                type="button"
                onClick={() => setScreen('welcome')}
                className="flex-1 cursor-pointer rounded-control border border-edge bg-modal py-2.5 font-ui text-[14px] font-medium text-text-secondary transition-colors duration-base ease-out hover:bg-sidebarHover hover:text-text-primary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setScreen('workspace')}
                className="flex-[1.4] cursor-pointer rounded-control bg-accent py-2.5 font-ui text-[14px] font-semibold text-text-onAccent transition-colors duration-base ease-out hover:bg-accent-hover"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {screen === 'workspace' && (
          <>
            <h1 className="font-ui text-[20px] font-semibold tracking-tight text-text-primary">
              Choose a workspace folder
            </h1>
            <p className="mt-2 text-center font-ui text-[13px] text-text-secondary">
              Optional — sessions will spawn here by default. You can override
              per-session in the New Session dialog.
            </p>
            <div className="mt-8 flex w-full flex-col gap-2">
              <input
                type="text"
                value={draftDir}
                onChange={(e) => setDraftDir(e.target.value)}
                placeholder="~/projects"
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                className="w-full rounded-control border border-edge bg-input px-4 py-2.5 font-terminal text-[13px] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-accent"
              />
              <button
                type="button"
                onClick={() => void pickFolder()}
                className="cursor-pointer rounded-control border border-edge bg-modal py-2 font-ui text-[12px] font-medium text-text-secondary transition-colors duration-base ease-out hover:bg-sidebarHover hover:text-text-primary"
              >
                Choose folder…
              </button>
            </div>
            <div className="mt-10 flex w-full gap-2">
              <button
                type="button"
                onClick={() => setScreen('command')}
                className="flex-1 cursor-pointer rounded-control border border-edge bg-modal py-2.5 font-ui text-[14px] font-medium text-text-secondary transition-colors duration-base ease-out hover:bg-sidebarHover hover:text-text-primary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={finish}
                className="flex-[1.4] cursor-pointer rounded-control bg-accent py-2.5 font-ui text-[14px] font-semibold text-text-onAccent transition-colors duration-base ease-out hover:bg-accent-hover"
              >
                Open Grove
              </button>
            </div>
          </>
        )}

        <ScreenDots active={screen} />
      </div>
    </div>
  );
}

function GroveIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect width="120" height="120" rx="26" fill="#D97745" />
      <path
        d="M22 53L36 63L22 73"
        stroke="#FFF7EF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M40 73h14" stroke="#FFF7EF" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="90" cy="36" r="7" fill="none" stroke="#FFF7EF" strokeWidth="3.5" />
      <circle cx="96" cy="66" r="7" fill="none" stroke="#FFF7EF" strokeWidth="3.5" />
      <circle cx="90" cy="94" r="7" fill="none" stroke="#FFF7EF" strokeWidth="3.5" />
      <path d="M72 60C72 60 75 38 83 36" stroke="#FFF7EF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M72 60C72 60 82 60 89 66" stroke="#FFF7EF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M72 60C72 60 75 80 83 94" stroke="#FFF7EF" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="72" cy="60" r="6" fill="#FFF7EF" />
    </svg>
  );
}

function ScreenDots({ active }: { active: Screen }) {
  const screens: Screen[] = ['welcome', 'command', 'workspace'];
  return (
    <div className="mt-8 flex gap-1.5">
      {screens.map((s) => (
        <span
          key={s}
          aria-hidden
          style={{
            width: s === active ? 18 : 6,
            height: 6,
            borderRadius: 999,
            background: s === active ? 'var(--accent)' : 'var(--border-default)',
            transition: 'width 160ms ease, background 160ms ease',
          }}
        />
      ))}
    </div>
  );
}
