// src/application/dtos/user/update-avatar.dto.ts
import { ApiProperty } from '@nestjs/swagger'

export class UpdateAvatarResponseDto {
  @ApiProperty({
    description: 'Avatar ID trong database',
    example: 1
  })
  avatarId: number

  @ApiProperty({
    description: 'URL của avatar',
    example: 'https://your-supabase.supabase.co/storage/v1/object/public/bee-storage/avatars/avatar_123456.jpg'
  })
  avatarUrl: string

  @ApiProperty({
    description: 'Tên file avatar',
    example: 'avatar_123456.jpg'
  })
  fileName: string

  @ApiProperty({
    description: 'Kích thước file (bytes)',
    example: 204800
  })
  fileSize: number
}