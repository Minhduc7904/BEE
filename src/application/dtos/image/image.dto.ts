// src/application/dtos/user/user-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsEmail, MaxLength, MinLength } from 'class-validator'
import { Trim } from '../../../shared/decorators/trim.decorator'
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants'
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages'

export class ImageUrlDto {
    @IsString()
    @ApiProperty(SWAGGER_PROPERTIES.URL)
    url: string

    @IsString()
    @ApiProperty(SWAGGER_PROPERTIES.ANOTHER_URL)
    anotherUrl: string
}
