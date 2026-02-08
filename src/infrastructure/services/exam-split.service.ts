import { Injectable, Logger } from '@nestjs/common'
import { OpenAIService } from './openai.service'
import { QuestionType, Difficulty } from 'src/shared/enums'
import { SUBJECTS } from 'src/shared/constants/subjects.constant'

/**
 * Cấu trúc một đáp án trắc nghiệm
 */
export interface SplitStatement {
    content: string
    isCorrect: boolean
    order: number
    difficulty?: Difficulty | null
}

/**
 * Cấu trúc một câu hỏi sau khi tách
 */
export interface SplitQuestion {
    order: number
    part: string | null
    content: string
    type: QuestionType
    subjectId?: number | null
    correctAnswer?: string | null
    solution?: string | null
    difficulty?: Difficulty | null
    pointsOrigin?: number | null
    statements?: SplitStatement[]
}

/**
 * Kết quả trả về từ AI
 */
export interface ExamSplitResult {
    questions: SplitQuestion[]
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
}

/**
 * Service dùng OpenAI để tách câu hỏi từ rawContent đề thi
 *
 * ⚠️ Backend KHÔNG chunk, KHÔNG regex
 * ⚠️ Client chịu trách nhiệm chia nhỏ nếu cần
 */
@Injectable()
export class ExamSplitService {
    private readonly logger = new Logger(ExamSplitService.name)

    constructor(private readonly openaiService: OpenAIService) {
        this.logger.log('ExamSplitService initialized')
    }

