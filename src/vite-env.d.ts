/// <reference types="vite/client" />

import type { GroveApi } from '../shared/grove-api';

declare global {
  interface Window {
    grove: GroveApi;
  }
}

export {};
