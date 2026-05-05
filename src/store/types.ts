// Re-export shared domain types so renderer code can keep importing
// from this familiar path. Single source of truth lives in shared/.

export type {
  ThemePreset,
  DarkMode,
  CursorStyle,
  Vec2,
  Size,
  Session,
  Tag,
  NewSessionInput,
  CanvasTransform,
} from '../../shared/types';
