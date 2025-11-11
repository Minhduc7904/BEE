// src/application/dtos/user/user-response.dto.ts
import { IsOptional, IsString, IsInt, IsUrl } from 'class-validator'
import { Trim, IsEnumValue } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { StorageProvider } from '../../../shared/enums'
import { Image } from '../../../domain/entities'
import { FileResponseDto } from '..'

export class ImageUrlDto {
    @IsString()
        url: string

    @IsString()
        anotherUrl: string
}

export class CreateImageDto {
        @Trim()
    @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
    url: string

        @Trim()
    @IsOptional()
    @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
    anotherUrl?: string

        @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('MIME type') })
    mimeType?: string

        @Trim()
    @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
    storageProvider: StorageProvider

        @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID admin') })
    adminId: number
}


export class ImageResponseDto extends FileResponseDto {
        imageId: number

        caption?: string

    constructor(partial: Partial<ImageResponseDto>) {
        super()
        Object.assign(this, partial)
    }

    static fromEntity(image: Image): ImageResponseDto {
        return new ImageResponseDto({
            imageId: image.imageId,
            adminId: image.adminId,
            url: image.url,
            anotherUrl: image.anotherUrl,
            caption: image.caption,
            mimeType: image.mimeType,
            storageProvider: image.storageProvider,
            createdAt: image.createdAt,
            updatedAt: image.updatedAt,
        })
    }
}