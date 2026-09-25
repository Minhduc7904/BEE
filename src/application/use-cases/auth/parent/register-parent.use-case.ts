import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { PasswordService } from '../../../interfaces'
import {
  BaseResponseDto,
  ParentNotificationSettingsResponseDto,
  ParentResponseDto,
  RegisterParentDto,
} from '../../../dtos'
import {
  ConflictException,
  UniqueConstraintException,
  ValidationException,
} from '../../../../shared/exceptions/custom-exceptions'
import { PhoneUtil } from '../../../../shared/utils'
import { ParentStudentSummaryService } from './parent-student-summary.service'

@Injectable()
export class RegisterParentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    private readonly studentSummaryService?: ParentStudentSummaryService,
  ) {}

  async execute(dto: RegisterParentDto): Promise<BaseResponseDto<ParentResponseDto>> {
    try {
      const created = await this.unitOfWork.executeInTransaction(async (repos) => {
        const phone = PhoneUtil.normalizeVietnamesePhone(dto.phone)
        const uniqueStudentIds = Array.from(new Set(dto.studentIds))

        if (uniqueStudentIds.length !== dto.studentIds.length || uniqueStudentIds.length === 0) {
          throw new ValidationException('Danh sách học sinh phải có ít nhất một ID và không được trùng')
        }

        if (await repos.parentRepository.findByPhone(phone)) {
          throw new ConflictException('Số điện thoại đã đăng ký tài khoản phụ huynh')
        }

        if (await repos.userRepository.existsByUsername(phone)) {
          throw new ConflictException('Số điện thoại đã được sử dụng bởi một loại tài khoản khác')
        }

        const students = await repos.studentRepository.findAllByIdsAndParentPhoneVariants(
          uniqueStudentIds,
          PhoneUtil.vietnamesePhoneVariants(phone),
        )

        if (students.length !== uniqueStudentIds.length) {
          throw new ValidationException('Danh sách học sinh không hợp lệ hoặc không thuộc số điện thoại phụ huynh này')
        }

        const passwordHash = await this.passwordService.hashPassword(dto.password)
        const user = await repos.userRepository.create({
          username: phone,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          isActive: true,
          isEmailVerified: false,
        })
        const parent = await repos.parentRepository.create({ userId: user.userId, phone })

        await repos.parentStudentRepository.createMany(
          uniqueStudentIds.map((studentId) => ({ parentId: parent.parentId, studentId })),
        )

        const created = await repos.parentRepository.findById(parent.parentId, {
          includeUser: true,
          includeStudents: true,
        })

        if (!created) {
          throw new Error('Không thể tải tài khoản phụ huynh vừa tạo')
        }

        return created
      })
      const linkedStudents = (created.studentLinks ?? [])
        .map((link) => link.student)
        .filter((student): student is NonNullable<typeof student> => student !== undefined)
      const students = this.studentSummaryService
        ? await this.studentSummaryService.createMany(linkedStudents)
        : undefined
      return BaseResponseDto.success(
        'Tạo tài khoản phụ huynh thành công',
        // Phụ huynh vừa tạo chưa có lựa chọn nào nên dùng cài đặt thông báo mặc định.
        ParentResponseDto.fromParent(created, students, ParentNotificationSettingsResponseDto.from(null, null)),
      )
    } catch (error) {
      if (error instanceof UniqueConstraintException) {
        throw new ConflictException(error.message)
      }
      throw error
    }
  }
}
