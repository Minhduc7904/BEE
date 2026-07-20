---
name: create-application-use-case
description: Viết hoặc cập nhật application use case cho dự án BEE, gồm get danh sách, get detail, create, update, delete và thao tác quản trị có audit log. Dùng khi tạo luồng ứng dụng trong src/application/use-cases, điều phối repository/Unit of Work, áp dụng quy tắc nghiệp vụ, phân trang, DTO phản hồi hoặc ghi nhật ký quản trị.
---

# Viết Application Use Case

## Mục tiêu

Viết một use case chỉ điều phối luồng ứng dụng: nhận dữ liệu đã được controller chuẩn hóa, áp dụng quy tắc nghiệp vụ, gọi domain repository qua `IUnitOfWork`, chuyển kết quả sang response DTO và trả về response chuẩn. Không đặt Prisma, HTTP request/response hoặc chi tiết hạ tầng vào use case.

Mỗi use case biểu diễn đúng một hành động: `GetAll...`, `Get...`, `Create...`, `Update...` hoặc `Delete...`. Đặt tệp tại `src/application/use-cases/<feature>/` và dùng tên lớp tương ứng.

## Tệp phải đọc trước khi thực hiện

1. Đọc `reference-files.md` của skill này để chọn mẫu gần nhất trong mã nguồn.
2. Đọc `template.md` để lấy khung cho loại hành động cần viết.
3. Đọc skill `business-rules` nếu có quyền sở hữu, trạng thái, ràng buộc hay lỗi nghiệp vụ.
4. Đọc skill `create-dto` khi cần DTO đầu vào/đầu ra; DTO đầu vào phải dùng validate decorator phù hợp.
5. Đọc skill `create-prisma-repository` khi cần bổ sung phương thức repository hoặc options quan hệ.
6. Đọc skill `create-prisma-mapper` khi response cần ánh xạ entity có quan hệ; dùng enum dùng chung khi có.
7. Đọc skill `create-enum` trước khi thêm action, resource type hoặc trạng thái enum mới.

Khi sửa một lớp hoặc phương thức use case đang tồn tại, chạy GitNexus impact analysis trước khi sửa. So sánh thêm với module gần nhất để giữ cách đăng ký DI, exception và response nhất quán.

## Quy trình chung

1. Xác định hành động, actor, resource, quyền, dữ liệu đầu vào/đầu ra và có bắt buộc audit hay không.
2. Chọn repository contract ở domain; không gọi Prisma client từ application.
3. Inject `IUnitOfWork` bằng `@Inject('UNIT_OF_WORK')`. Lấy repository từ `repos` trong `executeInTransaction`.
4. Kiểm tra dữ liệu tồn tại, ràng buộc unique, quan hệ tham chiếu, quyền và state transition trước khi ghi dữ liệu.
5. Dùng exception dùng chung phù hợp như `NotFoundException`, `ConflictException`, `BusinessLogicException`; không trả `null` hoặc tự tạo HTTP response.
6. Chuyển entity sang response DTO và bọc bằng `BaseResponseDto.success(...)` hoặc `PaginationResponseDto.success(...)` theo quy ước module.
7. Chỉ đăng ký/export use case và controller theo module hiện hữu sau khi luồng chính hoàn chỉnh.

Không bắt buộc viết unit test vì dự án hiện chưa có luồng này. Tối thiểu kiểm tra typecheck/build và đối chiếu chữ ký controller, DTO, repository.

## Mẫu theo từng hành động

### Get danh sách

- Nhận query DTO, gọi các hàm chuyển đổi options có sẵn như `to...PaginationOptions()` và `to...FilterOptions()`.
- Validate trường sắp xếp/giới hạn truy vấn tại DTO hoặc use case theo quy ước module.
- Gọi repository phân trang với `skip`, `take`, sort, filter và các relation options thật sự cần thiết.
- Map danh sách sang response DTO rồi trả `PaginationResponseDto.success` với `data`, `page`, `limit`, `total` và `totalPages`.
- Không ghi audit log cho thao tác chỉ đọc trừ khi yêu cầu nghiệp vụ nêu rõ.

### Get detail

- Nhận `id`, tìm resource bằng phương thức repository phù hợp.
- Nếu resource không tồn tại, ném `NotFoundException` có thông điệp tiếng Việt có dấu.
- Chỉ yêu cầu các quan hệ cần cho response detail bằng options tường minh, ví dụ `includeSubject: true`; không dùng một cờ bao quát kiểu `includeRelations`.
- Map bằng DTO detail; không trả entity/domain model trực tiếp.

### Create

