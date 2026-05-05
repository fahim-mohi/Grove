import { useSettingsStore } from '../../store/settings';

export function GeneralTab() {
  const defaultCommand = useSettingsStore((s) => s.defaultCommand);
  const setDefaultCommand = useSettingsStore((s) => s.setDefaultCommand);
  const defaultWorkingDir = useSettingsStore((s) => s.defaultWorkingDir);
  const setDefaultWorkingDir = useSettingsStore((s) => s.setDefaultWorkingDir);
  const snapToGrid = useSettingsStore((s) => s.snapToGrid);
  const setSnapToGrid = useSettingsStore((s) => s.setSnapToGrid);
  const gridSize = useSettingsStore((s) => s.gridSize);
  const setGridSize = useSettingsStore((s) => s.setGridSize);
  const autoRestoreSessions = useSettingsStore((s) => s.autoRestoreSessions);
  const setAutoRestoreSessions = useSettingsStore((s) => s.setAutoRestoreSessions);
  const confirmBeforeKill = useSettingsStore((s) => s.confirmBeforeKill);
  const setConfirmBeforeKill = useSettingsStore((s) => s.setConfirmBeforeKill);

  async function pickDir(): Promise<void> {
    const path = await window.grove.dialog.chooseDirectory({
      title: 'Default working directory',
      defaultPath: defaultWorkingDir ?? undefined,
    });
    if (path) setDefaultWorkingDir(path);
  }

  return (
    <div className="flex flex-col gap-5 py-1">
      <SectionHeading>Defaults</SectionHeading>

      <Field label="Default command" hint="Spawned for new sessions when no override is set">
        <input
          type="text"
          value={defaultCommand}
          onChange={(e) => setDefaultCommand(e.target.value)}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          className="w-full rounded-control border border-edge bg-input px-3 py-2 font-terminal text-xs text-text-primary outline-none focus-visible:border-accent"
        />
      </Field>

      <Field label="Default working directory" hint="Optional — falls back to your home directory">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={defaultWorkingDir ?? ''}
            onChange={(e) => setDefaultWorkingDir(e.target.value || null)}
            placeholder="~/projects"
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            className="flex-1 rounded-control border border-edge bg-input px-3 py-2 font-terminal text-xs text-text-primary outline-none placeholder:text-text-muted focus-visible:border-accent"
          />
          <button
            type="button"
            onClick={() => void pickDir()}
            className="cursor-pointer rounded-control border border-edge bg-modal px-3 py-2 font-ui text-[12px] font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
          >
            Choose…
          </button>
        </div>
      </Field>

      <SectionHeading>Behavior</SectionHeading>

      <Toggle
        label="Snap panel positions to grid"
        hint="Useful for keeping sessions aligned"
        checked={snapToGrid}
        onChange={setSnapToGrid}
      />

      {snapToGrid && (
        <Field label="Grid size">
          <Segmented
            options={[
              { value: 4, label: '4 px' },
              { value: 8, label: '8 px' },
              { value: 16, label: '16 px' },
            ]}
            value={gridSize}
            onChange={(v) => setGridSize(v as 4 | 8 | 16)}
          />
        </Field>
      )}

      <Toggle
        label="Auto-restore sessions on launch"
        hint="Re-spawn PTYs for previously open sessions when Grove starts"
        checked={autoRestoreSessions}
        onChange={setAutoRestoreSessions}
      />

      <Toggle
        label="Confirm before killing a session"
        hint="Show a native confirm dialog when clicking the ✕ button"
        checked={confirmBeforeKill}
        onChange={setConfirmBeforeKill}
      />
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-ui text-[11px] font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </h3>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-ui text-[12px] font-medium text-text-secondary">{label}</label>
      {children}
      {hint && <span className="font-ui text-[11px] text-text-muted">{hint}</span>}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-pill transition-colors duration-fast ease-out ${
          checked ? 'bg-accent' : 'bg-edge'
        }`}
        style={{ width: 32, height: 18 }}
      >
        <span
          aria-hidden
          className="absolute top-0.5 left-0.5 rounded-pill bg-white shadow transition-transform duration-fast ease-out"
          style={{
            width: 14,
            height: 14,
            transform: checked ? 'translateX(14px)' : 'translateX(0)',
          }}
        />
      </button>
      <div className="flex flex-col">
        <span className="font-ui text-[13px] text-text-primary">{label}</span>
        {hint && <span className="font-ui text-[11px] text-text-muted">{hint}</span>}
      </div>
    </label>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex rounded-control border border-edge bg-input p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer rounded-control px-3 py-1 font-ui text-[12px] font-medium transition-colors duration-fast ease-out ${
              active
                ? 'bg-panel text-text-primary shadow-panel-resting'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
