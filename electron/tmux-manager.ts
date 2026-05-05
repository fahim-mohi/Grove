// TmuxManager — wraps the tmux CLI so Grove sessions can survive Grove
// itself. A tmux session holds the PTY; Grove's local PTY just runs
// `tmux attach -t <name>`. Killing Grove's PTY = detach (session keeps
// running). Killing the tmux session itself = `tmux kill-session`.
//
// Lives entirely in the main process. Renderer talks to it via IPC
// through window.grove.tmux.*.

import { execFile, type ExecFileException } from 'node:child_process';
import { accessSync, constants as fsConstants } from 'node:fs';
import { join as pathJoin } from 'node:path';
import { homedir } from 'node:os';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

const TMUX_FALLBACK_PATHS = [
  '/usr/local/bin/tmux',
  '/opt/homebrew/bin/tmux',
  pathJoin(homedir(), '.local', 'bin', 'tmux'),
  '/usr/bin/tmux',
];

export interface TmuxSession {
  name: string;
  windowCount: number;
  attached: boolean;
  createdAt: number; // unix seconds
  lastActivity: number; // unix seconds
}

export class TmuxManager {
  private resolvedBinary: string | null = null;
  private resolved = false;

  resolveBinary(): string | null {
    if (this.resolved) return this.resolvedBinary;
    this.resolved = true;

    for (const dir of (process.env.PATH ?? '').split(':')) {
      if (!dir) continue;
      const candidate = pathJoin(dir, 'tmux');
      if (this.isExecutable(candidate)) {
        this.resolvedBinary = candidate;
        return candidate;
      }
    }
    for (const candidate of TMUX_FALLBACK_PATHS) {
      if (this.isExecutable(candidate)) {
        this.resolvedBinary = candidate;
        return candidate;
      }
    }
    return null;
  }

  isAvailable(): boolean {
    return this.resolveBinary() !== null;
  }

  // Re-runs detection (useful after the user installs tmux while Grove
  // is open and clicks "Recheck").
  refresh(): void {
    this.resolved = false;
    this.resolvedBinary = null;
  }

  private isExecutable(filePath: string): boolean {
    try {
      accessSync(filePath, fsConstants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async run(args: string[]): Promise<{ stdout: string; stderr: string }> {
    const binary = this.resolveBinary();
    if (!binary) throw new Error('tmux binary not available');
    try {
      const result = await execFileP(binary, args, {
        encoding: 'utf8',
        env: { ...process.env },
      });
      return { stdout: result.stdout, stderr: result.stderr };
    } catch (err) {
      // tmux exits non-zero for "no sessions" — surface as empty rather
      // than throwing.
      const e = err as ExecFileException & { stdout?: string; stderr?: string };
      if (e.stderr?.includes('no server running')) {
        return { stdout: '', stderr: e.stderr };
      }
      throw err;
    }
  }

  // List every tmux session on the system, regardless of which Grove
  // panel attached to it (or whether it was started outside Grove).
  async listSessions(): Promise<TmuxSession[]> {
    if (!this.isAvailable()) return [];
    const fmt = '#{session_name}|#{session_windows}|#{session_attached}|#{session_created}|#{session_activity}';
    const { stdout } = await this.run(['list-sessions', '-F', fmt]);
    if (!stdout.trim()) return [];
    return stdout
      .trim()
      .split('\n')
      .map((line) => {
        const [name = '', windows = '0', attached = '0', created = '0', activity = '0'] = line.split('|');
        return {
          name,
          windowCount: parseInt(windows, 10) || 0,
          attached: attached !== '0',
          createdAt: parseInt(created, 10) || 0,
          lastActivity: parseInt(activity, 10) || 0,
        };
      });
  }

  async hasSession(name: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await this.run(['has-session', '-t', name]);
      return true;
    } catch {
      return false;
    }
  }

  // Create a new detached tmux session running `command`. Idempotent —
  // returns silently if the session already exists.
  async createSession(name: string, command: string, cwd?: string): Promise<void> {
    if (await this.hasSession(name)) return;
    const args = ['new-session', '-d', '-s', name];
    if (cwd) args.push('-c', cwd);
    args.push(command);
    await this.run(args);
  }

  // Permanently destroy a tmux session.
  async killSession(name: string): Promise<void> {
    if (!(await this.hasSession(name))) return;
    await this.run(['kill-session', '-t', name]);
  }

  // Returns the argv Grove uses to spawn an attach PTY. Grove does NOT
  // run this directly — PtyManager owns PTY spawning. We just provide
  // the command + args for it to use.
  buildAttachArgv(name: string): { command: string; args: string[] } {
    const binary = this.resolveBinary();
    if (!binary) throw new Error('tmux binary not available');
    return { command: binary, args: ['attach-session', '-t', name] };
  }

  // Slugify a user-facing session name into a tmux-safe identifier.
  // tmux names can contain most chars but for cleanliness we restrict.
  static toTmuxName(grovePrefix: string, userName: string): string {
    const slug = userName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    const safe = slug || 'session';
    return `${grovePrefix}-${safe}`;
  }
}
