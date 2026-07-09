# Achievement Board Admin Flow

Tai lieu nay dung cho frontend trang quan tri tao module quan ly bang thanh tich hien thi tren trang SEO.

Base URL hien tai:

```http
/api
```

Tat ca API quan tri ben duoi can gui token dang nhap:

```http
Authorization: Bearer <access-token>
```

## 1. Chuc Nang Can Co Tren Trang Quan Tri

Module quan tri nen co cac man/chuc nang sau:

| Chuc nang | API su dung |
| --------- | ----------- |
| Xem danh sach bang thanh tich kem dong thanh tich | `GET /api/achievement-boards` |
| Tao thong tin co ban cua bang thanh tich | `POST /api/achievement-boards` |
| Sua thong tin co ban cua bang thanh tich | `PUT /api/achievement-boards/:achievementBoardId` |
| Xoa bang thanh tich va tat ca dong ben trong | `DELETE /api/achievement-boards/:achievementBoardId` |
| Tai file Excel mau | `GET /api/achievement-boards/rows/template` |
| Import hang loat dong thanh tich bang Excel | `POST /api/achievement-boards/:achievementBoardId/rows/import-excel` |
| Sua mot dong thanh tich | `PUT /api/achievement-boards/rows/:achievementRowId` |
| Xoa mot dong thanh tich | `DELETE /api/achievement-boards/rows/:achievementRowId` |
| Xem du lieu public cho trang SEO | `GET /api/achievement-boards/public/seo` |

## 2. Kieu Du Lieu Chinh

### AchievementBoard

```json
{
  "achievementBoardId": 1,
  "title": "Bang vang thanh tich HSG Toan",
  "slug": "bang-vang-thanh-tich-hsg-toan",
  "competitionName": "Ky thi hoc sinh gioi Toan",
  "academicYear": "2025-2026",
  "description": "Mo ta day du ve bang thanh tich",
  "shortDescription": "Mo ta ngan hien thi tren SEO",
  "targetKeyword": "bang thanh tich hoc sinh gioi toan",
  "keywordText": "hoc sinh gioi toan, bang vang thanh tich",
  "metaTitle": "Bang vang thanh tich HSG Toan 2025-2026",
  "metaDescription": "Danh sach hoc sinh dat thanh tich cao trong ky thi HSG Toan.",
  "ogTitle": "Bang vang thanh tich HSG Toan",
  "ogDescription": "Cac hoc sinh dat thanh tich noi bat.",
  "searchIntent": "informational",
  "seoScore": 85,
  "visibility": "PUBLISHED",
  "isFeatured": true,
  "viewCount": 0,
  "sortOrder": 0,
  "createdBy": 1,
  "updatedBy": 1,
  "createdAt": "2026-07-06T03:00:00.000Z",
  "updatedAt": "2026-07-06T03:00:00.000Z",
  "rows": []
}
```

### AchievementRow

```json
{
  "achievementRowId": 1,
  "achievementBoardId": 1,
  "studentName": "Nguyen Van A",
  "schoolName": "THCS Nguyen Du",
  "grade": 9,
  "score": 18.5,
  "sortOrder": 0,
  "createdAt": "2026-07-06T03:00:00.000Z",
  "updatedAt": "2026-07-06T03:00:00.000Z"
}
```

Luu y: `studentName`, `schoolName`, `grade`, `score` la du lieu text/number rieng cho SEO, khong lien ket voi bang `Student`.

## 3. API Tao Bang Thanh Tich

```http
POST /api/achievement-boards
Content-Type: application/json
Authorization: Bearer <access-token>
```

Request body:

