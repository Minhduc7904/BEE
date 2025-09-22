// src/application/dtos/user/user-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, IsUrl } from 'class-validator'
import { Trim, IsEnumValue } from '../../../shared/decorators'
import { SWAGGER_PROPERTIES, VALIDATION_MESSAGES } from '../../../shared/constants'
import { StorageProvider } from '../../../shared/enums'
import { Image } from '../../../domain/entities'
import { FileResponseDto } from '..'

export class ImageUrlDto {
    @IsString()
    @ApiProperty(SWAGGER_PROPERTIES.URL)
    url: string

    @IsString()
    @ApiProperty(SWAGGER_PROPERTIES.ANOTHER_URL)
    anotherUrl: string
}

export class CreateImageDto {
    @ApiProperty(SWAGGER_PROPERTIES.URL)
    @Trim()
    @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
    url: string

    @ApiProperty(SWAGGER_PROPERTIES.ANOTHER_URL)
    @Trim()
    @IsOptional()
    @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
    anotherUrl?: string

    @ApiProperty(SWAGGER_PROPERTIES.MIME_TYPE)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('MIME type') })
    mimeType?: string

    @ApiProperty(SWAGGER_PROPERTIES.STORAGE_PROVIDER)
    @Trim()
    @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
    storageProvider: StorageProvider

    @ApiProperty(SWAGGER_PROPERTIES.ADMIN_ID)
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID admin') })
    adminId: number
}


export class ImageResponseDto extends FileResponseDto {
    @ApiProperty(SWAGGER_PROPERTIES.IMAGE_ID)
    imageId: number

    @ApiPropertyOptional(SWAGGER_PROPERTIES.CAPTION)
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