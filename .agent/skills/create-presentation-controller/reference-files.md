# Tài liệu tham chiếu cho Presentation Controller

## Controller mẫu trong dự án

| Mục đích | Tệp | Điểm cần đối chiếu |
| --- | --- | --- |
| CRUD quản trị hoàn chỉnh | `src/presentation/controllers/chapter.controller.ts` | `GET` list/detail, `POST`, `PUT`, `DELETE`, DTO, ParseIntPipe, `CurrentUser`, permission constants và ExceptionHandler. |
| Self-service đã xác thực | `src/presentation/controllers/class-session.controller.ts` | `RequirePermission()` không tham số cùng `CurrentUser('studentId')` cho endpoint của người đang đăng nhập. |
| List và route phụ | `src/presentation/controllers/admin-audit-log.controller.ts` | DTO query, route tĩnh `admin/:adminId`, ParseIntPipe và permission cụ thể. |
| Đăng ký controller | `src/presentation/presentation.module.ts` | Import controller và thêm vào mảng `controllers`. |

## Decorator/hạ tầng dùng chung

| Tệp | Quy ước |
| --- | --- |
| `src/shared/decorators/permissions.decorator.ts` | `RequirePermission` luôn gắn `AuthGuard` và `PermissionsGuard`; `RequirePermission()` không truyền code vẫn yêu cầu auth. |
| `src/shared/guards/permissions.guard.ts` | Nhiều permission có semantics OR (`some`); SUPER_ADMIN bypass permission check. |
| `src/shared/decorators/current-user.decorator.ts` | Lấy actor từ `request.user`, có thể lấy field như `adminId` hoặc `studentId`. |
| `src/shared/utils/exception-handler.util.ts` | Bọc lời gọi async use case để chuẩn hóa lỗi. |
| `src/main.ts` | Đặt global prefix `/api`; controller không tự thêm `/api`. |

## Permission và DTO

| Tệp | Dùng khi |
| --- | --- |
| `src/shared/constants/permissions/permission.codes.ts` | Kiểm tra/thêm code để decorator controller sử dụng. |
| `src/shared/constants/permissions.constants.ts` | Thêm definition hệ thống tương ứng: code, tên, mô tả, group, isSystem. |
| `.agent/skills/create-dto/SKILL.md` | Tạo body/query/response DTO và dùng validation decorator dùng chung. |
| `.agent/skills/create-application-use-case/SKILL.md` | Kiểm tra chữ ký use case, actor, response và audit của mutation quản trị. |

## Bản đồ DTO theo endpoint

| Endpoint | Input controller | Output thường dùng |
| --- | --- | --- |
| `GET /features` | `@Query() FeatureListQueryDto` | `PaginationResponseDto<FeatureResponseDto>` |
| `GET /features/:id` | `@Param('id', ParseIntPipe)` | `BaseResponseDto<FeatureDetailResponseDto>` |
| `POST /features` | `@Body() CreateFeatureDto`, actor nếu cần | `BaseResponseDto<FeatureResponseDto>` + `201` |
| `PUT /features/:id` | ID parsed, `@Body() UpdateFeatureDto`, actor nếu cần | `BaseResponseDto<FeatureResponseDto>` |
| `DELETE /features/:id` | ID parsed, actor nếu cần | `BaseResponseDto<{ deleted: boolean }>` |

## Tài liệu API bắt buộc

| Đường dẫn | Quy ước |
| --- | --- |
| `docs/api/` | Thư mục contract REST dành cho FE/QA. Đã tồn tại; tạo `docs/api/<feature>.md` khi feature chưa có tài liệu. |
| `docs/api/<feature>.md` | Ghi method, endpoint đầy đủ `/api/...`, actor/auth/permission, path/query/body, validation, response success, HTTP status, error, side effect và ví dụ JSON. |

Khi sửa controller/route hiện có, tìm tài liệu API feature trước và cập nhật file đó trong cùng thay đổi. Nếu API thay đổi không tương thích, ghi deprecation/migration rõ ràng; không tạo tài liệu trùng hoặc để docs cũ mâu thuẫn code.

## Dấu hiệu cần dừng để thiết kế thêm

- Action cần toàn bộ nhiều permission cùng lúc: guard hiện tại chỉ hỗ trợ OR; không tự giả định AND.
- API public hoặc cách bypass auth: không dùng `RequirePermission()`; kiểm tra cơ chế public của dự án trước.
- DTO cần field ownership từ client: xác minh lại vì self-service phải dùng actor từ `CurrentUser`.
- Permission mới nhưng chưa rõ role nào có quyền mặc định: cần xác nhận policy/role seed trước khi gán mặc định.
