/** Application port and Nest injection token for FileConverterService. */
export abstract class FileConverterService {}

export interface FileConverterService {
  bufferToBase64(...args: any[]): any
  fileToBase64(...args: any[]): any
  streamToBase64(...args: any[]): any
  createDataUrl(...args: any[]): any
  parseDataUrl(...args: any[]): any
  getMimeTypeFromExtension(...args: any[]): any
  getExtensionFromMimeType(...args: any[]): any
  calculateBase64Size(...args: any[]): any
}