```json
{
  "auto": true,
  "title": "Bang vang thanh tich HSG Toan",
  "slug": "bang-vang-thanh-tich-hsg-toan",
  "competitionName": "Ky thi hoc sinh gioi Toan",
  "academicYear": "2025-2026",
  "description": "Mo ta day du ve bang thanh tich",
  "shortDescription": "Mo ta ngan hien thi tren SEO",
  "targetKeyword": "bang thanh tich hoc sinh gioi toan",
  "keywordText": "hoc sinh gioi toan, bang vang thanh tich",
  "metaTitle": "Bang vang thanh tich HSG Toan 2025-2026",
  "metaDescription": "Danh sach hoc sinh dat thanh tich cao trong ky thi HSG Toan.",
  "ogTitle": "Bang vang thanh tich HSG Toan",
  "ogDescription": "Cac hoc sinh dat thanh tich noi bat.",
  "searchIntent": "informational",
  "seoScore": 85,
  "visibility": "DRAFT",
  "isFeatured": false,
  "sortOrder": 0
}
```

Field bat buoc:

| Field | Type | Ghi chu |
| ----- | ---- | ------- |
| `title` | string | Tieu de bang thanh tich |
| `competitionName` | string | Ten cuoc thi |

Field tuy chon:

| Field | Type | Ghi chu |
| ----- | ---- | ------- |
| `auto` | boolean | Mac dinh `true`. Neu `true`, backend goi AI sinh cac field SEO con thieu. Neu `false`, frontend/admin tu nhap SEO thu cong |
| `slug` | string | Neu khong truyen, backend tu sinh tu `competitionName`, `academicYear`, `title` |
| `academicYear` | string | Nam hoc, vi du `2025-2026` |
| `description` | string | Mo ta day du |
| `shortDescription` | string | Mo ta ngan |
| `targetKeyword` | string | Tu khoa SEO chinh |
| `keywordText` | string | Danh sach tu khoa |
| `metaTitle` | string | SEO meta title |
| `metaDescription` | string | SEO meta description |
| `ogTitle` | string | Open Graph title |
| `ogDescription` | string | Open Graph description |
| `searchIntent` | string | Vi du `informational`, `commercial` |
| `seoScore` | number | Tu `0` den `100` |
| `visibility` | string | `DRAFT`, `PUBLISHED`, tuy enum backend hien co |
| `isFeatured` | boolean | Danh dau noi bat |
| `sortOrder` | number | Thu tu sap xep |

Luu y ve `auto`:

- Khong truyen `auto` thi backend hieu la `true`.
- Neu `auto=true`, frontend co the chi gui thong tin co ban nhu `title`, `competitionName`, `academicYear`, `description`, `shortDescription`; backend se goi AI de sinh `targetKeyword`, `keywordText`, `metaTitle`, `metaDescription`, `ogTitle`, `ogDescription`, `searchIntent`, `seoScore`.
- Neu frontend da gui mot vai field SEO, backend se giu field da gui va chi dung AI cho field con thieu.
- Neu `auto=false`, backend khong goi AI. Field SEO nao frontend khong gui se duoc luu `null`.

Request toi thieu nen dung khi muon backend tu sinh SEO:

```json
{
  "auto": true,
  "title": "Bang vang thanh tich HSG Toan",
  "competitionName": "Ky thi hoc sinh gioi Toan",
  "academicYear": "2025-2026",
  "shortDescription": "Danh sach hoc sinh dat thanh tich cao trong ky thi HSG Toan."
}
```

Request khi admin muon tu nhap SEO thu cong:

```json
{
  "auto": false,
  "title": "Bang vang thanh tich HSG Toan",
  "competitionName": "Ky thi hoc sinh gioi Toan",
  "academicYear": "2025-2026",
  "targetKeyword": "bang thanh tich hoc sinh gioi toan",
  "keywordText": "hoc sinh gioi toan, bang vang thanh tich",
  "metaTitle": "Bang vang thanh tich HSG Toan 2025-2026",
  "metaDescription": "Danh sach hoc sinh dat thanh tich cao trong ky thi HSG Toan.",
  "ogTitle": "Bang vang thanh tich HSG Toan",
  "ogDescription": "Cac hoc sinh dat thanh tich noi bat.",
  "searchIntent": "competition results",
  "seoScore": 85
}
```

Response:

