import { Injectable, Inject } from '@nestjs/common'
import { PaginationResponseDto, SubjectListQueryDto, SubjectResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetAllSubjectsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: SubjectListQueryDto): Promise<PaginationResponseDto<SubjectResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const subjectRepository = repos.subjectRepository

      // Validate sort fields
      if (!query.validateSubjectSortFields()) {
        throw new Error('Trường sắp xếp không hợp lệ')
      }

      const paginationOptions = query.toSubjectPaginationOptions()
      const filterOptions = query.toSubjectFilterOptions()

      const { data, total } = await subjectRepository.findAllWithPagination({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
        sortBy: paginationOptions.sortBy,
        sortOrder: paginationOptions.sortOrder,
        search: filterOptions.search,
        code: filterOptions.code,
      })

      const subjects = SubjectResponseDto.fromSubjectList(data)

      return {
        data: subjects,
        total,
        page: paginationOptions.page,
        limit: paginationOptions.limit,
        totalPages: Math.ceil(total / paginationOptions.limit),
      }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách môn học thành công',
      result.data,
      result.page,
      result.limit,
      result.total,
    )
  }
}
