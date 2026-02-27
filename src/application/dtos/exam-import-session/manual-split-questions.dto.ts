// src/application/dtos/exam-import-session/manual-split-questions.dto.ts
import { IsEnum } from 'class-validator'
import { IsOptionalString, IsRequiredString } from 'src/shared/decorators/validate'
import { QuestionType } from '../../../shared/enums/question-type.enum'

/**
 * DTO đầu vào cho API tách câu hỏi thủ công
 *
 * @description Nhận nội dung thô và loại câu hỏi,
 * hệ thống tách câu hỏi theo logic tương ứng với loại đó.
 */
export class ManualSplitQuestionsDto {
  /**
   * Nội dung thô cần tách câu hỏi
   * @required
   * @example 'Câu 1: Thủ đô Việt Nam là gì?\nA. Hà Nội\nB. TP.HCM\n...'
   */
  @IsRequiredString('Nội dung thô')
  rawContent: string

  /**
   * Loại câu hỏi cần tách
   * @required
   * @example QuestionType.SINGLE_CHOICE
   */
  @IsEnum(QuestionType)
  questionType: QuestionType

  /**
   * Chuỗi đáp án cách nhau bởi dấu cách, tương ứng thứ tự từng câu hỏi.
   *
   * - SINGLE_CHOICE / MULTIPLE_CHOICE: mỗi token là chữ cái (hoa/thường) hoặc tổ hợp
   *   biểu thị đáp án đúng. Ví dụ: 'A B C AB D' → câu 4 có 2 đáp án đúng (A, B).
   *
   * - TRUE_FALSE: mỗi token là chuỗi ký tự Đ/đ/D/d (= Đúng) và S/s (= Sai)
   *   theo thứ tự các mệnh đề a, b, c, d, …
   *   Ví dụ: 'ĐSĐs ĐSss' → câu 1: a=Đúng b=Sai c=Đúng d=Sai; câu 2: a=Đúng b=Sai c=Sai d=Sai.
   *
   * @optional
   * @example 'A B C D A C D B'
   */
  @IsOptionalString('Đáp án')
  answers?: string
}
