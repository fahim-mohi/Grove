import { useEffect, useRef, type HTMLAttributes } from 'react';
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
  isFocused?: boolean;
  // Drag handle props from @dnd-kit's useDraggable. When provided, the
  // SessionHeader becomes the drag handle.
  dragHandleProps?: HTMLAttributes<HTMLElement>;
}

const FIT_DEBOUNCE_MS = 50;

// Single Grove session: PTY + xterm + chrome. Outer dimensions are
// controlled by the parent wrapper (DraggableSessionWrapper inside
// WorkspaceCanvas) so this component fills 100% w/h and trusts the
// ResizeObserver to drive xterm refits.
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

  // ResizeObserver → debounced fit + pty.resize. Triggered by both
  // window resize and Grove resize-handle drags (which mutate parent dims).
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
      className={`flex h-full w-full flex-col overflow-hidden rounded-panel border bg-panel ${
        props.isFocused
          ? 'shadow-panel-focused'
          : 'shadow-panel-resting'
      }`}
      style={{
        borderColor: props.isFocused ? 'var(--border-strong)' : 'var(--border-default)',
      }}
    >
      <SessionHeader
        name={props.name}
        color={props.color}
        status={session.status}
        onKill={() => void session.kill()}
        onRestart={() => void session.restart()}
        dragHandleProps={props.dragHandleProps}
      />
      <div
        className="flex-1 overflow-hidden bg-panel"
        style={{ padding: '12px 16px' }}
        onMouseDown={handleClickViewport}
        role="presentation"
      >
        <div ref={term.containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
