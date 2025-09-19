// src/shared/utils/file-validation.util.ts
import { ParseFilePipeBuilder, HttpStatus } from '@nestjs/common'

export class FileValidationUtil {
    /**
     * Tạo validation pipe cho image upload
     * @param maxSizeInMB - Kích thước tối đa file (MB)
     * @param allowedTypes - Các loại file được phép (regex pattern)
     * @returns ParseFilePipe instance
     */
    static createImageValidationPipe(
        maxSizeInMB: number = 5,
        allowedTypes: RegExp = /(jpg|jpeg|png|gif|webp)$/
    ) {
        return new ParseFilePipeBuilder()
            .addFileTypeValidator({
                fileType: allowedTypes,
            })
            .addMaxSizeValidator({
                maxSize: maxSizeInMB * 1024 * 1024, // Convert MB to bytes
            })
            .build({
                errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
            })
    }

    /**
     * Tạo validation pipe cho document upload
     * @param maxSizeInMB - Kích thước tối đa file (MB)
     * @param allowedTypes - Các loại file được phép (regex pattern)
     * @returns ParseFilePipe instance
     */
    static createDocumentValidationPipe(
        maxSizeInMB: number = 10,
        allowedTypes: RegExp = /(pdf|doc|docx|txt)$/
    ) {
        return new ParseFilePipeBuilder()
            .addFileTypeValidator({
                fileType: allowedTypes,
            })
            .addMaxSizeValidator({
                maxSize: maxSizeInMB * 1024 * 1024, // Convert MB to bytes
            })
            .build({
                errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
            })
    }
}