- Kiểm tra các khóa ngoại, slug/unique, quyền tạo và ràng buộc nghiệp vụ trước khi gọi `create`.
- Với thao tác quản trị, nhận `adminId` tường minh từ controller/current user, không lấy actor từ body DTO.
- Ghi resource, map response và ghi audit `SUCCESS` trong cùng Unit of Work.
- Audit thành công dùng hằng số `ACTION_KEYS`, `RESOURCE_TYPES`, enum `AuditStatus`; có `adminId`, `resourceId` khi đã có, `afterData` đã lọc trường nhạy cảm.

### Update

- Đọc resource hiện tại trước để kiểm tra tồn tại, quyền và so sánh thay đổi.
- Kiểm tra unique/foreign key/state transition trước khi cập nhật.
- Với admin mutation, chụp `beforeData` tối thiểu, không chứa mật khẩu, token hay dữ liệu nhạy cảm.
- Cập nhật, lấy/map dữ liệu sau cập nhật nếu response cần quan hệ mới, rồi ghi audit `SUCCESS` với `beforeData` và `afterData` đã lọc.
- Nếu không có thay đổi thực sự, trả dữ liệu hiện có theo quy ước module; không tạo audit thành công giả cho một mutation không diễn ra.

### Delete

- Đọc resource trước khi xóa để kiểm tra tồn tại, quyền, ownership và dependency theo business rules.
- Chụp `beforeData` tối thiểu trước khi xóa.
- Xóa trong Unit of Work, sau đó ghi audit `SUCCESS` với `resourceId` và `beforeData`.
- Trả response xóa chuẩn, ví dụ `BaseResponseDto.success('Xóa ... thành công', { deleted: true })`, theo DTO/module hiện hữu.

## Audit log cho use case quản trị

Áp dụng bắt buộc cho mọi hành động quản trị làm thay đổi dữ liệu (`create`, `update`, `delete` và các thay đổi trạng thái). Mặc định không audit `get`/`get detail`/`get list`, trừ khi yêu cầu nghiệp vụ yêu cầu theo dõi truy cập.

1. Inject `UNIT_OF_WORK`; lấy cả repository resource và `repos.adminAuditLogRepository` trong cùng callback transaction.
2. Actor là `adminId` rõ ràng trong chữ ký `execute`, do controller truyền từ xác thực hiện hành.
3. Dùng `ACTION_KEYS.<RESOURCE>.<ACTION>`, `RESOURCE_TYPES.<RESOURCE>` và `AuditStatus.SUCCESS`/`AuditStatus.FAIL`; không dùng chuỗi tự do hay enum cục bộ.
4. Audit thành công phải được ghi sau mutation thành công và cùng transaction, để không có log thành công nếu dữ liệu không được ghi.
5. Chỉ lưu snapshot allowlist cần truy vết; không log password hash, token, secret, dữ liệu xác thực hoặc payload quá lớn.
6. Khi cần audit thất bại, ghi `FAIL` với `errorMessage` và `resourceId` nếu đã xác định. Kiểm tra ngữ nghĩa rollback của `IUnitOfWork` trước khi cam kết rằng log lỗi sẽ được lưu: log ghi trong transaction rồi ném lỗi có thể cùng bị rollback. Nếu yêu cầu bắt buộc lưu lỗi sau rollback, thiết kế cơ chế audit tách transaction và xin xác nhận trước khi thay đổi kiến trúc.

## Điều không được làm

- Không gọi Prisma client, mapper Prisma hoặc HTTP request/response trong use case.
- Không đưa logic nghiệp vụ xuống controller hoặc repository chỉ để use case ngắn hơn.
- Không truyền `any`; dùng `UnitOfWorkRepos`, DTO hoặc kiểu domain cụ thể.
- Không include toàn bộ quan hệ theo mặc định; chỉ bật từng relation cần thiết cho response.
- Không ghi audit từ controller hay bằng chuỗi action/resource tự viết.
- Không thêm enum trùng lặp; dùng enum dùng chung hoặc tạo theo skill `create-enum`.

## Kiểm tra trước khi bàn giao

- [ ] Tên lớp/tệp, input DTO và response DTO đúng với action.
- [ ] Repository được lấy qua `IUnitOfWork`; options quan hệ tường minh.
- [ ] Tồn tại, quyền, unique, khóa ngoại và business rule đã được kiểm tra trước mutation.
- [ ] Admin mutation có audit `SUCCESS` với action/resource enum và snapshot an toàn.
- [ ] Chính sách `FAIL` đã xét đến rollback transaction.
- [ ] Không thêm yêu cầu unit test; build/typecheck không có lỗi liên quan.
