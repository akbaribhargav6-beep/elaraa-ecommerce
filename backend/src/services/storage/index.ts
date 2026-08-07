import { env } from '../../config/env';
import { LocalStorageProvider } from './LocalStorageProvider';
import { CloudinaryStorageProvider } from './CloudinaryStorageProvider';
import type { StorageProvider } from './StorageProvider';

// Factory — swap STORAGE_PROVIDER in .env to move off local disk without
// touching any calling code. `local` writes to the backend's own disk, which
// on Railway (and most PaaS) is wiped on every redeploy unless a persistent
// volume is attached — `cloudinary` avoids that entirely by storing on
// Cloudinary's CDN instead.
let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!instance) {
    switch (env.STORAGE_PROVIDER) {
      case 'cloudinary':
        instance = new CloudinaryStorageProvider();
        break;
      case 'local':
      default:
        instance = new LocalStorageProvider();
    }
  }
  return instance;
}

export type { StorageProvider, SavedFile } from './StorageProvider';
