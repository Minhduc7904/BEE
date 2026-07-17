import type { CompetitionSubmitFeedbackAiService as CompetitionSubmitFeedbackAiServicePort } from 'src/application/interfaces/competition-submit-feedback-ai.interface'
import { Injectable, Logger } from '@nestjs/common'
import { OpenAIService } from './openai.service'

export interface CompetitionSubmitStatsForAi {
    competitionSubmitId: number
    competitionId: number
    examId: number
    studentId: number
    totalPoints: number
    maxPoints: number
    scorePercentage: number
    totals: {
        total: number
        correct: number
        incorrect: number
        unanswered: number
        ungraded: number
    }
    bySection: Array<{ key: string; label: string; counts: { total: number; correct: number; incorrect: number; unanswered: number; ungraded: number } }>
    byChapter: Array<{ key: string; label: string; counts: { total: number; correct: number; incorrect: number; unanswered: number; ungraded: number } }>
    byDifficulty: Array<{ key: string; label: string; counts: { total: number; correct: number; incorrect: number; unanswered: number; ungraded: number } }>
    byQuestionType: Array<{ key: string; label: string; counts: { total: number; correct: number; incorrect: number; unanswered: number; ungraded: number } }>
}

@Injectable()
export class CompetitionSubmitFeedbackAiService {
    private readonly logger = new Logger(CompetitionSubmitFeedbackAiService.name)

    constructor(private readonly openaiService: OpenAIService) { }

    async generateFeedbackFromStatistics(stats: CompetitionSubmitStatsForAi): Promise<string> {
        const systemMessage = `Bạn là thầy Bee – một giáo viên tận tâm và tích cực. Nhiệm vụ: nhận xét bài làm học sinh dựa trên thống kê.

Yêu cầu:
- Viết tiếng Việt, giọng điệu giáo viên thân thiện, có động viên học sinh.
- Ngắn gọn, tối đa 6 dòng, dễ hiểu cho phụ huynh/học sinh.
- Xưng hô: "Thầy" - "con".
- Cấu trúc:
  1) Tổng quan (có lời khen/động viên),
  2) Điểm mạnh,
  3) Điểm cần cải thiện (nhẹ nhàng, không tiêu cực),
  4) Gợi ý học tập cụ thể.
- BẮT BUỘC nêu rõ tổng điểm theo format: "Điểm hiện tại: <totalPoints>/<maxPoints> (<scorePercentage>%)".
- Không bịa dữ liệu ngoài thống kê cung cấp.
- Nếu có câu chưa chấm (ungraded > 0) thì ghi rõ đó là câu chưa chấm tự luận.
- Luôn kết thúc bằng một câu động viên tích cực.`;

        const prompt = [
            'Dữ liệu thống kê bài làm:',
            JSON.stringify(stats, null, 2),
            '',
            'Thầy Bee hãy viết nhận xét theo yêu cầu trên.',
        ].join('\n')

        try {
            const text = await this.openaiService.generateText(prompt, systemMessage, {
                temperature: 0.4,
                maxTokens: 500,
                model: 'gpt-4o-mini',
            })

            return text?.trim() || 'Thầy đã nhận được bài của con. Con cố gắng luyện tập thêm nhé, thầy tin con sẽ tiến bộ nhanh!'
        } catch (error: any) {
            this.logger.warn(`Không tạo được nhận xét AI: ${error?.message || 'Unknown error'}`)
            return 'Thầy đã nhận được bài của con. Con cố gắng luyện tập thêm nhé, thầy tin con sẽ tiến bộ nhanh!'
        }
    }
}
