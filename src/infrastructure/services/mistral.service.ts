import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Mistral } from '@mistralai/mistralai'

export interface OcrResult {
  text?: string
  pages?: any[]
  metadata?: any
  [key: string]: any
}

export interface OcrOptions {
  model?: string
  includeImageBase64?: boolean
}

/**
 * MistralService - Mistral AI integration for OCR
 *
 * Features:
 * - PDF and image OCR processing
 * - Base64 content support
 * - Configurable model and options
 */
@Injectable()
export class MistralService {
  private readonly logger = new Logger(MistralService.name)
  private readonly mistralClient: Mistral
  private readonly defaultModel: string
  private readonly defaultTemperature: number
  private readonly defaultMaxTokens: number

  constructor(private readonly configService: ConfigService) {
    const mistralConfig = this.configService.get('mistral')
    const apiKey = mistralConfig?.apiKey || process.env.MISTRAL_API_KEY

    if (!apiKey) {
      this.logger.warn('Mistral API key not configured. OCR features will be unavailable.')
    }

    this.mistralClient = new Mistral({
      apiKey: apiKey,
    })

    this.defaultModel = mistralConfig?.model || 'mistral-large-latest'
    this.defaultTemperature = mistralConfig?.temperature || 0.7
    this.defaultMaxTokens = mistralConfig?.maxTokens || 1000

    this.logger.log(`Mistral AI client initialized with model: ${this.defaultModel}`)
  }

  /**
   * Perform OCR on base64 content of PDF or image.
   * @param base64Data - Base64-encoded file content (without prefix)
   * @param fileType - 'pdf', 'png', 'jpg', or 'jpeg'
   * @param options - OCR options
   * @returns Promise with OCR result
   */
  async performOcr(base64Data: string, fileType: string = 'pdf', options?: OcrOptions): Promise<OcrResult> {
    try {
      const supportedTypes = {
        pdf: 'application/pdf',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
      }

      const normalizedType = fileType.toLowerCase()
      const mimeType = supportedTypes[normalizedType]

      if (!mimeType) {
        throw new Error(`Unsupported file type: ${fileType}`)
      }

      const isPdf = normalizedType === 'pdf'
      const dataUrl = `data:${mimeType};base64,${base64Data}`

      const model = options?.model || 'mistral-ocr-latest'
      const includeImageBase64 = options?.includeImageBase64 ?? true

      this.logger.log(`Performing OCR on ${fileType} with model: ${model}`)

      const result = await this.mistralClient.ocr.process({
        model,
        document: isPdf
          ? {
              type: 'document_url',
              documentUrl: dataUrl,
            }
          : {
              type: 'image_url',
              imageUrl: dataUrl,
            },
        includeImageBase64,
      })

      this.logger.log(`OCR completed successfully for ${fileType}`)
      return result as OcrResult
    } catch (error) {
      this.logger.error(`Error during OCR: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Get Mistral AI client instance for custom operations
   */
  getClient(): Mistral {
    return this.mistralClient
  }

  /**
   * Get default configuration
   */
  getConfig() {
    return {
      model: this.defaultModel,
      temperature: this.defaultTemperature,
      maxTokens: this.defaultMaxTokens,
    }
  }
}
