# Business Rules — Catalog sách và liên hệ mua thủ công

## BR-BOOK-01 — Phạm vi bán sách

Catalog sách là kênh giới thiệu công khai. Hệ thống chỉ hiển thị giá và CTA gọi hotline/nhắn Facebook; không có giỏ hàng, yêu cầu mua, đơn hàng, tồn kho, hoàn tiền, thanh toán hay tích hợp SePay cho sách.

## BR-BOOK-02 — Danh mục sách

- Mỗi loại sách có tên, slug duy nhất, mô tả, thứ tự hiển thị và trạng thái hoạt động.
- Một sách có thể thuộc nhiều loại, và một loại có thể chứa nhiều sách.
- Chỉ loại đang hoạt động mới được gắn vào sách khi tạo hoặc cập nhật.
- Loại đã được ít nhất một sách sử dụng không được xóa. Admin phải chuyển `isActive` thành `false` khi muốn ngừng dùng.

## BR-BOOK-03 — Định danh và giá sách

- `sku` là bắt buộc và duy nhất toàn catalog.
- `isbn` là tùy chọn; khi được cung cấp, ISBN phải duy nhất toàn catalog.
- Slug SEO của sách phải duy nhất. Nếu admin không nhập slug, hệ thống sinh từ tiêu đề và bảo đảm không trùng.
- `priceVnd` là giá bán bắt buộc, số nguyên dương theo VND. Hệ thống không hỗ trợ đa tiền tệ, giá âm, giá bằng 0 hoặc quy đổi tiền tệ.

## BR-BOOK-04 — Hiển thị và xuất bản

- Sách có `DRAFT`, `PRIVATE` hoặc `PUBLISHED`.
- Chỉ `PUBLISHED` được trả từ API danh sách, chi tiết, sitemap và tăng lượt xem công khai.
- `DRAFT` và `PRIVATE` không được lộ qua endpoint công khai, kể cả khi người dùng biết slug.
- Chỉ được xuất bản khi cấu hình liên hệ bán sách dùng chung đã tồn tại.
- Chỉ sách `DRAFT` được xóa. Trước khi xóa sách đã xuất bản hoặc riêng tư, admin phải chuyển sách về `DRAFT`.
- Khi xóa sách, hệ thống gỡ liên kết loại sách và liên kết media. Tệp media gốc vẫn được giữ lại.

## BR-BOOK-05 — Media sách

- Sách có thể liên kết một ảnh cover, nhiều ảnh gallery và một ảnh Open Graph.
- Chỉ media có trạng thái `READY` được phép gắn.
- Một media ID không được lặp trong cùng một nhóm media của request.
- Liên kết media của sách có visibility `PUBLIC`; gallery được trả theo thứ tự liên kết.
- Tất cả API GET sách trả media kèm `viewUrl` đã ký và thông tin hết hạn URL. Chỉnh media dùng endpoint riêng, không ghi trực tiếp vào bảng `Book`.

## BR-BOOK-06 — Cấu hình liên hệ bán sách

- Catalog dùng một cấu hình toàn cục duy nhất gồm `phone` và `facebookUrl`; admin có quyền riêng để cập nhật cấu hình này.
- Trang sách công khai trả hai giá trị này trong `contact` để frontend tạo liên kết `tel:` và Facebook.
- Nếu cấu hình bị thiếu, sách không được xuất bản. Một trang chi tiết công khai cũng không được trả nếu không có cấu hình liên hệ hợp lệ.
- Bấm CTA chỉ chuyển người dùng ra cuộc gọi/Facebook. Backend không lưu ý định mua hay bất cứ dữ liệu giao dịch nào.

## BR-BOOK-07 — Khám phá công khai, lượt xem và sitemap

- Danh sách công khai hỗ trợ phân trang, tìm kiếm, lọc theo slug loại sách và lọc sách nổi bật.
- Endpoint chi tiết theo slug chỉ phục vụ sách đã xuất bản.
- Mỗi request tăng lượt xem chỉ hợp lệ với sách đã xuất bản; frontend nên gọi tối đa một lần mỗi lần hiển thị trang.
- Sitemap chỉ chứa `{ slug, updatedAt }` của sách đã xuất bản.

## BR-BOOK-08 — SEO

- Sách có thể lưu metadata SEO: meta title/description, Open Graph, canonical URL, structured data, từ khóa, search intent và SEO score.
- Metadata được trả cùng dữ liệu công khai của sách để frontend render thẻ SEO. Nếu một field không được nhập, frontend chỉ dùng fallback đã được thống nhất ở tầng hiển thị; không tự suy diễn trạng thái xuất bản.

## BR-BOOK-09 — Quyền hạn, nhất quán và audit

- Quản lý sách, loại sách và cấu hình liên hệ là ba nhóm permission độc lập.
- Mọi mutation của ba nhóm này được thực hiện nhất quán trong transaction và tạo bản ghi audit cùng thao tác.
- Kiểm tra uniqueness, trạng thái loại sách, trạng thái media và điều kiện xuất bản luôn được backend thực thi; frontend chỉ hỗ trợ trải nghiệm, không phải nguồn quyết định nghiệp vụ.
