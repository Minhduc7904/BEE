import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../../domain/repositories'
import {
  BaseResponseDto,
  CheckParentPhoneRequestDto,
  CheckParentPhoneResponseDto,
  ParentStudentSummaryDto,
} from '../../../dtos'
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../../../../shared/exceptions/custom-exceptions'
import { PhoneUtil } from '../../../../shared/utils'
import { ParentStudentSummaryService } from './parent-student-summary.service'
import { ParentAccountDeletionService } from './parent-account-deletion.service'

@Injectable()
export class CheckParentPhoneUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly accountDeletionService: ParentAccountDeletionService,
    private readonly studentSummaryService?: ParentStudentSummaryService,
  ) {}

  async execute(dto: CheckParentPhoneRequestDto): Promise<BaseResponseDto<CheckParentPhoneResponseDto>> {
    if (await this.accountDeletionService.isDeleted(dto.phone)) {
      throw new ForbiddenException('Tài khoản đã bị xóa. Vui lòng liên hệ bộ phận hỗ trợ.', 'ACCOUNT_DELETED')
    }
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const phone = PhoneUtil.normalizeVietnamesePhone(dto.phone)
      const parent = await repos.parentRepository.findByPhone(phone)

      if (parent) {
        return { canLogin: true as const, students: [] }
      }

      if (await repos.userRepository.existsByUsername(phone)) {
        throw new ConflictException('Số điện thoại đã được sử dụng bởi một loại tài khoản khác')
      }

      const students = await repos.studentRepository.findAllByParentPhoneVariants(
        PhoneUtil.vietnamesePhoneVariants(phone),
      )

      if (students.length === 0) {
        throw new NotFoundException('Chưa có học sinh nào đăng ký số điện thoại phụ huynh này')
      }

      return { canLogin: false as const, students }
    })

    if (result.canLogin) {
      return BaseResponseDto.success('Số điện thoại đã đăng ký tài khoản phụ huynh', {
        canLogin: true,
        canRegister: false,
        students: [],
      })
    }

    const students = this.studentSummaryService
      ? await this.studentSummaryService.createMany(result.students)
      : ParentStudentSummaryDto.fromStudents(result.students)
    return BaseResponseDto.success('Số điện thoại có thể đăng ký tài khoản phụ huynh', {
      canLogin: false,
      canRegister: true,
      students,
    })
  }
}
