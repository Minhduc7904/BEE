# Course SEO Page Flow

Tai lieu nay dung cho frontend trang SEO/public hien thi khoa hoc online.

Base URL hien tai:

```http
/api
```

Tat ca API trong tai lieu nay la public:

```text
Khong can Authorization/JWT.
```

## 1. Trang SEO Course Can Hien Thi Gi

Nen tach thanh 2 man:

| Man | Muc dich | API chinh |
| --- | -------- | --------- |
| Danh sach khoa hoc online | Hien thi danh sach khoa hoc public de SEO index va user chon khoa hoc | `GET /api/courses/public/seo` |
| Chi tiet khoa hoc online | Hien thi landing/detail cua mot khoa hoc, gom noi dung hoc thu neu co | `GET /api/courses/public/seo/:courseIdOrCode` |

## 2. Rule Backend Dang Ap Dung

Ca 2 API chi tra khoa hoc thoa tat ca dieu kien:

| Dieu kien | Gia tri |
| --------- | ------- |
| `visibility` | `PUBLISHED` |
| `isEnded` | `false` |
| `courseType` | `ONLINE` hoac `ALL` |

Voi chi tiet khoa hoc:

- Chi tra lesson co `visibility = PUBLISHED`.
- Lesson co `allowTrial = true` se tra `learningItems`.
- Lesson co `allowTrial = false` se tra `learningItems = []` de khong lo noi dung khoa hoc.
- Learning item co `type = HOMEWORK` khong duoc tra trong API public SEO detail mac dinh.
- Learning item co `type = DOCUMENT` se co file trong `documentContents[].mediaFiles[]`; frontend lay URL tu `mediaFiles[].viewUrl`.
- Document trong buoi hoc thu lay file READY giong `GET /document-contents`, sau do sinh presigned `viewUrl`.
- Video va course media chi tra khi media `READY` va media usage `PUBLIC`.
- Cac `viewUrl` cua media la presigned URL, co thoi gian het han.

## 3. API Danh Sach Khoa Hoc SEO

```http
GET /api/courses/public/seo?page=1&limit=12&search=toan&grade=12&subjectId=1&teacherId=3&academicYear=2025-2026&sortBy=createdAt&sortOrder=desc
```

Request:

| Param | Type | Required | Default | Ghi chu |
| ----- | ---- | -------- | ------- | ------- |
| `page` | number | No | `1` | Trang hien tai |
| `limit` | number | No | `10` | So khoa hoc moi trang, toi da `1000` |
| `search` | string | No | none | Tim theo `code`, `title`, `subtitle`, `description` |
| `grade` | number | No | none | Khoi lop tu `1` den `12` |
| `subjectId` | number | No | none | Loc theo mon hoc |
| `teacherId` | number | No | none | Loc theo giao vien |
| `academicYear` | string | No | none | Nam hoc, vi du `2025-2026` |
| `sortBy` | string | No | `createdAt` | Ho tro `courseId`, `code`, `title`, `grade`, `priceVND`, `createdAt`, `updatedAt` |
| `sortOrder` | `asc`/`desc` | No | `desc` | Thu tu sap xep |

Khong co request body.

Response:

