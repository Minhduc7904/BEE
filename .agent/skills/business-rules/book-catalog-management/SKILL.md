# Quản lý catalog sách cho Admin, Student và SEO

## Phạm vi và thuật ngữ

- **Book** là sản phẩm catalog chỉ để giới thiệu và liên hệ mua thủ công; không tạo giỏ hàng, đơn hàng hay thanh toán.
- **AdminFE** quản lý sách, loại sách, media và cấu hình liên hệ bán sách.
- **StudentFE** là bề mặt catalog có JWT, chỉ dành cho role học sinh.
- **SeoFE** là bề mặt công khai không đăng nhập, dùng để render trang và sitemap.
- `PUBLISHED` là trạng thái duy nhất có thể xuất hiện trên StudentFE hoặc SeoFE.

## Actor, ownership và trạng thái

| Actor       | Phạm vi                                                                           | Cơ chế bảo vệ                                                                    |
| ----------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Admin       | Toàn bộ Book, BookCategory, cấu hình liên hệ và media liên kết                    | Permission `BOOK`, `BOOK_CATEGORY`, `BOOK_SALES_CONTACT_CONFIGURATION` tương ứng |
| Student     | Chỉ đọc Book/BookCategory `PUBLISHED` hoặc active; không sở hữu và không sửa Book | JWT role `STUDENT` qua `StudentOnly()`                                           |
| SeoFE/khách | Chỉ đọc Book `PUBLISHED`, loại active, sitemap; có thể ghi nhận lượt xem          | Public route, backend vẫn ép điều kiện `PUBLISHED`                               |

`Book.visibility` chuyển giữa `DRAFT`, `PRIVATE`, `PUBLISHED`. Không có trạng thái mua sách hay trạng thái đơn hàng.

## Luồng backend

1. Admin tạo/cập nhật sách trong Unit of Work. Backend kiểm tra SKU, ISBN, slug, loại sách active và media `READY`.
2. Khi chuyển sang `PUBLISHED`, backend bắt buộc có cấu hình hotline/Facebook. Mọi mutation admin tạo audit cùng transaction.
3. List/detail Student xác thực role học sinh, ép visibility `PUBLISHED` trong use case, không tin `visibility` từ query. Detail chỉ trả khi cấu hình liên hệ còn tồn tại.
4. List/detail SeoFE áp dụng cùng điều kiện `PUBLISHED`, nhưng không cần JWT. Sitemap chỉ trả slug và thời điểm cập nhật của sách published.
5. Endpoint view chỉ tăng `viewCount` khi sách vẫn published. StudentFE và SeoFE gọi tối đa một lần sau khi trang detail hiển thị.

### Lọc catalog theo nhiều loại sách

- List Admin, Student và SeoFE nhận `categorySlugs` lặp lại trong query. Một Book khớp khi thuộc **ít nhất một** slug được gửi (semantics OR); không yêu cầu phải thuộc toàn bộ loại sách.
- `categorySlug` đơn vẫn được chấp nhận để tương thích frontend cũ. Nếu gửi cả hai field, backend hợp nhất và khử trùng lặp slug trước khi query.
- Filter chỉ giới hạn tập Book sau khi policy visibility của từng bề mặt đã được áp dụng; không thể dùng category để lộ Book `DRAFT` hoặc `PRIVATE` ở StudentFE/SeoFE.

## Tạo SEO tự động khi tạo Book

- Actor: Admin có quyền `BOOK.CREATE`.
- Input tin cậy: `CreateBookDto.autoGenerateSeo`; mặc định là `false`.
- Khi `autoGenerateSeo=true`, backend gọi AI **trước** Unit of Work để sinh metadata chữ. Các field admin đã gửi (`targetKeyword`, `keywordText`, `metaTitle`, `metaDescription`, `ogTitle`, `ogDescription`, `searchIntent`, `seoScore`, `structuredData`) luôn được ưu tiên; `canonicalUrl` không do AI tạo.
- Backend tự tạo JSON-LD `Book` chỉ từ title, author, publisher và price đã gửi; không dùng AI để bịa thông tin catalogue.
- Nếu AI lỗi hoặc trả dữ liệu không parse được, toàn bộ request tạo Book bị từ chối trước khi mở transaction; không được tạo Book, `MediaUsage` hay audit dở dang.
- Audit tạo Book phải lưu cờ `autoGenerateSeo`, không lưu prompt, raw output AI hay nội dung có thể nhạy cảm.

## Luồng frontend

### AdminFE

1. Cấu hình hotline/Facebook trước khi xuất bản.
2. Quản lý loại sách, soạn `DRAFT`, gắn media rồi chuyển `PUBLISHED`.
3. Dùng API admin để xem cả `DRAFT`, `PRIVATE`, `PUBLISHED`; không dùng endpoint Student/SEO để preview dữ liệu private.
4. Chỉ xóa book ở `DRAFT`; khi lỗi rule, hiển thị message backend và không tự thay đổi trạng thái trên UI.

### StudentFE

1. Chỉ gọi `/api/books/student/my...` sau khi có access token role học sinh.
2. Render catalog/detail từ response backend; không tự thêm sách private hoặc draft bằng slug.
3. Dùng `contact.phone` và `contact.facebookUrl` cho CTA. CTA không tạo request mua hoặc payment.

### SeoFE

1. Gọi `/api/books/public/seo...` không kèm JWT.
2. Dùng metadata, structured data và media URL từ response để render SEO; URL media là có hạn, cần tải lại response khi hết hạn.
3. Sitemap chỉ lập URL từ các item backend trả về.

## Guardrail

- Không cho StudentFE truyền `studentId`, `visibility` hoặc book ID để vượt quyền; identity lấy từ JWT, Student query DTO không có `visibility` và use case vẫn ép published.
- Không lộ `DRAFT`/`PRIVATE` qua list, detail, sitemap hoặc endpoint view public/student.
- Không thêm order/payment/SePay cho book khi chưa có business rule và aggregate riêng.
- Không xóa file media gốc khi xóa sách; chỉ gỡ `MediaUsage` và liên kết category.

## Checklist thực thi

- [ ] Route student dùng `StudentOnly()` và route tĩnh đứng trước `:bookId`.
- [ ] Student/SEO list, detail và view đều kiểm tra `PUBLISHED` tại backend.
- [ ] Admin mutation ghi audit, còn read không ghi audit mặc định.
- [ ] Tài liệu API ghi rõ actor, auth, request/query, response, ví dụ và lỗi.
- [ ] Không có schema hay migration mới cho việc thêm bề mặt StudentFE vì tái dùng aggregate Book hiện có.
