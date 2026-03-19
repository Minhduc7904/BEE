import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { PasswordService } from 'src/infrastructure/services'
import { ResetStudentPasswordByDateRangeDto } from 'src/application/dtos/student/reset-student-password-by-date-range.dto'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

interface ResetResultItem {
    studentId: number
    userId: number
    studentPhone?: string
    status: 'updated' | 'skipped'
    reason?: string
}

interface ResetStudentPasswordByDateRangeResult {
    fromDate: string
    toDate: string
    totalStudents: number
    updatedCount: number
    skippedCount: number
    results: ResetResultItem[]
}

@Injectable()
export class ResetStudentPasswordByDateRangeUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        @Inject('PASSWORD_SERVICE')
        private readonly passwordService: PasswordService,
    ) { }

    async execute(
        dto: ResetStudentPasswordByDateRangeDto,
    ): Promise<BaseResponseDto<ResetStudentPasswordByDateRangeResult>> {
        // console.log('[ResetStudentPasswordByDateRange] Start', {
        //     fromDate: dto.fromDate,
        //     toDate: dto.toDate,
        // })

        const from = new Date(dto.fromDate)
        const to = new Date(dto.toDate)

        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
            throw new BadRequestException('fromDate hoặc toDate không hợp lệ')
        }

        if (from > to) {
            throw new BadRequestException('fromDate phải nhỏ hơn hoặc bằng toDate')
        }

        const limit = 500
        const allStudents: any[] = []
        let page = 1
        let totalPages = 1

        // Đọc theo từng trang trong transaction ngắn để tránh giữ transaction quá lâu.
        do {
            // console.log('[ResetStudentPasswordByDateRange] Fetch page', {
            //     page,
            //     limit,
            // })

            const studentsPage = await this.unitOfWork.executeInTransaction(async (repos) => {
                return repos.studentRepository.findByFilters(
                    {
                        fromDate: dto.fromDate,
                        toDate: dto.toDate,
                    },
                    {
                        page,
                        limit,
                        sortBy: {
                            field: 'createdAt',
                            direction: SortOrder.ASC,
                        },
                    },
                )
            })

            allStudents.push(...studentsPage.data)
            totalPages = studentsPage.totalPages || 1

            // console.log('[ResetStudentPasswordByDateRange] Page fetched', {
            //     page,
            //     pageCount: studentsPage.data.length,
            //     total: studentsPage.total,
            //     totalPages,
            //     accumulated: allStudents.length,
            // })

            page += 1
        } while (page <= totalPages)

        const results: ResetResultItem[] = []

        // console.log('[ResetStudentPasswordByDateRange] Start updating passwords', {
        //     totalStudents: allStudents.length,
        // })

        // Update từng học sinh trong transaction riêng để không bị timeout transaction toàn cục.
        for (const student of allStudents) {
            if (!student.studentPhone) {
                // console.log('[ResetStudentPasswordByDateRange] Skip student - missing phone', {
                //     studentId: student.studentId,
                //     userId: student.userId,
                // })

                results.push({
                    studentId: student.studentId,
                    userId: student.userId,
                    status: 'skipped',
                    reason: 'Học sinh chưa có số điện thoại',
                })
                continue
            }

            try {
                // console.log('[ResetStudentPasswordByDateRange] Update password', {
                //     studentId: student.studentId,
                //     userId: student.userId,
                // })

                const passwordHash = await this.passwordService.hashPassword(student.studentPhone)

                await this.unitOfWork.executeInTransaction(async (repos) => {
                    await repos.userRepository.update(student.userId, {
                        passwordHash,
                    })
                })

                results.push({
                    studentId: student.studentId,
                    userId: student.userId,
                    studentPhone: student.studentPhone,
                    status: 'updated',
                })

                // console.log('[ResetStudentPasswordByDateRange] Update success', {
                //     studentId: student.studentId,
                //     userId: student.userId,
                // })
            } catch (error: any) {
                // console.warn('[ResetStudentPasswordByDateRange] Update failed', {
                //     studentId: student.studentId,
                //     userId: student.userId,
                //     errorMessage: error?.message,
                // })

                results.push({
                    studentId: student.studentId,
                    userId: student.userId,
                    studentPhone: student.studentPhone,
                    status: 'skipped',
                    reason: error?.message || 'Không thể cập nhật mật khẩu',
                })
            }
        }

        const updatedCount = results.filter((item) => item.status === 'updated').length
        const skippedCount = results.length - updatedCount

        const result = {
            fromDate: dto.fromDate,
            toDate: dto.toDate,
            totalStudents: allStudents.length,
            updatedCount,
            skippedCount,
            results,
        }

        // console.log('[ResetStudentPasswordByDateRange] Completed', {
        //     fromDate: dto.fromDate,
        //     toDate: dto.toDate,
        //     totalStudents: result.totalStudents,
        //     updatedCount: result.updatedCount,
        //     skippedCount: result.skippedCount,
        // })

        return BaseResponseDto.success(
            'Reset mật khẩu học sinh theo khoảng thời gian thành công',
            result,
        )
    }
}
