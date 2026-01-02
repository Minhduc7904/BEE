import { Injectable, Logger } from '@nestjs/common'
import { MediaType } from '@prisma/client'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

type OptimizeParams = {
    buffer: Buffer
    mimeType: string
    mediaType: MediaType
}

type OptimizedMediaResult = {
    buffer: Buffer
    mimeType: string
    extension: string
    width?: number | null
    height?: number | null
    duration?: number | null
}

@Injectable()
export class MediaProcessingService {
    private readonly logger = new Logger(MediaProcessingService.name)

    constructor() {
        const ffmpegPath = ffmpegStatic || null
        if (ffmpegPath) {
            ffmpeg.setFfmpegPath(ffmpegPath)
        }

        const ffprobeCandidate = ffprobeStatic as unknown as { path?: string } | string | null | undefined
        const ffprobePath = typeof ffprobeCandidate === 'string'
            ? ffprobeCandidate
            : ffprobeCandidate?.path || null
        if (ffprobePath) {
            ffmpeg.setFfprobePath(ffprobePath)
        }
    }

    async optimize(params: OptimizeParams): Promise<OptimizedMediaResult | null> {
        try {
            if (params.mediaType === MediaType.IMAGE) {
                return await this.optimizeImage(params)
            }

            if (params.mediaType === MediaType.VIDEO) {
                return await this.optimizeVideo(params)
            }

            return null
        } catch (error) {
            this.logger.warn(`Media optimization failed: ${(error as Error).message}`)
            return null
        }
    }

    private async optimizeImage({ buffer, mimeType }: OptimizeParams) {
        const metadata = await sharp(buffer).metadata()
        

        const optimizedBuffer = await sharp(buffer)
            .rotate()
            .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer()

        if (optimizedBuffer.length >= buffer.length) {
            return {
                buffer,
                mimeType,
                extension: this.extensionFromMime(mimeType),
                width: metadata.width ?? null,
                height: metadata.height ?? null,
            }
        }

        const optimizedMeta = await sharp(optimizedBuffer).metadata()

        return {
            buffer: optimizedBuffer,
            mimeType: 'image/webp',
            extension: '.webp',
            width: optimizedMeta.width ?? null,
            height: optimizedMeta.height ?? null,
        }
    }


    private async optimizeVideo({ buffer, mimeType }: OptimizeParams): Promise<OptimizedMediaResult | null> {
        const ext = mimeType.includes('mp4') ? '.mp4' : '.video'
        const tempInput = await this.writeTempFile(buffer, `.source${ext}`)
        const tempOutput = join(tmpdir(), `optimized-${uuidv4()}.mp4`)

        try {
            await new Promise<void>((resolve, reject) => {
                ffmpeg(tempInput)
                    .outputOptions([
                        '-vf',
                        "scale='min(1280,iw)':-2",
                        '-c:v',
                        'libx264',
                        '-preset',
                        'medium',
                        '-crf',
                        '23',
                        '-c:a',
                        'aac',
                        '-b:a',
                        '128k',
                        '-movflags',
                        '+faststart',
                    ])
                    .on('end', () => resolve())
                    .on('error', (error) => reject(error))
                    .save(tempOutput)
            })

            const optimizedBuffer = await fs.readFile(tempOutput)

            if (optimizedBuffer.length >= buffer.length) {
                return {
                    buffer,
                    mimeType,
                    extension: this.extensionFromMime(mimeType),
                }
            }

            const metadata = await this.probeVideo(tempOutput)

            return {
                buffer: optimizedBuffer,
                mimeType: 'video/mp4',
                extension: '.mp4',
                width: metadata?.width ?? null,
                height: metadata?.height ?? null,
                duration: metadata?.duration ?? null,
            }
        } finally {
            await this.cleanupTempFiles([tempInput, tempOutput])
        }
    }

    private async probeVideo(filePath: string) {
        return new Promise<{ width?: number; height?: number; duration?: number } | null>((resolve) => {
            ffmpeg.ffprobe(filePath, (error, data) => {
                if (error || !data?.streams?.length) {
                    this.logger.warn(`Failed to probe video metadata: ${error?.message ?? 'unknown error'}`)
                    return resolve(null)
                }

                const videoStream = data.streams.find((stream) => stream.codec_type === 'video')

                resolve({
                    width: videoStream?.width,
                    height: videoStream?.height,
                    duration: videoStream?.duration ? Number(videoStream.duration) : data.format?.duration,
                })
            })
        })
    }

    private async writeTempFile(buffer: Buffer, suffix: string) {
        const filePath = join(tmpdir(), `${uuidv4()}${suffix}`)
        await fs.writeFile(filePath, buffer)
        return filePath
    }

    private async cleanupTempFiles(files: string[]) {
        await Promise.all(
            files.map(async (filePath) => {
                try {
                    await fs.unlink(filePath)
                } catch (error) {
                    this.logger.warn(`Failed to remove temporary file ${filePath}: ${(error as Error).message}`)
                }
            }),
        )
    }

    private extensionFromMime(mimeType: string): string {
        const mimeToExtension: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'video/mp4': '.mp4',
            'video/quicktime': '.mov',
            'video/x-msvideo': '.avi',
        }
        return mimeToExtension[mimeType] || '.bin'
    }
}