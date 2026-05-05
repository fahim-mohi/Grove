// Slugify a user-facing session name into a tmux-safe identifier. Mirrors
// TmuxManager.toTmuxName in the main process. Lives in src/lib/ so it's
// reachable from the renderer (NewSessionDialog, drag-in handlers).
const PREFIX = 'grove';

export function toTmuxName(userName: string): string {
  const slug = userName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const safe = slug || 'session';
  // Suffix with a short stamp so renaming doesn't collide with an
  // earlier session of the same name still parked in tmux.
  const stamp = Date.now().toString(36).slice(-4);
  return `${PREFIX}-${safe}-${stamp}`;
}

export function isGroveTmuxName(name: string): boolean {
  return name.startsWith(`${PREFIX}-`);
}
