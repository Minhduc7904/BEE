/** Application port and Nest injection token for MinioService. */
export abstract class MinioService {}

export interface MinioService {
  onModuleInit(...args: any[]): any
  uploadFile(...args: any[]): any
  uploadFileStream(...args: any[]): any
  downloadFile(...args: any[]): any
  getFileStream(...args: any[]): any
  getPartialStream(...args: any[]): any
  getPresignedDownloadUrl(...args: any[]): any
  getPresignedUrl(...args: any[]): any
  getPresignedUploadUrl(...args: any[]): any
  deleteFile(...args: any[]): any
  fileExists(...args: any[]): any
  getFileMetadata(...args: any[]): any
  copyFile(...args: any[]): any
  listFiles(...args: any[]): any
  getBuckets(): Record<string, string>
  getClient(...args: any[]): any
}
