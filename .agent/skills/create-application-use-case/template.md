# Mẫu Application Use Case

Thay các phần trong dấu `<...>` bằng feature thực tế. Giữ tên DTO, repository, enum và thông điệp theo module gần nhất.

## 1. Get danh sách có phân trang

```ts
import { Injectable, Inject } from '@nestjs/common'
import { PaginationResponseDto, <Feature>ListQueryDto, <Feature>ResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetAll<Feature>UseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: <Feature>ListQueryDto): Promise<PaginationResponseDto<<Feature>ResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      if (!query.validate<Feature>SortFields()) {
        throw new Error('Trường sắp xếp không hợp lệ')
      }

      const pagination = query.to<Feature>PaginationOptions()
      const filters = query.to<Feature>FilterOptions()
      const { data, total } = await repos.<feature>Repository.findAllWithPagination({
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        ...filters,
      })

      return { data: <Feature>ResponseDto.from<Feature>List(data), total, pagination }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách <feature> thành công',
      result.data,
      result.pagination.page,
      result.pagination.limit,
      result.total,
    )
  }
}
```

## 2. Get detail với quan hệ tường minh

```ts
import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, <Feature>DetailResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class Get<Feature>UseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(id: number): Promise<BaseResponseDto<<Feature>DetailResponseDto>> {
    const feature = await this.unitOfWork.executeInTransaction(async (repos) => {
      const item = await repos.<feature>Repository.findById(id, {
        include<NeededRelation>: true,
      })

      if (!item) {
        throw new NotFoundException('<Feature> với ID ' + id + ' không tồn tại')
      }

      return <Feature>DetailResponseDto.from<Feature>With<NeededRelation>(item)
    })

    return BaseResponseDto.success('Lấy chi tiết <feature> thành công', feature)
  }
}
```

Chỉ thêm cờ `include<NeededRelation>` khi DTO detail thực sự dùng relation đó. Nếu repository chưa hỗ trợ options này, cập nhật interface và Prisma repository theo skill `create-prisma-repository`.

## 3. Create của quản trị có audit log

```ts
import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, Create<Feature>Dto, <Feature>ResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class Create<Feature>UseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(dto: Create<Feature>Dto, adminId: number): Promise<BaseResponseDto<<Feature>ResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      // Kiểm tra quyền, quan hệ tham chiếu và unique trước khi tạo.
      const duplicated = await repos.<feature>Repository.findBy<UniqueField>(dto.<uniqueField>)
      if (duplicated) {
        throw new ConflictException('<Feature> đã tồn tại')
      }

      const created = await repos.<feature>Repository.create(dto)
      const data = <Feature>ResponseDto.from<Feature>(created)

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.<FEATURE>.CREATE,
        resourceType: RESOURCE_TYPES.<FEATURE>,
        resourceId: String(created.<id>),
        status: AuditStatus.SUCCESS,
        afterData: this.toAuditData(data),
      })

      return data
    })

    return BaseResponseDto.success('Tạo <feature> thành công', response)
  }
}
```

`toAuditData` là private helper allowlist của use case, ví dụ `return { id: data.id, name: data.name, status: data.status }`. Chỉ trả các trường an toàn cần truy vết; không truyền nguyên DTO hay entity.

## 4. Update của quản trị có before/after audit

```ts
@Injectable()
export class Update<Feature>UseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(id: number, dto: Update<Feature>Dto, adminId: number): Promise<BaseResponseDto<<Feature>ResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.<feature>Repository.findById(id)
      if (!current) {
        throw new NotFoundException('<Feature> với ID ' + id + ' không tồn tại')
      }

      // Kiểm tra quyền, unique, khóa ngoại và state transition tại đây.
      const beforeData = this.toAuditData(
        <Feature>ResponseDto.from<Feature>(current),
      )
      const updated = await repos.<feature>Repository.update(id, dto)
      const data = <Feature>ResponseDto.from<Feature>(updated)

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.<FEATURE>.UPDATE,
        resourceType: RESOURCE_TYPES.<FEATURE>,
        resourceId: String(id),
        status: AuditStatus.SUCCESS,
        beforeData,
        afterData: this.toAuditData(data),
      })

      return data
    })

    return BaseResponseDto.success('Cập nhật <feature> thành công', response)
  }
}
```

## 5. Delete của quản trị có audit

```ts
@Injectable()
export class Delete<Feature>UseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(id: number, adminId: number): Promise<BaseResponseDto<{ deleted: true }>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.<feature>Repository.findById(id)
      if (!current) {
        throw new NotFoundException('<Feature> với ID ' + id + ' không tồn tại')
      }

      // Kiểm tra quyền và dependency trước khi xóa.
      const beforeData = this.toAuditData(
        <Feature>ResponseDto.from<Feature>(current),
      )
      await repos.<feature>Repository.delete(id)

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.<FEATURE>.DELETE,
        resourceType: RESOURCE_TYPES.<FEATURE>,
        resourceId: String(id),
        status: AuditStatus.SUCCESS,
        beforeData,
      })
    })

    return BaseResponseDto.success('Xóa <feature> thành công', { deleted: true })
  }
}
```

## Audit thất bại

Với lỗi nghiệp vụ có thể dự đoán (không tìm thấy, trùng, sai state), có thể tạo `AuditStatus.FAIL` với `adminId`, action/resource dùng enum và `errorMessage` tiếng Việt có dấu. Tuy nhiên, không giả định bản ghi đó sẽ tồn tại nếu sau đó ném lỗi bên trong cùng transaction; cần xác minh hành vi rollback của `IUnitOfWork`. Chỉ tách audit sang transaction khác khi yêu cầu lưu lỗi là bắt buộc và đã được chấp thuận về kiến trúc.
