import { useEffect, useMemo, useRef, type HTMLAttributes } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useSession } from '../hooks/useSession';
import { SessionHeader } from './SessionHeader';
import { useWorkspaceStore } from '../store/workspace';
import { useSettingsStore } from '../store/settings';
import type { Tag } from '../store/types';

export interface SessionPanelProps {
  sessionId: string;
  name: string;
  color: string;
  tagIds?: string[];
  cwd?: string;
  command?: string;
  isFocused?: boolean;
  isFullscreen?: boolean;
  // Drag handle props from @dnd-kit's useDraggable. When provided, the
  // SessionHeader becomes the drag handle.
  dragHandleProps?: HTMLAttributes<HTMLElement>;
}

const FIT_DEBOUNCE_MS = 50;

export function SessionPanel(props: SessionPanelProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const terminalFont = useSettingsStore((s) => s.terminalFont);
  const terminalFontSize = useSettingsStore((s) => s.terminalFontSize);
  const cursorStyle = useSettingsStore((s) => s.cursorStyle);
  const cursorBlink = useSettingsStore((s) => s.cursorBlink);

  // Subscribe to PTY data BEFORE useSession creates the PTY. The xterm
  // theme is no longer passed in — ThemeProvider applies the active
  // theme to all registered terminals via the registry, so xterm uses
  // its built-in default until the first ThemeProvider effect runs (which
  // happens synchronously on mount).
  const term = useTerminal({
    sessionId: props.sessionId,
    fontFamily: terminalFont,
    fontSize: terminalFontSize,
    cursorStyle,
    cursorBlink,
  });

  const session = useSession({
    sessionId: props.sessionId,
    cwd: props.cwd,
    command: props.command,
    initialCols: 100,
    initialRows: 30,
  });

  const renameSession = useWorkspaceStore((s) => s.renameSession);
  const recolorSession = useWorkspaceStore((s) => s.recolorSession);
  const removeSession = useWorkspaceStore((s) => s.removeSession);
  const toggleFullscreen = useWorkspaceStore((s) => s.toggleFullscreen);
  const tagsMap = useWorkspaceStore((s) => s.tags);

  const tags = useMemo<Tag[]>(
    () =>
      (props.tagIds ?? [])
        .map((id) => tagsMap[id])
        .filter((t): t is Tag => Boolean(t)),
    [props.tagIds, tagsMap],
  );

  // ResizeObserver → debounced fit + pty.resize.
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

  async function handleKill(): Promise<void> {
    await session.kill();
    removeSession(props.sessionId);
  }

  return (
    <div
      ref={rootRef}
      className={`flex h-full w-full flex-col overflow-hidden rounded-panel border bg-panel ${
        props.isFocused ? 'shadow-panel-focused' : 'shadow-panel-resting'
      }`}
      style={{
        borderColor: props.isFocused ? 'var(--border-strong)' : 'var(--border-default)',
      }}
    >
      <SessionHeader
        sessionId={props.sessionId}
        name={props.name}
        color={props.color}
        tags={tags}
        status={session.status}
        isFullscreen={props.isFullscreen}
        confirmKill={false}
        onRename={(next) => renameSession(props.sessionId, next)}
        onRecolor={(next) => recolorSession(props.sessionId, next)}
        onKill={handleKill}
        onRestart={() => void session.restart()}
        onToggleFullscreen={() => toggleFullscreen(props.sessionId)}
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
