# Books API

Base URL: `/api`. Catalog sách chỉ phục vụ giới thiệu và CTA liên hệ mua thủ công; không có giỏ hàng, đơn hàng, tồn kho hay thanh toán.

## Bề mặt API và xác thực

| Bề mặt    | Prefix                  | Xác thực                          | Dữ liệu thấy được                      |
| --------- | ----------------------- | --------------------------------- | -------------------------------------- |
| AdminFE   | `/api/books`            | Bearer JWT + permission tương ứng | Tất cả `DRAFT`, `PRIVATE`, `PUBLISHED` |
| StudentFE | `/api/books/student/my` | Bearer JWT role `STUDENT`         | Chỉ `PUBLISHED`                        |
| SeoFE     | `/api/books/public/seo` | Không cần JWT                     | Chỉ `PUBLISHED`                        |

Các URL media trong response là signed URL có `expiresAt` và `expirySeconds`; frontend phải tải lại response thay vì lưu URL lâu dài.

## Cấu trúc Book rút gọn

```json
{
  "bookId": 12,
  "sku": "BOOK-ATOMIC-HABITS",
  "isbn": "978-0-7352-1129-2",
  "title": "Atomic Habits",
  "slug": "atomic-habits",
  "shortDescription": "Xây dựng thói quen tốt.",
  "content": "<p>Nội dung chi tiết...</p>",
  "author": "James Clear",
  "publisher": "BEE Books",
  "priceVnd": 199000,
  "visibility": "PUBLISHED",
  "isFeatured": true,
  "viewCount": 25,
  "categories": [
    {
      "bookCategoryId": 3,
      "name": "Kỹ năng sống",
      "slug": "ky-nang-song",
      "description": null,
      "isActive": true,
      "sortOrder": 1
    }
  ],
  "media": [
    {
      "usageId": 90,
      "mediaId": 101,
      "fieldName": "cover",
      "visibility": "PUBLIC",
      "fileName": "atomic-habits.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 120034,
      "type": "IMAGE",
      "viewUrl": "https://storage.example/...",
      "expiresAt": "2026-08-09T12:00:00.000Z",
      "expirySeconds": 3600
    }
  ],
  "createdAt": "2026-08-01T08:00:00.000Z",
  "updatedAt": "2026-08-09T08:00:00.000Z"
}
```

List không có `content`; detail có `content`, metadata SEO (`metaTitle`, `metaDescription`, `ogTitle`, `ogDescription`, `canonicalUrl`, `structuredData`) và, với Student/SEO, thêm `contact`.

## API StudentFE

Tất cả endpoint trong phần này yêu cầu:

```http
Authorization: Bearer <student-access-token>
```

Token không phải role `STUDENT` bị từ chối. Query StudentFE không có field `visibility`; backend luôn chỉ trả sách `PUBLISHED`.

### `GET /api/books/student/my/categories`

Trả các loại sách active để làm bộ lọc.

```json
{
  "success": true,
  "message": "Lấy loại sách dành cho học sinh thành công",
  "data": [
    {
      "bookCategoryId": 3,
      "name": "Kỹ năng sống",
      "slug": "ky-nang-song",
      "description": null,
      "isActive": true,
      "sortOrder": 1
    }
  ]
}
```

### `GET /api/books/student/my`

Query tùy chọn: `page` (mặc định 1), `limit` (mặc định 10), `search`, `categorySlugs`, `isFeatured`, `sortBy` (`bookId|title|priceVnd|isFeatured|viewCount|createdAt|updatedAt`), `sortOrder` (`asc|desc`). `visibility` không được hỗ trợ. Gửi lặp `categorySlugs` để lọc theo nhiều loại sách; kết quả khớp ít nhất một slug. `categorySlug` đơn vẫn hỗ trợ tương thích ngược.

```http
GET /api/books/student/my?page=1&limit=12&categorySlugs=ky-nang-song&categorySlugs=thieu-nhi&isFeatured=true&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <student-access-token>
```

