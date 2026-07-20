---
name: create-presentation-controller
description: Viết hoặc cập nhật NestJS presentation controller cho dự án BEE, gồm API get list, get detail, create, update và delete. Dùng khi cần gắn route/decorator, DTO body-query-param, RequirePermission, CurrentUser, HTTP status, ExceptionHandler hoặc đăng ký controller vào PresentationModule.
---

# Viết Presentation Controller

## Mục tiêu

Đặt controller tại `src/presentation/controllers/<feature>.controller.ts`. Controller chỉ khai báo HTTP contract và gọi đúng một application use case cho mỗi endpoint: route, decorator, DTO, actor hiện hành, HTTP status và response type. Không đặt business rule, Prisma query, transaction, mapper hoặc audit log trong controller.

Mỗi API mới, sửa endpoint, sửa request hoặc sửa response phải tạo/cập nhật tài liệu tương ứng tại `docs/api/`. Tài liệu là một phần của HTTP contract, không phải công việc tùy chọn sau khi code xong.

## Tệp phải đọc trước khi thực hiện

1. Đọc `reference-files.md` và `template.md` của skill này.
2. Đọc controller cùng loại gần nhất, DTO và use case mà endpoint sẽ gọi.
3. Đọc `create-application-use-case` để xác nhận chữ ký `execute`, actor cần truyền và response DTO.
4. Đọc `create-dto` khi thêm/sửa request, query hoặc response DTO.
5. Đọc `business-rules` khi endpoint có ownership, state transition, policy hay business error.
6. Đọc `create-enum` trước khi thêm enum hữu hạn cho DTO/response.
7. Đọc tài liệu API hiện có tại `docs/api/` của feature, nếu có, trước khi sửa endpoint.

Khi sửa class hoặc handler controller đã tồn tại, chạy GitNexus impact analysis trước khi sửa. Thêm controller mới phải được import và đăng ký tại `PresentationModule` theo mẫu hiện có.

## Quy trình

1. Xác định actor (admin, student hoặc user), action, quyền cần có, input DTO và response của use case.
2. Kiểm tra permission code đã có trong `PERMISSION_CODES` trước; không tạo code trùng hoặc dùng chuỗi permission trực tiếp.
3. Inject các use case bằng constructor; không inject repository, PrismaService, mapper hoặc Unit of Work vào controller.
4. Dùng decorator NestJS đúng cho nguồn dữ liệu: `@Body()` cho create/update DTO, `@Query()` cho list query DTO, `@Param('id', ParseIntPipe)` cho ID số, `@CurrentUser(...)` cho actor xác thực.
5. Bọc lời gọi use case bằng `ExceptionHandler.execute(() => ...)` để giữ quy ước lỗi dùng chung.
6. Đặt route tĩnh trước route tham số, ví dụ `@Get('search')`, `@Get('me')` trước `@Get(':id')`.
7. Dùng status code tường minh: `GET`/`PUT`/`DELETE` là `HttpStatus.OK`; `POST` tạo resource là `HttpStatus.CREATED`. Chỉ chọn status khác khi contract có lý do rõ ràng.
8. Đăng ký controller tại `src/presentation/presentation.module.ts`, sau khi application module đã export use case cần inject.
9. Tạo/cập nhật `docs/api/<feature>.md` trước khi bàn giao. Nếu feature đã có file tài liệu với tên khác, cập nhật file đó thay vì tạo tài liệu trùng.

Không bắt buộc viết unit test vì dự án hiện chưa có luồng này. Tối thiểu chạy build/typecheck sau thay đổi TypeScript.

## Decorator và DTO

| Nhu cầu | Cách dùng | Quy tắc |
| --- | --- | --- |
| Base route | `@Controller('features')` | Dùng danh từ số nhiều và theo route của module gần nhất. Global prefix `/api` đã đặt ở `main.ts`; không lặp lại trong controller. |
| Get list | `@Get()` + `@Query() query: FeatureListQueryDto` | Query DTO phải là DTO list/filter riêng, không nhận từng query rời rạc khi DTO đã tồn tại. |
| Get detail | `@Get(':id')` + `@Param('id', ParseIntPipe) id: number` | Luôn parse ID số; route tĩnh phải ở trước. |
| Create | `@Post()` + `@Body() dto: CreateFeatureDto` | DTO chịu trách nhiệm validate shape; không nhận raw object. |
| Update | `@Put(':id')` + `@Body() dto: UpdateFeatureDto` | ID dùng `ParseIntPipe`; field ownership không nhận từ body self-service. |
| Delete | `@Delete(':id')` | Chỉ nhận ID và actor nếu use case cần; không nhận delete DTO tùy tiện. |
| Actor | `@CurrentUser('adminId') adminId: number` | Lấy identity/ownership từ auth context, rồi truyền nguyên vẹn cho use case. |
| HTTP status | `@HttpCode(HttpStatus.OK)` | Khai báo tường minh trên từng handler. |

`@Body()` và `@Query()` phải dùng application DTO. Validation decorator nằm trong DTO theo skill `create-dto`; controller không lặp lại validation class-validator hoặc truy vấn database để validate.

## Tài liệu API bắt buộc tại docs/api

`docs/api/` là nguồn contract dành cho FE/QA. Với controller/API mới, tạo `docs/api/<feature>.md` nếu chưa có tài liệu feature. Với route đã có, cập nhật lại chính tài liệu feature khi thay đổi endpoint, HTTP method, permission, input, output, status code hoặc behavior.

Mỗi endpoint phải ghi rõ:

