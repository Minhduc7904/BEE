import { newDb } from './db-clients';
import * as fs from 'fs';
import * as path from 'path';
import mime from 'mime-types';
import * as Minio from 'minio';
import { MediaType, MediaStatus, MediaVisibility } from '@prisma/client';
import { EntityType } from '../../src/shared/constants/entity-type.constants';
import { USER_MEDIA_FIELDS } from '../../src/shared/constants/media-field-name.constants';

/**
 * Extract MinIO path từ URL, strip domain prefix
 * @param url - URL hoặc path từ DB cũ
 * @returns Clean path không có domain prefix
 */
export function extractMinioPath(url: string | null): string {
    if (!url) return '';
    
    // Remove domain prefix
    let cleanPath = url.replace(/^https?:\/\/[^\/]+\/minio\//i, '');
    // Remove leading slashes
    cleanPath = cleanPath.replace(/^[\/\\]+/, '');
    // Normalize path separators
    cleanPath = cleanPath.replace(/\\/g, '/');
    return cleanPath;
}

/**
 * Helper class để migrate media từ backup minio vào minio mới
 * Implements retry logic and error handling similar to MinioService
 */
export class MediaMigrationHelper {
    private minioClient: Minio.Client;
    private backupBasePath: string;
    private readonly buckets: Record<string, string>;
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

        // Load buckets từ env vars giống minio.config.ts
        this.buckets = {
            images: process.env.MINIO_BUCKET_IMAGES || 'images',
            videos: process.env.MINIO_BUCKET_VIDEOS || 'videos',
            audios: process.env.MINIO_BUCKET_AUDIOS || 'audios',
            documents: process.env.MINIO_BUCKET_DOCUMENTS || 'documents',
            others: process.env.MINIO_BUCKET_OTHERS || 'others',
        };

        this.backupBasePath = path.join(__dirname, '../../backup/minio-backup');
    }

    /**
     * Tự động detect bucket key từ mime type
     */
    private getBucketKeyFromMimeType(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'images';
        if (mimeType.startsWith('video/')) return 'videos';
        if (mimeType.startsWith('audio/')) return 'audios';
        if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('excel')) return 'documents';
        return 'others';
    }

    /**
     * Map MediaType từ mime type
     */
    private getMediaTypeFromMime(mimeType: string): MediaType {
        if (mimeType.startsWith('image/')) return MediaType.IMAGE;
        if (mimeType.startsWith('video/')) return MediaType.VIDEO;
        if (mimeType.startsWith('audio/')) return MediaType.AUDIO;
        if (mimeType.includes('pdf') || mimeType.includes('document')) return MediaType.DOCUMENT;
        return MediaType.OTHER;
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
                console.warn('Avatar file not found in backup: ' + localFilePath);
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
            const objectKey = 'avatars/' + userId + '/' + timestamp + '-' + filename;

            // Upload lên MinIO bucket IMAGE với retry logic
            const targetBucket = this.buckets.images;
            await this.uploadWithRetry(async () => {
                await this.minioClient.putObject(
                    targetBucket,
                    objectKey,
                    fileBuffer,
                    fileBuffer.length,
                    { 'Content-Type': mimeType }
                );
            });

            console.log('Uploaded avatar to MinIO: ' + targetBucket + '/' + objectKey + ' (' + fileBuffer.length + ' bytes)');

            // Tạo Media record
            const media = await newDb.media.create({
                data: {
                    fileName: filename,
                    originalName: filename,
                    mimeType: mimeType,
                    fileSize: BigInt(fileSize),
                    type: MediaType.IMAGE,
                    status: MediaStatus.READY,
                    bucketName: targetBucket,
                    objectKey: objectKey,
                    publicUrl: null, // Không dùng public URL, dùng presigned URL
                    uploadedBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            console.log('Created Media record: mediaId=' + media.mediaId);

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

            console.log('Created MediaUsage record: usageId=' + mediaUsage.usageId);

            return media;
        } catch (error: any) {
            const normalizedError = this.normalizeMinioError(error, 'avatars/' + userId);
            console.error('Error migrating avatar for user ' + userId + ': ' + normalizedError.message);
            return null;
        }
    }

    /**
     * Migrate media file từ backup path vào minio mới
     * Tự động detect bucket dựa vào mime type
     * @param relativePath - Relative path hoặc URL từ DB cũ (e.g., "question-image/file.jpg" or "https://beeedu.vn/minio/...")
     * @param entityType - Entity type (e.g., 'QUESTION', 'EXAM')
     * @param entityId - Entity ID
     * @param uploadedBy - User ID của người upload
     * @returns Media record hoặc null
     */
    async migrateMedia(
        relativePath: string,
        entityType: string,
        entityId: number,
        uploadedBy: number | null = null,
        fieldName: string | null = null,
    ): Promise<any | null> {
        try {
            // Strip MinIO URL prefix nếu có
            const cleanPath = this.stripMinioUrl(relativePath);
            const filename = path.basename(cleanPath);
            const folderPath = path.dirname(cleanPath);
            
            // Extract timestamp từ filename (format: {timestamp}-{name}.ext)
            const timestampMatch = filename.match(/^(\d+)-/);
            const timestamp = timestampMatch ? timestampMatch[1] : null;
            
            // Tìm file theo timestamp prefix trong folder cụ thể
            let localFilePath: string | null = null;
            
            if (timestamp && folderPath && folderPath !== '.') {
                // Tìm trong folder cụ thể
                const targetFolder = path.join(this.backupBasePath, folderPath);
                localFilePath = await this.findFileByTimestamp(timestamp, path.extname(filename), targetFolder);
            }
            
            // Fallback: thử tìm theo path trực tiếp
            if (!localFilePath) {
                const directPath = path.join(this.backupBasePath, cleanPath);
                if (fs.existsSync(directPath)) {
                    localFilePath = directPath;
                }
            }

            if (!localFilePath) {
                console.warn(`⚠ Media file not found for: ${filename}${timestamp ? ` (timestamp: ${timestamp})` : ''} in folder: ${folderPath}`);
                return null;
            }
            const fileBuffer = await fs.promises.readFile(localFilePath);
            const fileSize = (await fs.promises.stat(localFilePath)).size;
            const mimeType = mime.lookup(filename) || 'application/octet-stream';

            const bucketKey = this.getBucketKeyFromMimeType(mimeType);
            const targetBucket = this.buckets[bucketKey];
            const mediaType = this.getMediaTypeFromMime(mimeType);

            // Tạo objectKey cố định (không random timestamp nữa để tránh duplicate)
            const objectKey = `${entityType.toLowerCase()}s/${entityId}/${filename}`;

            // 🔎 Check object đã tồn tại trên MinIO chưa
            const objectExists = await this.minioClient
                .statObject(targetBucket, objectKey)
                .then(() => true)
                .catch(() => false);

            if (!objectExists) {
                await this.uploadWithRetry(async () => {
                    await this.minioClient.putObject(
                        targetBucket,
                        objectKey,
                        fileBuffer,
                        fileBuffer.length,
                        { 'Content-Type': mimeType }
                    );
                });

                console.log(`📤 Uploaded: ${targetBucket}/${objectKey}`);
            } else {
                console.log(`⏭ Object already exists: ${targetBucket}/${objectKey}`);
            }

            // 🔎 Check Media record
            let media = await newDb.media.findFirst({
                where: {
                    bucketName: targetBucket,
                    objectKey: objectKey,
                },
            });

            if (!media) {
                media = await newDb.media.create({
                    data: {
                        fileName: filename,
                        originalName: filename,
                        mimeType,
                        fileSize: BigInt(fileSize),
                        type: mediaType,
                        status: MediaStatus.READY,
                        bucketName: targetBucket,
                        objectKey,
                        publicUrl: null,
                        uploadedBy,
                    },
                });

                console.log(`🗂 Media record created for ${filename}`);
            }

            // 🔎 Check MediaUsage
            const existingUsage = await newDb.mediaUsage.findFirst({
                where: {
                    mediaId: media.mediaId,
                    entityType,
                    entityId,
                    fieldName,
                },
            });

            if (!existingUsage) {
                await newDb.mediaUsage.create({
                    data: {
                        mediaId: media.mediaId,
                        entityType,
                        entityId,
                        fieldName,
                        usedBy: uploadedBy,
                        visibility: MediaVisibility.PRIVATE,
                    },
                });

                console.log(`🔗 MediaUsage linked to ${entityType} ${entityId}`);
            }

            return media;
        } catch (error: any) {
            const normalizedError = this.normalizeMinioError(error, relativePath);
            console.error(`❌ Error migrating media ${relativePath}: ${normalizedError.message}`);
            return null;
        }
    }

    /**
     * Initialize MinIO connection and ensure all buckets exist
     */
    async initialize(): Promise<void> {
        try {
            // Wait for MinIO to be ready
            await this.waitForMinioConnection();

            // Check and create all buckets from config
            for (const [key, bucketName] of Object.entries(this.buckets)) {
                const exists = await this.minioClient.bucketExists(bucketName);
                if (!exists) {
                    await this.minioClient.makeBucket(bucketName, 'us-east-1');
                    console.log('Created bucket: ' + bucketName + ' (' + key + ')');
                } else {
                    console.log('Bucket already exists: ' + bucketName + ' (' + key + ')');
                }
            }
            console.log('MediaMigrationHelper initialized');
        } catch (error: any) {
            console.error('Failed to initialize MediaMigrationHelper: ' + error.message);
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
                console.log('MinIO connection established');
                return;
            } catch (error: any) {
                console.warn('MinIO connection attempt ' + attempt + '/' + this.maxRetries + ' failed: ' + error.message);

                if (attempt === this.maxRetries) {
                    console.error('Failed to connect to MinIO after maximum retries');
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
                console.warn('Upload attempt ' + attempt + '/' + this.maxRetries + ' failed: ' + error.message);
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        console.error('Upload failed after ' + this.maxRetries + ' attempts');
        throw new Error('Upload failed: ' + (lastError?.message || 'Unknown error'));
    }

    /**
     * Normalize MinIO errors to user-friendly messages
     */
    private normalizeMinioError(error: any, objectKey?: string): Error {
        if (this.isNotFoundError(error)) {
            return new Error('File not found: ' + (objectKey || 'unknown'));
        }
        if (error.code === 'NoSuchBucket') {
            return new Error('Storage bucket does not exist');
        }
        if (error.code === 'AccessDenied') {
            return new Error('Access denied to storage');
        }
        return new Error('Storage error: ' + error.message);
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

    /**
     * Strip MinIO URL prefix từ URL
     * Xử lý các format: https://beeedu.vn/minio/..., http://..., hoặc path thuần
     */
    private stripMinioUrl(url: string): string {
        // Remove domain prefix
        let cleanPath = url.replace(/^https?:\/\/[^\/]+\/minio\//i, '');
        // Remove leading slashes
        cleanPath = cleanPath.replace(/^[\/\\]+/, '');
        // Normalize path separators
        cleanPath = cleanPath.replace(/\\/g, '/');
        return cleanPath;
    }

    /**
     * Tìm file trong folder cụ thể theo timestamp prefix
     * @param timestamp - Timestamp prefix (e.g., "1755658536442")
     * @param ext - Optional file extension để filter (e.g., ".pdf")
     * @param targetFolder - Folder cụ thể để tìm (e.g., "backup/minio-backup/learning-items-pdf")
     */
    private async findFileByTimestamp(timestamp: string, ext?: string, targetFolder?: string): Promise<string | null> {
        const searchDir = targetFolder || this.backupBasePath;
        const pattern = new RegExp(`^${timestamp}-`);
        
        // Chỉ search trong folder cụ thể, không đệ quy
        if (targetFolder && fs.existsSync(targetFolder)) {
            return await this.searchFileInDirectory(targetFolder, pattern, ext);
        }
        
        return null;
    }

    /**
     * Search file trong directory (không đệ quy, chỉ search level 1)
     */
    private async searchFileInDirectory(
        dir: string,
        pattern: RegExp,
        ext?: string,
    ): Promise<string | null> {
        try {
            if (!fs.existsSync(dir)) return null;
            
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (!entry.isDirectory() && pattern.test(entry.name)) {
                    // Nếu có ext filter, check extension match
                    if (!ext || path.extname(entry.name).toLowerCase() === ext.toLowerCase()) {
                        return path.join(dir, entry.name);
                    }
                }
            }
        } catch (error: any) {
            console.warn(`⚠ Error reading directory ${dir}: ${error.message}`);
        }
        
        return null;
    }
}
