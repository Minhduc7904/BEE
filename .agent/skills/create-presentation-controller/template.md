# Mẫu Presentation Controller

Thay `<Feature>`, `<feature>` và permission constant bằng tài nguyên thực tế. Kiểm tra use case trước để xác nhận thứ tự đối số của `execute`.

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import {
  BaseResponseDto,
  Create<Feature>Dto,
  <Feature>DetailResponseDto,
  <Feature>ListQueryDto,
  <Feature>ResponseDto,
  PaginationResponseDto,
  Update<Feature>Dto,
} from '../../application/dtos'
import {
  Create<Feature>UseCase,
  Delete<Feature>UseCase,
  Get<Feature>UseCase,
  GetAll<Feature>UseCase,
  Update<Feature>UseCase,
} from '../../application/use-cases/<feature>'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('<features>')
export class <Feature>Controller {
  constructor(
    private readonly getAll<Feature>UseCase: GetAll<Feature>UseCase,
    private readonly get<Feature>UseCase: Get<Feature>UseCase,
    private readonly create<Feature>UseCase: Create<Feature>UseCase,
    private readonly update<Feature>UseCase: Update<Feature>UseCase,
    private readonly delete<Feature>UseCase: Delete<Feature>UseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.<FEATURE>.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query() query: <Feature>ListQueryDto,
  ): Promise<PaginationResponseDto<<Feature>ResponseDto>> {
    return ExceptionHandler.execute(() => this.getAll<Feature>UseCase.execute(query))
  }

  // Đặt mọi route tĩnh (ví dụ search, me, public) tại đây, trước ':id'.

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.<FEATURE>.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<<Feature>DetailResponseDto>> {
    return ExceptionHandler.execute(() => this.get<Feature>UseCase.execute(id))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.<FEATURE>.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: Create<Feature>Dto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<<Feature>ResponseDto>> {
    return ExceptionHandler.execute(() => this.create<Feature>UseCase.execute(dto, adminId))
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.<FEATURE>.UPDATE)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Update<Feature>Dto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<<Feature>ResponseDto>> {
    return ExceptionHandler.execute(() => this.update<Feature>UseCase.execute(id, dto, adminId))
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.<FEATURE>.DELETE)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    return ExceptionHandler.execute(() => this.delete<Feature>UseCase.execute(id, adminId))
  }
}
```

## Biến thể self-service

```ts
@Get('me')
@RequirePermission()
@HttpCode(HttpStatus.OK)
async getMine(
  @CurrentUser('studentId') studentId: number,
  @Query() query: My<Feature>ListQueryDto,
): Promise<PaginationResponseDto<<Feature>ResponseDto>> {
  return ExceptionHandler.execute(() => this.getMy<Feature>UseCase.execute(studentId, query))
}
```

`RequirePermission()` vẫn yêu cầu đăng nhập. Đừng nhận `studentId`, `adminId` hay ID owner từ query/body nếu có thể lấy từ `CurrentUser`.

## Sau khi tạo controller

1. Import controller vào `src/presentation/presentation.module.ts`.
2. Thêm controller vào mảng `controllers`.
3. Kiểm tra ApplicationModule đã export các use case được constructor inject.
4. Nếu thêm permission mới, cập nhật cả `permission.codes.ts`, `permissions.constants.ts` và role seed cần thiết trước khi chạy build.
5. Tạo hoặc cập nhật `docs/api/<feature>.md` theo mẫu dưới đây trước khi bàn giao.

## Mẫu tài liệu `docs/api/<feature>.md`

```md
# <Feature> API

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: `<admin | student | user>`.
- Authentication: `<Bearer JWT / cơ chế khác>`.
- Ownership/permission: `<RequirePermission(...) hoặc self-service rule>`.

## `POST /api/<features>`

| Thuộc tính | Giá trị |
| --- | --- |
| Actor/quyền | `<permission hoặc self-service>` |
| Status thành công | `201 Created` |
| Use case | `<CreateFeatureUseCase>` |
| Side effect | `<audit/notification/state transition nếu có>` |

### Request

```http
POST /api/<features>
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "<field>": "<value>"
}
```

| Field | Kiểu | Bắt buộc | Validation/ghi chú |
| --- | --- | --- | --- |
| `<field>` | `<type>` | Có/Không | `<DTO decorator, enum hoặc giới hạn>` |

### Response thành công

```json
{
  "success": true,
  "message": "...",
  "data": {
    "id": 1
  }
}
```

### Lỗi FE cần xử lý

| HTTP status | Code/message | Khi nào |
| --- | --- | --- |
| `400` | `<validation error>` | Request không hợp lệ. |
| `401/403` | `<auth/permission error>` | Không đăng nhập hoặc không đủ quyền. |
| `404` | `<not found error>` | Resource không tồn tại/không thuộc ownership. |
| `409` | `<business conflict>` | Vi phạm state/unique rule khi có. |
```

Lặp lại phần endpoint cho list/detail/update/delete. Với list, ghi đầy đủ query filter, sort được whitelist, phân trang và ví dụ `PaginationResponseDto`. Khi sửa API hiện có, cập nhật request/response/error cũ và thêm ghi chú deprecated/migration nếu FE cần đổi.
