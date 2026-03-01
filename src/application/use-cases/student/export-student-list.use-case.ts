import { Injectable, Inject } from '@nestjs/common'
import type { IStudentRepository } from 'src/domain/repositories'
import { ExcelService, ExcelColumn } from '../../../infrastructure/services/excel.service'
import { ExportStudentListOptionDto } from '../../dtos/student/export-student-list-option.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { Gender } from 'src/shared/enums'

@Injectable()
export class ExportStudentListUseCase {
    constructor(
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
        private readonly excelService: ExcelService,
    ) { }

    async execute(
        options: ExportStudentListOptionDto,
    ): Promise<{
        buffer: Buffer
        filename: string
    }> {
        const filters = options.toStudentFilterOptions()
        const pagination = options.toStudentPaginationOptions()
        pagination.limit = 10000 // override limit để xuất tối đa 1000 học sinh, tránh tình trạng quá tải khi export với limit nhỏ
        const result = await this.studentRepository.findByFilters(filters, pagination)

        if (result.total === 0) {
            throw new NotFoundException('Không tìm thấy dữ liệu học sinh để xuất file')
        }

        // ===== 1. Lấy danh sách tất cả class (unique) =====
        const allClasses = Array.from(
            new Set(
                result.data.flatMap(student =>
                    student.classStudents?.map(cs => cs.courseClass.className) || [],
                ),
            ),
        )

        // ===== 2. Build data pivot =====
        const excelData = result.data.map((student, index) => {
            const studentClasses = new Set(
                student.classStudents?.map(cs => cs.courseClass.className) || [],
            )

            const classColumns = Object.fromEntries(
                allClasses.map(className => [
                    className,
                    studentClasses.has(className) ? '✔' : '',
                ]),
            )

            return {
                stt: index + 1,
                studentCode: student.studentId || '',
                lastName: student.user.lastName || '',
                firstName: student.user.firstName || '',
                school: student.school || '',
                gender:
                    student.user.gender === Gender.MALE
                        ? 'Nam'
                        : student.user.gender === Gender.FEMALE
                            ? 'Nữ'
                            : 'Khác',
                dateOfBirth: this.formatDate(student.user.dateOfBirth),
                username: student.user.username || '',
                parentPhone: student.parentPhone || '',
                studentPhone: student.studentPhone || '',
                grade: student.grade || '',
                email: student.user.email || '',
                isActive: student.user.isActive ? 'Hoạt động' : 'Không hoạt động',
                createdAt: this.formatDateTime(student.user.createdAt),
                ...classColumns,
            }
        })

        const filename = `Danh_sach_hoc_sinh_${this.formatDateTime(new Date()).replace(
            /[/ :]/g,
            '_',
        )}.xlsx`

        // ===== 3. Build columns (dynamic class columns) =====
        const columns = this.buildColumns(options, allClasses)

        const buffer = await this.excelService.exportToBuffer({
            sheetName: 'Học sinh',
            columns,
            data: excelData,
        })

        return { buffer, filename }
    }

    // ================= Helpers =================

    private formatDateTime(date: Date): string {
        if (!date) return ''
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
    }

    private formatDate(date: Date): string {
        if (!date) return ''
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
    }

    private buildColumns(
        options: ExportStudentListOptionDto,
        allClasses: string[],
    ): ExcelColumn[] {
        const columns: ExcelColumn[] = [
            { header: 'STT', key: 'stt', width: 8 },
            { header: 'Mã học sinh', key: 'studentCode', width: 15 },
            { header: 'Họ', key: 'lastName', width: 20 },
            { header: 'Tên', key: 'firstName', width: 15 },
        ]

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

        if (options.includeParentPhone !== false) {
            columns.push({ header: 'SĐT phụ huynh', key: 'parentPhone', width: 15 })
        }

        if (options.includeStudentPhone === true) {
            columns.push({ header: 'SĐT học sinh', key: 'studentPhone', width: 15 })
        }

        if (options.includeGrade !== false) {
            columns.push({ header: 'Khối', key: 'grade', width: 10 })
        }

        if (options.includeEmail !== false) {
            columns.push({ header: 'Email', key: 'email', width: 25 })
        }

        columns.push({ header: 'Trạng thái', key: 'isActive', width: 15 })

        if (options.includeCreatedAt === true) {
            columns.push({ header: 'Ngày tạo', key: 'createdAt', width: 20 })
        }

        // ===== Dynamic class columns =====
        allClasses.forEach(className => {
            columns.push({
                header: className,
                key: className,
                width: 15,
            })
        })

        return columns
    }
}
