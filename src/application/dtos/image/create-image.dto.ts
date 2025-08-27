import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUrl, IsInt } from 'class-validator';
import { StorageProvider } from '@prisma/client';

export class CreateImageDto {
  @ApiProperty({ 
    description: 'URL của ảnh',
    example: 'https://example.com/image.jpg'
  })
  @IsUrl({}, { message: 'URL không hợp lệ' })
  @IsString()
  url: string;

  @ApiProperty({ 
    description: 'URL phụ của ảnh (tùy chọn)',
    example: 'https://example.com/image-alt.jpg',
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
  @IsEnum(StorageProvider)
  storageProvider: StorageProvider;

  @ApiProperty({ 
    description: 'ID admin tạo ảnh',
    example: 1,
  })
  @IsInt()
  adminId: number;
}
