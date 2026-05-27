import { IsOptionalBoolean } from 'src/shared/decorators/validate'
import { CourseEnrollmentListQueryDto } from './course-enrollment-list-query.dto'

export class ExportCourseEnrollmentListOptionDto extends CourseEnrollmentListQueryDto {
  @IsOptionalBoolean('Bao gồm trường')
  includeSchool?: boolean = true

  @IsOptionalBoolean('Bao gồm giới tính')
  includeGender?: boolean = true

  @IsOptionalBoolean('Bao gồm ngày sinh')
  includeDateOfBirth?: boolean = true

  @IsOptionalBoolean('Bao gồm tên đăng nhập')
  includeUsername?: boolean = true

  @IsOptionalBoolean('Bao gồm số điện thoại phụ huynh')
  includeParentPhone?: boolean = true

  @IsOptionalBoolean('Bao gồm số điện thoại học sinh')
  includeStudentPhone?: boolean = false

  @IsOptionalBoolean('Bao gồm khối')
  includeGrade?: boolean = true

  @IsOptionalBoolean('Bao gồm năm tốt nghiệp cấp 3')
  includeHighSchoolGraduationYear?: boolean = true

  @IsOptionalBoolean('Bao gồm email')
  includeEmail?: boolean = true

  @IsOptionalBoolean('Bao gồm trạng thái hoạt động')
  includeIsActive?: boolean = true

  @IsOptionalBoolean('Bao gồm ngày tạo')
  includeCreatedAt?: boolean = true
}
