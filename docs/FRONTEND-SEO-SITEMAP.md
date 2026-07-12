# Frontend: crawl sitemap SEO

Các endpoint dưới đây là public, không cần `Authorization`. Backend có prefix `/api`; ví dụ development: `https://api.example.com/api`.

Mỗi endpoint chỉ trả định danh URL và thời điểm cập nhật, không trả HTML, nội dung, đáp án, media hoặc file đính kèm. FE nên dùng các API này để tạo sitemap thay vì các API search/detail.

## Endpoint và route FE

| Nội dung | Endpoint | Route FE |
| --- | --- | --- |
| Câu hỏi | `GET /questions/public/seo/sitemap` | `/thu-vien/cau-hoi/chi-tiet/[slug]` |
| Đề thi | `GET /exams/public/seo/sitemap` | `/thu-vien/de-thi/chi-tiet/[slug]` |
| Tài liệu | `GET /documents/public/seo/sitemap` | `/thu-vien/tai-lieu/{thpt|thcs}/chi-tiet/[slug]` |
| Khóa học online | `GET /courses/public/seo/sitemap` | `/khoa-hoc-online/[code]` |
| Tin tức | `GET /news-articles/public/seo/sitemap` | `/tin-tuc/[slug]` |
| Giáo viên | `GET /teacher-profiles/public/seo/sitemap` | `/doi-ngu/giao-vien/chi-tiet/[slug]` |

## Query parameters

| Field | Kiểu | Mặc định | Quy tắc |
| --- | --- | --- | --- |
| `page` | number | `1` | Tối thiểu `1` |
| `limit` | number | `1000` | Từ `1` đến `1000` |
| `sortBy` | string | `updatedAt` | Chỉ chấp nhận `updatedAt` |
| `sortOrder` | string | `desc` | `asc` hoặc `desc` |

Ví dụ request trang đầu:

```http
GET ${API_BASE_URL}/questions/public/seo/sitemap?page=1&limit=1000&sortBy=updatedAt&sortOrder=desc
```

## Response chung

```json
{
  "success": true,
  "data": [
    {
      "slug": "phan-tich-ham-so-lop-12-cau-001",
      "updatedAt": "2026-07-12T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 1000,
    "total": 9000,
    "totalPages": 9,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

`updatedAt` là chuỗi ISO 8601. Dùng giá trị này làm `lastModified` trong sitemap Next.js.

Riêng sitemap khóa học, field `slug` chính là `code` của khóa học. Ví dụ `{ "slug": "TOAN12-ONLINE" }` tạo URL `/khoa-hoc-online/TOAN12-ONLINE`.

## Quy tắc dữ liệu được crawl

- Câu hỏi: lấy cả `PRIVATE` và `PUBLISHED`; chỉ loại `DRAFT`.
- Đề thi, tài liệu, tin tức và giáo viên: chỉ bản ghi `PUBLISHED`.
- Khóa học online: `PUBLISHED`, `courseType` là `ONLINE` hoặc `ALL`; bao gồm cả khóa học có `isEnded=true` để URL cũ vẫn được crawl.

## Cách crawl tất cả trang

Không gọi đồng thời mọi trang. Bắt đầu ở trang 1, đọc `meta.totalPages`, sau đó gọi từng trang còn lại. Với khoảng 9.000 records, `limit=1000` sẽ có 9 request.

```ts
type SitemapItem = { slug: string; updatedAt: string }

type SitemapResponse = {
  success: true
  data: SitemapItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasPrevious: boolean
    hasNext: boolean
  }
}

async function fetchAllSitemapItems(endpoint: string): Promise<SitemapItem[]> {
  const first = await fetch(`${endpoint}?page=1&limit=1000&sortBy=updatedAt&sortOrder=desc`, {
    next: { revalidate: 3600 },
  }).then((res) => {
    if (!res.ok) throw new Error(`Sitemap request failed: ${res.status}`)
    return res.json() as Promise<SitemapResponse>
  })

  const pages = await Promise.all(
    Array.from({ length: first.meta.totalPages - 1 }, (_, index) => index + 2).map((page) =>
      fetch(`${endpoint}?page=${page}&limit=1000&sortBy=updatedAt&sortOrder=desc`, {
        next: { revalidate: 3600 },
      }).then((res) => res.json() as Promise<SitemapResponse>),
    ),
  )

  return [first, ...pages].flatMap((response) => response.data)
}
```

## Ví dụ dùng trong `app/sitemap.ts`

```ts
import type { MetadataRoute } from 'next'

const API_BASE_URL = process.env.API_BASE_URL!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const questions = await fetchAllSitemapItems(
    `${API_BASE_URL}/questions/public/seo/sitemap`,
  )

  return questions.map((item) => ({
    url: `${SITE_URL}/thu-vien/cau-hoi/chi-tiet/${item.slug}`,
    lastModified: new Date(item.updatedAt),
  }))
}
```

## Lưu ý cho route tài liệu

API sitemap chung chỉ trả `slug` và `updatedAt` theo format thống nhất. Trong khi route FE của tài liệu cần thêm `{thpt|thcs}`, FE phải có quy tắc xác định level riêng (hoặc dùng một nguồn dữ liệu level đã có) trước khi sinh URL. Nếu FE cần backend trả level ngay trong sitemap, cần mở rộng response tài liệu thêm field `level` — điều này sẽ khác format chung hiện tại.
