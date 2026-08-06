import { env } from '../../config/env';
import { LocalStorageProvider } from './LocalStorageProvider';
import type { StorageProvider } from './StorageProvider';

// Factory — swap STORAGE_PROVIDER=s3 in .env (and implement S3StorageProvider)
// to move off local disk without touching any calling code.
let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!instance) {
    switch (env.STORAGE_PROVIDER) {
      case 'local':
      default:
        instance = new LocalStorageProvider();
    }
  }
  return instance;
}

export type { StorageProvider, SavedFile } from './StorageProvider';