```json
{
  "success": true,
  "message": "Tao bang thanh tich thanh cong",
  "data": {
    "achievementBoardId": 1,
    "title": "Bang vang thanh tich HSG Toan",
    "slug": "bang-vang-thanh-tich-hsg-toan",
    "competitionName": "Ky thi hoc sinh gioi Toan",
    "academicYear": "2025-2026",
    "description": "Mo ta day du ve bang thanh tich",
    "shortDescription": "Mo ta ngan hien thi tren SEO",
    "targetKeyword": "bang thanh tich hoc sinh gioi toan",
    "keywordText": "hoc sinh gioi toan, bang vang thanh tich",
    "metaTitle": "Bang vang thanh tich HSG Toan 2025-2026",
    "metaDescription": "Danh sach hoc sinh dat thanh tich cao trong ky thi HSG Toan.",
    "ogTitle": "Bang vang thanh tich HSG Toan",
    "ogDescription": "Cac hoc sinh dat thanh tich noi bat.",
    "searchIntent": "informational",
    "seoScore": 85,
    "visibility": "DRAFT",
    "isFeatured": false,
    "viewCount": 0,
    "sortOrder": 0,
    "createdBy": 1,
    "updatedBy": 1,
    "createdAt": "2026-07-06T03:00:00.000Z",
    "updatedAt": "2026-07-06T03:00:00.000Z",
    "rows": []
  }
}
```

## 4. API Lay Danh Sach Bang Thanh Tich Cho Admin

```http
GET /api/achievement-boards?page=1&limit=10&includeRows=true&search=toan&visibility=PUBLISHED&isFeatured=true&sortBy=sortOrder&sortOrder=asc
Authorization: Bearer <access-token>
```

Query params:

| Param | Type | Required | Default | Ghi chu |
| ----- | ---- | -------- | ------- | ------- |
| `page` | number | No | `1` | Trang hien tai |
| `limit` | number | No | `10` | So ban ghi moi trang |
| `search` | string | No | none | Tim theo noi dung lien quan bang thanh tich |
| `visibility` | string | No | none | Loc theo trang thai, vi du `DRAFT`, `PUBLISHED` |
| `isFeatured` | boolean | No | none | Loc bang noi bat |
| `includeRows` | boolean | No | `true` | Co tra kem cac dong thanh tich hay khong |
| `sortBy` | string | No | `sortOrder` | Field sort hop le: `achievementBoardId`, `title`, `slug`, `competitionName`, `academicYear`, `visibility`, `isFeatured`, `viewCount`, `sortOrder`, `createdAt`, `updatedAt` |
| `sortOrder` | string | No | `asc` | `asc` hoac `desc` |

Response:

