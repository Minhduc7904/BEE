/** Application port and Nest injection token for DocumentThumbnailService. */
export abstract class DocumentThumbnailService {}

export interface DocumentThumbnailService {
  generateFromPdf(...args: any[]): any
  upload(...args: any[]): any
}