    /**
     * Tách câu hỏi từ rawContent đề thi
     */
    async splitExam(rawContent: string): Promise<ExamSplitResult> {
        const startTime = Date.now()

        try {
            if (!rawContent || rawContent.trim().length === 0) {
                throw new Error('rawContent không được rỗng')
            }

            this.logger.log(
                `Bắt đầu tách đề thi | rawContent length=${rawContent.length}`,
            )

            const questionTypes = Object.values(QuestionType).join(', ')
            const difficulties = Object.values(Difficulty).join(', ')
            const subjects = SUBJECTS.map(s => `${s.id} - ${s.name} (${s.code})`).join(', ')

            /** SYSTEM PROMPT */
            const systemMessage = `
Bạn là AI chuyên phân tích đề thi.

MỤC TIÊU:
- Tách đề thi thành danh sách các câu hỏi độc lập.
- Mỗi câu hỏi phải được giữ đúng thứ tự xuất hiện trong đề.
- Kết quả dùng để lưu trữ và xử lý lại, KHÔNG phải để giải bài toán.

NHIỆM VỤ BẮT BUỘC:
- Tách đề thi thành danh sách câu hỏi.
- KHÔNG sửa nội dung gốc của câu hỏi.
- Không bỏ media placeholder (ví dụ: ![media:3]).
- Phân loại chính xác QuestionType, subjectId, difficulty.
- Xác định đáp án dựa trên solution (nếu có).
- KHÔNG thêm câu hỏi mới.
- KHÔNG gộp nhiều câu thành một.
- KHÔNG chia sai ranh giới câu hỏi.
- Giữ nguyên ký hiệu toán học, công thức, văn phong và media placeholder (ví dụ: ![media:3]).

----------------------------------------------------------------
XỬ LÝ BẢNG SỐ LIỆU (QUY TẮC BẮT BUỘC – RẤT QUAN TRỌNG):

Nếu trong đề có bảng số liệu, bảng tần số, bảng thống kê, bảng ghép nhóm:

1. TUYỆT ĐỐI KHÔNG sử dụng LaTeX tabular:
   - CẤM dùng \begin{tabular}, \end{tabular}, |c|c|, \hline, v.v.
   - CẤM dùng bảng LaTeX dưới mọi hình thức.

2. BẮT BUỘC chuyển bảng sang Markdown Table chuẩn (GitHub Flavored Markdown):
   - Dùng cú pháp | cột | cột |
   - Có dòng phân cách bằng ---.
   - Mỗi bảng phải độc lập, dễ render bằng react-markdown + remark-gfm.

3. KHÔNG thay đổi nội dung bảng:
   - Giữ nguyên số liệu.
   - Giữ nguyên nhãn cột, nhãn hàng.
   - Không rút gọn, không diễn giải.

4. Nếu bảng thuộc về mẫu số liệu khác nhau (ví dụ: M₁, M₂):
   - Mỗi bảng phải được trình bày riêng biệt.
   - Có tiêu đề rõ ràng ngay trước bảng (ví dụ: **M₁**, **M₂**).

Ví dụ ĐÚNG (chỉ để tham chiếu, KHÔNG thêm nội dung mới):
| Nhóm | [8;10) | [10;12) |
|------|--------|---------|
| Tần số | 3 | 4 |

----------------------------------------------------------------
SỬA LỖI KÝ HIỆU TOÁN HỌC (CHỈ SỬA LỖI OCR):

Bạn ĐƯỢC PHÉP sửa các lỗi ký hiệu toán học do OCR gây ra, NHƯNG PHẢI TUÂN THEO TẤT CẢ CÁC QUY TẮC SAU:

1. CHỈ sửa lỗi ký hiệu hiển thị, KHÔNG được biến đổi bản chất toán học.
2. Đảm bảo các biểu thức toán học nằm trong dấu $...$ hoặc $$...$$ vẫn giữ nguyên ý nghĩa.
3. KHÔNG được rút gọn biểu thức.
4. KHÔNG được tính toán.
5. KHÔNG được suy luận thêm.
6. Giữ nguyên cấu trúc biểu thức ban đầu.

Các lỗi được phép sửa (không giới hạn):
- Dấu trừ unicode (−) → dấu trừ chuẩn (-)
- Nhầm chữ O thành số 0, chữ l thành số 1
- <= → ≤ ; >= → ≥ ; != → ≠ ; ~= → ≈
- Ký tự x dùng làm phép nhân → × (CHỈ khi ngữ cảnh rõ ràng)
- Dấu phẩy / dấu chấm thập phân bị OCR sai
- lim x->a → lim_{x→a}

Nếu KHÔNG chắc chắn một ký hiệu là lỗi OCR:
→ GIỮ NGUYÊN, KHÔNG SỬA.

----------------------------------------------------------------
PHÂN LOẠI CÂU HỎI (QuestionType):
- ${questionTypes}

QUY TẮC PHÂN LOẠI:
- ${QuestionType.SINGLE_CHOICE} / ${QuestionType.MULTIPLE_CHOICE} / ${QuestionType.TRUE_FALSE}:
  + Phải có danh sách statements.
- ${QuestionType.SHORT_ANSWER} / ${QuestionType.ESSAY}:
  + KHÔNG có statements.

Nếu không xác định được loại câu hỏi:
→ Chọn loại phù hợp nhất, KHÔNG tạo loại mới.

----------------------------------------------------------------
PHÂN LOẠI MÔN HỌC (subjectId):
Danh sách môn học:
${subjects}

QUY TẮC PHÂN LOẠI MÔN HỌC:
- Dựa vào nội dung câu hỏi, xác định môn học phù hợp.
- Chỉ sử dụng các subjectId trong danh sách trên.
- Nếu không xác định được môn học chính xác → subjectId = null.
- KHÔNG tự tạo môn học mới.
- Ưu tiên phân loại dựa trên:
  + Thuật ngữ chuyên môn trong câu hỏi
  + Công thức toán học, hóa học, vật lý
  + Ngữ cảnh và kiến thức liên quan

Ví dụ phân loại:
- Câu hỏi có phương trình, đạo hàm, tích phân → subjectId = 1 (Toán học)
- Câu hỏi về lực, vận tốc, điện từ → subjectId = 2 (Vật lý)
- Câu hỏi về phản ứng hóa học, nguyên tố → subjectId = 3 (Hóa học)
- Câu hỏi về tế bào, gen, sinh thái → subjectId = 4 (Sinh học)
- Câu hỏi về văn học, tác phẩm, thơ ca → subjectId = 5 (Ngữ văn)
- Câu hỏi tiếng Anh, grammar, vocabulary → subjectId = 6 (Tiếng Anh)
- Câu hỏi về sự kiện lịch sử, niên đại → subjectId = 7 (Lịch sử)
- Câu hỏi về địa hình, khí hậu, quốc gia → subjectId = 8 (Địa lý)

----------------------------------------------------------------
ĐỘ KHÓ (Difficulty):
- ${difficulties}
- Nếu không xác định được → difficulty = null.

----------------------------------------------------------------
XÁC ĐỊNH ĐÁP ÁN (QUY TẮC BẮT BUỘC – TUYỆT ĐỐI TUÂN THỦ):

NGUYÊN TẮC TỔNG QUÁT:
- solution (lời giải) là NGUỒN DUY NHẤT để xác định đáp án.
- TUYỆT ĐỐI KHÔNG suy luận, KHÔNG đoán, KHÔNG bịa đáp án.

CHI TIẾT THEO LOẠI CÂU HỎI:

1. Với SHORT_ANSWER hoặc ESSAY:
   - Nếu solution tồn tại VÀ trong solution có nêu rõ kết quả cuối cùng:
     → điền correctAnswer đúng theo solution.
   - Nếu solution KHÔNG tồn tại hoặc KHÔNG nêu rõ kết quả:
     → correctAnswer = null.

2. Với SINGLE_CHOICE hoặc MULTIPLE_CHOICE:
   - Nếu solution tồn tại VÀ solution chỉ rõ đáp án đúng:
     → với mỗi statement:
         - isCorrect = true nếu statement được xác định là đúng trong solution.
         - isCorrect = false cho các statement còn lại.
   - Nếu solution KHÔNG tồn tại:
     → TẤT CẢ statements phải có isCorrect = false.

CÁC HÀNH VI BỊ CẤM:
- KHÔNG tự giải toán.
- KHÔNG dựa vào kiến thức bên ngoài.
- KHÔNG chọn đáp án theo “có vẻ đúng”.
- KHÔNG điền correctAnswer hoặc isCorrect khi solution không đủ thông tin.

NGUYÊN TẮC AN TOÀN:
→ Thiếu thông tin thì để null hoặc false. KHÔNG BỊA.

----------------------------------------------------------------
OUTPUT JSON FORMAT (BẮT BUỘC – PHẢI ĐÚNG CHÍNH XÁC):

{
  "questions": [
    {
      "order": number,
      "part": string | null,
      "content": string,
      "type": "${questionTypes}",
      "subjectId": number | null,
      "correctAnswer": string | null,
      "solution": string | null,
      "difficulty": "${difficulties}" | null,
      "pointsOrigin": number | null,
      "statements": [
        {
          "content": string,
          "isCorrect": boolean,
          "order": number,
          "difficulty": "${difficulties}" | null
        }
      ]
    }
  ]
}

----------------------------------------------------------------
YÊU CẦU CUỐI CÙNG:
- CHỈ trả về JSON thuần.
- KHÔNG markdown.
- KHÔNG giải thích.
- KHÔNG text thừa.
`

            /** USER PROMPT */
            const userMessage = `
RAW EXAM CONTENT:
<<<
${rawContent}
>>>
`

            this.logger.log('Gửi rawContent sang OpenAI')

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

            const responseText = completion.choices[0]?.message?.content || ''

            const result = this.parseResponse(responseText)

            // Thêm usage information
            if (completion.usage) {
                result.usage = {
                    promptTokens: completion.usage.prompt_tokens,
                    completionTokens: completion.usage.completion_tokens,
                    totalTokens: completion.usage.total_tokens,
                }
            }

            this.validateResult(result)

            this.logger.log(
                `Tách đề thi thành công | questions=${result.questions.length} | time=${Date.now() - startTime}ms`,
            )

            return result
        } catch (error: any) {
            this.logger.error(
                `Lỗi khi tách đề thi (${Date.now() - startTime}ms): ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    /**
     * Parse JSON trả về từ OpenAI
     */
    private parseResponse(text: string): ExamSplitResult {
        try {
            let cleaned = text.trim()

            // Trường hợp AI trả markdown
            if (cleaned.startsWith('```')) {
                cleaned = cleaned
                    .replace(/^```json?\n?/, '')
                    .replace(/\n?```$/, '')
            }

            // Trường hợp AI nói thừa trước JSON
            const jsonStart = cleaned.indexOf('{')
            if (jsonStart > 0) {
                cleaned = cleaned.slice(jsonStart)
            }

            return JSON.parse(cleaned) as ExamSplitResult
        } catch (error: any) {
            this.logger.error('Không parse được JSON từ AI')
            this.logger.debug(text.slice(0, 500))
            throw new Error('AI trả về JSON không hợp lệ')
        }
    }

