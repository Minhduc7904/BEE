import { IsOptionalBoolean, IsRequiredIdNumber } from 'src/shared/decorators/validate'

export class ExportClassStudentListOptionDto {
  @IsRequiredIdNumber('ID lớp học')
  classId: number

  @IsOptionalBoolean('Bao gồm số điện thoại học sinh')
  includeStudentPhone?: boolean = false

  @IsOptionalBoolean('Bao gồm số điện thoại phụ huynh')
  includeParentPhone?: boolean = true

  @IsOptionalBoolean('Bao gồm trường')
  includeSchool?: boolean = true

  @IsOptionalBoolean('Bao gồm giới tính')
  includeGender?: boolean = true

  @IsOptionalBoolean('Bao gồm ngày sinh')
  includeDateOfBirth?: boolean = true

  @IsOptionalBoolean('Bao gồm email')
  includeEmail?: boolean = true
}
