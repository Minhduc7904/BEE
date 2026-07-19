import { Injectable } from '@nestjs/common'
import { ExcelColumn, ExcelService } from '../../../infrastructure/services/excel.service'
import { PrismaService } from '../../../prisma/prisma.service'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ExportClassStudentListOptionDto } from '../../dtos/class-student/export-class-student-list-option.dto'

@Injectable()
export class ExportClassStudentListUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelService,
  ) { }

  async execute(options: ExportClassStudentListOptionDto): Promise<{ buffer: Buffer; filename: string }> {
    // Select only columns rendered in the spreadsheet; no pagination/count query is needed for an export.
    const courseClass = await this.prisma.courseClass.findUnique({
      where: { classId: options.classId },
      select: {
        classId: true,
        className: true,
        course: {
          select: {
            code: true,
            title: true,
          },
        },
        classStudents: {
          where: {
            student: {
              user: {
                isActive: true,
              },
            },
          },
          select: {
            student: {
              select: {
                studentId: true,
                studentPhone: true,
                parentPhone: true,
                school: true,
                grade: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    gender: true,
                    dateOfBirth: true,
                  },
                },
              },
            },
          },
          orderBy: {
            studentId: 'asc',
          },
        },
      },
    })

    if (!courseClass) {
      throw new NotFoundException('Không tìm thấy lớp học')
    }

    if (!courseClass.classStudents.length) {
      throw new NotFoundException('Lớp học chưa có học sinh đang hoạt động để xuất file')
    }

    const data = courseClass.classStudents.map((classStudent, index) => {
      const student = classStudent.student
      const user = student.user

      return {
        stt: index + 1,
        className: courseClass.className,
        courseCode: courseClass.course.code,
        courseName: courseClass.course.title,
        studentCode: student.studentId,
        fullName: `${user.lastName} ${user.firstName}`.trim(),
        studentPhone: student.studentPhone ?? '',
        parentPhone: student.parentPhone ?? '',
        school: student.school ?? '',
        grade: student.grade ?? '',
        gender: this.formatGender(user.gender),
        dateOfBirth: this.formatDate(user.dateOfBirth),
        email: user.email ?? '',
      }
    })

    const buffer = await this.excelService.exportToBuffer({
      sheetName: 'Học sinh trong lớp',
      columns: this.buildColumns(options),
      data,
    })

    return {
      buffer,
      filename: `Danh_sach_hoc_sinh_lop_${courseClass.classId}_${this.formatFilenameDate(new Date())}.xlsx`,
    }
  }

  private buildColumns(options: ExportClassStudentListOptionDto): ExcelColumn[] {
    const columns: ExcelColumn[] = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Lớp học', key: 'className', width: 24 },
      { header: 'Mã khóa học', key: 'courseCode', width: 18 },
      { header: 'Khóa học', key: 'courseName', width: 30 },
      { header: 'Mã học sinh', key: 'studentCode', width: 15 },
      { header: 'Họ và tên', key: 'fullName', width: 30 },
    ]

    if (options.includeStudentPhone === true) {
      columns.push({ header: 'SĐT học sinh', key: 'studentPhone', width: 18 })
    }
    if (options.includeParentPhone !== false) {
      columns.push({ header: 'SĐT phụ huynh', key: 'parentPhone', width: 18 })
    }
    if (options.includeSchool !== false) {
      columns.push({ header: 'Trường', key: 'school', width: 28 })
    }
    columns.push({ header: 'Khối', key: 'grade', width: 10 })
    if (options.includeGender !== false) {
      columns.push({ header: 'Giới tính', key: 'gender', width: 12 })
    }
    if (options.includeDateOfBirth !== false) {
      columns.push({ header: 'Ngày sinh', key: 'dateOfBirth', width: 14 })
    }
    if (options.includeEmail !== false) {
      columns.push({ header: 'Email', key: 'email', width: 28 })
    }

    return columns
  }

  private formatGender(gender?: string | null): string {
    if (gender === 'MALE') return 'Nam'
    if (gender === 'FEMALE') return 'Nữ'
    if (gender === 'OTHER') return 'Khác'
    return ''
  }

  private formatDate(date?: Date | null): string {
    if (!date) return ''
    const value = new Date(date)
    return `${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()}`
  }

  private formatFilenameDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}_${month}_${year}_${hours}_${minutes}`
  }
}