```json
{
  "success": true,
  "message": "Lay danh sach khoa hoc public online cho trang SEO thanh cong",
  "data": [
    {
      "courseId": 64,
      "code": "TOAN12-ONLINE",
      "title": "On thi THPT mon Toan",
      "subtitle": "Lo trinh nen tang den van dung cao",
      "academicYear": "2025-2026",
      "grade": 12,
      "subjectId": 1,
      "description": "Khoa hoc on thi THPT mon Toan danh cho hoc sinh lop 12.",
      "priceVND": 299000,
      "compareAtVND": 499000,
      "visibility": "PUBLISHED",
      "isEnded": false,
      "courseType": "ONLINE",
      "teacherId": 3,
      "subject": {
        "subjectId": 1,
        "name": "Toan",
        "code": "MATH"
      },
      "teacher": {
        "adminId": 3,
        "userId": 10,
        "firstName": "Van A",
        "lastName": "Nguyen",
        "fullName": "Van A Nguyen",
        "email": "teacher@example.com"
      },
      "lessonsCount": 20,
      "trialLessonsCount": 2,
      "enrollmentsCount": 120,
      "isFree": false,
      "hasDiscount": true,
      "discountPercentage": 40,
      "thumbnail": {
        "usageId": 11,
        "mediaId": 101,
        "fileName": "thumbnail.webp",
        "originalName": "thumbnail.webp",
        "mimeType": "image/webp",
        "type": "IMAGE",
        "viewUrl": "https://api-domain.com/media/presigned-url",
        "expiresAt": "2026-07-06T04:00:00.000Z",
        "expirySeconds": 3600,
        "width": 1280,
        "height": 720,
        "duration": null
      },
      "createdAt": "2026-07-06T03:00:00.000Z",
      "updatedAt": "2026-07-06T03:00:00.000Z"
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

Frontend nen dung data danh sach de hien thi:

| UI | Field nen dung |
| -- | -------------- |
| Anh card | `thumbnail.viewUrl` |
| Tieu de | `title` |
| Mo ta ngan | `subtitle` hoac cat ngan `description` |
| Khoi | `grade` |
| Mon | `subject.name` |
| Giao vien | `teacher.fullName` |
| Gia hien tai | `priceVND` |
| Gia gach ngang | `compareAtVND` neu `hasDiscount=true` |
| Badge giam gia | `discountPercentage` |
| So buoi hoc | `lessonsCount` |
| So buoi hoc thu | `trialLessonsCount` |
| So hoc vien | `enrollmentsCount` |
| Link detail | `/courses/${courseId}` hoac `/courses/${code}` tuy router frontend |

## 4. API Chi Tiet Khoa Hoc SEO

Co the goi bang `courseId`:

```http
GET /api/courses/public/seo/64
```

Hoac goi bang `code`:

```http
GET /api/courses/public/seo/TOAN12-ONLINE
```

Request:

| Param | Type | Required | Ghi chu |
| ----- | ---- | -------- | ------- |
| `courseIdOrCode` | number/string | Yes | Neu toan so thi backend tim theo `courseId`, nguoc lai tim theo `code` |

Khong co request body.

Response:

```json
{
  "success": true,
  "message": "Lay chi tiet khoa hoc public online cho trang SEO thanh cong",
  "data": {
    "courseId": 64,
    "code": "TOAN12-ONLINE",
    "title": "On thi THPT mon Toan",
    "subtitle": "Lo trinh nen tang den van dung cao",
    "academicYear": "2025-2026",
    "grade": 12,
    "subjectId": 1,
    "description": "Khoa hoc on thi THPT mon Toan danh cho hoc sinh lop 12.",
    "priceVND": 299000,
    "compareAtVND": 499000,
    "visibility": "PUBLISHED",
    "isEnded": false,
    "courseType": "ONLINE",
    "teacherId": 3,
    "subject": {
      "subjectId": 1,
      "name": "Toan",
      "code": "MATH"
    },
    "teacher": {
      "adminId": 3,
      "userId": 10,
      "firstName": "Van A",
      "lastName": "Nguyen",
      "fullName": "Van A Nguyen",
      "email": "teacher@example.com"
    },
    "lessonsCount": 20,
    "trialLessonsCount": 2,
    "enrollmentsCount": 120,
    "isFree": false,
    "hasDiscount": true,
    "discountPercentage": 40,
    "thumbnail": {
      "usageId": 11,
      "mediaId": 101,
      "fileName": "thumbnail.webp",
      "originalName": "thumbnail.webp",
      "mimeType": "image/webp",
      "type": "IMAGE",
      "viewUrl": "https://api-domain.com/media/presigned-url",
      "expiresAt": "2026-07-06T04:00:00.000Z",
      "expirySeconds": 3600,
      "width": 1280,
      "height": 720,
      "duration": null
    },
    "media": {
      "thumbnail": {
        "usageId": 11,
        "mediaId": 101,
        "fileName": "thumbnail.webp",
        "originalName": "thumbnail.webp",
        "mimeType": "image/webp",
        "type": "IMAGE",
        "viewUrl": "https://api-domain.com/media/presigned-url",
        "expiresAt": "2026-07-06T04:00:00.000Z",
        "expirySeconds": 3600,
        "width": 1280,
        "height": 720,
        "duration": null
      },
      "banner": {
        "usageId": 12,
        "mediaId": 102,
        "fileName": "banner.webp",
        "originalName": "banner.webp",
        "mimeType": "image/webp",
        "type": "IMAGE",
        "viewUrl": "https://api-domain.com/media/presigned-url",
        "expiresAt": "2026-07-06T04:00:00.000Z",
        "expirySeconds": 3600,
        "width": 1920,
        "height": 720,
        "duration": null
      },
      "introVideo": {
        "usageId": 13,
        "mediaId": 103,
        "fileName": "intro.mp4",
        "originalName": "intro.mp4",
        "mimeType": "video/mp4",
        "type": "VIDEO",
        "viewUrl": "https://api-domain.com/media/presigned-url",
        "expiresAt": "2026-07-06T04:00:00.000Z",
        "expirySeconds": 3600,
        "width": 1280,
        "height": 720,
        "duration": 95.4
      },
      "gallery": []
    },
    "classes": [
      {
        "classId": 1,
        "className": "Toan 12 Online A",
        "startDate": "2026-07-10T00:00:00.000Z",
        "endDate": "2026-10-10T00:00:00.000Z",
        "weeklySchedule": "Thu 2, Thu 4 - 19:30",
        "room": "Online"
      }
    ],
    "assistants": [
      {
        "courseAssistantId": 1,
        "adminId": 4,
        "joinedAt": "2026-07-06T03:00:00.000Z",
        "admin": {
          "adminId": 4,
          "userId": 11,
          "firstName": "Thi B",
          "lastName": "Tran",
          "fullName": "Thi B Tran",
          "email": "assistant@example.com"
        }
      }
    ],
    "lessons": [
      {
        "lessonId": 1001,
        "courseId": 64,
        "title": "Buoi 1: Ham so va do thi",
        "description": "Noi dung hoc thu ve ham so.",
        "visibility": "PUBLISHED",
        "orderInCourse": 1,
        "teacherId": 3,
        "allowTrial": true,
        "chapters": [
          {
            "chapterId": 10,
            "name": "Ham so",
            "slug": "ham-so",
            "code": "CH-HAM-SO",
            "level": 1
          }
        ],
        "learningItems": [
          {
            "lessonId": 1001,
            "learningItemId": 501,
            "order": 1,
            "type": "VIDEO",
            "title": "Video bai giang ham so",
            "description": "Video gioi thieu bai hoc.",
            "homeworkContents": [],
            "documentContents": [],
            "youtubeContents": [],
            "videoContents": [
              {
                "videoContentId": 201,
                "learningItemId": 501,
                "content": "Video bai giang",
                "mediaFiles": [
                  {
                    "usageId": 50,
                    "mediaId": 2001,
                    "fileName": "lesson-1.mp4",
                    "originalName": "lesson-1.mp4",
                    "mimeType": "video/mp4",
                    "type": "VIDEO",
                    "viewUrl": "https://api-domain.com/media/presigned-url",
                    "expiresAt": "2026-07-06T04:00:00.000Z",
                    "expirySeconds": 3600,
                    "width": 1280,
                    "height": 720,
                    "duration": 620
                  }
                ],
                "createdAt": "2026-07-06T03:00:00.000Z",
                "updatedAt": "2026-07-06T03:00:00.000Z"
              }
            ],
            "createdAt": "2026-07-06T03:00:00.000Z",
            "updatedAt": "2026-07-06T03:00:00.000Z"
          },
          {
            "lessonId": 1001,
            "learningItemId": 502,
            "order": 2,
            "type": "DOCUMENT",
            "title": "Tai lieu ham so PDF",
            "description": "Tai lieu hoc thu kem bai tap vi du.",
            "homeworkContents": [],
            "documentContents": [
              {
                "documentContentId": 301,
                "learningItemId": 502,
                "content": "Tai lieu PDF buoi hoc thu.",
                "orderInDocument": 1,
                "mediaFiles": [
                  {
                    "usageId": 51,
                    "mediaId": 2002,
                    "fileName": "lesson-1.pdf",
                    "originalName": "lesson-1.pdf",
                    "mimeType": "application/pdf",
                    "type": "DOCUMENT",
                    "viewUrl": "https://api-domain.com/media/presigned-url",
                    "expiresAt": "2026-07-06T04:00:00.000Z",
                    "expirySeconds": 3600,
                    "width": null,
                    "height": null,
                    "duration": null
                  }
                ],
                "createdAt": "2026-07-06T03:00:00.000Z",
                "updatedAt": "2026-07-06T03:00:00.000Z"
              }
            ],
            "youtubeContents": [],
            "videoContents": [],
            "createdAt": "2026-07-06T03:00:00.000Z",
            "updatedAt": "2026-07-06T03:00:00.000Z"
          }
        ],
        "createdAt": "2026-07-06T03:00:00.000Z",
        "updatedAt": "2026-07-06T03:00:00.000Z"
      },
      {
        "lessonId": 1002,
        "courseId": 64,
        "title": "Buoi 2: Dao ham",
        "description": "Noi dung chi danh cho hoc vien da mua.",
        "visibility": "PUBLISHED",
        "orderInCourse": 2,
        "teacherId": 3,
        "allowTrial": false,
        "chapters": [],
        "learningItems": [],
        "createdAt": "2026-07-06T03:00:00.000Z",
        "updatedAt": "2026-07-06T03:00:00.000Z"
      }
    ],
    "createdAt": "2026-07-06T03:00:00.000Z",
    "updatedAt": "2026-07-06T03:00:00.000Z"
  }
}
```

Frontend nen dung data chi tiet de hien thi:

| UI | Field nen dung |
| -- | -------------- |
| Hero banner | `media.banner.viewUrl` hoac fallback `thumbnail.viewUrl` |
| Thumbnail/card | `thumbnail.viewUrl` hoac `media.thumbnail.viewUrl` |
| Video gioi thieu | `media.introVideo.viewUrl` |
| Gallery | `media.gallery[]` |
| Tieu de | `title` |
| Subtitle | `subtitle` |
| Mo ta | `description` |
| Khoi/mon | `grade`, `subject.name` |
| Giao vien | `teacher.fullName` |
| Tro giang | `assistants[].admin.fullName` |
| Lich/lop | `classes[]` |
| Gia | `priceVND`, `compareAtVND`, `discountPercentage` |
| So buoi hoc | `lessonsCount` |
| So buoi hoc thu | `trialLessonsCount` |
| Chuong trinh hoc | `lessons[]` |
| Noi dung hoc thu | `lessons[].learningItems[]` khi `allowTrial=true` |
| Tai lieu hoc thu | `documentContents[].mediaFiles[].viewUrl` voi item `type=DOCUMENT` |

## 5. Render Lesson Va Learning Item

Voi moi `lesson`:

| Field | Cach hien thi |
| ----- | ------------- |
| `title` | Ten buoi hoc |
| `description` | Mo ta buoi hoc |
| `orderInCourse` | Thu tu buoi hoc |
| `allowTrial` | Neu `true`, hien badge "Hoc thu" |
| `chapters` | Chuong/kien thuc lien quan |
| `learningItems` | Chi co noi dung khi `allowTrial=true` |

Voi learning item:

| Field | Cach hien thi |
| ----- | ------------- |
| `type` | Phan loai noi dung public: `DOCUMENT`, `VIDEO`, `YOUTUBE`; `HOMEWORK` bi an trong SEO detail |
| `title` | Ten noi dung |
| `description` | Mo ta ngan |
| `documentContents[].content` | Noi dung tai lieu/markdown |
| `documentContents[].mediaFiles[]` | File tai lieu/anh public kem `viewUrl` |
| `videoContents[].mediaFiles[]` | Video public kem `viewUrl` |
| `youtubeContents[].youtubeUrl` | Link YouTube |
| `homeworkContents[]` | Mac dinh luon rong trong API public SEO vi `HOMEWORK` khong hien public |

## 6. Flow De Xuat Cho Frontend SEO

1. Trang `/courses` goi `GET /api/courses/public/seo`.
2. Render filter theo `grade`, `subjectId`, `teacherId`, `academicYear`, `search`.
3. User bam vao card khoa hoc, frontend dieu huong den route detail, vi du `/courses/TOAN12-ONLINE`.
4. Trang detail goi `GET /api/courses/public/seo/TOAN12-ONLINE`.
5. Render hero, gia, teacher, classes, lesson outline va noi dung hoc thu.
6. Nut CTA:
   - Neu khoa hoc mien phi: hien "Vao hoc" hoac "Dang ky hoc".
   - Neu co gia: hien "Thanh toan" hoac "Mua khoa hoc".
7. Sau khi user dang nhap/mua khoa hoc, frontend di tiep theo flow invoice/VNPay cua online course.

## 7. Goi API Bang Axios

Danh sach:

```ts
const response = await axios.get('/api/courses/public/seo', {
  params: {
    page: 1,
    limit: 12,
    search: 'toan',
    grade: 12,
    subjectId: 1,
    academicYear: '2025-2026',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
})
```

Chi tiet:

```ts
const response = await axios.get('/api/courses/public/seo/TOAN12-ONLINE')
```

Dung `viewUrl` cho anh/video:

```tsx
<img src={course.media.banner?.viewUrl || course.thumbnail?.viewUrl} alt={course.title} />

{course.media.introVideo?.viewUrl && (
  <video controls src={course.media.introVideo.viewUrl} />
)}
```

Luu y: `viewUrl` co het han theo `expirySeconds`, neu trang detail de qua lau va media loi 403 thi goi lai API detail de lay URL moi.
