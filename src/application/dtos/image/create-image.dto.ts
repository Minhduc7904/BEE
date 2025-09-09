import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsInt } from 'class-validator';
import { StorageProvider } from '../../../shared/enums/storage-provider.enum';
import { IsEnumValue } from '../../../shared/decorators/is-enum-value.decorator';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class CreateImageDto {
  @ApiProperty({ 
    description: 'URL của ảnh',
    example: 'https://example.com/image.jpg'
  })
  @Trim()
  @IsUrl({}, { message: 'URL không hợp lệ' })
  @IsString()
  url: string;

  @ApiProperty({ 
    description: 'URL phụ của ảnh (tùy chọn)',
    example: 'https://example.com/image-alt.jpg',
    required: false
  })
  @Trim()
  @IsOptional()
  @IsUrl({}, { message: 'Another URL không hợp lệ' })
  @IsString()
  anotherUrl?: string;

  @ApiProperty({ 
    description: 'MIME type của file ảnh',
    example: 'image/jpeg',
    required: false
  })
  @Trim()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ 
    description: 'Nhà cung cấp lưu trữ',
    enum: StorageProvider,
    example: StorageProvider.EXTERNAL
  })
  @Trim()
  @IsEnumValue(StorageProvider)
  storageProvider: StorageProvider;

  @ApiProperty({ 
    description: 'ID admin tạo ảnh',
    example: 1,
  })
  @IsInt()
  adminId: number;
}
