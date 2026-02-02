import { Injectable, Logger } from '@nestjs/common'
import { OpenAIService } from './openai.service'
import { CHAPTERS, getChaptersBySubject } from 'src/shared/constants/chapters.constant'
import { Difficulty } from 'src/shared/enums/difficulty.enum'

/**
 * Input: question với content và statements
 */
export interface QuestionToClassify {
    questionId: number
    subjectId: number | null
    content: string
    statements?: Array<{
        content: string
    }>
}

/**
 * Output: mapping giữa questionId, chapterIds, grade và difficulty được AI phân loại
 */
export interface QuestionChapterMapping {
    questionId: number
    chapterIds: number[]
    grade: number | null // Grade được AI phân loại (1-12), null nếu không xác định được
    difficulty: Difficulty | null // Difficulty được AI phân loại (NB/TH/VD/VDC), null nếu không xác định được
}

/**
 * Kết quả trả về từ service
 */
export interface ClassificationResult {
    mappings: QuestionChapterMapping[]
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
}

/**
 * Service sử dụng OpenAI để phân loại chapter cho các câu hỏi
 * Chỉ phân loại câu hỏi có subjectId
 * Chỉ phân loại với chapters thuộc subject của câu hỏi
 */
@Injectable()
export class QuestionChapterClassificationService {
    private readonly logger = new Logger(QuestionChapterClassificationService.name)

    constructor(private readonly openaiService: OpenAIService) {
        this.logger.log('QuestionChapterClassificationService initialized')
    }

