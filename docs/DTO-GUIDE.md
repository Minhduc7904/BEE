# DTO (Data Transfer Object) Guide

## Mục Lục
- [Giới Thiệu](#giới-thiệu)
- [Cấu Trúc DTO](#cấu-trúc-dto)
- [Best Practices](#best-practices)
- [Ví Dụ Thực Tế](#ví-dụ-thực-tế)
- [Validation Decorators](#validation-decorators)
- [Hướng Dẫn Chọn Decorator Đúng](#hướng-dẫn-chọn-decorator-đúng)
- [Quy Tắc Đặt Tên](#quy-tắc-đặt-tên)
- [Checklist](#checklist)
- [Lưu Ý Quan Trọng](#lưu-ý-quan-trọng)
- [Kết Luận](#kết-luận)

## Giới Thiệu

DTO (Data Transfer Object) là các class được sử dụng để định nghĩa cấu trúc dữ liệu được truyền giữa các layer trong ứng dụng. DTOs giúp:
- Validate dữ liệu đầu vào
- Định nghĩa rõ ràng contract API
- Tự động generate API documentation
- Type-safe cho TypeScript

## Cấu Trúc DTO

### 1. Class Declaration

```typescript
export class ExampleDto {
    // properties với validation decorators
}
```

### 2. JSDoc Comments

Mỗi DTO class và property nên có JSDoc comments đầy đủ:

```typescript
/**
 * DTO for [mô tả chức năng]
 * 
 * Default fields (always included):
 * - Field 1 (Tên tiếng Việt)
 * - Field 2 (Tên tiếng Việt)
 * 
 * Optional fields (can be toggled):
 * - Field 3 (Tên tiếng Việt)
 * - Field 4 (Tên tiếng Việt)
 */
export class ExampleDto {
    /**
     * Mô tả property
     * @default giá trị mặc định
     */
    @ValidationDecorator('Tên tiếng Việt')
    propertyName?: type = defaultValue
}
```

### 3. Properties

- Sử dụng `camelCase` cho tên property
- Khai báo type rõ ràng
- Đặt default value nếu cần
- Sử dụng optional (`?`) cho các field không bắt buộc

### 4. Validation Decorators

Luôn thêm validation decorator với message tiếng Việt:

```typescript
@IsOptionalBoolean('Bao gồm trường')
includeSchool?: boolean = true

@IsOptionalEnumValue(StatusEnum, 'Trạng thái')
status?: StatusEnum

@IsRequiredString('Tên đăng nhập')
username: string

@IsOptionalEmail('Email')
email?: string

@IsOptionalPhoneVN('Số điện thoại')
phone?: string
```

## Best Practices

### ✅ Nên Làm

1. **Đặt tên rõ ràng và mô tả đầy đủ**
```typescript
/**
 * DTO for customizing attendance export fields
 */
export class ExportAttendanceOptionsDto {
    /**
     * Include school field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm trường')
    includeSchool?: boolean = true
}
```

2. **Nhóm các field liên quan**
```typescript
// School-related fields
@IsOptionalBoolean('Bao gồm trường')
includeSchool?: boolean = true

@IsOptionalBoolean('Bao gồm khối')
includeGrade?: boolean = true

// Contact-related fields
@IsOptionalBoolean('Bao gồm số điện thoại phụ huynh')
includeParentPhone?: boolean = true

@IsOptionalBoolean('Bao gồm email')
includeEmail?: boolean = true
```

3. **Đặt default values hợp lý**
```typescript
// Các field quan trọng mặc định true
@IsOptionalBoolean('Bao gồm email')
includeEmail?: boolean = true

// Các field ít dùng mặc định false
@IsOptionalBoolean('Bao gồm số điện thoại học sinh')
includeStudentPhone?: boolean = false
```

4. **Thêm interface hỗ trợ nếu cần**
```typescript
/**
 * Interface for column configuration
 */
export interface AttendanceExportColumn {
    header: string
    key: string
    width: number
    enabled: boolean
}
```

### ❌ Không Nên Làm

```typescript
// ❌ Thiếu JSDoc
export class ExportDto {
    include?: boolean
}

// ❌ Không có validation decorator
export class ExportDto {
  includeSchool?: boolean
}

// ❌ Tên property không rõ ràng
export class ExportDto {
  @IsOptionalBoolean('Field')
  field1?: boolean
}

// ❌ Thiếu default value cho optional field
export class ExportDto {
  @IsOptionalBoolean('Bao gồm trường')
  includeSchool?: boolean // Nên có = true hoặc = false
}

// ❌ Sử dụng sai thứ tự tham số cho enum
export class ExportDto {
  @IsOptionalEnumValue('Trạng thái', StatusEnum) // SAI!
  status?: StatusEnum
}

// ❌ Sử dụng decorator không phù hợp với type
export class ExportDto {
  @IsOptionalString('ID')  // SAI! ID nên dùng IsOptionalIdNumber
  id?: number
  
  @IsOptionalInt('Danh sách ID')  // SAI! Array nên dùng IsOptionalIntArray
  ids?: number[]
}

// ❌ Thiếu import decorator
import { IsOptional, IsString } from 'class-validator'  // SAI! Nên import từ shared/decorators

export class ExportDto {
  @IsOptional()
  @IsString()
  name?: string
}
```

## Hướng Dẫn Chọn Decorator Đúng

### Khi nào dùng decorator nào?

#### String Fields
- **Tên, mô tả, text thông thường**: `IsOptionalString` / `IsRequiredString`
- **Email**: `IsOptionalEmail` / `IsRequiredEmail`
- **Số điện thoại VN**: `IsOptionalPhoneVN` / `IsRequiredPhoneVN`

#### Number Fields
- **ID, khóa ngoại** (phải là số nguyên dương): `IsOptionalIdNumber` / `IsRequiredIdNumber`
- **Số nguyên** (integer): `IsOptionalInt` / `IsRequiredInt`
- **Số thực** (float/decimal): `IsOptionalNumber` / `IsRequiredNumber`
- **Số nguyên với min/max**: `IsRequiredInt('Khối lớp', 1, 12)`
- **Số thực với min/max**: `IsOptionalNumber('Điểm số', 0, 10)`

#### Array Fields
- **Mảng các ID** (positive integers): `IsOptionalIntArray` / `IsRequiredIntArray`
- **Mảng các số nguyên**: `IsOptionalNumberArray` / `IsRequiredNumberArray`

#### Other Fields
- **Boolean**: `IsOptionalBoolean` / `IsRequiredBoolean`
- **Enum**: `IsOptionalEnumValue(EnumType, 'Label')` / `IsRequiredEnumValue(EnumType, 'Label')`
- **Date**: `IsOptionalDate` / `IsRequiredDate`

### Ví dụ chọn decorator đúng:

```typescript
export class StudentDto {
  // ID - dùng IsRequiredIdNumber
  @IsRequiredIdNumber('ID học sinh')
  id: number

  // Tên - dùng IsRequiredString
  @IsRequiredString('Tên học sinh')
  name: string

  // Email - dùng IsOptionalEmail
  @IsOptionalEmail('Email')
  email?: string

  // Số điện thoại - dùng IsOptionalPhoneVN
  @IsOptionalPhoneVN('Số điện thoại')
  phone?: string

  // Khối lớp (1-12) - dùng IsRequiredInt với min/max
  @IsRequiredInt('Khối lớp', 1, 12)
  grade: number

  // Điểm số - dùng IsOptionalNumber với min/max
  @IsOptionalNumber('Điểm trung bình', 0, 10)
  gpa?: number

  // Giới tính - dùng IsOptionalEnumValue
  @IsOptionalEnumValue(Gender, 'Giới tính')
  gender?: Gender

  // Ngày sinh - dùng IsOptionalDate
  @IsOptionalDate('Ngày sinh')
  dateOfBirth?: Date

  // Danh sách ID khóa học - dùng IsOptionalIntArray
  @IsOptionalIntArray('Danh sách khóa học')
  courseIds?: number[]

  // Trạng thái kích hoạt - dùng IsOptionalBoolean
  @IsOptionalBoolean('Kích hoạt')
  isActive?: boolean = true
}
```

### Bảng Tóm Tắt Nhanh

| Loại Field | Optional Decorator | Required Decorator | Ghi chú |
|------------|-------------------|-------------------|---------|
| **String** | `IsOptionalString('Label')` | `IsRequiredString('Label')` | Có thể thêm maxLength |
| **Email** | `IsOptionalEmail('Email')` | `IsRequiredEmail('Email')` | Tự động validate format |
| **Phone VN** | `IsOptionalPhoneVN('SĐT')` | `IsRequiredPhoneVN('SĐT')` | Regex Vietnamese phone |
| **Boolean** | `IsOptionalBoolean('Label')` | `IsRequiredBoolean('Label')` | Nên có default value |
| **Integer** | `IsOptionalInt('Label', min?, max?)` | `IsRequiredInt('Label', min?, max?)` | Số nguyên |
| **Number** | `IsOptionalNumber('Label', min?, max?)` | `IsRequiredNumber('Label', min?, max?)` | Số thực |
| **ID** | `IsOptionalIdNumber('Label')` | `IsRequiredIdNumber('Label')` | Positive integer |
| **Enum** | `IsOptionalEnumValue(Enum, 'Label')` | `IsRequiredEnumValue(Enum, 'Label')` | ⚠️ Enum trước, Label sau |
| **Date** | `IsOptionalDate('Label')` | `IsRequiredDate('Label')` | ISO date string |
| **Array (int)** | `IsOptionalNumberArray('Label')` | `IsRequiredNumberArray('Label')` | Array of integers |
| **Array (IDs)** | `IsOptionalIntArray('Label')` | `IsRequiredIntArray('Label')` | Array of positive int |

## Ví Dụ Thực Tế

### Example 1: Export Options DTO

```typescript
import { IsOptionalBoolean } from 'src/shared/decorators'

/**
 * DTO for customizing attendance export fields
 * 
 * Default fields (always included):
 * - STT (序号)
 * - Mã học sinh (Student Code)
 * - Họ (Last Name)
 * - Tên (First Name)
 * - Trạng thái (Status)
 * 
 * Optional fields (can be toggled):
 * - Trường (School)
 * - SĐT phụ huynh (Parent Phone)
 * - SĐT học sinh (Student Phone)
 * - Lớp (Grade)
 * - Email
 * - Thời gian điểm danh (Marked At)
 * - Ghi chú (Notes)
 */
export class ExportAttendanceOptionsDto {
    /**
     * Include school field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm trường')
    includeSchool?: boolean = true

    /**
     * Include parent phone field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm số điện thoại phụ huynh')
    includeParentPhone?: boolean = true

    /**
     * Include student phone field
     * @default false
     */
    @IsOptionalBoolean('Bao gồm số điện thoại học sinh')
    includeStudentPhone?: boolean = false

    /**
     * Include grade field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm khối')
    includeGrade?: boolean = true

    /**
     * Include email field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm email')
    includeEmail?: boolean = true

    /**
     * Include marked at timestamp field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm thời gian điểm danh')
    includeMarkedAt?: boolean = true

    /**
     * Include notes field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm ghi chú')
    includeNotes?: boolean = true

    /**
     * Include makeup note field
     * @default false
     */
    @IsOptionalBoolean('Bao gồm ghi chú điểm danh bù')
    includeMakeupNote?: boolean = false

    /**
     * Include marker name field
     * @default true
     */
    @IsOptionalBoolean('Bao gồm tên người điểm danh')
    includeMarkerName?: boolean = true
}
```

### Example 2: Filter DTO

```typescript
import { IsOptionalEnumValue, IsOptionalDate, IsOptionalString } from 'src/shared/decorators'
import { AttendanceStatus } from 'src/shared/enums'

/**
 * DTO for filtering attendance records
 */
export class FilterAttendanceDto {
  /**
   * Filter by status
   * @optional
   */
  @IsOptionalEnumValue(AttendanceStatus, 'Trạng thái')
  status?: AttendanceStatus

  /**
   * Filter by date range start
   * @optional
   */
  @IsOptionalDate('Từ ngày')
  fromDate?: Date

  /**
   * Filter by date range end
   * @optional
   */
  @IsOptionalDate('Đến ngày')
  toDate?: Date

  /**
   * Filter by class ID
   * @optional
   */
  @IsOptionalIdNumber('ID lớp học')
  classId?: number
}
```

### Example 3: Create/Update DTO

```typescript
import { IsRequiredString, IsRequiredEnumValue, IsOptionalString, IsRequiredIdNumber } from 'src/shared/decorators'
import { AttendanceStatus } from 'src/shared/enums'

/**
 * DTO for creating or updating attendance record
 */
export class CreateAttendanceDto {
  /**
   * Student ID
   * @required
   */
  @IsRequiredIdNumber('ID học sinh')
  studentId: number

  /**
   * Class ID
   * @required
   */
  @IsRequiredIdNumber('ID lớp học')
  classId: number

  /**
   * Attendance status
   * @required
   */
  @IsRequiredEnumValue(AttendanceStatus, 'Trạng thái')
  status: AttendanceStatus

  /**
   * Notes
   * @optional
   */
  @IsOptionalString('Ghi chú')
  notes?: string

  /**
   * Makeup note
   * @optional
   */
  @IsOptionalString('Ghi chú điểm danh bù')
  makeupNote?: string
}
```

### Example 4: Registration DTO with Arrays

```typescript
import { 
  IsRequiredString, 
  IsOptionalEmail, 
  IsOptionalIntArray,
  IsRequiredInt 
} from 'src/shared/decorators'
import { MinLength } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'

/**
 * DTO for student registration
 * 
 * Required fields:
 * - Username (Tên đăng nhập)
 * - Password (Mật khẩu)
 * - Grade (Khối lớp)
 * 
 * Optional fields:
 * - Email
 * - Course IDs (Danh sách khóa học)
 * - Class IDs (Danh sách lớp học)
 */
export class RegisterStudentDto {
  /**
   * Student username
   * @required
   */
  @IsRequiredString('Tên đăng nhập')
  username: string

  /**
   * Student email
   * @optional
   */
  @IsOptionalEmail('Email')
  email?: string

  /**
   * Student password
   * @required
   * @minLength 6
   */
  @IsRequiredString('Mật khẩu')
  @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH('Mật khẩu', 6) })
  password: string

  /**
   * Grade level (1-12)
   * @required
   */
  @IsRequiredInt('Khối lớp', 1, 12)
  grade: number

  /**
   * List of course IDs to enroll
   * @optional
   */
  @IsOptionalIntArray('Danh sách khóa học')
  courseIds?: number[]

  /**
   * List of class IDs to join
   * @optional
   */
  @IsOptionalIntArray('Danh sách lớp học')
  classIds?: number[]
## Validation Decorators

### Custom Decorators

Dự án sử dụng các custom decorators từ `src/shared/decorators/validate`:

#### Boolean
```typescript
// Optional boolean field
@IsOptionalBoolean('Tên field tiếng Việt')
fieldName?: boolean

// Required boolean field
@IsRequiredBoolean('Tên field tiếng Việt')
fieldName: boolean
```

#### String
```typescript
// Optional string field
@IsOptionalString('Tên field tiếng Việt')
fieldName?: string

// Optional string with max length
@IsOptionalString('Tên field tiếng Việt', 255)
fieldName?: string

// Required string field
@IsRequiredString('Tên field tiếng Việt')
fieldName: string

// Required string with max length
@IsRequiredString('Tên field tiếng Việt', 100)
fieldName: string
```

#### Email
```typescript
// Optional email field
@IsOptionalEmail('Email')
email?: string

// Required email field
@IsRequiredEmail('Email')
email: string
```

#### Phone (Vietnamese Format)
```typescript
// Optional Vietnamese phone number
@IsOptionalPhoneVN('Số điện thoại')
phone?: string

// Required Vietnamese phone number
@IsRequiredPhoneVN('Số điện thoại')
phone: string
```

#### Number
```typescript
// Optional number (float/decimal)
@IsOptionalNumber('Tên field tiếng Việt')
fieldName?: number

// Optional number with min/max
@IsOptionalNumber('Điểm số', 0, 100)
score?: number

// Required number
@IsRequiredNumber('Tên field tiếng Việt')
fieldName: number

// Required number with min/max
@IsRequiredNumber('Tuổi', 0, 150)
age: number
```

#### Integer
```typescript
// Optional integer
@IsOptionalInt('Tên field tiếng Việt')
fieldName?: number

// Optional integer with min/max
@IsOptionalInt('Số lượng', 0, 100)
quantity?: number

// Required integer
@IsRequiredInt('Tên field tiếng Việt')
fieldName: number

// Required integer with min/max
@IsRequiredInt('Khối lớp', 1, 12)
grade: number
```

#### ID Number (Positive Integer)
```typescript
// Optional ID (positive integer)
@IsOptionalIdNumber('ID môn học')
subjectId?: number

// Required ID (positive integer)
@IsRequiredIdNumber('ID học sinh')
studentId: number
```

#### Enum
```typescript
// Optional enum field
@IsOptionalEnumValue(StatusEnum, 'Trạng thái')
status?: StatusEnum

// Required enum field
@IsRequiredEnumValue(GenderEnum, 'Giới tính')
gender: GenderEnum
```
**Lưu ý:** Tham số đầu tiên là enum type, tham số thứ hai là label tiếng Việt.

#### Date
```typescript
// Optional date field
@IsOptionalDate('Ngày sinh')
dateOfBirth?: Date

// Required date field
@IsRequiredDate('Ngày bắt đầu')
startDate: Date
```

#### Array
```typescript
// Optional number array (integers)
@IsOptionalNumberArray('Danh sách ID')
ids?: number[]

// Required number array (integers)
@IsRequiredNumberArray('Danh sách ID')
ids: number[]

// Optional positive integer array (for IDs)
@IsOptionalIntArray('Danh sách ID khóa học')
courseIds?: number[]

// Required positive integer array (for IDs)
@IsRequiredIntArray('Danh sách ID lớp học')
classIds: number[]
```
**Lưu ý:** 
- `IsOptionalNumberArray` / `IsRequiredNumberArray`: Chỉ validate array of integers
- `IsOptionalIntArray` / `IsRequiredIntArray`: Validate array of positive integers (dùng cho IDs)

## Quy Tắc Đặt Tên

### DTO Class Names

| Loại DTO | Pattern | Ví dụ |
|----------|---------|-------|
| Create | `Create[Entity]Dto` | `CreateAttendanceDto` |
| Update | `Update[Entity]Dto` | `UpdateAttendanceDto` |
| Filter/Query | `Filter[Entity]Dto` hoặc `Query[Entity]Dto` | `FilterAttendanceDto` |
| Export Options | `Export[Entity]OptionsDto` | `ExportAttendanceOptionsDto` |
| Response | `[Entity]ResponseDto` | `AttendanceResponseDto` |

### Property Names

- Sử dụng `camelCase`
- Tên tiếng Anh rõ ràng
- Prefix cho boolean: `is`, `has`, `include`, `enable`

```typescript
// ✅ Tốt
includeSchool?: boolean
isActive?: boolean
hasPermission?: boolean

// ❌ Không tốt
school?: boolean
active?: boolean
permission?: boolean
```

## Checklist

Khi tạo DTO mới, đảm bảo:

- [ ] Class name theo đúng convention
- [ ] JSDoc đầy đủ cho class
- [ ] JSDoc đầy đủ cho mỗi property (bao gồm @required/@optional)
- [ ] Validation decorator cho mỗi property
- [ ] Message tiếng Việt cho decorator
- [ ] Default value cho optional fields (đặc biệt là boolean)
- [ ] Type declaration rõ ràng
- [ ] Import decorators từ `src/shared/decorators`
- [ ] Nhóm các field liên quan với comments phân loại
- [ ] Interface hỗ trợ nếu cần
- [ ] Chọn đúng decorator cho từng loại field:
  - [ ] ID → `IsOptionalIdNumber` / `IsRequiredIdNumber`
  - [ ] Email → `IsOptionalEmail` / `IsRequiredEmail`
  - [ ] Phone → `IsOptionalPhoneVN` / `IsRequiredPhoneVN`
  - [ ] Enum → `IsOptionalEnumValue(EnumType, 'Label')` (đúng thứ tự!)
  - [ ] Array of IDs → `IsOptionalIntArray` / `IsRequiredIntArray`
  - [ ] Number với min/max → `IsRequiredInt('Label', min, max)`

## Lưu Ý Quan Trọng

### 1. Thứ tự tham số Enum Decorator
```typescript
// ✅ ĐÚNG
@IsOptionalEnumValue(StatusEnum, 'Trạng thái')
status?: StatusEnum

// ❌ SAI
@IsOptionalEnumValue('Trạng thái', StatusEnum)
status?: StatusEnum
```

### 2. Import từ đúng nguồn
```typescript
// ✅ ĐÚNG - Import từ shared decorators
import { IsRequiredString, IsOptionalEmail } from 'src/shared/decorators'

// ❌ SAI - Import trực tiếp từ class-validator
import { IsString, IsEmail, IsOptional } from 'class-validator'
```

### 3. Chọn đúng decorator cho ID
```typescript
// ✅ ĐÚNG - Dùng IsOptionalIdNumber cho ID
@IsOptionalIdNumber('ID môn học')
subjectId?: number

// ❌ SAI - Dùng IsOptionalInt hoặc IsOptionalNumber
@IsOptionalInt('ID môn học')
subjectId?: number
```

### 4. Chọn đúng decorator cho Array
```typescript
// ✅ ĐÚNG - Dùng IsOptionalIntArray cho array of IDs
@IsOptionalIntArray('Danh sách ID khóa học')
courseIds?: number[]

// ❌ SAI - Dùng decorator khác
@IsOptionalArray('Danh sách ID khóa học')
courseIds?: number[]
```

### 5. Default value cho Boolean fields
```typescript
// ✅ ĐÚNG - Có default value rõ ràng
@IsOptionalBoolean('Kích hoạt')
isActive?: boolean = true

// ❌ SAI - Thiếu default value
@IsOptionalBoolean('Kích hoạt')
isActive?: boolean
```

### 6. MaxLength cho String
```typescript
// ✅ ĐÚNG - Thêm maxLength khi cần
@IsRequiredString('Tên đăng nhập', 50)
username: string

// ✅ ĐÚNG - Không cần maxLength cho text dài
@IsOptionalString('Mô tả')
description?: string
```

### 7. Min/Max cho Number
```typescript
// ✅ ĐÚNG - Thêm min/max validation
@IsRequiredInt('Khối lớp', 1, 12)
grade: number

@IsOptionalNumber('Điểm số', 0, 10)
score?: number

// ⚠️ CẢNH BÁO - Không có min/max cho field có giới hạn rõ ràng
@IsRequiredInt('Khối lớp')  // Nên thêm min=1, max=12
grade: number
```

## Kết Luận

DTOs là phần quan trọng trong kiến trúc ứng dụng. Việc tuân thủ các best practices giúp:
- Code dễ đọc và maintain
- API documentation tự động và chính xác
- Validation nhất quán
- Giảm bugs từ dữ liệu đầu vào không hợp lệ

