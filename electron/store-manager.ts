// Wrapper around electron-store. Hides the v8+ ESM-only quirk by lazily
// loading the module with a dynamic import.
//
// Used by the renderer through window.grove.store via IPC. The renderer
// never imports this file.

import { app } from 'electron';
import { existsSync, copyFileSync } from 'node:fs';
import { join as pathJoin } from 'node:path';

import type { PersistedState } from '../shared/persistence';
import { CURRENT_SCHEMA_VERSION, defaultPersistedState, runMigrations } from '../shared/persistence';

type ElectronStore<T> = {
  store: T;
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  set(values: Partial<T>): void;
  clear(): void;
  path: string;
};

let store: ElectronStore<PersistedState> | null = null;

async function getStore(): Promise<ElectronStore<PersistedState>> {
  if (store) return store;
  const Store = (await import('electron-store')).default as new (
    options: Record<string, unknown>,
  ) => ElectronStore<PersistedState>;
  store = new Store({
    name: 'config',
    cwd: app.getPath('userData'),
    defaults: defaultPersistedState(),
    fileExtension: 'json',
  });
  return store;
}

function backupCorruptConfig(path: string): void {
  if (!existsSync(path)) return;
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  copyFileSync(path, `${path}.bak.${stamp}`);
}

export async function getAll(): Promise<PersistedState> {
  try {
    const s = await getStore();
    const raw = s.store;
    if (typeof raw !== 'object' || raw === null) {
      throw new Error('persisted state is not an object');
    }
    const persistedVersion =
      (raw as Partial<PersistedState>).schemaVersion ?? CURRENT_SCHEMA_VERSION;
    if (persistedVersion === CURRENT_SCHEMA_VERSION) return raw as PersistedState;

    const migrated = runMigrations(raw as Partial<PersistedState>, persistedVersion);
    s.set(migrated);
    return migrated;
  } catch (err) {
    // Corrupt config — back up, reset, surface a clean default.
    const userData = app.getPath('userData');
    const path = pathJoin(userData, 'config.json');
    try {
      backupCorruptConfig(path);
    } catch {
      // best-effort
    }
    console.error('[grove] config corrupted, reset to defaults:', err);
    const fresh = defaultPersistedState();
    if (store) store.set(fresh);
    return fresh;
  }
}

export async function setKey<K extends keyof PersistedState>(
  key: K,
  value: PersistedState[K],
): Promise<void> {
  const s = await getStore();
  s.set(key, value);
}

export async function setMany(patch: Partial<PersistedState>): Promise<void> {
  const s = await getStore();
  s.set(patch);
}

export async function reset(): Promise<void> {
  const s = await getStore();
  s.clear();
  s.set(defaultPersistedState());
}

export async function path(): Promise<string> {
  const s = await getStore();
  return s.path;
}