```json
{
  "success": true,
  "message": "Lấy danh sách sách dành cho học sinh thành công",
  "data": [
    {
      "bookId": 12,
      "sku": "BOOK-ATOMIC-HABITS",
      "title": "Atomic Habits",
      "slug": "atomic-habits",
      "shortDescription": "Xây dựng thói quen tốt.",
      "priceVnd": 199000,
      "visibility": "PUBLISHED",
      "isFeatured": true,
      "viewCount": 25,
      "categories": [],
      "media": []
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

### `GET /api/books/student/my/:slug`

```http
GET /api/books/student/my/atomic-habits
Authorization: Bearer <student-access-token>
```

```json
{
  "success": true,
  "message": "Lấy chi tiết sách dành cho học sinh thành công",
  "data": {
    "bookId": 12,
    "title": "Atomic Habits",
    "slug": "atomic-habits",
    "content": "<p>Nội dung chi tiết...</p>",
    "priceVnd": 199000,
    "visibility": "PUBLISHED",
    "categories": [],
    "media": [],
    "contact": {
      "phone": "0901234567",
      "facebookUrl": "https://www.facebook.com/bee.edu.vn"
    }
  }
}
```

### `POST /api/books/student/my/:slug/view`

Gọi tối đa một lần sau khi trang detail render; không có body.

```http
POST /api/books/student/my/atomic-habits/view
Authorization: Bearer <student-access-token>
```

```json
{
  "success": true,
  "message": "Tăng lượt xem sách dành cho học sinh thành công",
  "data": { "viewCount": 26 }
}
```

## API SeoFE công khai

Không gửi access token. Query list giống StudentFE, gồm `categorySlugs` lặp lại với semantics OR, trừ `visibility` luôn do backend ép `PUBLISHED`.

| Endpoint                                | Ví dụ request                                             | Kết quả                                             |
| --------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| `GET /api/books/public/seo/categories`  | `GET /api/books/public/seo/categories`                    | Các loại active                                     |
| `GET /api/books/public/seo`             | `GET /api/books/public/seo?page=1&limit=12&search=atomic` | Pagination Book published, không có `content`       |
| `GET /api/books/public/seo/:slug`       | `GET /api/books/public/seo/atomic-habits`                 | Detail Book published + `contact` + SEO metadata    |
| `POST /api/books/public/seo/:slug/view` | `POST /api/books/public/seo/atomic-habits/view`           | `{ "viewCount": 26 }`                               |
| `GET /api/books/public/seo/sitemap`     | `GET /api/books/public/seo/sitemap?page=1&limit=1000`     | Pagination `{ slug, updatedAt }` cho published book |

Response list/detail/view cùng cấu trúc StudentFE, trừ message. Ví dụ sitemap:

```json
{
  "success": true,
  "data": [{ "slug": "atomic-habits", "updatedAt": "2026-08-09T08:00:00.000Z" }],
  "meta": {
    "page": 1,
    "limit": 1000,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

## API AdminFE

Các endpoint cần Bearer JWT và permission ghi ở bảng.

| Endpoint                                         | Permission                                    | Request / mục đích                           |
| ------------------------------------------------ | --------------------------------------------- | -------------------------------------------- |
| `GET /api/books`                                 | `BOOK.GET_ALL`                                | Query list gồm `visibility`, `categorySlugs` |
| `GET /api/books/:bookId`                         | `BOOK.GET_BY_ID`                              | Chi tiết theo ID                             |
| `POST /api/books`                                | `BOOK.CREATE`                                 | Tạo book, `201 Created` + audit              |
| `PUT /api/books/:bookId`                         | `BOOK.UPDATE`                                 | Cập nhật book + audit                        |
| `PUT /api/books/:bookId/media`                   | `BOOK.UPDATE`                                 | Thay cover, OG image, gallery + audit        |
| `DELETE /api/books/:bookId`                      | `BOOK.DELETE`                                 | Chỉ `DRAFT`; trả `{ deleted: true }` + audit |
| `GET/POST/PUT/DELETE /api/books/categories...`   | `BOOK_CATEGORY.*`                             | Quản lý loại sách + audit mutation           |
| `GET/PUT /api/books/sales-contact-configuration` | `BOOK_SALES_CONTACT_CONFIGURATION.GET/UPDATE` | Đọc/cập nhật hotline và Facebook             |

### Tạo book — `POST /api/books`

```http
POST /api/books
Authorization: Bearer <admin-access-token>
Content-Type: application/json
```

```json
{
  "sku": "BOOK-ATOMIC-HABITS",
  "isbn": "978-0-7352-1129-2",
  "title": "Atomic Habits",
  "slug": "atomic-habits",
  "shortDescription": "Xây dựng thói quen tốt.",
  "content": "<p>Nội dung chi tiết...</p>",
  "author": "James Clear",
  "publisher": "BEE Books",
  "priceVnd": 199000,
  "categoryIds": [3],
  "visibility": "DRAFT",
  "isFeatured": true,
  "autoGenerateSeo": true,
  "metaTitle": "Atomic Habits | Nhà sách BEE",
  "metaDescription": "Giới thiệu Atomic Habits.",
  "structuredData": { "@context": "https://schema.org", "@type": "Book" },
  "coverMediaId": 101,
  "ogImageMediaId": 102,
  "galleryMediaIds": [103, 104]
}
```

`sku`, `title`, `priceVnd >= 1` và `categoryIds` là bắt buộc. SKU, ISBN (nếu có) và slug là unique. Category phải active; media phải `READY`. Không thể đặt `visibility=PUBLISHED` nếu chưa có sales contact configuration.

`autoGenerateSeo` là boolean tùy chọn, mặc định `false`. Khi đặt `true`, backend gọi AI để sinh các metadata chữ gồm `targetKeyword`, `keywordText`, `metaTitle`, `metaDescription`, `ogTitle`, `ogDescription`, `searchIntent`, `seoScore`; đồng thời tạo JSON-LD `structuredData` an toàn từ dữ liệu book đã gửi. Giá trị SEO được gửi trong body vẫn được ưu tiên; `canonicalUrl` luôn do AdminFE cung cấp. Nếu AI trả lỗi, request thất bại và Book/media không được tạo.

### Ý nghĩa các media ID

| Field             | Vai trò                                                                                                                                                          | Quy tắc cập nhật                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `coverMediaId`    | Một ảnh bìa chính cho card/list/detail Book; được lưu với `fieldName: COVER`.                                                                                    | Gửi `null` để gỡ ảnh bìa; bỏ field để không thay đổi khi update.                  |
| `ogImageMediaId`  | Một ảnh riêng dành cho Open Graph (`og:image`) khi chia sẻ Book lên Facebook/Zalo và các mạng xã hội; không bắt buộc trùng cover. Lưu với `fieldName: OG_IMAGE`. | Gửi `null` để gỡ; bỏ field để giữ nguyên.                                         |
| `galleryMediaIds` | Danh sách ảnh phụ hiển thị thành gallery/carousel ở trang chi tiết; từng phần tử được lưu với `fieldName: GALLERY`.                                              | Gửi `[]` để xóa toàn bộ gallery; bỏ field để giữ nguyên. Không được lặp media ID. |

Mọi media ID phải trỏ tới media `READY`. Các URL trong response là signed URL có hạn, nên frontend phải tải lại Book thay vì lưu lâu dài URL đó.

Success trả `201` với `BaseResponseDto<BookResponseDto>` như cấu trúc Book phía trên; mutation ghi audit.

### Cập nhật book — `PUT /api/books/:bookId`

Body là một phần của request tạo (mọi field optional). Ví dụ xuất bản:

```json
{
  "visibility": "PUBLISHED",
  "isFeatured": true,
  "categoryIds": [3]
}
```

### Cập nhật media — `PUT /api/books/:bookId/media`

```json
{
  "coverMediaId": 101,
  "ogImageMediaId": null,
  "galleryMediaIds": [103, 104]
}
```

`null` gỡ cover/OG image, `[]` xóa toàn bộ gallery. Response là Book mới với media signed URL.

### Category và cấu hình liên hệ

```json
{
  "name": "Kỹ năng sống",
  "slug": "ky-nang-song",
  "description": "Sách kỹ năng.",
  "isActive": true,
  "sortOrder": 1
}
```

```json
{
  "phone": "0901234567",
  "facebookUrl": "https://www.facebook.com/bee.edu.vn"
}
```

Ví dụ response tạo/cập nhật category:

```json
{
  "success": true,
  "message": "Tạo loại sách thành công",
  "data": {
    "bookCategoryId": 3,
    "name": "Kỹ năng sống",
    "slug": "ky-nang-song",
    "description": "Sách kỹ năng.",
    "isActive": true,
    "sortOrder": 1
  }
}
```

Ví dụ response cập nhật cấu hình liên hệ:

```json
{
  "success": true,
  "message": "Cập nhật cấu hình liên hệ bán sách thành công",
  "data": {
    "phone": "0901234567",
    "facebookUrl": "https://www.facebook.com/bee.edu.vn"
  }
}
```

Ví dụ response xóa book/category hợp lệ:

```json
{
  "success": true,
  "message": "Xóa sách thành công",
  "data": { "deleted": true }
}
```

Category đang được một book dùng không thể xóa; hãy đặt `isActive: false`. Chỉ book `DRAFT` có thể xóa.

## Lỗi frontend cần xử lý

| HTTP                   | Khi xảy ra                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`                  | DTO/query không hợp lệ, ví dụ `priceVnd < 1`, enum/sort không hợp lệ                                                                            |
| `401`                  | Thiếu hoặc token JWT không hợp lệ ở Admin/Student API                                                                                           |
| `403`                  | Token không phải học sinh với Student API, hoặc admin thiếu permission                                                                          |
| `404`                  | Book/slug không tồn tại, không published, hoặc detail public/student thiếu sales contact configuration                                          |
| `409` / business error | Trùng SKU/ISBN/slug, category không active, media chưa READY, xuất bản chưa có contact, xóa book không ở DRAFT hoặc xóa category đang được dùng |

Tham khảo luồng giao diện: [AdminFE](admin-book-catalog-flow.md), [StudentFE](student-book-catalog-flow.md), [SeoFE](seo-book-catalog-flow.md).
