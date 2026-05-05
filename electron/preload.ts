import { contextBridge } from 'electron';

const groveApi = {
  system: {
    versions: () => ({
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
      grove: '0.1.0',
    }),
    platform: () => process.platform,
  },
} as const;

export type GroveApi = typeof groveApi;

contextBridge.exposeInMainWorld('grove', groveApi);
