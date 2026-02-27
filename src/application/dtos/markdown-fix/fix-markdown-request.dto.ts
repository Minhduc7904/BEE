import { IsString, IsNotEmpty, MaxLength } from 'class-validator'

export class FixMarkdownRequestDto {
    /**
     * Nội dung Markdown cần sửa chính tả.
     * Có thể chứa ký hiệu toán học ($...$, $$...$$), bảng, danh sách.
     */
    @IsString()
    @IsNotEmpty({ message: 'content không được để trống' })
    @MaxLength(50000, { message: 'content không được vượt quá 50.000 ký tự' })
    content: string
}
