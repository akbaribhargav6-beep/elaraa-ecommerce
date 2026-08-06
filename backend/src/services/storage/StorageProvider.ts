export interface SavedFile {
  url: string; // public URL (relative or absolute) the frontend can render
  path: string; // internal storage path/key, used for deletion
}

export interface StorageProvider {
  /** Saves a file buffer under the given relative key (e.g. "products/captivate/img-1.jpg") and returns its public URL. */
  save(key: string, data: Buffer, contentType?: string): Promise<SavedFile>;
  /** Deletes a previously-saved file by its storage key. */
  delete(key: string): Promise<void>;
  /** Resolves the public URL for a given key without writing anything. */
  getUrl(key: string): string;
}
