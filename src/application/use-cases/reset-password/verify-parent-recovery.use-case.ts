import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { TokenService } from '../../interfaces'
import { BaseResponseDto, VerifyParentRecoveryDto, VerifyParentRecoveryResultDto } from '../../dtos'
import { NotFoundException, ValidationException } from '../../../shared/exceptions/custom-exceptions'
import { PhoneUtil } from '../../../shared/utils'

@Injectable()
export class VerifyParentRecoveryUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: VerifyParentRecoveryDto): Promise<BaseResponseDto<VerifyParentRecoveryResultDto>> {
    const phone = PhoneUtil.normalizeVietnamesePhone(dto.phone)
    const answerIds = dto.students.map((answer) => answer.studentId)
    if (new Set(answerIds).size !== answerIds.length) {
      throw new ValidationException('Danh sách học sinh xác minh không được trùng lặp')
    }

    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const parent = await repos.parentRepository.findByPhone(phone, {
        includeUser: true,
        includeStudents: true,
      })
      if (!parent || !parent.user?.isActive) {
        throw new NotFoundException('Không thể khôi phục tài khoản bằng số điện thoại này')
      }

      const students = (parent.studentLinks ?? [])
        .map((link) => link.student)
        .filter((student) => student !== undefined)
      const expectedIds = students.map((student) => student.studentId).sort((a, b) => a - b)
      const submittedIds = [...answerIds].sort((a, b) => a - b)
      if (expectedIds.length === 0 || !this.sameIds(expectedIds, submittedIds)) {
        throw new ValidationException('Phải xác minh đúng và đủ tất cả học sinh được liên kết')
      }

      const answerByStudentId = new Map(dto.students.map((answer) => [answer.studentId, answer]))
      const invalidStudentIds = students
        .filter((student) => {
          const answer = answerByStudentId.get(student.studentId)!
          return (
            answer.school.trim() !== student.school?.trim() ||
            !this.samePhone(answer.studentPhone, student.studentPhone) ||
            !this.samePhone(answer.parentPhone, student.parentPhone) ||
            !this.samePhone(answer.parentPhone, parent.phone)
          )
        })
        .map((student) => student.studentId)

      if (invalidStudentIds.length > 0) {
        return { verified: false as const, invalidStudentIds }
      }

      const { rawToken, tokenHash } = this.tokenService.generateToken()
      const expiresAt = this.tokenService.generateExpiryTime()
      await repos.passwordResetTokenRepository.create({
        userId: parent.userId,
        tokenHash,
        expiresAt,
      })
      return { verified: true as const, invalidStudentIds: [], resetToken: rawToken, expiresAt }
    })

    return BaseResponseDto.success(
      result.verified ? 'Xác minh thông tin học sinh thành công' : 'Thông tin xác minh chưa chính xác',
      result,
    )
  }

  private sameIds(expected: number[], submitted: number[]): boolean {
    return expected.length === submitted.length && expected.every((id, index) => id === submitted[index])
  }

  private samePhone(input: string, stored?: string): boolean {
    if (!stored?.trim()) return false
    return PhoneUtil.vietnamesePhoneVariants(input).includes(stored.trim())
  }
}