```json
{
  "success": true,
  "message": "Lay danh sach bang thanh tich thanh cong",
  "data": [
    {
      "achievementBoardId": 1,
      "title": "Bang vang thanh tich HSG Toan",
      "slug": "bang-vang-thanh-tich-hsg-toan",
      "competitionName": "Ky thi hoc sinh gioi Toan",
      "academicYear": "2025-2026",
      "description": "Mo ta day du ve bang thanh tich",
      "shortDescription": "Mo ta ngan hien thi tren SEO",
      "targetKeyword": "bang thanh tich hoc sinh gioi toan",
      "keywordText": "hoc sinh gioi toan, bang vang thanh tich",
      "metaTitle": "Bang vang thanh tich HSG Toan 2025-2026",
      "metaDescription": "Danh sach hoc sinh dat thanh tich cao trong ky thi HSG Toan.",
      "ogTitle": "Bang vang thanh tich HSG Toan",
      "ogDescription": "Cac hoc sinh dat thanh tich noi bat.",
      "searchIntent": "informational",
      "seoScore": 85,
      "visibility": "PUBLISHED",
      "isFeatured": true,
      "viewCount": 0,
      "sortOrder": 0,
      "createdBy": 1,
      "updatedBy": 1,
      "createdAt": "2026-07-06T03:00:00.000Z",
      "updatedAt": "2026-07-06T03:00:00.000Z",
      "rows": [
        {
          "achievementRowId": 1,
          "achievementBoardId": 1,
          "studentName": "Nguyen Van A",
          "schoolName": "THCS Nguyen Du",
          "grade": 9,
          "score": 18.5,
          "sortOrder": 0,
          "createdAt": "2026-07-06T03:00:00.000Z",
          "updatedAt": "2026-07-06T03:00:00.000Z"
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

## 5. API Cap Nhat Bang Thanh Tich

```http
PUT /api/achievement-boards/1
Content-Type: application/json
Authorization: Bearer <access-token>
```

Request body: truyen field nao thi cap nhat field do.

```json
{
  "title": "Bang vang thanh tich HSG Toan cap nhat",
  "visibility": "PUBLISHED",
  "isFeatured": true,
  "seoScore": 90,
  "sortOrder": 1
}
```

Response:

```json
{
  "success": true,
  "message": "Cap nhat bang thanh tich thanh cong",
  "data": {
    "achievementBoardId": 1,
    "title": "Bang vang thanh tich HSG Toan cap nhat",
    "slug": "bang-vang-thanh-tich-hsg-toan-cap-nhat",
    "competitionName": "Ky thi hoc sinh gioi Toan",
    "academicYear": "2025-2026",
    "visibility": "PUBLISHED",
    "isFeatured": true,
    "seoScore": 90,
    "sortOrder": 1,
    "rows": []
  }
}
```

Luu y: response thuc te van tra day du cac field nhu `AchievementBoard`.

## 6. API Xoa Bang Thanh Tich

```http
DELETE /api/achievement-boards/1
Authorization: Bearer <access-token>
```

Khi xoa bang thanh tich, backend xoa luon tat ca dong thanh tich thuoc bang do.

Response:

```json
{
  "success": true,
  "message": "Xoa bang thanh tich thanh cong",
  "data": {
    "deleted": true,
    "message": "Xoa bang thanh tich thanh cong"
  }
}
```

## 7. API Tai File Excel Mau

```http
GET /api/achievement-boards/rows/template
Authorization: Bearer <access-token>
```

Response la file Excel:

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="achievement-row-template.xlsx"
```

File mau co cac cot:

| Cot Excel | Bat buoc | Ghi chu |
| --------- | -------- | ------- |
| `Ten hoc sinh` | Yes | Ten hoc sinh hien thi tren SEO |
| `Truong` | No | Ten truong |
| `Khoi` | Yes | So nguyen tu `1` den `12` |
| `Diem` | Yes | So diem, lon hon hoac bang `0` |

## 8. API Import Dong Thanh Tich Bang Excel

```http
POST /api/achievement-boards/1/rows/import-excel
Content-Type: multipart/form-data
Authorization: Bearer <access-token>
```

Request form-data:

| Field | Type | Required | Ghi chu |
| ----- | ---- | -------- | ------- |
| `file` | binary | Yes | File Excel theo mau tu API template |

Response:

```json
{
  "success": true,
  "message": "Import dong thanh tich thanh cong",
  "data": {
    "importedCount": 2,
    "rows": [
      {
        "achievementRowId": 1,
        "achievementBoardId": 1,
        "studentName": "Nguyen Van A",
        "schoolName": "THCS Nguyen Du",
        "grade": 9,
        "score": 18.5,
        "sortOrder": 0,
        "createdAt": "2026-07-06T03:00:00.000Z",
        "updatedAt": "2026-07-06T03:00:00.000Z"
      },
      {
        "achievementRowId": 2,
        "achievementBoardId": 1,
        "studentName": "Tran Thi B",
        "schoolName": "THCS Le Loi",
        "grade": 8,
        "score": 19,
        "sortOrder": 1,
        "createdAt": "2026-07-06T03:00:00.000Z",
        "updatedAt": "2026-07-06T03:00:00.000Z"
      }
    ]
  }
}
```

Luu y:

- API import se them dong moi vao bang thanh tich, khong thay the cac dong cu.
- Neu can import lai tu dau, frontend nen xoa bang thanh tich cu hoac xoa tung dong cu truoc khi import.
- Neu file sai cot, thieu ten hoc sinh, khoi khong nam trong `1..12`, hoac diem am, backend tra loi validation error.

## 9. API Cap Nhat Mot Dong Thanh Tich

```http
PUT /api/achievement-boards/rows/1
Content-Type: application/json
Authorization: Bearer <access-token>
```

Request body: truyen field nao thi cap nhat field do.

