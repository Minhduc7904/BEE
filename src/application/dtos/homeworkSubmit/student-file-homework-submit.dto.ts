import { ArrayMinSize } from 'class-validator'
import {
  IsRequiredIdNumber,
  IsRequiredIntArray,
  IsRequiredString,
} from 'src/shared/decorators/validate'

export class SubmitStudentFileHomeworkDto {
  @IsRequiredIdNumber('ID nội dung bài tập')
  homeworkContentId: number

  @IsRequiredString('Nội dung bài làm')
  content: string

  @IsRequiredIntArray('Danh sách media')
  @ArrayMinSize(1, { message: 'Phải có ít nhất một file đính kèm' })
  mediaIds: number[]
}

export class ResubmitStudentFileHomeworkDto {
  @IsRequiredString('Nội dung bài làm')
  content: string

  @IsRequiredIntArray('Danh sách media')
  @ArrayMinSize(1, { message: 'Phải có ít nhất một file đính kèm' })
  mediaIds: number[]
}
