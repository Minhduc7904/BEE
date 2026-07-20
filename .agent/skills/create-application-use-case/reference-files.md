# Tài liệu tham chiếu cho Application Use Case

## Mã nguồn ưu tiên đối chiếu

| Mục đích | Tệp tham chiếu | Điểm cần học |
| --- | --- | --- |
| Lấy danh sách phân trang | `src/application/use-cases/chapter/get-all-chapters.use-case.ts` | Query DTO chuyển pagination/filter options, gọi repository và bọc `PaginationResponseDto.success`. |
| Lấy chi tiết | `src/application/use-cases/chapter/get-chapter.use-case.ts` | `UNIT_OF_WORK`, kiểm tra tồn tại, `NotFoundException`, detail response DTO. |
| Tạo có audit | `src/application/use-cases/chapter/create-chapter.use-case.ts` | Kiểm tra quan hệ/slug, ghi audit thành công và thất bại bằng constants/enum. |
| Cập nhật có snapshot | `src/application/use-cases/chapter/update-chapter.use-case.ts` | Lấy dữ liệu cũ, tạo `beforeData`, update và tạo `afterData`. |
| Xóa có audit | `src/application/use-cases/chapter/delete-chapter.use-case.ts` | Chụp dữ liệu trước xóa, xóa và ghi audit thành công. |
| Hợp đồng audit | `src/domain/repositories/admin-audit-log.repository.ts` | `create(CreateLogDto)`, truy vấn theo admin/action/resource và `AuditStatus`. |
| Unit of Work | `src/domain/repositories/unit-of-work.repository.ts` | Tất cả repository, gồm `adminAuditLogRepository`, được lấy trong callback `executeInTransaction`. |
| Update nhiều aggregate | `src/application/use-cases/admin/update-admin.use-case.ts` | Cập nhật `User` và `Admin` trong cùng Unit of Work; đây là mẫu điều phối, nhưng hiện chưa có audit nên không dùng làm chuẩn audit. |

## Quy ước phát hiện từ mã nguồn

- Use case là lớp `@Injectable()` với một public method tên `execute`.
- Dependency hiện hành là `@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork`.
- Repository chỉ lấy từ `repos` trong `executeInTransaction`; không inject Prisma repository cụ thể vào use case.
- Dữ liệu trả về được map vào DTO rồi bọc bằng `BaseResponseDto.success` hoặc `PaginationResponseDto.success`.
- Lỗi dự kiến dùng custom exception của `src/shared/exceptions/custom-exceptions`; thông điệp phải bằng tiếng Việt có dấu.
- `UnitOfWorkRepos` đã có `adminAuditLogRepository`; không tạo repository audit riêng trong use case.

## Quy ước audit quản trị

| Trường | Quy tắc |
| --- | --- |
| `adminId` | Nhận tường minh từ actor đã xác thực, không lấy từ body DTO. |
| `actionKey` | Dùng `ACTION_KEYS`; không hard-code chuỗi. |
| `resourceType` | Dùng `RESOURCE_TYPES`; không hard-code chuỗi. |
| `status` | Dùng enum `AuditStatus.SUCCESS` hoặc `AuditStatus.FAIL`. |
| `resourceId` | Đặt sau khi định danh resource có sẵn; chuyển sang chuỗi theo contract hiện tại. |
| `beforeData` | Chỉ snapshot allowlist trước update/delete. |
| `afterData` | Chỉ snapshot allowlist sau create/update. |
| `errorMessage` | Dùng cho lỗi nghiệp vụ dự kiến; không ghi secret hoặc stack trace nhạy cảm. |

Các use case chapter hiện ghi `FAIL` rồi ném exception trong callback transaction. Vì `IUnitOfWork` chỉ công bố `executeInTransaction`, phải kiểm tra implementation trước khi hứa rằng log lỗi sẽ còn lại sau rollback. Đây là điểm cần ra quyết định kiến trúc khi có yêu cầu lưu audit thất bại bắt buộc.

## Skills liên quan

- `.agent/skills/business-rules/SKILL.md`: quyền, ownership, state transition và lỗi nghiệp vụ.
- `.agent/skills/create-dto/SKILL.md`: DTO đầu vào/đầu ra và validate decorator.
- `.agent/skills/create-validate-decorator/SKILL.md`: tạo decorator khi decorator có sẵn không đáp ứng được validation.
- `.agent/skills/create-prisma-repository/SKILL.md`: contract repository, phân trang và relation options chi tiết.
- `.agent/skills/create-prisma-mapper/SKILL.md`: mapping entity/quan hệ sang persistence model hoặc DTO.
- `.agent/skills/create-enum/SKILL.md`: enum action, resource, status dùng chung.

## Checklist đọc mã trước khi viết feature mới

1. Mở một use case cùng loại hành động trong feature gần nhất.
2. Mở DTO request/response và controller gọi use case đó để xác nhận chữ ký `execute`.
3. Mở interface repository để biết options quan hệ, filter và kiểu trả về.
4. Mở mapper/DTO detail nếu use case phải trả quan hệ.
5. Với admin mutation, xác nhận action/resource constant có sẵn; nếu chưa có, tạo enum/constant theo skill liên quan trước.