```json
{
  "studentName": "Nguyen Van A",
  "schoolName": "THCS Nguyen Du",
  "grade": 9,
  "score": 19,
  "sortOrder": 0
}
```

Field:

| Field | Type | Ghi chu |
| ----- | ---- | ------- |
| `studentName` | string | Ten hoc sinh |
| `schoolName` | string | Ten truong |
| `grade` | number | So nguyen tu `1` den `12` |
| `score` | number | Diem, lon hon hoac bang `0` |
| `sortOrder` | number | Thu tu sap xep |

Response:

```json
{
  "success": true,
  "message": "Cap nhat dong thanh tich thanh cong",
  "data": {
    "achievementRowId": 1,
    "achievementBoardId": 1,
    "studentName": "Nguyen Van A",
    "schoolName": "THCS Nguyen Du",
    "grade": 9,
    "score": 19,
    "sortOrder": 0,
    "createdAt": "2026-07-06T03:00:00.000Z",
    "updatedAt": "2026-07-06T03:10:00.000Z"
  }
}
```

## 10. API Xoa Mot Dong Thanh Tich

```http
DELETE /api/achievement-boards/rows/1
Authorization: Bearer <access-token>
```

Response:

```json
{
  "success": true,
  "message": "Xoa dong thanh tich thanh cong",
  "data": {
    "deleted": true,
    "message": "Xoa dong thanh tich thanh cong"
  }
}
```

## 11. API Public Cho Trang SEO

Trang SEO/public khong can token.

```http
GET /api/achievement-boards/public/seo?page=1&limit=10&search=toan&isFeatured=true&sortBy=sortOrder&sortOrder=asc
```

Backend tu ep:

```text
visibility=PUBLISHED
includeRows=true
```

Response giong API danh sach admin, nhung chi tra cac bang thanh tich da publish.

## 12. Flow De Xuat Cho Frontend Quan Tri

1. Vao man danh sach: goi `GET /api/achievement-boards?page=1&limit=10&includeRows=true`.
2. Bam "Tao bang thanh tich": hien form thong tin co ban va cong tac `auto` cho SEO.
3. Neu `auto=true`, co the an/disable nhom field SEO va de backend AI sinh. Neu `auto=false`, cho admin nhap SEO thu cong.
4. Submit form: goi `POST /api/achievement-boards`.
5. Sau khi tao thanh cong, lay `achievementBoardId` trong response.
6. Neu admin muon nhap dong bang Excel, cho tai file mau bang `GET /api/achievement-boards/rows/template`.
7. Admin upload file Excel: goi `POST /api/achievement-boards/:achievementBoardId/rows/import-excel` voi form-data `file`.
8. Sau import, reload lai danh sach bang thanh tich bang `GET /api/achievement-boards?page=1&limit=10&includeRows=true`.
9. Khi sua dong: goi `PUT /api/achievement-boards/rows/:achievementRowId`.
10. Khi xoa dong: goi `DELETE /api/achievement-boards/rows/:achievementRowId`.
11. Khi muon hien thi len SEO: cap nhat bang thanh tich voi `visibility=PUBLISHED`.

## 13. Goi API Bang Axios

Tao bang thanh tich:

```ts
await axios.post('/api/achievement-boards', payload, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
```

Lay danh sach:

```ts
await axios.get('/api/achievement-boards', {
  params: {
    page: 1,
    limit: 10,
    includeRows: true,
    sortBy: 'sortOrder',
    sortOrder: 'asc',
  },
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
```

Import Excel:

```ts
const formData = new FormData()
formData.append('file', file)

await axios.post(`/api/achievement-boards/${achievementBoardId}/rows/import-excel`, formData, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'multipart/form-data',
  },
})
```

Tai file mau:

```ts
const response = await axios.get('/api/achievement-boards/rows/template', {
  responseType: 'blob',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
```

Public SEO:

```ts
await axios.get('/api/achievement-boards/public/seo', {
  params: {
    page: 1,
    limit: 10,
    isFeatured: true,
    sortBy: 'sortOrder',
    sortOrder: 'asc',
  },
})
```
