/// <reference types="vite/client" />

import type { GroveApi } from '../electron/preload';

declare global {
  interface Window {
    grove: GroveApi;
  }
}

export {};
