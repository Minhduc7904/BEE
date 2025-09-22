// src/shared/decorators/validated-image-file.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { ValidationException } from '../exceptions/custom-exceptions'

export const ValidatedImageFile = createParamDecorator(
    (data: unknown, ctx: ExecutionContext, size: number = 5) => {
        const request = ctx.switchToHttp().getRequest()
        const file = request.file as Express.Multer.File

        if (!file) {
            throw new ValidationException('Image file is required')
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.mimetype)) {
            throw new ValidationException('Invalid image type. Only JPG, PNG, GIF, WEBP are allowed')
        }

        const maxSize = size * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            throw new ValidationException('Image size too large. Maximum 5MB allowed')
        }

        return file
    },
)

export const ValidatedPdfDocFile = createParamDecorator(
    (data: unknown, ctx: ExecutionContext, size: number = 10) => {
        const request = ctx.switchToHttp().getRequest()
        const file = request.file as Express.Multer.File

        if (!file) {
            throw new ValidationException('Document file is required')
        }

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(file.mimetype)) {
            throw new ValidationException('Invalid document type. Only PDF, DOC, DOCX are allowed')
        }

        const maxSize = size * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            throw new ValidationException('Document size too large. Maximum 10MB allowed')
        }

        return file
    },
)