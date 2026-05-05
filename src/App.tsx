import { useEffect, useState } from 'react';

interface Versions {
  electron: string;
  node: string;
  chrome: string;
  grove: string;
}

export function App() {
  const [versions, setVersions] = useState<Versions | null>(null);

  useEffect(() => {
    setVersions(window.grove.system.versions());
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-canvas text-text-primary">
      <div className="mb-4 font-terminal text-5xl font-semibold text-accent">{'>_'}</div>
      <h1 className="font-ui text-2xl font-semibold">Grove</h1>
      <p className="mt-2 font-ui text-sm text-text-secondary">
        Phase 0 — scaffold ready. Theme: claude (light).
      </p>
      {versions && (
        <p className="mt-6 font-terminal text-xs text-text-muted">
          electron {versions.electron} · node {versions.node} · grove {versions.grove}
        </p>
      )}
    </div>
  );
}
