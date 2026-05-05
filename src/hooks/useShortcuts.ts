import { useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspace';
import { useSettingsStore } from '../store/settings';

// Full keyboard shortcut surface (DESIGN.md §9). Registered once at the
// App level. Each shortcut is implemented in terms of store actions so
// behavior stays consistent with the toolbar/sidebar/header equivalents.
//
// Guards against firing while the user is typing in inputs, textareas, or
// contenteditable elements (so e.g. Cmd+W in a text field still does
// what the user expects).
export function useShortcuts(): void {
  const focusSession = useWorkspaceStore((s) => s.focusSession);
  const focusedId = useWorkspaceStore((s) => s.focusedSessionId);
  const sessionOrder = useWorkspaceStore((s) => s.sessionOrder);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const removeSession = useWorkspaceStore((s) => s.removeSession);
  const bringToFront = useWorkspaceStore((s) => s.bringToFront);
  const closeModal = useWorkspaceStore((s) => s.closeModal);
  const modal = useWorkspaceStore((s) => s.modal);
  const exitFullscreen = useWorkspaceStore((s) => s.exitFullscreen);
  const fullscreenId = useWorkspaceStore((s) => s.fullscreenSessionId);
  const confirmBeforeKill = useSettingsStore((s) => s.confirmBeforeKill);

  useEffect(() => {
    async function killFocused(): Promise<void> {
      if (!focusedId) return;
      const session = sessions[focusedId];
      if (!session) return;
      if (confirmBeforeKill) {
        const ok = await window.grove.dialog.confirm({
          title: `Kill ${session.name}?`,
          message: `Kill ${session.name}?`,
          detail: 'The PTY will be terminated. Scrollback in this panel will be lost.',
          danger: true,
          okLabel: 'Kill',
        });
        if (!ok) return;
      }
      await window.grove.pty.kill(focusedId);
      removeSession(focusedId);
    }

    function focusByIndex(idx: number): void {
      const id = sessionOrder[idx];
      if (!id) return;
      focusSession(id);
      bringToFront(id);
    }

    function cycleFocus(reverse: boolean): void {
      if (sessionOrder.length === 0) return;
      const currentIdx = focusedId ? sessionOrder.indexOf(focusedId) : -1;
      const nextIdx = reverse
        ? (currentIdx - 1 + sessionOrder.length) % sessionOrder.length
        : (currentIdx + 1) % sessionOrder.length;
      focusByIndex(nextIdx);
    }

    function onKey(e: KeyboardEvent): void {
      if (isInputElement(e.target)) return;
      const meta = e.metaKey || e.ctrlKey;

      // Esc — order matters: modal close > fullscreen exit > deselect
      if (e.key === 'Escape') {
        if (modal) {
          e.preventDefault();
          closeModal();
          return;
        }
        if (fullscreenId) {
          e.preventDefault();
          exitFullscreen();
          return;
        }
        if (focusedId) {
          e.preventDefault();
          focusSession(null);
        }
        return;
      }

      if (meta && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        void killFocused();
        return;
      }

      if (meta && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        focusByIndex(parseInt(e.key, 10) - 1);
        return;
      }

      if (meta && e.key === 'Tab') {
        e.preventDefault();
        cycleFocus(e.shiftKey);
        return;
      }

      // F2 inline-rename — surface a custom event the SessionHeader
      // listens for to enter rename mode without our hook needing to
      // reach into its internal state.
      if (e.key === 'F2' && focusedId) {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent('grove:rename-session', { detail: { sessionId: focusedId } }),
        );
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    sessions,
    sessionOrder,
    focusedId,
    fullscreenId,
    modal,
    confirmBeforeKill,
    focusSession,
    removeSession,
    bringToFront,
    closeModal,
    exitFullscreen,
  ]);
}

function isInputElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}
