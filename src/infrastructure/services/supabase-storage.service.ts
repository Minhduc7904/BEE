// src/infrastructure/services/supabase-storage.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
    IStorageService,
    UploadFileOptions,
    FileUploadResult,
    FileInfo
} from '../../domain/interface/storage.interface'

@Injectable()
export class SupabaseStorageService implements IStorageService {
    private readonly logger = new Logger(SupabaseStorageService.name)
    private readonly supabase: SupabaseClient
    private readonly bucketName: string

    constructor(private readonly configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('supabase.url')
        const supabaseKey = this.configService.get<string>('supabase.apiKey')
        this.bucketName = this.configService.get<string>('supabase.bucketName', 'uploads')

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and API Key are required')
        }

        this.supabase = createClient(supabaseUrl, supabaseKey)
        this.logger.log('Supabase Storage Service initialized')
    }

    async uploadFile(
        file: Buffer | Uint8Array | File,
        options: UploadFileOptions = {}
    ): Promise<FileUploadResult> {
        try {
            const fileName = options.fileName || this.generateFileName()
            const folder = options.folder || 'general'
            const filePath = `${folder}/${fileName}`
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(filePath, file, {
                    upsert: options.upsert || false,
                    contentType: options.contentType,
                })

            if (error) {
                this.logger.error('Failed to upload file:', error.message)
                throw new Error(`Upload failed: ${error.message}`)
            }

            const { data: urlData } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(filePath)

            return {
                fileName,
                filePath: data.path,
                url: urlData.publicUrl,
                size: file instanceof Buffer ? file.length : file instanceof Uint8Array ? file.byteLength : file.size || 0,
                contentType: options.contentType,
            }
        } catch (error) {
            this.logger.error('Upload file error:', error)
            throw error
        }
    }

    async downloadFile(filePath: string): Promise<Buffer> {
        try {
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .download(filePath)

            if (error) {
                this.logger.error('Failed to download file:', error.message)
                throw new Error(`Download failed: ${error.message}`)
            }

            return Buffer.from(await data.arrayBuffer())
        } catch (error) {
            this.logger.error('Download file error:', error)
            throw error
        }
    }

    async deleteFile(filePath: string): Promise<boolean> {
        try {
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .remove([filePath])

            if (error) {
                this.logger.error('Failed to delete file:', error.message)
                throw new Error(`Delete failed: ${error.message}`)
            }

            return true
        } catch (error) {
            this.logger.error('Delete file error:', error)
            throw error
        }
    }

    async listFiles(folder?: string, limit = 100): Promise<FileInfo[]> {
        try {
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .list(folder, {
                    limit,
                    sortBy: { column: 'created_at', order: 'desc' }
                })

            if (error) {
                this.logger.error('Failed to list files:', error.message)
                throw new Error(`List failed: ${error.message}`)
            }

            return data.map(file => ({
                name: file.name,
                size: file.metadata?.size || 0,
                lastModified: file.created_at || '',
                contentType: file.metadata?.mimetype,
                url: this.getPublicUrlSync(`${folder ? folder + '/' : ''}${file.name}`)
            }))
        } catch (error) {
            this.logger.error('List files error:', error)
            throw error
        }
    }

    async getPublicUrl(filePath: string): Promise<string> {
        try {
            const { data } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(filePath)

            return data.publicUrl
        } catch (error) {
            this.logger.error('Get public URL error:', error)
            throw error
        }
    }

    async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
        try {
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .createSignedUrl(filePath, expiresIn)

            if (error) {
                this.logger.error('Failed to create signed URL:', error.message)
                throw new Error(`Signed URL creation failed: ${error.message}`)
            }

            return data.signedUrl
        } catch (error) {
            this.logger.error('Get signed URL error:', error)
            throw error
        }
    }

    async fileExists(filePath: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .list(filePath.split('/').slice(0, -1).join('/'), {
                    search: filePath.split('/').pop()
                })

            if (error) {
                return false
            }

            return data.length > 0
        } catch (error) {
            this.logger.error('Check file exists error:', error)
            return false
        }
    }

    async copyFile(fromPath: string, toPath: string): Promise<boolean> {
        try {
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .copy(fromPath, toPath)

            if (error) {
                this.logger.error('Failed to copy file:', error.message)
                throw new Error(`Copy failed: ${error.message}`)
            }

            return true
        } catch (error) {
            this.logger.error('Copy file error:', error)
            throw error
        }
    }

    async moveFile(fromPath: string, toPath: string): Promise<boolean> {
        try {
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .move(fromPath, toPath)

            if (error) {
                this.logger.error('Failed to move file:', error.message)
                throw new Error(`Move failed: ${error.message}`)
            }

            return true
        } catch (error) {
            this.logger.error('Move file error:', error)
            throw error
        }
    }

    // Helper methods
    private generateFileName(): string {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 15)
        return `${timestamp}_${random}`
    }

    private getPublicUrlSync(filePath: string): string {
        const { data } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(filePath)

        return data.publicUrl
    }

    // Bucket management methods
    async createBucket(name: string, isPublic = false): Promise<boolean> {
        try {
            const { error } = await this.supabase.storage.createBucket(name, {
                public: isPublic
            })

            if (error) {
                this.logger.error('Failed to create bucket:', error.message)
                throw new Error(`Create bucket failed: ${error.message}`)
            }

            return true
        } catch (error) {
            this.logger.error('Create bucket error:', error)
            throw error
        }
    }

    async deleteBucket(name: string): Promise<boolean> {
        try {
            const { error } = await this.supabase.storage.deleteBucket(name)

            if (error) {
                this.logger.error('Failed to delete bucket:', error.message)
                throw new Error(`Delete bucket failed: ${error.message}`)
            }

            return true
        } catch (error) {
            this.logger.error('Delete bucket error:', error)
            throw error
        }
    }

    async getBuckets(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase.storage.listBuckets()

            if (error) {
                this.logger.error('Failed to list buckets:', error.message)
                throw new Error(`List buckets failed: ${error.message}`)
            }

            return data
        } catch (error) {
            this.logger.error('Get buckets error:', error)
            throw error
        }
    }
}