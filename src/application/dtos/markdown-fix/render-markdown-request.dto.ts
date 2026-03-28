import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class RenderMarkdownRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'content không được để trống' })
  @MaxLength(100000, { message: 'content không được vượt quá 100.000 ký tự' })
  content: string

  @IsOptional()
  @IsBoolean()
  allowRawHtml?: boolean = true

  @IsOptional()
  @IsBoolean()
  breaks?: boolean = true
}
