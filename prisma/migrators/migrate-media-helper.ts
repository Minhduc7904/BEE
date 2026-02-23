import { newDb } from './db-clients';
import * as fs from 'fs';
import * as path from 'path';
import mime from 'mime-types';
import * as Minio from 'minio';
import { MediaType, MediaStatus, MediaVisibility } from '@prisma/client';
import { EntityType } from 'src/shared/constants/entity-type.constants';
import { USER_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants';
/**
 * Helper class để migrate media từ backup minio vào minio mới
 * Implements retry logic and error handling similar to MinioService
 */
export class MediaMigrationHelper {
    private minioClient: Minio.Client;
    private backupBasePath: string;
    private bucketName: string;
    private readonly maxRetries = 3;
    private readonly retryDelay = 1000; // ms

    constructor() {
        // Initialize MinIO client directly
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
            region: 'us-east-1',
            pathStyle: true,
        });

        this.backupBasePath = path.join(__dirname, '../../backup/minio-backup');
        this.bucketName = 'images'; // Bucket cho images
    }

    /**
     * Migrate avatar của user từ backup vào minio mới
     * @param avatarUrl - URL avatar từ DB cũ (e.g., "avatar/1753785603314-file.jpg")
     * @param userId - User ID mới trong DB mới
     * @returns Media record đã tạo hoặc null nếu không có avatar
     */
    async migrateUserAvatar(avatarUrl: string | null, userId: number): Promise<any | null> {
        if (!avatarUrl) {
            return null;
        }

        try {
            // Extract filename từ avatarUrl
            // avatarUrl format: "avatar/1753785603314-filename.jpg"
            const filename = path.basename(avatarUrl);
            const localFilePath = path.join(this.backupBasePath, 'avatar', filename);

            // Check xem file có tồn tại trong backup không
            if (!fs.existsSync(localFilePath)) {
                console.warn(`⚠️  Avatar file not found in backup: ${localFilePath}`);
                return null;
            }

            // Đọc file
            const fileBuffer = fs.readFileSync(localFilePath);
            const fileSize = fs.statSync(localFilePath).size;

            // Detect mime type
            const mimeType = mime.lookup(filename) || 'image/jpeg';

            // Generate object key mới cho MinIO
            // Format: avatars/{userId}/{timestamp}-{filename}
            const timestamp = Date.now();
            const objectKey = `avatars/${userId}/${timestamp}-${filename}`;

            // Upload lên MinIO bucket IMAGE với retry logic
            await this.uploadWithRetry(async () => {
                await this.minioClient.putObject(
                    this.bucketName,
                    objectKey,
                    fileBuffer,
                    fileBuffer.length,
                    { 'Content-Type': mimeType }
                );
            });

            console.log(`✅ Uploaded avatar to MinIO: ${this.bucketName}/${objectKey} (${fileBuffer.length} bytes)`);

            // Tạo Media record
            const media = await newDb.media.create({
                data: {
                    fileName: filename,
                    originalName: filename,
                    mimeType: mimeType,
                    fileSize: BigInt(fileSize),
                    type: MediaType.IMAGE,
                    status: MediaStatus.READY,
                    bucketName: this.bucketName,
                    objectKey: objectKey,
                    publicUrl: null, // Không dùng public URL, dùng presigned URL
                    uploadedBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            console.log(`✅ Created Media record: mediaId=${media.mediaId}`);

            // Tạo MediaUsage record
            const mediaUsage = await newDb.mediaUsage.create({
                data: {
                    mediaId: media.mediaId,
                    entityType: EntityType.USER,
                    entityId: userId,
                    fieldName: USER_MEDIA_FIELDS.AVATAR,
                    usedBy: userId,
                    visibility: MediaVisibility.PUBLIC, // Avatar thường là public
                    createdAt: new Date(),
                },
            });

            console.log(`✅ Created MediaUsage record: usageId=${mediaUsage.usageId}`);

            return media;
        } catch (error: any) {
            const normalizedError = this.normalizeMinioError(error, avatarUrl);
            console.error(`❌ Error migrating avatar for user ${userId}:`, normalizedError.message);
            return null;
        }
    }

    /**
     * Migrate media file từ backup path vào minio mới
     * @param relativePath - Relative path từ backup root (e.g., "question-image/file.jpg")
     * @param targetBucket - Target bucket name
     * @param entityType - Entity type (e.g., 'QUESTION', 'EXAM')
     * @param entityId - Entity ID
     * @param uploadedBy - User ID của người upload
     * @returns Media record hoặc null
     */
    async migrateMedia(
        relativePath: string,
        targetBucket: string,
        entityType: string,
        entityId: number,
        uploadedBy: number | null = null,
        fieldName: string | null = null,
    ): Promise<any | null> {
        try {
            const localFilePath = path.join(this.backupBasePath, relativePath);

            if (!fs.existsSync(localFilePath)) {
                console.warn(`⚠️  Media file not found: ${localFilePath}`);
                return null;
            }

            const filename = path.basename(relativePath);
            const fileBuffer = fs.readFileSync(localFilePath);
            const fileSize = fs.statSync(localFilePath).size;
            const mimeType = mime.lookup(filename) || 'application/octet-stream';

            // Determine media type from mime
            let mediaType: MediaType = MediaType.OTHER;
            if (mimeType.startsWith('image/')) mediaType = MediaType.IMAGE;
            else if (mimeType.startsWith('video/')) mediaType = MediaType.VIDEO;
            else if (mimeType.startsWith('audio/')) mediaType = MediaType.AUDIO;
            else if (mimeType.includes('pdf') || mimeType.includes('document')) mediaType = MediaType.DOCUMENT;

            // Generate object key
            const timestamp = Date.now();
            const objectKey = `${entityType.toLowerCase()}s/${entityId}/${timestamp}-${filename}`;

            // Upload to MinIO với retry logic
            await this.uploadWithRetry(async () => {
                await this.minioClient.putObject(
                    targetBucket,
                    objectKey,
                    fileBuffer,
                    fileBuffer.length,
                    { 'Content-Type': mimeType }
                );
            });

            console.log(`✅ File uploaded: ${targetBucket}/${objectKey} (${fileBuffer.length} bytes)`);

            // Create Media record
            const media = await newDb.media.create({
                data: {
                    fileName: filename,
                    originalName: filename,
                    mimeType: mimeType,
                    fileSize: BigInt(fileSize),
                    type: mediaType,
                    status: MediaStatus.READY,
                    bucketName: targetBucket,
                    objectKey: objectKey,
                    publicUrl: null,
                    uploadedBy: uploadedBy,
                },
            });

            // Create MediaUsage
            await newDb.mediaUsage.create({
                data: {
                    mediaId: media.mediaId,
                    entityType: entityType,
                    entityId: entityId,
                    fieldName: fieldName,
                    usedBy: uploadedBy,
                    visibility: MediaVisibility.PRIVATE,
                },
            });

            return media;
        } catch (error: any) {
            const normalizedError = this.normalizeMinioError(error, relativePath);
            console.error(`❌ Error migrating media ${relativePath}:`, normalizedError.message);
            return null;
        }
    }

    /**
     * Initialize MinIO connection and ensure bucket exists
     */
    async initialize(): Promise<void> {
        try {
            // Wait for MinIO to be ready
            await this.waitForMinioConnection();

            // Check if bucket exists, create if not
            const exists = await this.minioClient.bucketExists(this.bucketName);
            if (!exists) {
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                console.log(`✅ Created bucket: ${this.bucketName}`);
            } else {
                console.log(`✅ Bucket already exists: ${this.bucketName}`);
            }
            console.log('✅ MediaMigrationHelper initialized');
        } catch (error: any) {
            console.error('❌ Failed to initialize MediaMigrationHelper:', error.message);
            throw error;
        }
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Wait for MinIO connection to be ready with retry logic
     */
    private async waitForMinioConnection(): Promise<void> {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                await this.minioClient.listBuckets();
                console.log('✅ MinIO connection established');
                return;
            } catch (error: any) {
                console.warn(`⚠️  MinIO connection attempt ${attempt}/${this.maxRetries} failed: ${error.message}`);
                
                if (attempt === this.maxRetries) {
                    console.error('❌ Failed to connect to MinIO after maximum retries');
                    throw new Error('Failed to connect to MinIO storage');
                }
                
                await this.delay(this.retryDelay * attempt);
            }
        }
    }

    /**
     * Retry wrapper for upload operations
     */
    private async uploadWithRetry<T>(uploadFn: () => Promise<T>): Promise<T> {
        let lastError: Error | undefined;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await uploadFn();
            } catch (error: any) {
                lastError = error;
                console.warn(`⚠️  Upload attempt ${attempt}/${this.maxRetries} failed: ${error.message}`);
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        console.error(`❌ Upload failed after ${this.maxRetries} attempts`);
        throw new Error(`Upload failed: ${lastError?.message || 'Unknown error'}`);
    }

    /**
     * Normalize MinIO errors to user-friendly messages
     */
    private normalizeMinioError(error: any, objectKey?: string): Error {
        if (this.isNotFoundError(error)) {
            return new Error(`File not found: ${objectKey || 'unknown'}`);
        }
        if (error.code === 'NoSuchBucket') {
            return new Error('Storage bucket does not exist');
        }
        if (error.code === 'AccessDenied') {
            return new Error('Access denied to storage');
        }
        return new Error(`Storage error: ${error.message}`);
    }

    /**
     * Check if error is NotFound/NoSuchKey
     */
    private isNotFoundError(error: any): boolean {
        return error.code === 'NotFound' || error.code === 'NoSuchKey';
    }

    /**
     * Simple delay helper for retry logic
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
