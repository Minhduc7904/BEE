import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { promises as fs } from 'fs'
import { Readable } from 'stream'

/**
 * FileConverterService - File to Base64 conversion service
 *
 * FEATURES:
 * - Convert file Buffer to base64 string
 * - Convert file path to base64 string
 * - Convert Stream to base64 string
 * - Extract base64 data from data URLs
 * - Type-safe and error handling
 *
 * ARCHITECTURE:
 * - Pure utility service (no business logic)
 * - Memory-efficient for large files
 * - Support multiple input formats
 * - Clean base64 output (without prefix)
 */

export interface Base64Result {
  /** Base64 encoded string (without data URL prefix) */
  base64: string
  /** Original mime type if available */
  mimeType?: string
  /** File size in bytes */
  size: number
}

export interface FileInfo {
  /** Base64 string with data URL prefix */
  dataUrl: string
  /** Base64 string without prefix */
  base64: string
  /** Mime type extracted from data URL */
  mimeType: string
}

@Injectable()
export class FileConverterService {
  private readonly logger = new Logger(FileConverterService.name)

  /**
   * Convert Buffer to base64 string
   * @param buffer - File buffer
   * @param mimeType - Optional mime type for data URL
   * @returns Base64Result
   */
  async bufferToBase64(buffer: Buffer, mimeType?: string): Promise<Base64Result> {
    try {
      const base64 = buffer.toString('base64')

      return {
        base64,
        mimeType,
        size: buffer.length,
      }
    } catch (error) {
      this.logger.error(`Error converting buffer to base64: ${error.message}`)
      throw new BadRequestException('Failed to convert buffer to base64')
    }
  }

  /**
   * Convert file path to base64 string
   * @param filePath - Absolute path to file
   * @param mimeType - Optional mime type
   * @returns Base64Result
   */
  async fileToBase64(filePath: string, mimeType?: string): Promise<Base64Result> {
    try {
      const buffer = await fs.readFile(filePath)
      return this.bufferToBase64(buffer, mimeType)
    } catch (error) {
      this.logger.error(`Error reading file ${filePath}: ${error.message}`)
      throw new BadRequestException('Failed to read file')
    }
  }

  /**
   * Convert Readable stream to base64 string
   * @param stream - Readable stream
   * @param mimeType - Optional mime type
   * @returns Base64Result
   */
  async streamToBase64(stream: Readable, mimeType?: string): Promise<Base64Result> {
    try {
      const chunks: Buffer[] = []

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
      }

      const buffer = Buffer.concat(chunks)
      return this.bufferToBase64(buffer, mimeType)
    } catch (error) {
      this.logger.error(`Error converting stream to base64: ${error.message}`)
      throw new BadRequestException('Failed to convert stream to base64')
    }
  }

  /**
   * Create data URL from base64 string and mime type
   * @param base64 - Base64 encoded string (without prefix)
   * @param mimeType - Mime type (e.g., 'image/png', 'application/pdf')
   * @returns Data URL string
   */
  createDataUrl(base64: string, mimeType: string): string {
    return `data:${mimeType};base64,${base64}`
  }

  /**
   * Extract base64 data and mime type from data URL
   * @param dataUrl - Data URL string (data:mime;base64,...)
   * @returns FileInfo with extracted data
   */
  parseDataUrl(dataUrl: string): FileInfo {
    try {
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)

      if (!matches) {
        throw new BadRequestException('Invalid data URL format')
      }

      const [, mimeType, base64] = matches

      return {
        dataUrl,
        base64,
        mimeType,
      }
    } catch (error) {
      this.logger.error(`Error parsing data URL: ${error.message}`)
      throw new BadRequestException('Failed to parse data URL')
    }
  }

  /**
   * Get mime type from file extension
   * @param extension - File extension (with or without dot)
   * @returns Mime type string
   */
  getMimeTypeFromExtension(extension: string): string {
    const ext = extension.toLowerCase().replace(/^\./, '')

    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',

      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',

      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',

      // Video
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',

      // Archives
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',

      // Others
      json: 'application/json',
      xml: 'application/xml',
      csv: 'text/csv',
    }

    return mimeTypes[ext] || 'application/octet-stream'
  }

  /**
   * Get file extension from mime type
   * @param mimeType - Mime type string
   * @returns File extension (without dot)
   */
  getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'text/plain': 'txt',
      'application/json': 'json',
      'application/zip': 'zip',
    }

    return extensions[mimeType] || 'bin'
  }

  /**
   * Calculate base64 size in bytes (original file size)
   * @param base64 - Base64 encoded string
   * @returns Size in bytes
   */
  calculateBase64Size(base64: string): number {
    // Remove padding
    const padding = (base64.match(/=/g) || []).length
    // Base64 is 4/3 of original size
    return Math.floor((base64.length * 3) / 4) - padding
  }
}
