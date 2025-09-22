import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { SWAGGER_PROPERTIES } from '../../../shared/constants'
import { StorageProvider } from '../../../shared/enums'

export class FileResponseDto {

    @ApiPropertyOptional(SWAGGER_PROPERTIES.ADMIN_ID)
    adminId?: number

    @ApiProperty(SWAGGER_PROPERTIES.URL)
    url: string

    @ApiPropertyOptional(SWAGGER_PROPERTIES.ANOTHER_URL)
    anotherUrl?: string

    @ApiPropertyOptional(SWAGGER_PROPERTIES.MIME_TYPE)
    mimeType?: string

    @ApiProperty(SWAGGER_PROPERTIES.STORAGE_PROVIDER)
    storageProvider: StorageProvider

    @ApiProperty(SWAGGER_PROPERTIES.CREATED_AT)
    createdAt: Date

    @ApiProperty(SWAGGER_PROPERTIES.UPDATED_AT)
    updatedAt: Date
}