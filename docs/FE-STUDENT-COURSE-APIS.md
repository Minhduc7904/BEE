# API cho trang khóa học của học sinh

Luồng màn hình và thứ tự gọi API dành cho student đã đăng nhập nằm tại [COURSE-STUDENT-PAGE-FLOW.md](./COURSE-STUDENT-PAGE-FLOW.md).

Tài liệu này mô tả các API FE cần gọi để xây dựng trang tổng quan khóa học, theo dõi bài học mới, tiến độ học và bài tập về nhà của học sinh.

## Quy ước chung

- Base URL trong ví dụ: `/api`.
- Tất cả API trong tài liệu dùng JWT của học sinh:

  ```http
  Authorization: Bearer <access_token>
  ```

- `studentId` luôn lấy từ JWT, FE không truyền `studentId`.
- API chỉ trả dữ liệu thuộc course có enrollment `ACTIVE`.
- Lesson phải có `visibility = PUBLISHED` và phải đi qua kiểm tra quyền xem theo class.

### Quy tắc quyền xem lesson theo class

Backend dùng `StudentClassLessonAccessService`, cùng rule với `GetStudentCourseLessonsUseCase`:

1. Tìm các class của học sinh trong course.
2. Nếu học sinh chưa thuộc class nào trong course, lesson `PUBLISHED` vẫn được hiển thị.
3. Nếu lesson chưa có cấu hình `course_class_lessons` cho class của học sinh, lesson vẫn được hiển thị.
4. Khi tất cả class của học sinh đã có cấu hình cho lesson, lesson chỉ hiển thị nếu có ít nhất một cấu hình thỏa:
   - `isVisible = true`;
   - chưa đến `availableUntil`;
   - đã qua `availableFrom`.

FE không tự lọc lại lesson theo class hoặc thời gian; kết quả backend đã là nguồn dữ liệu cuối cùng.

## 1. Lấy các lesson mới nhất

```http
GET /api/lessons/student/latest?page=1&limit=10
```

Mục đích: hiển thị khu vực “Bài học mới” trên trang tổng quan khóa học.

### Query

| Tham số | Kiểu | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `page` | number | `1` | Tối thiểu 1 |
| `limit` | number | `10` | Từ 1 đến 100 |

### Rule

- Chỉ lấy lesson trong các course học sinh đang có enrollment `ACTIVE`.
- Chỉ lấy lesson `PUBLISHED` mà học sinh được xem qua class.
- Sắp xếp mới nhất theo `createdAt DESC`, nếu bằng nhau dùng `updatedAt DESC`.
- Mỗi lesson có danh sách learning item và tiến độ của chính học sinh.

### Response mẫu

