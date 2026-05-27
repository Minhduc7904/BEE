import { Inject, Injectable } from '@nestjs/common'
import type { ICourseEnrollmentRepository } from 'src/domain/repositories/course-enrollment.repository'
import { ExcelColumn, ExcelService } from '../../../infrastructure/services/excel.service'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { Gender } from '../../../shared/enums'
import { ExportCourseEnrollmentListOptionDto } from '../../dtos/course-enrollment/export-course-enrollment-list-option.dto'

@Injectable()
export class ExportCourseEnrollmentListUseCase {
  constructor(
    @Inject('ICourseEnrollmentRepository')
    private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
    private readonly excelService: ExcelService,
  ) {}

  async execute(
    options: ExportCourseEnrollmentListOptionDto,
  ): Promise<{
    buffer: Buffer
    filename: string
  }> {
    const filters = options.toCourseEnrollmentFilterOptions()
    const pagination = options.toCourseEnrollmentPaginationOptions()
    pagination.limit = 10000

    const result = await this.courseEnrollmentRepository.findAllWithPagination(pagination, filters)

    if (result.total === 0) {
      throw new NotFoundException('Không tìm thấy dữ liệu đăng ký khóa học để xuất file')
    }

    const excelData = result.data.map((enrollment, index) => {
      const student = enrollment.student
      const user = student?.user

      return {
        stt: index + 1,
        studentCode: student?.studentId || enrollment.studentId || '',
        fullName: `${user?.lastName || ''} ${user?.firstName || ''}`.trim(),
        school: student?.school || '',
        gender:
          user?.gender === Gender.MALE
            ? 'Nam'
            : user?.gender === Gender.FEMALE
              ? 'Nữ'
              : 'Khác',
        dateOfBirth: this.formatDate(user?.dateOfBirth),
        username: user?.username || '',
        parentPhone: student?.parentPhone || '',
        studentPhone: student?.studentPhone || '',
        grade: student?.grade || '',
        highSchoolGraduationYear: student?.highSchoolGraduationYear || '',
        email: user?.email || '',
        isActive: user?.isActive ? 'Hoạt động' : 'Không hoạt động',
        createdAt: this.formatDateTime(user?.createdAt),
      }
    })

    const filename = `Danh_sach_hoc_sinh_dang_ky_khoa_hoc_${this.formatDateTime(new Date()).replace(
      /[/ :]/g,
      '_',
    )}.xlsx`

    const buffer = await this.excelService.exportToBuffer({
      sheetName: 'Học sinh',
      columns: this.buildColumns(options),
      data: excelData,
    })

    return { buffer, filename }
  }

  private formatDateTime(date?: Date): string {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  private formatDate(date?: Date): string {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  private buildColumns(options: ExportCourseEnrollmentListOptionDto): ExcelColumn[] {
    const columns: ExcelColumn[] = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã học sinh', key: 'studentCode', width: 15 },
      { header: 'Họ và tên', key: 'fullName', width: 30 },
    ]

    if (options.includeStudentPhone === true) {
      columns.push({ header: 'SĐT học sinh', key: 'studentPhone', width: 15 })
    }

    if (options.includeParentPhone !== false) {
      columns.push({ header: 'SĐT phụ huynh', key: 'parentPhone', width: 15 })
    }

    if (options.includeSchool !== false) {
      columns.push({ header: 'Trường', key: 'school', width: 25 })
    }

    if (options.includeGender === true) {
      columns.push({ header: 'Giới tính', key: 'gender', width: 10 })
    }

    if (options.includeDateOfBirth === true) {
      columns.push({ header: 'Ngày sinh', key: 'dateOfBirth', width: 15 })
    }

    if (options.includeUsername !== false) {
      columns.push({ header: 'Tên đăng nhập', key: 'username', width: 20 })
    }

    if (options.includeGrade !== false) {
      columns.push({ header: 'Khối', key: 'grade', width: 10 })
    }

    if (options.includeHighSchoolGraduationYear !== false) {
      columns.push({ header: 'Năm tốt nghiệp cấp 3', key: 'highSchoolGraduationYear', width: 22 })
    }

    if (options.includeEmail !== false) {
      columns.push({ header: 'Email', key: 'email', width: 25 })
    }

    columns.push({ header: 'Trạng thái', key: 'isActive', width: 15 })

    if (options.includeCreatedAt === true) {
      columns.push({ header: 'Ngày tạo', key: 'createdAt', width: 20 })
    }

    return columns
  }
}
