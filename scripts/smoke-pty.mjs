// Standalone node-pty smoke test. Spawns the resolved `claude` binary (or
// falls back to $SHELL), captures output for 2 seconds, then kills the
// process. Confirms node-pty links correctly against the local Electron ABI
// and the resolved binary spawns. Run with: node scripts/smoke-pty.mjs
//
// This bypasses Electron entirely — runs node-pty under plain Node, so it
// validates the native module loads but does NOT validate IPC. (IPC is
// proven by the dev server starting without preload errors.)

import { spawn } from 'node-pty';
import { accessSync, constants as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const FALLBACKS = [
  join(homedir(), '.local', 'bin', 'claude'),
  '/usr/local/bin/claude',
  '/opt/homebrew/bin/claude',
];

function isExec(p) {
  try {
    accessSync(p, fs.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveClaude() {
  for (const dir of (process.env.PATH ?? '').split(':')) {
    if (!dir) continue;
    const c = join(dir, 'claude');
    if (isExec(c)) return c;
  }
  for (const c of FALLBACKS) {
    if (isExec(c)) return c;
  }
  return null;
}

const claude = resolveClaude();
const command = claude ?? process.env.SHELL ?? '/bin/zsh';
const usedFallback = !claude;

console.log('[smoke] resolved command:', command);
console.log('[smoke] used fallback shell:', usedFallback);
console.log('[smoke] spawning…');

const pty = spawn(command, usedFallback ? ['-l'] : ['--help'], {
  name: 'xterm-256color',
  cols: 100,
  rows: 30,
  cwd: homedir(),
  env: {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
  },
});

console.log('[smoke] pid:', pty.pid);

let bytes = 0;
let snippet = '';
pty.onData((d) => {
  bytes += d.length;
  if (snippet.length < 200) snippet += d;
});

pty.onExit(({ exitCode }) => {
  console.log('[smoke] exited with code:', exitCode);
  console.log('[smoke] total bytes received:', bytes);
  console.log('[smoke] first 200 bytes:');
  console.log('---');
  console.log(snippet.slice(0, 200));
  console.log('---');
  if (bytes > 0) {
    console.log('[smoke] PASS — node-pty round-trip works');
    process.exit(0);
  } else {
    console.log('[smoke] FAIL — no data received');
    process.exit(1);
  }
});

setTimeout(() => {
  pty.kill();
}, 3000);