```json
{
  "success": true,
  "message": "Lấy danh sách bài học mới nhất thành công",
  "data": [
    {
      "lessonId": 21,
      "courseId": 80,
      "courseName": "Toán 12",
      "title": "Khảo sát hàm số",
      "description": "Bài học mới",
      "visibility": "PUBLISHED",
      "orderInCourse": 3,
      "allowTrial": false,
      "createdAt": "2026-07-15T08:00:00.000Z",
      "updatedAt": "2026-07-15T08:00:00.000Z",
      "learningItems": [
        {
          "learningItemId": 101,
          "learningItemName": "Video lý thuyết",
          "type": "VIDEO",
          "order": 1,
          "isLearned": true,
          "learnedAt": "2026-07-15T09:00:00.000Z",
          "studentLearningItem": {
            "studentId": 5,
            "learningItemId": 101,
            "isLearned": true,
            "learnedAt": "2026-07-15T09:00:00.000Z"
          }
        }
      ],
      "totalLearningItems": 4,
      "completedLearningItems": 1,
      "completionPercentage": 25
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

FE có thể dùng `completionPercentage` cho progress bar của lesson và dùng `learningItems[].isLearned` để hiển thị trạng thái từng mục.

## 2. Lấy danh sách learning item đã học

```http
GET /api/lesson-learning-items/student/learned?page=1&limit=10
```

Mục đích: hiển thị lịch sử hoặc danh sách các mục học tập mà học sinh đã đánh dấu hoàn thành.

### Query

| Tham số | Kiểu | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `page` | number | `1` | Tối thiểu 1 |
| `limit` | number | `10` | Từ 1 đến 100 |

### Rule

- Chỉ lấy `StudentLearningItem` có `isLearned = true` của học sinh hiện tại.
- Learning item phải thuộc ít nhất một lesson mà học sinh được xem qua enrollment và class.
- Mỗi learning item chỉ xuất hiện một lần.
- `lessons` chỉ chứa các lesson/course mà học sinh hiện tại được phép xem.
- Sắp xếp theo `learnedAt DESC`, sau đó `updatedAt DESC`.

### Response mẫu

```json
{
  "success": true,
  "message": "Lấy danh sách mục học tập đã học thành công",
  "data": [
    {
      "studentId": 5,
      "learningItemId": 101,
      "isLearned": true,
      "learnedAt": "2026-07-15T09:00:00.000Z",
      "createdAt": "2026-07-15T09:00:00.000Z",
      "updatedAt": "2026-07-15T09:00:00.000Z",
      "learningItem": {
        "learningItemId": 101,
        "type": "VIDEO",
        "title": "Video lý thuyết",
        "description": "Nội dung bài học",
        "createdAt": "2026-07-14T08:00:00.000Z",
        "updatedAt": "2026-07-14T08:00:00.000Z"
      },
      "lessons": [
        {
          "lessonId": 21,
          "lessonTitle": "Khảo sát hàm số",
          "courseId": 80,
          "courseCode": "TOAN12",
          "courseTitle": "Toán 12",
          "order": 1
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

Khi FE cần nội dung đầy đủ của item, gọi `GET /api/learning-items/:learningItemId/student`.

## 3. Lấy danh sách bài tập về nhà

```http
GET /api/learning-items/student/my-homeworks?page=1&limit=10&status=ALL
```

Mục đích: hiển thị danh sách learning item loại `HOMEWORK`, nội dung bài tập và bài nộp hiện tại nếu học sinh đã nộp.

### Query

| Tham số | Kiểu | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `page` | number | `1` | Tối thiểu 1 |
| `limit` | number | `10` | Từ 1 đến 100 |
| `status` | `ALL \| INCOMPLETE \| COMPLETED \| OVERDUE` | `ALL` | Lọc theo trạng thái HomeworkSubmit/deadline |
| `search` | string | — | Tìm theo title/description |
| `courseId` | number | — | Chỉ nhận course đã enrollment `ACTIVE` |
| `lessonId` | number | — | Lesson phải đi qua quyền xem class |
| `homeworkType` | `COMPETITION \| FILE_UPLOAD` | — | Bỏ trống để lấy cả hai loại homework |
| `sortBy` | `createdAt \| updatedAt \| title` | `createdAt` | Trường sắp xếp |
| `sortOrder` | `asc \| desc` | `desc` | Chiều sắp xếp |

### Rule

- Chỉ lấy learning item loại `HOMEWORK` thuộc lesson mà học sinh được xem qua class.
- Không truyền `homeworkType` thì include toàn bộ `homeworkContents`; có truyền thì chỉ trả content đúng loại.
- Mỗi homework content có `homeworkSubmit` nếu học sinh đã nộp.
- `INCOMPLETE`: learning item chưa có `HomeworkSubmit` của học sinh.
- `COMPLETED`: learning item đã có ít nhất một `HomeworkSubmit` của học sinh.
- `OVERDUE` với `FILE_UPLOAD`: `dueDate` của homework đã hết hạn.
- `OVERDUE` với `COMPETITION`: `dueDate` của homework hoặc `endDate` của competition đã hết hạn; chỉ cần một trong hai hết hạn.
- `dueDate` hoặc `endDate` bằng `null` nghĩa là deadline tương ứng không giới hạn.
- `FILE_UPLOAD` không trả `mediaIds`, `attachments`, metadata file hoặc URL file.
- `isSubmitted`, `isGraded`, `isOverdue`, `canSubmit`, `points`, `feedback` được cung cấp sẵn để FE hiển thị nhanh.
- Các field không có dữ liệu trả `null`; các mảng không có dữ liệu trả `[]`.
- Response không còn trả object Prisma thô `learningItem` và `studentLearningItem`; FE dùng các field đã chuẩn hóa trực tiếp trên mỗi item.

### Response mẫu

```json
{
  "success": true,
  "message": "Lấy danh sách bài tập thành công",
  "data": [
    {
      "learningItemId": 205,
      "title": "Bài tập khảo sát hàm số",
      "description": "Hoàn thành các câu hỏi",
      "type": "HOMEWORK",
      "createdAt": "2026-07-15T09:00:00.000Z",
      "updatedAt": "2026-07-15T09:00:00.000Z",
      "isLearned": false,
      "learnedAt": null,
      "lessonId": 21,
      "lessonTitle": "Khảo sát hàm số",
      "courseId": 80,
      "homeworkContents": [
        {
          "homeworkContentId": 301,
          "type": "FILE_UPLOAD",
          "content": "Nộp file PDF",
          "dueDate": "2026-07-20T16:59:59.000Z",
          "allowLateSubmit": true,
          "competitionId": null,
          "competition": null,
          "isSubmitted": true,
          "submittedAt": "2026-07-18T09:00:00.000Z",
          "isGraded": true,
          "points": 8.5,
          "feedback": "Bài làm tốt",
          "isOverdue": false,
          "canSubmit": false,
          "homeworkSubmit": {
            "homeworkSubmitId": 401,
            "homeworkContentId": 301,
            "competitionSubmitId": null,
            "submitAt": "2026-07-18T09:00:00.000Z",
            "content": "Nội dung/file bài nộp",
            "points": 8.5,
            "gradedAt": "2026-07-19T09:00:00.000Z",
            "graderId": 5,
            "feedback": "Bài làm tốt",
            "createdAt": "2026-07-18T09:00:00.000Z",
            "updatedAt": "2026-07-19T09:00:00.000Z"
          }
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

`homeworkSubmit` bằng `null` nếu học sinh chưa nộp bài. FE nên dùng `isSubmitted`, `isOverdue` và `canSubmit` để quyết định trạng thái nút.

## Các API liên quan khi điều hướng

| Màn hình/thao tác | API |
| --- | --- |
| Danh sách course đã tham gia, tiến độ và thumbnail | `GET /api/course-enrollments/student/my?search=toán&grade=12&subjectId=1` |
| Danh sách course đã tham gia, sắp xếp theo tiến độ | `GET /api/course-enrollments/student/my/by-progress?sortOrder=desc&search=toán&grade=12&subjectId=1` |
| Course online chưa đăng ký, kèm thumbnail và avatar giáo viên | `GET /api/courses/student/online-not-enrolled` |
| Chi tiết course | `GET /api/courses/student/:courseId` |
| Tất cả lesson được phép xem trong course | `GET /api/lessons/student/course/:courseId` |
| Chi tiết một lesson | `GET /api/lessons/:lessonId/student` |
| Danh sách learning item trong lesson | `GET /api/lesson-learning-items/student/lesson/:lessonId` |
| Chi tiết/content một learning item | `GET /api/learning-items/:learningItemId/student` |
| Đánh dấu learning item đã học | `POST /api/student-learning-items/:learningItemId/mark-learned` |

## Luồng gọi đề xuất cho FE

Khi mở trang tổng quan khóa học, FE có thể gọi song song:

```text
GET /course-enrollments/student/my
GET /lessons/student/latest
GET /lesson-learning-items/student/learned
GET /learning-items/student/my-homeworks
```

Khi học sinh mở một course:

```text
GET /courses/student/:courseId
GET /lessons/student/course/:courseId
```

Khi mở lesson hoặc learning item:

```text
GET /lesson-learning-items/student/lesson/:lessonId
GET /learning-items/:learningItemId/student
POST /student-learning-items/:learningItemId/mark-learned
```

FE nên invalidate/refetch các query `latest`, `learned`, danh sách lesson của course và enrollment progress sau khi `mark-learned` thành công.

### Thumbnail trong danh sách enrollment

Mỗi phần tử của `GET /api/course-enrollments/student/my` có thêm trường `thumbnail`. Thumbnail là media `READY` của course, không lọc media visibility và có cùng cấu trúc file với API course SEO:

```json
{
  "enrollmentId": 10,
  "courseId": 80,
  "completionPercentage": 25,
  "thumbnail": {
    "usageId": 501,
    "mediaId": 301,
    "fileName": "course-thumbnail.webp",
    "originalName": "thumbnail.webp",
    "mimeType": "image/webp",
    "type": "IMAGE",
    "viewUrl": "https://...",
    "expiresAt": "2026-07-15T11:00:00.000Z",
    "expirySeconds": 3600,
    "width": 1280,
    "height": 720
  }
}
```

Nếu course chưa có thumbnail `READY`, trường `thumbnail` không xuất hiện.

### Thông tin giáo viên

`GET /api/courses/student/:courseId` trả thêm `teacherAvatarUrl` bên cạnh `teacherName`, `teacherFirstName`, `teacherLastName` và `teacherEmail`.

Mỗi phần tử của `GET /api/course-enrollments/student/my` trả thêm:

```json
{
  "teacherName": "Nguyễn Văn A",
  "teacherAvatarUrl": "https://...",
  "course": {
    "teacherName": "Nguyễn Văn A",
    "teacher": {
      "avatarUrl": "https://..."
    }
  }
}
```

Avatar là media `READY` gắn với user của giáo viên qua field `avatar`. Nếu giáo viên chưa có avatar, các trường URL không xuất hiện.
