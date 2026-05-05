import type { Tag } from '../store/types';

export interface TagBadgeProps {
  tag: Tag;
  size?: 'sm' | 'xs';
  // Optional click handler — turns the badge into a button
  // (e.g. for filter chips in the sidebar). When omitted the badge is a
  // passive label.
  onClick?: () => void;
  active?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

// Hex helpers — convert #RRGGBB to rgba string with given alpha.
function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const expanded =
    cleaned.length === 3
      ? cleaned[0]! + cleaned[0]! + cleaned[1]! + cleaned[1]! + cleaned[2]! + cleaned[2]!
      : cleaned;
  if (expanded.length !== 6) return hex;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Per DESIGN.md §6.3:
// - height 20px (sm), 16px (xs)
// - padding 0 8px
// - radius pill
// - bg = tag.color @ 14% (light) / 22% (dark)
// - text = tag.color (light) / lightened (dark)
// - color dot 6×6 in tag.color 100%
//
// We approximate the light/dark conditional by using two alpha values
// stacked — the underlying surface paints through. A small inner
// outline at 30% alpha lifts the pill in dark mode without needing JS
// theme detection here.
export function TagBadge({
  tag,
  size = 'sm',
  onClick,
  active = false,
  removable = false,
  onRemove,
}: TagBadgeProps) {
  const height = size === 'xs' ? 16 : 20;
  const fontSize = size === 'xs' ? 10 : 11;
  const dotSize = size === 'xs' ? 5 : 6;
  const padX = size === 'xs' ? 5 : 7;

  const Component = onClick ? 'button' : 'span';

  const baseBg = hexToRgba(tag.color, active ? 0.32 : 0.16);
  const ringColor = hexToRgba(tag.color, active ? 0.55 : 0);

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      aria-pressed={onClick ? active : undefined}
      title={tag.name}
      className={`relative inline-flex flex-shrink-0 items-center gap-1 rounded-pill font-ui font-medium transition-colors duration-fast ease-out ${
        onClick ? 'cursor-pointer hover:brightness-110' : ''
      }`}
      style={{
        height,
        padding: `0 ${padX}px`,
        fontSize,
        background: baseBg,
        color: tag.color,
        boxShadow: active ? `inset 0 0 0 1px ${ringColor}` : undefined,
      }}
    >
      <span
        aria-hidden
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: 999,
          background: tag.color,
          flexShrink: 0,
        }}
      />
      <span className="truncate" style={{ maxWidth: 96 }}>
        {tag.name}
      </span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={`Remove tag ${tag.name}`}
          className="ml-0.5 cursor-pointer opacity-60 hover:opacity-100"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: tag.color,
            lineHeight: 1,
          }}
        >
          <svg
            width={10}
            height={10}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        </button>
      )}
    </Component>
  );
}
