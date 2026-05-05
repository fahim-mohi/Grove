import { useEffect, useRef } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useSession } from '../hooks/useSession';
import { SessionHeader } from './SessionHeader';
import { xtermClaudeLight } from '../themes/xterm-claude';

export interface SessionPanelProps {
  sessionId: string;
  name: string;
  color: string;
  cwd?: string;
  command?: string;
  width?: number;
  height?: number;
}

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const FIT_DEBOUNCE_MS = 50;

// One Grove session, one PTY, one xterm. Phase 2 is a fixed-size, fixed-
// position panel — Phase 3 wraps it with @dnd-kit for free positioning on
// the WorkspaceCanvas.
//
// Mount order matters: useTerminal subscribes to pty:data BEFORE useSession
// triggers pty.create, so the welcome banner isn't lost.
export function SessionPanel(props: SessionPanelProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const term = useTerminal({
    sessionId: props.sessionId,
    theme: xtermClaudeLight,
  });

  const session = useSession({
    sessionId: props.sessionId,
    cwd: props.cwd,
    command: props.command,
    initialCols: 100,
    initialRows: 30,
  });

  // ResizeObserver → debounced fit + pty.resize
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let timer: number | null = null;
    const ro = new ResizeObserver(() => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const dims = term.fit();
        if (dims) {
          window.grove.pty.resize(props.sessionId, dims.cols, dims.rows);
        }
      }, FIT_DEBOUNCE_MS);
    });
    ro.observe(root);
    return () => {
      ro.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [term, props.sessionId]);

  function handleClickViewport(): void {
    term.focus();
  }

  return (
    <div
      ref={rootRef}
      className="flex flex-col overflow-hidden rounded-panel border border-edge bg-panel shadow-panel-resting"
      style={{
        width: props.width ?? 720,
        height: props.height ?? 480,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
      }}
    >
      <SessionHeader
        name={props.name}
        color={props.color}
        status={session.status}
        onKill={() => void session.kill()}
        onRestart={() => void session.restart()}
      />
      <div
        className="flex-1 overflow-hidden bg-panel"
        style={{ padding: '12px 16px' }}
        onClick={handleClickViewport}
        role="presentation"
      >
        <div ref={term.containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
