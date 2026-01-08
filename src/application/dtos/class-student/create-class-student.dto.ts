import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateClassStudentDto {
  @IsInt({ message: 'ID lớp học phải là số nguyên' })
  @Min(1, { message: 'ID lớp học phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID lớp học không được để trống' })
  classId: number;

  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  @Min(1, { message: 'ID học sinh phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID học sinh không được để trống' })
  studentId: number;
}
