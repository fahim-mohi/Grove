// PTY Manager — owns all node-pty lifecycle.
// node-pty MUST only be imported in this file (or other files inside electron/).
// Never import node-pty from anywhere under src/.

import { EventEmitter } from 'node:events';
import { accessSync, constants as fsConstants, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pathJoin } from 'node:path';
import { spawn as ptySpawn, type IPty } from 'node-pty';

export interface CreateSessionOpts {
  cols: number;
  rows: number;
  cwd?: string;
  command?: string;
  // Explicit argv for the spawned process. When provided, the manager
  // skips its claude-resolution path and just spawns this command +
  // args directly. Used by TmuxManager to spawn `tmux attach -t <name>`.
  argv?: { command: string; args: string[] };
}

export type CreateSessionResult =
  | { ok: true; pid: number; usedFallback: boolean; command: string }
  | { ok: false; reason: 'already-exists' | 'spawn-failed'; error: string };

interface PtyManagerEventMap {
  data: [sessionId: string, data: string];
  exit: [sessionId: string, code: number];
}

// Common Claude CLI install locations searched after $PATH.
const CLAUDE_FALLBACK_PATHS = [
  pathJoin(homedir(), '.local', 'bin', 'claude'),
  '/usr/local/bin/claude',
  '/opt/homebrew/bin/claude',
  pathJoin(homedir(), '.claude', 'local', 'claude'),
];

export class PtyManager extends EventEmitter<PtyManagerEventMap> {
  private sessions = new Map<string, IPty>();
  private resolvedClaudeBinary: string | null = null;
  private claudeBinaryResolved = false;

  resolveClaudeBinary(): string | null {
    if (this.claudeBinaryResolved) return this.resolvedClaudeBinary;
    this.claudeBinaryResolved = true;

    for (const dir of (process.env.PATH ?? '').split(':')) {
      if (!dir) continue;
      const candidate = pathJoin(dir, 'claude');
      if (this.isExecutable(candidate)) {
        this.resolvedClaudeBinary = candidate;
        return candidate;
      }
    }

    for (const candidate of CLAUDE_FALLBACK_PATHS) {
      if (this.isExecutable(candidate)) {
        this.resolvedClaudeBinary = candidate;
        return candidate;
      }
    }

    return null;
  }

  isClaudeInstalled(): boolean {
    return this.resolveClaudeBinary() !== null;
  }

  private isExecutable(filePath: string): boolean {
    try {
      accessSync(filePath, fsConstants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  create(sessionId: string, opts: CreateSessionOpts): CreateSessionResult {
    if (this.sessions.has(sessionId)) {
      return {
        ok: false,
        reason: 'already-exists',
        error: `Session ${sessionId} already exists`,
      };
    }

    let command: string;
    let args: string[] = [];
    let usedFallback = false;

    if (opts.argv) {
      command = opts.argv.command;
      args = opts.argv.args;
    } else if (opts.command && opts.command.trim().length > 0) {
      command = opts.command;
    } else {
      const claude = this.resolveClaudeBinary();
      if (claude) {
        command = claude;
      } else {
        command = process.env.SHELL ?? '/bin/zsh';
        usedFallback = true;
      }
    }

    const cwd = opts.cwd && existsSync(opts.cwd) ? opts.cwd : homedir();

    let pty: IPty;
    try {
      pty = ptySpawn(command, args, {
        name: 'xterm-256color',
        cols: Math.max(1, Math.floor(opts.cols)),
        rows: Math.max(1, Math.floor(opts.rows)),
        cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          GROVE_SESSION_ID: sessionId,
        } as Record<string, string>,
      });
    } catch (err) {
      return {
        ok: false,
        reason: 'spawn-failed',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    pty.onData((data) => {
      this.emit('data', sessionId, data);
    });

    pty.onExit(({ exitCode }) => {
      this.sessions.delete(sessionId);
      this.emit('exit', sessionId, exitCode);
    });

    this.sessions.set(sessionId, pty);
    return { ok: true, pid: pty.pid, usedFallback, command };
  }

  write(sessionId: string, data: string): void {
    const pty = this.sessions.get(sessionId);
    if (!pty) return;
    pty.write(data);
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const pty = this.sessions.get(sessionId);
    if (!pty) return;
    try {
      pty.resize(Math.max(1, Math.floor(cols)), Math.max(1, Math.floor(rows)));
    } catch {
      // PTY may already be dead; safe to ignore.
    }
  }

  kill(sessionId: string): void {
    const pty = this.sessions.get(sessionId);
    if (!pty) return;
    try {
      pty.kill();
    } catch {
      // ignore — process may already be dead
    }
    this.sessions.delete(sessionId);
  }

  killAll(): void {
    for (const id of [...this.sessions.keys()]) {
      this.kill(id);
    }
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  size(): number {
    return this.sessions.size;
  }
}
