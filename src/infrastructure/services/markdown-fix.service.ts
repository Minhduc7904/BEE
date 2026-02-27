import { Injectable, Logger } from '@nestjs/common'
import { OpenAIService } from './openai.service'

/**
 * Kết quả sửa chính tả markdown
 */
export interface MarkdownFixResult {
    fixedContent: string
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
}

/**
 * MarkdownFixService
 *
 * Dùng OpenAI để sửa chính tả và ngữ pháp trong đoạn Markdown,
 * bảo toàn toàn bộ ký hiệu toán học ($...$ / $$...$$), media placeholder,
 * bảng Markdown, định dạng tiêu đề, danh sách, v.v.
 */
@Injectable()
export class MarkdownFixService {
    private readonly logger = new Logger(MarkdownFixService.name)

    constructor(private readonly openaiService: OpenAIService) {
        this.logger.log('MarkdownFixService initialized')
    }

    /**
     * Sửa chính tả và ngữ pháp đoạn Markdown
     * @param content Nội dung Markdown cần sửa
     * @returns Nội dung đã được sửa
     */
    async fixMarkdown(content: string): Promise<MarkdownFixResult> {
        const startTime = Date.now()

        try {
            if (!content || content.trim().length === 0) {
                throw new Error('content không được rỗng')
            }

            this.logger.log(`Bắt đầu sửa chính tả markdown | length=${content.length}`)

            /** SYSTEM PROMPT */
            const systemMessage = `
Bạn là AI chuyên sửa chính tả và ngữ pháp tiếng Việt trong văn bản Markdown giáo dục.

================================================================
MỤC TIÊU:

* Sửa lỗi chính tả, ngữ pháp, dấu câu trong văn bản thuần túy.
* Sửa cả các ký hiệu toán học nếu bị sai do lỗi nhập liệu hoặc OCR.
* Tự động thêm $...$ hoặc $$...$$ nếu phát hiện biểu thức toán học chưa được bao bởi ký hiệu LaTeX.
* Trả về đúng định dạng Markdown gốc, KHÔNG thay đổi cấu trúc.

================================================================
QUY TẮC BẮT BUỘC – TUYỆT ĐỐI TUÂN THỦ:

1. XỬ LÝ CÔNG THỨC TOÁN HỌC:

   * Nếu biểu thức toán học đã nằm trong $...$ hoặc $$...$$ → KHÔNG thêm hoặc xóa dấu $.
   * Nếu phát hiện biểu thức toán học rõ ràng nhưng CHƯA có $ hoặc $$ → tự động thêm:
     * Biểu thức inline → bao bằng $...$.
     * Biểu thức riêng một dòng hoặc nhiều dòng → bao bằng $$...$$.
   * KHÔNG được rút gọn, tính toán hoặc diễn giải biểu thức.
   * Chỉ sửa các lỗi ký hiệu rõ ràng do nhập sai hoặc OCR.
   * Nếu không chắc chắn có phải biểu thức toán hay không → GIỮ NGUYÊN.

2. BẢO TOÀN MEDIA PLACEHOLDER:

   * Giữ nguyên tất cả placeholder dạng ![media:ID], ![image:ID], v.v.
   * KHÔNG di chuyển, xóa hoặc sửa đổi placeholder.

3. BẢO TOÀN CẤU TRÚC MARKDOWN:

   * Giữ nguyên tiêu đề (#, ##, ###…), danh sách (-, *, 1.…), blockquote (>).
   * Giữ nguyên bảng Markdown (| cột | cột |).
   * Giữ nguyên code block (\`\`\` ... \`\`\`) và inline code (\`...\`).
   * Giữ nguyên link [text](url) và hình ảnh ![alt](url).
   * Giữ nguyên định dạng **bold**, _italic_, v.v.

4. CHỈ SỬA VĂN BẢN THUẦN:

   * Sửa lỗi chính tả tiếng Việt (sai dấu, sai vần, sai âm).
   * Sửa lỗi ngữ pháp (thiếu chủ ngữ, vị ngữ, sai cấu trúc câu).
   * Sửa lỗi dấu câu (., !, ?, … thừa/thiếu hoặc sai vị trí).
   * Chuẩn hóa khoảng trắng (xóa khoảng trắng đầu/cuối dòng, xóa khoảng trắng thừa giữa các từ).
   * KHÔNG viết lại câu, KHÔNG thêm hoặc bớt nội dung, KHÔNG thay đổi từ đã đúng.

5. SỬA LỖI KÝ HIỆU TOÁN HỌC DO OCR (CHỈ SỬA LỖI HIỂN THỊ):

   * Dấu trừ Unicode (−) → dấu trừ chuẩn (-).
   * <= → \\leq ; >= → \\geq ; != → \\neq.
   * Chữ O bị nhầm thành số 0, chữ l bị nhầm thành số 1 (chỉ khi ngữ cảnh rõ ràng).
   * Sửa các ký hiệu toán học sai rõ ràng (ví dụ: thiếu dấu ngoặc, sai ký hiệu chuẩn) nếu có thể xác định chắc chắn.
   * Nếu KHÔNG chắc chắn → GIỮ NGUYÊN.

================================================================
OUTPUT:

* Trả về ĐÚNG NỘI DUNG MARKDOWN đã sửa.
* KHÔNG thêm giải thích, tiêu đề, chú thích, hay markdown code block bao ngoài.
* KHÔNG thêm \`\`\`markdown hay \`\`\` bao quanh output.
* KHÔNG thêm hoặc giữ lại các ký tự phân cách <<<, >>> trong output.
* KHÔNG dùng HTML entity: viết thẳng ký tự gốc thay vì mã HTML:
  * Dùng < thay vì &lt;
  * Dùng > thay vì &gt;
  * Dùng & thay vì &amp;
* Nếu không có lỗi nào → trả về nguyên văn bản gốc.
`

            /** USER PROMPT */
            const userMessage = `
Hãy sửa chính tả và ngữ pháp đoạn Markdown sau, tuân theo đúng các quy tắc đã cho.
Nội dung được phân cách bằng <<< và >>> chỉ để đánh dấu ranh giới — KHÔNG đưa <<< hay >>> vào output.

<<<
${content}
>>>
`

            this.logger.log('Gửi content sang OpenAI để sửa chính tả')

            const completion = await this.openaiService.createChatCompletion(
                [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userMessage },
                ],
                {
                    temperature: 0,
                    maxTokens: 16384,
                    model: 'gpt-4o',
                },
            )

            const rawFixed = completion.choices[0]?.message?.content?.trim() || content

            // Post-process: thay HTML entities sang ký tự gốc phòng trường hợp AI vẫn sinh ra
            const fixedContent = rawFixed
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')

            const result: MarkdownFixResult = { fixedContent }

            if (completion.usage) {
                result.usage = {
                    promptTokens: completion.usage.prompt_tokens,
                    completionTokens: completion.usage.completion_tokens,
                    totalTokens: completion.usage.total_tokens,
                }
            }

            this.logger.log(
                `Sửa chính tả thành công | time=${Date.now() - startTime}ms | tokens=${result.usage?.totalTokens ?? 'N/A'}`,
            )

            return result
        } catch (error: any) {
            this.logger.error(
                `Lỗi khi sửa chính tả markdown (${Date.now() - startTime}ms): ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
