import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xterm/xterm/css/xterm.css';
import { App } from './App';
import './styles/globals.css';
import { hydrateStores, subscribePersistence } from './store/persistence';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found in index.html');

async function bootstrap(): Promise<void> {
  // Pull persisted state into the Zustand stores before React mounts so
  // the first render shows the user's prior session layout. Failure here
  // is non-fatal — defaults render and a clean save will overwrite later.
  try {
    await hydrateStores();
  } catch (err) {
    console.error('[grove] hydrate failed:', err);
  }

  // Start persisting future changes (debounced 200ms inside the bridge).
  subscribePersistence();

  createRoot(rootEl!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
