// src/shared/utils/file.utils.ts
import { remove as removeDiacritics } from 'diacritics'

export function getFileExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()

    const extensionMap: Record<string, string> = {
        // Images
        jpeg: 'jpg',
        jpg: 'jpg',
        png: 'png',
        gif: 'gif',
        webp: 'webp',

        // Documents
        pdf: 'pdf',
        doc: 'doc',
        docx: 'docx',
    }

    return extensionMap[extension || ''] || 'bin' // default: 'bin' (binary)
}

/**
 * Generate a safe file name from original name + extension
 * - Loại bỏ dấu tiếng Việt
 * - Thay khoảng trắng bằng "_"
 * - Giữ nguyên chữ thường
 * - Thêm timestamp để tránh trùng lặp
 */
export function generateFileName(originalName: string, extension: string): string {
    // Lấy phần tên gốc (bỏ extension nếu có)
    const baseName = originalName.split('.').slice(0, -1).join('.') || originalName

    // Loại bỏ dấu tiếng Việt
    const noAccentName = removeDiacritics(baseName)

    // Thay khoảng trắng bằng "_", convert về lowercase
    const safeName = noAccentName.replace(/\s+/g, '_').toLowerCase()

    // Gắn thêm timestamp để đảm bảo duy nhất
    const timestamp = Date.now()

    return `${safeName}_${timestamp}.${extension}`
}

