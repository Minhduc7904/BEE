/** Application port and Nest injection token for ImageExportService. */
export abstract class ImageExportService {}

export interface ImageExportService {
  exportToImage(...args: any[]): any
  exportUrlToImage(...args: any[]): any
  closeBrowser(...args: any[]): any
  onModuleDestroy(...args: any[]): any
}

