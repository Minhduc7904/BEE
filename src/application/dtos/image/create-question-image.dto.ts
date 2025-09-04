import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsInt } from 'class-validator';
import { StorageProvider } from '../../../shared/enums/storage-provider.enum';
import { IsEnumValue } from '../../../shared/decorators/is-enum-value.decorator';

export class CreateQuestionImageDto {
  @ApiProperty({ 
    description: 'URL của ảnh câu hỏi',
    example: 'https://example.com/question-image.jpg'
  })
  @IsUrl({}, { message: 'URL không hợp lệ' })
  @IsString()
  url: string;

  @ApiProperty({ 
    description: 'URL phụ của ảnh (tùy chọn)',
    example: 'https://example.com/question-image-alt.jpg',
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
    description: 'Loại liên quan',
    example: 'question',
    required: false
  })
  @IsOptional()
  @IsString()
  relatedType?: string;

  @ApiProperty({ 
    description: 'ID liên quan',
    example: 123,
    required: false
  })
  @IsOptional()
  @IsInt()
  relatedId?: number;
}
