import { useEffect, useRef, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  // Visual width — modals are typically centered fixed-width.
  width?: number | string;
  // When false, clicks on the scrim don't close the modal (form-bearing
  // modals usually want this so accidental clicks don't lose data).
  closeOnScrimClick?: boolean;
  children: ReactNode;
  // Footer slot rendered with separator.
  footer?: ReactNode;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function Modal(props: ModalProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Esc to close + focus trap.
  useEffect(() => {
    if (!props.open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    function focusFirst(): void {
      const surface = surfaceRef.current;
      if (!surface) return;
      const first = surface.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }
    // Defer so the modal has rendered.
    const t = window.setTimeout(focusFirst, 0);

    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation();
        props.onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const surface = surfaceRef.current;
      if (!surface) return;
      const focusables = Array.from(
        surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!first || !last) return;

      if (e.shiftKey && (active === first || active === surface)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-overlay backdrop-blur-sm"
      style={{ zIndex: 80 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && props.closeOnScrimClick !== false) {
          props.onClose();
        }
      }}
    >
      <div
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-label={props.ariaLabel ?? props.title}
        className="relative flex max-h-[90vh] flex-col overflow-hidden rounded-panel border border-edge bg-modal shadow-modal"
        style={{ width: props.width ?? 480, zIndex: 90 }}
      >
        {props.title && (
          <header className="flex flex-shrink-0 items-center justify-between border-b border-edge px-5 py-3.5">
            <h2 className="font-ui text-[15px] font-semibold text-text-primary">{props.title}</h2>
            <button
              type="button"
              onClick={props.onClose}
              aria-label="Close"
              className="cursor-pointer rounded-control p-1 text-text-muted transition-colors duration-fast ease-out hover:text-text-primary"
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M6 6L18 18M18 6L6 18" />
              </svg>
            </button>
          </header>
        )}
        <div className="flex-1 overflow-auto px-5 py-4">{props.children}</div>
        {props.footer && (
          <footer className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-edge px-5 py-3">
            {props.footer}
          </footer>
        )}
      </div>
    </div>
  );
}
