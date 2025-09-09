import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsInt } from 'class-validator';
import { StorageProvider } from '../../../shared/enums/storage-provider.enum';
import { IsEnumValue } from '../../../shared/decorators/is-enum-value.decorator';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages';

export class CreateImageDto {
  @ApiProperty(SWAGGER_PROPERTIES.URL)
  @Trim()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  url: string;

  @ApiProperty(SWAGGER_PROPERTIES.ANOTHER_URL)
  @Trim()
  @IsOptional()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  anotherUrl?: string;

  @ApiProperty(SWAGGER_PROPERTIES.MIME_TYPE)
  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('MIME type') })
  mimeType?: string;

  @ApiProperty(SWAGGER_PROPERTIES.STORAGE_PROVIDER)
  @Trim()
  @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
  storageProvider: StorageProvider;

  @ApiProperty(SWAGGER_PROPERTIES.ADMIN_ID)
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID admin') })
  adminId: number;
}
