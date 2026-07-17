/** Application port and Nest injection token for SupabaseStorageService. */
export abstract class SupabaseStorageService {}

export interface SupabaseStorageService {
  uploadFile(...args: any[]): any
  downloadFile(...args: any[]): any
  deleteFile(...args: any[]): any
  listFiles(...args: any[]): any
  getPublicUrl(...args: any[]): any
  getSignedUrl(...args: any[]): any
  fileExists(...args: any[]): any
  copyFile(...args: any[]): any
  moveFile(...args: any[]): any
  createBucket(...args: any[]): any
  deleteBucket(...args: any[]): any
  getBuckets(...args: any[]): any
  extractFilePathFromUrl(...args: any[]): any
}

