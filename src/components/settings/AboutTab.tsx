import { useEffect, useState } from 'react';

interface Versions {
  electron: string;
  node: string;
  chrome: string;
  grove: string;
}

export function AboutTab() {
  const [versions, setVersions] = useState<Versions | null>(null);

  useEffect(() => {
    setVersions(window.grove.system.versions());
  }, []);

  return (
    <div className="flex flex-col gap-5 py-1">
      <header className="flex items-center gap-3">
        <span className="font-terminal text-3xl font-semibold text-accent">{'>_'}</span>
        <div className="flex flex-col">
          <span className="font-ui text-[16px] font-semibold text-text-primary">Grove</span>
          <span className="font-ui text-[12px] text-text-muted">
            Organize your Claude Code sessions.
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-1.5 rounded-control border border-edge bg-input p-3">
        <Row label="Grove version" value={versions?.grove ?? '—'} />
        <Row label="Electron" value={versions?.electron ?? '—'} />
        <Row label="Node" value={versions?.node ?? '—'} />
        <Row label="Chromium" value={versions?.chrome ?? '—'} />
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="font-ui text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Acknowledgements
        </h3>
        <p className="font-ui text-[12px] leading-relaxed text-text-secondary">
          Built on Electron, React, and TypeScript. Terminal rendering by{' '}
          <strong>xterm.js</strong>. PTY by <strong>node-pty</strong>. Drag mechanics by{' '}
          <strong>@dnd-kit</strong>. State by <strong>zustand</strong>. Persistence by{' '}
          <strong>electron-store</strong>. UI styled with <strong>Tailwind CSS</strong>. The Claude
          CLI is by <strong>Anthropic</strong>.
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-ui text-[12px] text-text-muted">{label}</span>
      <span className="font-terminal text-[12px] text-text-primary">{value}</span>
    </div>
  );
}
