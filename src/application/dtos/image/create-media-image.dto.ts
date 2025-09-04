import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsNumber } from 'class-validator';
import { StorageProvider } from '../../../shared/enums/storage-provider.enum';
import { IsEnumValue } from '../../../shared/decorators/is-enum-value.decorator';

export class CreateMediaImageDto {
  @ApiProperty({ 
    description: 'URL của ảnh media',
    example: 'https://example.com/media-image.jpg'
  })
  @IsUrl({}, { message: 'URL không hợp lệ' })
  @IsString()
  url: string;

  @ApiProperty({ 
    description: 'URL phụ của ảnh (tùy chọn)',
    example: 'https://example.com/media-image-alt.jpg',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'Another URL không hợp lệ' })
  @IsString()
  anotherUrl?: string;

  @ApiProperty({ 
    description: 'MIME type của file ảnh',
    example: 'image/jpeg',
    required: false
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ 
    description: 'Nhà cung cấp lưu trữ',
    enum: StorageProvider,
    example: StorageProvider.EXTERNAL
  })
  @IsEnumValue(StorageProvider)
  storageProvider: StorageProvider;

  @ApiProperty({
    description: 'ID của admin tạo image',
    example: 1,
  })
  @IsNumber()
  adminId: number;
}
