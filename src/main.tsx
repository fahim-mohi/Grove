import { createRoot } from 'react-dom/client';
import '@xterm/xterm/css/xterm.css';
import { App } from './App';
import './styles/globals.css';
import { hydrateStores, subscribePersistence } from './store/persistence';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found in index.html');

async function bootstrap(): Promise<void> {
  try {
    await hydrateStores();
  } catch (err) {
    console.error('[grove] hydrate failed:', err);
  }

  subscribePersistence();

  // StrictMode intentionally omitted: it double-invokes effects in dev,
  // which double-spawns + kills PTYs through useSession's mount/cleanup
  // (user sees "exit 0" the moment a session opens). Re-enable once
  // useSession's lifecycle is idempotent across remounts.
  createRoot(rootEl!).render(<App />);
}

void bootstrap();