    /**
     * Phân loại chapters cho một mảng câu hỏi
     */
    async classifyQuestions(questions: QuestionToClassify[]): Promise<ClassificationResult> {
        const startTime = Date.now()

        try {
            if (!questions || questions.length === 0) {
                throw new Error('Danh sách câu hỏi không được rỗng')
            }

            // Lọc chỉ lấy câu hỏi có subjectId
            const questionsWithSubject = questions.filter(q => q.subjectId !== null && q.subjectId !== undefined)

            if (questionsWithSubject.length === 0) {
                this.logger.log('Không có câu hỏi nào có subjectId, bỏ qua phân loại')
                return {
                    mappings: questions.map(q => ({ questionId: q.questionId, chapterIds: [], grade: null, difficulty: null })),
                    usage: {
                        promptTokens: 0,
                        completionTokens: 0,
                        totalTokens: 0,
                    },
                }
            }

            this.logger.log(
                `Bắt đầu phân loại chapter cho ${questionsWithSubject.length} câu hỏi`,
            )

            // Nhóm câu hỏi theo subjectId để xử lý batch cho mỗi subject
            const questionsBySubject = this.groupQuestionsBySubject(questionsWithSubject)

            const allMappings: QuestionChapterMapping[] = []
            let totalUsage = {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
            }

            // Xử lý từng subject một
            for (const [subjectId, subjectQuestions] of Object.entries(questionsBySubject)) {
                const result = await this.classifyQuestionsForSubject(
                    parseInt(subjectId),
                    subjectQuestions,
                )

                allMappings.push(...result.mappings)

                if (result.usage) {
                    totalUsage.promptTokens += result.usage.promptTokens
                    totalUsage.completionTokens += result.usage.completionTokens
                    totalUsage.totalTokens += result.usage.totalTokens
                }
            }

            this.logger.log(
                `Phân loại thành công ${allMappings.length} câu hỏi | time=${Date.now() - startTime}ms`,
            )

            return {
                mappings: allMappings,
                usage: totalUsage,
            }
        } catch (error: any) {
            this.logger.error(
                `Lỗi khi phân loại chapters (${Date.now() - startTime}ms): ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    /**
     * Nhóm câu hỏi theo subjectId
     */
    private groupQuestionsBySubject(
        questions: QuestionToClassify[],
    ): Record<number, QuestionToClassify[]> {
        const grouped: Record<number, QuestionToClassify[]> = {}

        for (const question of questions) {
            const subjectId = question.subjectId!
            if (!grouped[subjectId]) {
                grouped[subjectId] = []
            }
            grouped[subjectId].push(question)
        }

        return grouped
    }

    /**
     * Phân loại chapters cho các câu hỏi của một subject
     */
    private async classifyQuestionsForSubject(
        subjectId: number,
        questions: QuestionToClassify[],
    ): Promise<ClassificationResult> {
        // Lấy danh sách chapters của subject này
        const availableChapters = getChaptersBySubject(subjectId)

        if (availableChapters.length === 0) {
            this.logger.warn(`Subject ${subjectId} không có chapters, bỏ qua`)
            return {
                mappings: questions.map(q => ({ questionId: q.questionId, chapterIds: [], grade: null, difficulty: null })),
            }
        }

        // Build chapter info string - bao gồm grade từ chapter code
        const chaptersInfo = availableChapters
            .map(c => {
                const parentInfo = c.parentChapterId
                    ? ` (thuộc chương ${availableChapters.find(p => p.id === c.parentChapterId)?.name})`
                    : ''
                // Extract grade from chapter code (e.g., "10C1" -> grade 10)
                const gradeFromCode = c.code ? parseInt(c.code.substring(0, 2)) : null
                const gradeInfo = gradeFromCode ? ` [Lớp ${gradeFromCode}]` : ''
                return `${c.id} - ${c.name}${parentInfo} - Level ${c.level}${gradeInfo}`
            })
            .join('\n')

        // Build questions info string
        const questionsInfo = questions
            .map(q => {
                const statementsText = q.statements && q.statements.length > 0
                    ? '\nCác đáp án:\n' + q.statements.map((s, i) => `  ${String.fromCharCode(65 + i)}. ${s.content}`).join('\n')
                    : ''
                return `Question ID: ${q.questionId}\nNội dung: ${q.content}${statementsText}`
            })
            .join('\n\n---\n\n')

        /** SYSTEM PROMPT */
        const systemMessage = `
Bạn là AI chuyên phân loại câu hỏi theo chương học, cấp lớp và độ khó.

MỤC TIÊU:
- Phân tích nội dung câu hỏi và các đáp án (nếu có).
- Xác định các chương học phù hợp với câu hỏi.
- Xác định cấp lớp (grade) phù hợp với câu hỏi (từ 1 đến 12).
- Xác định độ khó (difficulty) của câu hỏi.
- Một câu hỏi có thể thuộc nhiều chương.

QUY TẮC PHÂN LOẠI CHƯƠNG:
1. CHỈ sử dụng các chapterIds trong danh sách được cung cấp.
2. KHÔNG tự tạo chương mới.
3. Dựa vào:
   - Kiến thức, thuật ngữ, khái niệm trong nội dung câu hỏi
   - Nội dung các đáp án (nếu có)
   - Công thức, định lý, phương pháp giải
4. Ưu tiên chọn cả chương cha và chương con nếu hợp lý.
5. Ưu tiên chọn chương con (level 1) hơn chương cha (level 0).
6. Nếu không chắc chắn về chương → để mảng rỗng [].
7. KHÔNG đoán, KHÔNG bịa chương.

QUY TẮC PHÂN LOẠI GRADE:
1. Xác định cấp lớp dựa trên:
   - Độ khó của câu hỏi
   - Kiến thức yêu cầu (cơ bản hay nâng cao)
   - Các chương đã được chọn (chương có thông tin [Lớp X])
   - Thuật ngữ, công thức trong nội dung
2. Ưu tiên lấy grade từ chapter code nếu đã chọn chapter.
3. Nếu chọn nhiều chapter có grade khác nhau → chọn grade phù hợp nhất.
4. Nếu không chọn chapter nào hoặc không chắc chắn → grade = null.
5. Grade hợp lệ: số nguyên từ 1 đến 12 hoặc null.

QUY TẮC PHÂN LOẠI DIFFICULTY:
1. Difficulty có 4 mức độ (CHỈ được dùng các giá trị này):
   - "NB" (Nhận biết): Câu hỏi yêu cầu ghi nhớ, nhận dạng kiến thức cơ bản
   - "TH" (Thông hiểu): Câu hỏi yêu cầu hiểu và giải thích kiến thức
   - "VD" (Vận dụng): Câu hỏi yêu cầu áp dụng kiến thức vào tình huống quen thuộc
   - "VDC" (Vận dụng cao): Câu hỏi yêu cầu tổng hợp, sáng tạo, giải quyết vấn đề phức tạp
2. Dựa vào:
   - Mức độ tư duy cần thiết để giải câu hỏi
   - Số bước giải, độ phức tạp của lời giải
   - Yêu cầu tổng hợp nhiều kiến thức hay không
   - Có yêu cầu phân tích, sáng tạo hay không
3. Nếu phân vân giữa 2 mức → chọn mức thấp hơn.
4. Nếu HOÀN TOÀN không chắc chắn → difficulty = null.
5. TUYỆT ĐỐI KHÔNG bịa, không đoán khi không chắc.
6. Difficulty hợp lệ: "NB", "TH", "VD", "VDC" hoặc null.

DANH SÁCH CHAPTERS CỦA MÔN HỌC:
${chaptersInfo}

OUTPUT JSON FORMAT (BẮT BUỘC):
{
  "mappings": [
    {
      "questionId": number,
      "chapterIds": number[],
      "grade": number | null,
      "difficulty": "NB" | "TH" | "VD" | "VDC" | null
    }
  ]
}

YÊU CẦU:
- CHỈ trả về JSON thuần.
- KHÔNG markdown.
- KHÔNG giải thích.
- KHÔNG text thừa.
- Phải có mapping cho TẤT CẢ câu hỏi trong input.
- grade phải là số từ 1-12 hoặc null.
- difficulty phải là "NB", "TH", "VD", "VDC" hoặc null.
`

        /** USER PROMPT */
        const userMessage = `
DANH SÁCH CÂU HỎI CẦN PHÂN LOẠI:

${questionsInfo}
`

        this.logger.log(`Gửi ${questions.length} câu hỏi sang OpenAI để phân loại chapters`)

        const completion = await this.openaiService.createChatCompletion(
            [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage },
            ],
            {
                temperature: 0,
                maxTokens: 4096,
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

        this.validateResult(result, questions, availableChapters.map(c => c.id))

        return result
    }

    /**
     * Parse JSON trả về từ OpenAI
     */
    private parseResponse(text: string): ClassificationResult {
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

            return JSON.parse(cleaned) as ClassificationResult
        } catch (error: any) {
            this.logger.error('Không parse được JSON từ AI')
            this.logger.debug(text.slice(0, 500))
            throw new Error('AI trả về JSON không hợp lệ')
        }
    }

    /**
     * Validate kết quả từ AI
     */
    private validateResult(
        result: ClassificationResult,
        inputQuestions: QuestionToClassify[],
        validChapterIds: number[],
    ): void {
        if (!Array.isArray(result.mappings)) {
            throw new Error('Kết quả không hợp lệ: mappings phải là array')
        }

        // Kiểm tra có đủ mapping cho tất cả câu hỏi
        const inputQuestionIds = new Set(inputQuestions.map(q => q.questionId))
        const resultQuestionIds = new Set(result.mappings.map(m => m.questionId))

        for (const qid of inputQuestionIds) {
            if (!resultQuestionIds.has(qid)) {
                this.logger.warn(`Question ${qid} không có mapping, thêm mapping rỗng`)
                result.mappings.push({ questionId: qid, chapterIds: [], grade: null, difficulty: null })
            }
        }

        // Validate từng mapping
        const validChapterIdSet = new Set(validChapterIds)

        result.mappings.forEach((mapping, index) => {
            if (typeof mapping.questionId !== 'number') {
                throw new Error(`Mapping ${index}: questionId không hợp lệ`)
            }

            if (!Array.isArray(mapping.chapterIds)) {
                throw new Error(`Mapping ${index}: chapterIds phải là array`)
            }

            // Kiểm tra chapterIds có hợp lệ không
            for (const chapterId of mapping.chapterIds) {
                if (!validChapterIdSet.has(chapterId)) {
                    this.logger.warn(
                        `Question ${mapping.questionId}: chapterId ${chapterId} không hợp lệ, loại bỏ`,
                    )
                    mapping.chapterIds = mapping.chapterIds.filter(id => id !== chapterId)
                }
            }

            // Validate grade
            if (mapping.grade !== null && mapping.grade !== undefined) {
                if (typeof mapping.grade !== 'number' || mapping.grade < 1 || mapping.grade > 12) {
                    this.logger.warn(
                        `Question ${mapping.questionId}: grade ${mapping.grade} không hợp lệ (phải từ 1-12), set null`,
                    )
                    mapping.grade = null
                }
            } else {
                mapping.grade = null
            }

            // Validate difficulty
            if (mapping.difficulty !== null && mapping.difficulty !== undefined) {
                const validDifficulties = [Difficulty.NB, Difficulty.TH, Difficulty.VD, Difficulty.VDC]
                if (!validDifficulties.includes(mapping.difficulty as Difficulty)) {
                    this.logger.warn(
                        `Question ${mapping.questionId}: difficulty "${mapping.difficulty}" không hợp lệ (phải là NB/TH/VD/VDC), set null`,
                    )
                    mapping.difficulty = null
                }
            } else {
                mapping.difficulty = null
            }
        })

        this.logger.log('Validate ClassificationResult thành công')
    }
}
