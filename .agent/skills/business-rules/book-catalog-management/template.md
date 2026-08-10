# Mẫu triển khai catalog sách

## API dự kiến

| Method/path                             | Actor                     | Input                                             | Response                      | Side effect                 |
| --------------------------------------- | ------------------------- | ------------------------------------------------- | ----------------------------- | --------------------------- |
| `GET /api/books`                        | Admin có `BOOK.GET_ALL`   | `BookListQueryDto`                                | Danh sách mọi visibility      | Không                       |
| `GET /api/books/:bookId`                | Admin có `BOOK.GET_BY_ID` | path ID                                           | Chi tiết Book                 | Không                       |
| `POST/PUT/DELETE /api/books...`         | Admin                     | DTO quản trị                                      | Book hoặc `{ deleted: true }` | Audit; xóa chỉ ở DRAFT      |
| `GET /api/books/student/my`             | Student JWT               | `BookListQueryDto` không nhận visibility hiệu lực | Danh sách PUBLISHED           | Không                       |
| `GET /api/books/student/my/:slug`       | Student JWT               | slug                                              | Chi tiết PUBLISHED + contact  | Không                       |
| `POST /api/books/student/my/:slug/view` | Student JWT               | slug                                              | `{ viewCount }`               | Tăng lượt xem PUBLISHED     |
| `GET /api/books/public/seo...`          | Public                    | query/slug                                        | Catalog PUBLISHED             | View endpoint tăng lượt xem |

## Ma trận trạng thái

| Từ          | Trigger      | Đến                        | Từ chối khi                                                     |
| ----------- | ------------ | -------------------------- | --------------------------------------------------------------- |
| `DRAFT`     | Admin update | `PRIVATE` hoặc `PUBLISHED` | PUBLISHED không có cấu hình liên hệ hoặc loại sách không hợp lệ |
| `PRIVATE`   | Admin update | `DRAFT` hoặc `PUBLISHED`   | PUBLISHED không có cấu hình liên hệ                             |
| `PUBLISHED` | Admin update | `DRAFT` hoặc `PRIVATE`     | Không có lỗi trạng thái riêng                                   |
| `DRAFT`     | Admin delete | Đã xóa                     | Book không còn là DRAFT                                         |

## Schema

| Thành phần                      | Thay đổi         | Lý do                                                |
| ------------------------------- | ---------------- | ---------------------------------------------------- |
| `Book`                          | Không thêm field | Student/SEO chỉ là hai bề mặt đọc của cùng aggregate |
| `BookCategory`                  | Không thêm field | Dùng `isActive` hiện có                              |
| `BookSalesContactConfiguration` | Không thêm field | Dùng singleton hotline/Facebook hiện có              |

Không cần migration hoặc backfill cho API StudentFE.

## Trường hợp biên

1. Book bị chuyển khỏi `PUBLISHED` giữa lúc Student/SeoFE đang mở: request detail/view tiếp theo trả `404`.
2. Cấu hình liên hệ bị xóa/thiếu: detail public/student trả `404`, admin phải khôi phục cấu hình trước khi publish.
3. Student dùng token không có `studentId`: guard hoặc use case từ chối, không fallback sang endpoint public.
4. Slug hợp lệ nhưng book `DRAFT`/`PRIVATE`: luôn trả `404`, không tiết lộ trạng thái nội bộ.