    /**
     * Validate kết quả từ AI
     */
    private validateResult(result: ExamSplitResult): void {
        if (!Array.isArray(result.questions) || result.questions.length === 0) {
            throw new Error('Kết quả không hợp lệ: không có câu hỏi')
        }

        const orders = new Set<number>()

        result.questions.forEach((q, index) => {
            orders.add(q.order)

            // content
            if (!q.content || typeof q.content !== 'string') {
                throw new Error(`Question ${index}: content không hợp lệ`)
            }

            // type
            if (!Object.values(QuestionType).includes(q.type)) {
                throw new Error(`Question ${index}: type không hợp lệ`)
            }

            const isChoice =
                q.type === QuestionType.SINGLE_CHOICE ||
                q.type === QuestionType.MULTIPLE_CHOICE ||
                q.type === QuestionType.TRUE_FALSE

            if (isChoice) {
                if (!Array.isArray(q.statements) || q.statements.length === 0) {
                    throw new Error(
                        `Question ${index}: trắc nghiệm phải có statements`,
                    )
                }

                const correctCount = q.statements.filter((s) => s.isCorrect).length

            } else {
                if (q.statements && q.statements.length > 0) {
                    throw new Error(
                        `Question ${index}: câu hỏi tự luận không có statements`,
                    )
                }
            }

            // difficulty
            if (
                q.difficulty !== null &&
                q.difficulty !== undefined &&
                !Object.values(Difficulty).includes(q.difficulty)
            ) {
                throw new Error(`Question ${index}: difficulty không hợp lệ`)
            }

            // subjectId
            if (
                q.subjectId !== null &&
                q.subjectId !== undefined
            ) {
                const validSubjectIds = SUBJECTS.map(s => s.id)
                if (!validSubjectIds.includes(q.subjectId)) {
                    throw new Error(`Question ${index}: subjectId không hợp lệ`)
                }
            }
        })

        this.logger.log('Validate ExamSplitResult thành công')
    }
}
