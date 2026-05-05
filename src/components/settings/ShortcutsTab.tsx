interface Shortcut {
  combo: string;
  action: string;
  available: boolean;
}

const SHORTCUTS: Shortcut[] = [
  { combo: '⌘N', action: 'New session', available: true },
  { combo: '⌘W', action: 'Kill focused session', available: false },
  { combo: '⌘1 … ⌘9', action: 'Focus session by sidebar index', available: false },
  { combo: '⌘Tab', action: 'Cycle focused session', available: false },
  { combo: '⌘,', action: 'Open Settings', available: true },
  { combo: '⌘⇧F', action: 'Fit all panels to view', available: false },
  { combo: '⌘\\', action: 'Toggle sidebar', available: true },
  { combo: '⌘D', action: 'Toggle dark/light mode', available: true },
  { combo: '⌘0', action: 'Reset canvas zoom', available: false },
  { combo: '⌘= / ⌘−', action: 'Zoom in / out', available: false },
  { combo: 'Escape', action: 'Deselect / close modal', available: true },
];

export function ShortcutsTab() {
  return (
    <div className="flex flex-col gap-3 py-1">
      <h3 className="font-ui text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Keyboard shortcuts
      </h3>
      <p className="font-ui text-[11px] text-text-muted">
        Greyed shortcuts will become available in Phase 11. Rebinding lands later.
      </p>
      <div className="rounded-control border border-edge">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-edge">
              <th className="px-3 py-2 font-ui text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Shortcut
              </th>
              <th className="px-3 py-2 font-ui text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((s, i) => (
              <tr
                key={i}
                className={
                  i < SHORTCUTS.length - 1 ? 'border-b border-edge-subtle' : ''
                }
              >
                <td className="px-3 py-2">
                  <kbd
                    className={`rounded-control border border-edge bg-modal px-2 py-0.5 font-terminal text-[11px] ${
                      s.available ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {s.combo}
                  </kbd>
                </td>
                <td
                  className={`px-3 py-2 font-ui text-[13px] ${
                    s.available ? 'text-text-primary' : 'text-text-muted'
                  }`}
                >
                  {s.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
