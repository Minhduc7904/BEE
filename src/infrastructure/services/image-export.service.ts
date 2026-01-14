import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common'
import { chromium, Browser, Page } from 'playwright'

/**
 * ImageExportService - Production-ready image export service using Playwright
 * 
 * FEATURES:
 * - Export HTML to image (PNG, JPEG, WebP)
 * - Capture full page or specific element
 * - Customizable viewport and styling
 * - High-quality rendering
 * - Type-safe configuration
 * - Error handling and validation
 * 
 * ARCHITECTURE:
 * - Pure utility service (no business logic)
 * - Browser instance management
 * - Memory-efficient processing
 * - Extensible and reusable
 */

export interface ImageExportOptions {
  /** HTML content to render */
  html: string
  /** Image format (default: 'png') */
  format?: 'png' | 'jpeg' | 'webp'
  /** Image quality 0-100 (for jpeg/webp, default: 90) */
  quality?: number
  /** Viewport width (default: 1024) */
  width?: number
  /** Viewport height (default: 768) */
  height?: number
  /** Capture full page (default: true) */
  fullPage?: boolean
  /** Custom CSS to inject */
  css?: string
  /** Wait for selector before capture */
  waitForSelector?: string
  /** Additional wait time in ms (default: 500) */
  waitTime?: number
  /** Omit background (transparent, default: false) */
  omitBackground?: boolean
  /** Device scale factor (default: 2 for retina) */
  deviceScaleFactor?: number
}

export interface ImageExportResult {
  /** Image buffer */
  buffer: Buffer
  /** Image format */
  format: string
  /** Generated filename */
  filename: string
}

@Injectable()
export class ImageExportService {
  private readonly logger = new Logger(ImageExportService.name)
  private browser: Browser | null = null

  /**
   * Export HTML to image buffer
   * 
   * @param options - Export configuration
   * @returns Image export result
   */
  async exportToImage(options: ImageExportOptions): Promise<ImageExportResult> {
    let page: Page | null = null

    try {
      // Initialize browser if needed
      if (!this.browser) {
        await this.initBrowser()
      }

      // Create new page
      page = await this.browser!.newPage({
        viewport: {
          width: options.width || 1024,
          height: options.height || 768,
        },
        deviceScaleFactor: options.deviceScaleFactor || 2,
      })

      // Set HTML content
      await page.setContent(options.html, {
        waitUntil: 'networkidle',
      })

      // Inject custom CSS if provided
      if (options.css) {
        await page.addStyleTag({ content: options.css })
      }

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: 10000,
        })
      }

      // Additional wait time for rendering
      const waitTime = options.waitTime ?? 500
      if (waitTime > 0) {
        await page.waitForTimeout(waitTime)
      }

      // Capture screenshot
      const format = options.format || 'png'
      const screenshotOptions: any = {
        type: format,
        fullPage: options.fullPage !== false,
        omitBackground: options.omitBackground || false,
      }

      // Add quality for jpeg/webp
      if (format === 'jpeg' || format === 'webp') {
        screenshotOptions.quality = options.quality || 90
      }

      const buffer = await page.screenshot(screenshotOptions)

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const filename = `export-${timestamp}.${format}`

      this.logger.log(`✅ Image exported: ${format.toUpperCase()}, ${buffer.length} bytes`)

      return {
        buffer: Buffer.from(buffer),
        format,
        filename,
      }
    } catch (error) {
      this.logger.error(`❌ Image export failed: ${error.message}`)
      throw new InternalServerErrorException(`Failed to export image: ${error.message}`)
    } finally {
      // Clean up page
      if (page) {
        await page.close().catch(err => {
          this.logger.warn(`Failed to close page: ${err.message}`)
        })
      }
    }
  }

  /**
   * Export URL to image buffer
   * Useful for capturing external websites or local URLs
   * 
   * @param url - URL to capture
   * @param options - Export configuration (without html)
   * @returns Image export result
   */
  async exportUrlToImage(
    url: string,
    options: Omit<ImageExportOptions, 'html'>,
  ): Promise<ImageExportResult> {
    let page: Page | null = null

    try {
      // Initialize browser if needed
      if (!this.browser) {
        await this.initBrowser()
      }

      // Create new page
      page = await this.browser!.newPage({
        viewport: {
          width: options.width || 1024,
          height: options.height || 768,
        },
        deviceScaleFactor: options.deviceScaleFactor || 2,
      })

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })

      // Inject custom CSS if provided
      if (options.css) {
        await page.addStyleTag({ content: options.css })
      }

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: 10000,
        })
      }

      // Additional wait time for rendering
      const waitTime = options.waitTime ?? 500
      if (waitTime > 0) {
        await page.waitForTimeout(waitTime)
      }

      // Capture screenshot
      const format = options.format || 'png'
      const screenshotOptions: any = {
        type: format,
        fullPage: options.fullPage !== false,
        omitBackground: options.omitBackground || false,
      }

      // Add quality for jpeg/webp
      if (format === 'jpeg' || format === 'webp') {
        screenshotOptions.quality = options.quality || 90
      }

      const buffer = await page.screenshot(screenshotOptions)

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const filename = `capture-${timestamp}.${format}`

      this.logger.log(`✅ URL captured: ${url}, ${format.toUpperCase()}, ${buffer.length} bytes`)

      return {
        buffer: Buffer.from(buffer),
        format,
        filename,
      }
    } catch (error) {
      this.logger.error(`❌ URL capture failed: ${error.message}`)
      throw new InternalServerErrorException(`Failed to capture URL: ${error.message}`)
    } finally {
      // Clean up page
      if (page) {
        await page.close().catch(err => {
          this.logger.warn(`Failed to close page: ${err.message}`)
        })
      }
    }
  }

  /**
   * Initialize Playwright browser
   * @private
   */
  private async initBrowser(): Promise<void> {
    try {
      this.logger.log('🚀 Initializing Playwright browser...')
      
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      })

      this.logger.log('✅ Playwright browser initialized')
    } catch (error) {
      this.logger.error(`❌ Failed to initialize browser: ${error.message}`)
      throw new InternalServerErrorException('Failed to initialize browser')
    }
  }

  /**
   * Close browser instance
   * Should be called on application shutdown
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close()
        this.browser = null
        this.logger.log('✅ Browser closed')
      } catch (error) {
        this.logger.error(`❌ Failed to close browser: ${error.message}`)
      }
    }
  }

  /**
   * Clean up on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.closeBrowser()
  }
}
