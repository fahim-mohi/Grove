import { useEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  // Renders a horizontal divider below this item.
  dividerAfter?: boolean;
}

export interface ContextMenuProps {
  open: boolean;
  // Anchor coords in viewport space (clientX/Y from a contextmenu event).
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ITEM_HEIGHT = 32;
const MENU_WIDTH = 220;
const MENU_VPAD = 6; // top + bottom padding inside surface

export function ContextMenu(props: ContextMenuProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Close on click-outside + Esc, navigate with ↑↓ Enter.
  useEffect(() => {
    if (!props.open) return;

    function onPointer(e: MouseEvent): void {
      if (surfaceRef.current && !surfaceRef.current.contains(e.target as Node)) {
        props.onClose();
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation();
        props.onClose();
        return;
      }
      const enabledIndexes = props.items
        .map((item, i) => (item.disabled ? -1 : i))
        .filter((i) => i >= 0);
      if (enabledIndexes.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((idx) => {
          const pos = enabledIndexes.indexOf(idx);
          const nextPos = (pos + 1) % enabledIndexes.length;
          return enabledIndexes[nextPos] ?? -1;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((idx) => {
          const pos = enabledIndexes.indexOf(idx);
          const nextPos = pos <= 0 ? enabledIndexes.length - 1 : pos - 1;
          return enabledIndexes[nextPos] ?? -1;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = props.items[activeIndex];
        if (item && !item.disabled) {
          item.onSelect();
          props.onClose();
        }
      }
    }

    const t = window.setTimeout(() => {
      window.addEventListener('mousedown', onPointer);
      window.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [props, activeIndex]);

  if (!props.open) return null;

  // Clamp to viewport so the menu doesn't render off-screen.
  const naturalH = props.items.length * ITEM_HEIGHT + MENU_VPAD * 2;
  const clampedX = Math.min(props.x, window.innerWidth - MENU_WIDTH - 8);
  const clampedY = Math.min(props.y, window.innerHeight - naturalH - 8);

  return (
    <div
      ref={surfaceRef}
      role="menu"
      className="rounded-control border border-edge bg-modal py-1.5 shadow-modal"
      style={{
        position: 'fixed',
        left: clampedX,
        top: clampedY,
        width: MENU_WIDTH,
        zIndex: 70,
      }}
    >
      {props.items.map((item, idx) => (
        <Item
          key={item.id}
          item={item}
          active={idx === activeIndex}
          onMouseEnter={() => setActiveIndex(idx)}
          onSelect={() => {
            if (item.disabled) return;
            item.onSelect();
            props.onClose();
          }}
        />
      ))}
    </div>
  );
}

function Item({
  item,
  active,
  onMouseEnter,
  onSelect,
}: {
  item: ContextMenuItem;
  active: boolean;
  onMouseEnter: () => void;
  onSelect: () => void;
}) {
  return (
    <>
      <button
        type="button"
        role="menuitem"
        disabled={item.disabled}
        onMouseEnter={onMouseEnter}
        onClick={onSelect}
        className={`flex w-full items-center justify-between gap-3 px-3 font-ui text-[13px] transition-colors duration-fast ease-out ${
          item.disabled
            ? 'cursor-not-allowed text-text-muted'
            : item.danger
              ? `cursor-pointer ${active ? 'bg-danger text-white' : 'text-danger hover:bg-danger hover:text-white'}`
              : `cursor-pointer text-text-primary ${active ? 'bg-sidebarHover' : 'hover:bg-sidebarHover'}`
        }`}
        style={{ height: ITEM_HEIGHT }}
      >
        <span>{item.label}</span>
        {item.shortcut && (
          <span className="font-terminal text-[11px] text-text-muted">{item.shortcut}</span>
        )}
      </button>
      {item.dividerAfter && <div className="my-1 border-t border-edge" aria-hidden />}
    </>
  );
}
