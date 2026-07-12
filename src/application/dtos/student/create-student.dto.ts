import { RegisterStudentDto } from '../auth/register.dto'
import { IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { StudentType } from 'src/shared/enums'

/**
 * DTO used by administrators when creating a student.
 */
export class CreateStudentDto extends RegisterStudentDto {
  @IsOptionalEnumValue(StudentType, 'Loại học sinh')
  studentType?: StudentType
}
