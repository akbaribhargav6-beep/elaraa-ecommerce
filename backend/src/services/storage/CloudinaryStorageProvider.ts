import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import type { SavedFile, StorageProvider } from './StorageProvider';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Cloudinary manages its own extension/versioning per public_id, so the
// storage key's file extension is stripped before use.
function keyToPublicId(key: string): string {
  return key.replace(/\.[^/.]+$/, '');
}

export class CloudinaryStorageProvider implements StorageProvider {
  async save(key: string, data: Buffer, contentType?: string): Promise<SavedFile> {
    const publicId = keyToPublicId(key);
    const result = await cloudinary.uploader.upload(
      `data:${contentType ?? 'application/octet-stream'};base64,${data.toString('base64')}`,
      { public_id: publicId, overwrite: true, resource_type: 'image' }
    );
    return { url: result.secure_url, path: result.public_id };
  }

  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(keyToPublicId(key));
  }

  getUrl(key: string): string {
    return cloudinary.url(keyToPublicId(key), { secure: true });
  }
}