1. HTTP method và endpoint đầy đủ có prefix `/api`, ví dụ `GET /api/features/:id`.
2. Actor, cơ chế auth, permission, ownership/self-service rule và header đặc biệt nếu có.
3. Path param, query và request body: tên field, kiểu, bắt buộc/optional, enum/validation và ví dụ request.
4. Status code, response success đầy đủ đúng `BaseResponseDto`/`PaginationResponseDto`, kèm ví dụ JSON.
5. Error có thể hiển thị cho FE: HTTP status, code/message, trường hợp xảy ra; không chép raw stack trace hay secret.
6. Side effect quan trọng như audit, notification, pagination/sort hoặc thay đổi trạng thái khi có.

Không chỉ ghi danh sách endpoint. Không để docs nói một request/response khác code thực tế. Khi API bị thay thế hoặc bỏ, ghi rõ deprecated/migration cho FE thay vì xóa thông tin mà không giải thích.

## Permission

### Chọn decorator

- Endpoint quản trị hoặc endpoint cần một quyền cụ thể: `@RequirePermission(PERMISSION_CODES.FEATURE.ACTION)`.
- Endpoint self-service đã xác thực nhưng không đòi hỏi permission code: `@RequirePermission()`. Decorator này vẫn áp dụng `AuthGuard`; mảng permission rỗng chỉ khiến `PermissionsGuard` không kiểm tra code.
- Không dùng `@RequirePermission()` để biến endpoint thành public.
- Không truyền nhiều code để kỳ vọng logic AND: `PermissionsGuard` hiện dùng `some`, nên nhiều code nghĩa là chỉ cần **một trong các quyền**. Nếu thật sự cần all-of, phải có thay đổi guard/decorator được thiết kế riêng.

### Thêm permission mới

Chỉ thêm khi endpoint quản trị có action chưa được định nghĩa.

1. Thêm `PERMISSION_CODES.<FEATURE>.<ACTION>` tại `src/shared/constants/permissions/permission.codes.ts`, dùng format `<feature>:<action>`.
2. Thêm permission definition tương ứng tại `src/shared/constants/permissions.constants.ts`: code, tên, mô tả tiếng Việt có dấu, group và `isSystem`.
3. Cập nhật mapping/seed role mặc định nếu role mặc định cần có quyền đó.
4. Import `PERMISSION_CODES` vào controller và dùng đúng constant tại `@RequirePermission(...)`.
5. Không tự tạo string literal, không dùng page permission cho API resource và không sửa guard chỉ để lách policy.

## Mẫu endpoint theo CRUD

### Get list

- `GET /features`
- Nhận `FeatureListQueryDto` bằng `@Query()`.
- Yêu cầu `PERMISSION_CODES.FEATURE.GET_ALL` cho admin list; self-service dùng permission code riêng hoặc `RequirePermission()` tùy policy.
- Trả `PaginationResponseDto<FeatureResponseDto>` từ use case qua `ExceptionHandler`.

### Get detail

- `GET /features/:id`
- Dùng `@Param('id', ParseIntPipe)`.
- Yêu cầu `PERMISSION_CODES.FEATURE.GET_BY_ID` nếu là admin resource.
- Trả `BaseResponseDto<FeatureDetailResponseDto>`.

### Create

- `POST /features`
- Dùng `CreateFeatureDto` từ `@Body()`.
- Yêu cầu `PERMISSION_CODES.FEATURE.CREATE` cho admin mutation.
- Nếu use case/audit cần actor, lấy `@CurrentUser('adminId')` và truyền vào use case; không cho client gửi `adminId`.
- Trả `201 Created` và `BaseResponseDto<FeatureResponseDto>`.

### Update

- `PUT /features/:id`
- Dùng `UpdateFeatureDto`, ID parsed và actor từ `CurrentUser` khi cần.
- Yêu cầu `PERMISSION_CODES.FEATURE.UPDATE`.
- Trả `200 OK`; use case mới là nơi kiểm tra ownership, state transition và ghi audit.

### Delete

- `DELETE /features/:id`
- Dùng ID parsed và actor khi use case cần audit/ownership.
- Yêu cầu `PERMISSION_CODES.FEATURE.DELETE`.
- Trả DTO response đúng contract use case, thường `BaseResponseDto<{ deleted: boolean }>`.

## Điều không được làm

- Không gọi repository/Prisma/mapper/Unit of Work trong controller.
- Không đặt kiểm tra tồn tại, unique, ownership, state transition hay audit log trong handler.
- Không dùng `@Param('id') id: string` cho ID số.
- Không truyền body DTO trực tiếp sang repository hoặc thêm actor/ownership từ client body.
- Không bỏ `ExceptionHandler.execute`, `@HttpCode` hoặc `@RequirePermission` chỉ để handler ngắn hơn.
- Không để `:id` đứng trước `search`, `root`, `me`, `public/...` hoặc bất kỳ route tĩnh nào.
- Không thêm/sửa/bỏ API mà không cập nhật đầy đủ contract tại `docs/api`.

## Checklist trước khi bàn giao

- [ ] Controller chỉ nhận HTTP input/auth context rồi gọi use case.
- [ ] Body/query dùng DTO đúng loại; ID số dùng `ParseIntPipe`.
- [ ] Route tĩnh đứng trước route tham số.
- [ ] Permission có constant hợp lệ và semantics phù hợp; endpoint self-service vẫn có auth.
- [ ] Create/update/delete truyền actor từ `@CurrentUser` khi use case yêu cầu.
- [ ] Response type và status code khớp use case/API contract.
- [ ] Controller đã đăng ký ở `PresentationModule`.
- [ ] `docs/api` đã được tạo/cập nhật với endpoint, request, response, status/error và permission/ownership chính xác.
- [ ] Không thêm yêu cầu unit test; build/typecheck không lỗi liên quan.
