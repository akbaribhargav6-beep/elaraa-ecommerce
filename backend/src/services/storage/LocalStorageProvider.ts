import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env';
import type { SavedFile, StorageProvider } from './StorageProvider';

const uploadRoot = path.join(process.cwd(), env.UPLOAD_DIR);

export class LocalStorageProvider implements StorageProvider {
  async save(key: string, data: Buffer): Promise<SavedFile> {
    const fullPath = path.join(uploadRoot, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    return { url: this.getUrl(key), path: fullPath };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(uploadRoot, key);
    await fs.rm(fullPath, { force: true });
  }

  getUrl(key: string): string {
    // Served statically from app.ts: app.use('/uploads', express.static(...))
    return `/uploads/${key.replace(/\\/g, '/')}`;
  }
}
