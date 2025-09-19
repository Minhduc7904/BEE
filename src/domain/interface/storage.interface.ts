// src/domain/interface/storage.interface.ts

export interface UploadFileOptions {
  fileName?: string
  folder?: string
  upsert?: boolean
  contentType?: string
}

export interface FileUploadResult {
  fileName: string
  filePath: string
  url: string
  size: number
  contentType?: string
}

export interface FileInfo {
  name: string
  size: number
  lastModified: string
  contentType?: string
  url: string
}

export interface IStorageService {
  /**
   * Upload file to storage
   */
  uploadFile(
    file: Buffer | Uint8Array | File, 
    options: UploadFileOptions
  ): Promise<FileUploadResult>

  /**
   * Download file from storage
   */
  downloadFile(filePath: string): Promise<Buffer>

  /**
   * Delete file from storage
   */
  deleteFile(filePath: string): Promise<boolean>

  /**
   * List files in folder
   */
  listFiles(folder?: string, limit?: number): Promise<FileInfo[]>

  /**
   * Get public URL for file
   */
  getPublicUrl(filePath: string): Promise<string>

  /**
   * Get signed URL for private file access
   */
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>

  /**
   * Check if file exists
   */
  fileExists(filePath: string): Promise<boolean>

  /**
   * Copy file to new location
   */
  copyFile(fromPath: string, toPath: string): Promise<boolean>

  /**
   * Move/rename file
   */
  moveFile(fromPath: string, toPath: string): Promise<boolean>
}