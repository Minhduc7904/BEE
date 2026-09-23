import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto, GetParentRecoveryStudentsDto, GetParentRecoveryStudentsResultDto } from '../../dtos'
import { BusinessLogicException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { PhoneUtil } from '../../../shared/utils'
import { ParentStudentSummaryService } from '../auth/parent'

@Injectable()
export class GetParentRecoveryStudentsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly studentSummaryService: ParentStudentSummaryService,
  ) {}

  async execute(dto: GetParentRecoveryStudentsDto): Promise<BaseResponseDto<GetParentRecoveryStudentsResultDto>> {
    const verificationStudents = await this.unitOfWork.executeInTransaction(async (repos) => {
      const phone = PhoneUtil.normalizeVietnamesePhone(dto.phone)
      const parent = await repos.parentRepository.findByPhone(phone, {
        includeUser: true,
        includeStudents: true,
      })

      if (!parent || !parent.user?.isActive) {
        throw new NotFoundException('Không thể khôi phục tài khoản bằng số điện thoại này')
      }

      const linkedStudents = (parent.studentLinks ?? [])
        .map((link) => link.student)
        .filter((student) => student !== undefined)

      if (linkedStudents.length === 0) {
        throw new BusinessLogicException('Không có đủ thông tin xác minh. Vui lòng liên hệ trung tâm')
      }

      return Promise.all(
        linkedStudents.map(async (student) => {
          const actualSchool = student.school?.trim()
          if (!student.user || !actualSchool || !student.studentPhone?.trim() || !student.parentPhone?.trim()) {
            throw new BusinessLogicException('Không có đủ thông tin xác minh. Vui lòng liên hệ trung tâm')
          }

          const randomSchools = await repos.studentRepository.findRandomDistinctSchools(actualSchool, 20)
          const decoys = this.uniqueSchools(randomSchools, actualSchool).slice(0, 3)
          if (decoys.length !== 3) {
            throw new BusinessLogicException('Không có đủ dữ liệu trường học để xác minh. Vui lòng liên hệ trung tâm')
          }

          return {
            studentId: student.studentId,
            userId: student.userId,
            fullName: `${student.user.lastName} ${student.user.firstName}`.trim(),
            schoolOptions: this.shuffle([actualSchool, ...decoys]),
          }
        }),
      )
    })

    const avatarUrlByUserId = await this.studentSummaryService.findAvatarUrlsByUserIds(
      verificationStudents.map((student) => student.userId),
    )

    const students = verificationStudents.map(({ userId, ...student }) => ({
      ...student,
      avatarUrl: avatarUrlByUserId.get(userId) ?? null,
    }))

    return BaseResponseDto.success('Lấy danh sách học sinh xác minh thành công', { students })
  }

  private uniqueSchools(schools: string[], excludedSchool: string): string[] {
    const excluded = excludedSchool.toLocaleLowerCase('vi-VN')
    const unique = new Map<string, string>()
    for (const school of schools) {
      const trimmed = school.trim()
      const key = trimmed.toLocaleLowerCase('vi-VN')
      if (trimmed && key !== excluded && !unique.has(key)) unique.set(key, trimmed)
    }
    return [...unique.values()]
  }

  private shuffle(values: string[]): string[] {
    const result = [...values]
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1))
      ;[result[index], result[target]] = [result[target], result[index]]
    }
    return result
  }
}
