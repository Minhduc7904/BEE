import { Inject, Injectable } from '@nestjs/common'
import { PaginationResponseDto, TeacherProfileListQueryDto, TeacherProfileResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'

@Injectable()
export class GetTeacherProfilesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: TeacherProfileListQueryDto): Promise<PaginationResponseDto<TeacherProfileResponseDto>> {
    const pagination = query.toTeacherProfilePaginationOptions()

    const result = await this.unitOfWork.executeInTransaction((repos) =>
      repos.teacherProfileRepository.findAllWithPagination({
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        search: query.search,
        visibility: query.visibility,
        isFeatured: query.isFeatured,
      }),
    )

    return PaginationResponseDto.success(
      'Lay danh sach ho so giao vien thanh cong',
      TeacherProfileResponseDto.fromEntityList(result.data),
      pagination.page,
      pagination.limit,
      result.total,
    )
  }
}
