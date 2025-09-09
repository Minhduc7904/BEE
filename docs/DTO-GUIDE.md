# DTO (Data Transfer Object) Guide - NestJS với Clean Architecture

## 📖 Mục lục
1. [Giới thiệu về DTO](#giới-thiệu-về-dto)
2. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
3. [Các loại DTO](#các-loại-dto)
4. [Decorators chính](#decorators-chính)
5. [Validation Decorators](#validation-decorators)
6. [Transform Decorators](#transform-decorators)
7. [Custom Decorators](#custom-decorators)
8. [Best Practices](#best-practices)
9. [Ví dụ thực tế](#ví-dụ-thực-tế)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Giới thiệu về DTO

**Data Transfer Object (DTO)** là pattern để truyền tải dữ liệu giữa các layer trong ứng dụng. Trong NestJS, DTO được sử dụng để:

- **Validation**: Kiểm tra dữ liệu đầu vào
- **Transformation**: Chuyển đổi dữ liệu
- **Documentation**: Tự động tạo Swagger docs
- **Type Safety**: Đảm bảo kiểu dữ liệu TypeScript
- **Serialization**: Kiểm soát dữ liệu trả về client

---

## 📁 Cấu trúc thư mục

```
src/application/dtos/
├── auth/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── google-auth.dto.ts
├── user/
│   ├── user.dto.ts
│   └── user-list-query.dto.ts
├── student/
│   ├── student.dto.ts
│   └── student-list-query.dto.ts
├── document/
│   └── document.dto.ts
├── pagination/
│   ├── list-query.dto.ts
│   └── pagination-response.dto.ts
└── base/
    ├── base-response.dto.ts
    └── error-response.dto.ts
```

---

## 🏗️ Các loại DTO

### 1. **Input DTOs** (Request)
- `CreateXxxDto`: Tạo mới resource
- `UpdateXxxDto`: Cập nhật resource  
- `XxxQueryDto`: Tham số query/filter
- `XxxParamsDto`: Tham số URL params

### 2. **Output DTOs** (Response)
- `XxxResponseDto`: Trả về dữ liệu single resource
- `XxxListResponseDto`: Trả về danh sách có pagination
- `ErrorResponseDto`: Trả về lỗi

### 3. **Base DTOs**
- `ListQueryDto`: Base class cho query pagination
- `BaseResponseDto`: Base class cho response

---

## 🎨 Decorators chính

### 1. **Swagger Decorators**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty({
        description: 'Tên đăng nhập của user',
        example: 'john_doe',
        minLength: 3,
        maxLength: 50
    })
    username: string;

    @ApiPropertyOptional({
        description: 'Email của user (tùy chọn)',
        example: 'john@example.com',
        format: 'email'
    })
    email?: string;

    @ApiProperty({
        description: 'Tuổi của user',
        example: 25,
        minimum: 18,
        maximum: 100
    })
    age: number;

    @ApiProperty({
        description: 'Vai trò của user',
        enum: ['ADMIN', 'USER', 'MODERATOR'],
        example: 'USER'
    })
    role: string;

    @ApiProperty({
        description: 'Danh sách sở thích',
        type: [String],
        example: ['reading', 'gaming']
    })
    hobbies: string[];

    @ApiProperty({
        description: 'Thông tin địa chỉ',
        type: () => AddressDto
    })
    address: AddressDto;
}
```

**Các thuộc tính Swagger:**
- `description`: Mô tả field
- `example`: Ví dụ giá trị
- `required`: Bắt buộc (mặc định true cho @ApiProperty)
- `type`: Kiểu dữ liệu
- `enum`: Danh sách giá trị hợp lệ
- `minimum/maximum`: Giá trị min/max cho number
- `minLength/maxLength`: Độ dài min/max cho string
- `format`: Định dạng (email, date, etc.)

### 2. **Validation Decorators**

```typescript
import { 
    IsString, IsNumber, IsEmail, IsOptional, 
    MinLength, MaxLength, Min, Max,
    IsEnum, IsArray, IsBoolean, IsDate,
    IsUrl, IsUUID, Matches, IsNotEmpty
} from 'class-validator';

export class CreateUserDto {
    // String validation
    @IsString({ message: 'Username phải là chuỗi ký tự' })
    @IsNotEmpty({ message: 'Username không được để trống' })
    @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Username không được vượt quá 50 ký tự' })
    username: string;

    // Email validation
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @IsOptional() // Field tùy chọn
    email?: string;

    // Number validation
    @IsNumber({}, { message: 'Tuổi phải là số' })
    @Min(18, { message: 'Tuổi phải từ 18 trở lên' })
    @Max(100, { message: 'Tuổi không được quá 100' })
    age: number;

    // Enum validation
    @IsEnum(['ADMIN', 'USER', 'MODERATOR'], { 
        message: 'Vai trò phải là ADMIN, USER hoặc MODERATOR' 
    })
    role: string;

    // Array validation
    @IsArray({ message: 'Sở thích phải là mảng' })
    @IsString({ each: true, message: 'Mỗi sở thích phải là chuỗi' })
    hobbies: string[];

    // Boolean validation
    @IsBoolean({ message: 'Trạng thái phải là true/false' })
    isActive: boolean;

    // URL validation
    @IsUrl({}, { message: 'URL không hợp lệ' })
    @IsOptional()
    website?: string;

    // UUID validation
    @IsUUID(4, { message: 'ID phải là UUID version 4' })
    @IsOptional()
    externalId?: string;

    // Regex validation
    @Matches(/^[0-9]{10,11}$/, { 
        message: 'Số điện thoại phải có 10-11 chữ số' 
    })
    @IsOptional()
    phone?: string;

    // Date validation
    @IsDate({ message: 'Ngày sinh phải là ngày hợp lệ' })
    @IsOptional()
    birthDate?: Date;
}
```

### 3. **Transform Decorators**

```typescript
import { Transform, Type } from 'class-transformer';

export class QueryDto {
    // Transform string to number
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    page: number;

    // Transform string to boolean
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isActive: boolean;

    // Transform array of strings to numbers
    @Transform(({ value }) => {
        if (Array.isArray(value)) {
            return value.map(v => parseInt(v));
        }
        return [parseInt(value)];
    })
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];

    // Using Type decorator for nested objects
    @Type(() => Date)
    @IsDate()
    createdAt: Date;

    // Transform string to uppercase
    @Transform(({ value }) => value?.toUpperCase())
    @IsString()
    code: string;
}
```

---

## 🛠️ Custom Decorators

### 1. **@Trim Decorator**

```typescript
// src/shared/decorators/trim.decorator.ts
import { Transform } from 'class-transformer';

export const Trim = () => Transform(({ value }) => {
    if (typeof value === 'string') {
        return value.trim();
    }
    return value;
});

// Sử dụng
export class UserDto {
    @Trim()
    @IsString()
    username: string;
}
```

### 2. **@IsEnumValue Decorator**

```typescript
// src/shared/decorators/is-enum-value.decorator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsEnumValue(enumObject: any, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isEnumValue',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return Object.values(enumObject).includes(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} phải là một trong các giá trị: ${Object.values(enumObject).join(', ')}`;
                }
            }
        });
    };
}

// Sử dụng
enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

export class CreateUserDto {
    @IsEnumValue(UserRole)
    role: UserRole;
}
```

### 3. **@IsPhoneNumber Decorator**

```typescript
// src/shared/decorators/is-phone.decorator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isPhoneNumber',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (typeof value !== 'string') return false;
                    return /^[0-9]{10,11}$/.test(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return 'Số điện thoại phải có 10-11 chữ số';
                }
            }
        });
    };
}
```

---

## 🏆 Best Practices

### 1. **Naming Convention**
```typescript
// ✅ Good
CreateUserDto, UpdateUserDto, UserResponseDto
UserListQueryDto, UserListResponseDto

// ❌ Bad  
UserCreateDto, UserUpdateDto, User
UserQuery, UserList
```

### 2. **Optional vs Required Fields**
```typescript
export class UpdateUserDto {
    // ✅ Update DTO - tất cả field đều optional
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsEmail()
    email?: string;
}

export class CreateUserDto {
    // ✅ Create DTO - field bắt buộc không có @IsOptional
    @IsString()
    @IsNotEmpty()
    username: string;

    // ✅ Field tùy chọn có @IsOptional
    @IsOptional()
    @IsEmail()
    email?: string;
}
```

### 3. **Validation Messages**
```typescript
export class CreateUserDto {
    @IsString({ message: 'Username phải là chuỗi ký tự' })
    @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Username không được vượt quá 50 ký tự' })
    username: string;
}
```

### 4. **Inheritance Pattern**
```typescript
// Base DTO
export class BaseUserDto {
    @Trim()
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username: string;

    @Trim()
    @IsOptional()
    @IsEmail()
    email?: string;
}

// Extend base DTO
export class CreateUserDto extends BaseUserDto {
    @IsString()
    @MinLength(8)
    password: string;
}

export class UpdateUserDto extends BaseUserDto {
    // Tất cả fields từ BaseUserDto đã là optional trong update
}
```

### 5. **Query DTO Pattern**
```typescript
export class UserListQueryDto extends ListQueryDto {
    // Kế thừa pagination, sort, search từ ListQueryDto
    
    @ApiPropertyOptional({
        description: 'Lọc theo vai trò',
        enum: UserRole
    })
    @IsOptional()
    @IsEnumValue(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái',
        example: true
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;
}
```

---

## 💡 Ví dụ thực tế

### 1. **User Management DTO**

```typescript
// create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    MODERATOR = 'MODERATOR'
}

export class CreateUserDto {
    @ApiProperty({
        description: 'Tên đăng nhập',
        example: 'john_doe',
        minLength: 3,
        maxLength: 50
    })
    @Trim()
    @IsString({ message: 'Username phải là chuỗi ký tự' })
    @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Username không được vượt quá 50 ký tự' })
    username: string;

    @ApiProperty({
        description: 'Mật khẩu',
        example: 'SecurePass123!',
        minLength: 8
    })
    @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    password: string;

    @ApiPropertyOptional({
        description: 'Email người dùng',
        example: 'john@example.com'
    })
    @Trim()
    @IsOptional()
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    email?: string;

    @ApiProperty({
        description: 'Họ',
        example: 'Doe',
        maxLength: 100
    })
    @Trim()
    @IsString({ message: 'Họ phải là chuỗi ký tự' })
    @MaxLength(100, { message: 'Họ không được vượt quá 100 ký tự' })
    lastName: string;

    @ApiProperty({
        description: 'Tên',
        example: 'John',
        maxLength: 50
    })
    @Trim()
    @IsString({ message: 'Tên phải là chuỗi ký tự' })
    @MaxLength(50, { message: 'Tên không được vượt quá 50 ký tự' })
    firstName: string;

    @ApiProperty({
        description: 'Vai trò người dùng',
        enum: UserRole,
        example: UserRole.USER
    })
    @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
    role: UserRole;
}

// update-user.dto.ts
export class UpdateUserDto {
    @ApiPropertyOptional({
        description: 'Tên đăng nhập mới',
        example: 'john_doe_new'
    })
    @Trim()
    @IsOptional()
    @IsString({ message: 'Username phải là chuỗi ký tự' })
    @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Username không được vượt quá 50 ký tự' })
    username?: string;

    @ApiPropertyOptional({
        description: 'Email mới',
        example: 'john.new@example.com'
    })
    @Trim()
    @IsOptional()
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    email?: string;

    @ApiPropertyOptional({
        description: 'Họ mới',
        example: 'Smith'
    })
    @Trim()
    @IsOptional()
    @IsString({ message: 'Họ phải là chuỗi ký tự' })
    @MaxLength(100, { message: 'Họ không được vượt quá 100 ký tự' })
    lastName?: string;

    @ApiPropertyOptional({
        description: 'Tên mới',
        example: 'Jane'
    })
    @Trim()
    @IsOptional()
    @IsString({ message: 'Tên phải là chuỗi ký tự' })
    @MaxLength(50, { message: 'Tên không được vượt quá 50 ký tự' })
    firstName?: string;
}

// user-response.dto.ts
export class UserResponseDto {
    @ApiProperty({
        description: 'ID người dùng',
        example: 1
    })
    userId: number;

    @ApiProperty({
        description: 'Tên đăng nhập',
        example: 'john_doe'
    })
    username: string;

    @ApiProperty({
        description: 'Email',
        example: 'john@example.com',
        nullable: true
    })
    email?: string;

    @ApiProperty({
        description: 'Họ và tên đầy đủ',
        example: 'John Doe'
    })
    fullName: string;

    @ApiProperty({
        description: 'Vai trò',
        enum: UserRole,
        example: UserRole.USER
    })
    role: UserRole;

    @ApiProperty({
        description: 'Trạng thái hoạt động',
        example: true
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Ngày tạo',
        example: '2024-01-01T00:00:00.000Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Ngày cập nhật',
        example: '2024-01-02T00:00:00.000Z'
    })
    updatedAt: Date;

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
    }

    static fromEntity(user: any): UserResponseDto {
        return new UserResponseDto({
            userId: user.userId,
            username: user.username,
            email: user.email,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
}
```

### 2. **Pagination Query DTO**

```typescript
// user-list-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { ListQueryDto } from '../pagination/list-query.dto';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class UserListQueryDto extends ListQueryDto {
    @ApiPropertyOptional({
        description: 'Lọc theo vai trò',
        enum: UserRole,
        example: UserRole.USER
    })
    @IsOptional()
    @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
    role?: UserRole;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái hoạt động',
        example: true
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: 'Trạng thái phải là true hoặc false' })
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Lọc theo email',
        example: 'john@example.com'
    })
    @Trim()
    @IsOptional()
    @IsString({ message: 'Email phải là chuỗi' })
    email?: string;

    /**
     * Convert to filter options for repository
     */
    toFilterOptions() {
        return {
            role: this.role,
            isActive: this.isActive,
            email: this.email,
            search: this.search // From base ListQueryDto
        };
    }

    /**
     * Get Prisma where clause
     */
    toPrismaWhere() {
        const where: any = {};

        if (this.role) {
            where.role = this.role;
        }

        if (this.isActive !== undefined) {
            where.isActive = this.isActive;
        }

        if (this.email) {
            where.email = {
                contains: this.email,
                mode: 'insensitive'
            };
        }

        // Add search functionality
        if (this.search) {
            where.OR = [
                {
                    username: {
                        contains: this.search,
                        mode: 'insensitive'
                    }
                },
                {
                    firstName: {
                        contains: this.search,
                        mode: 'insensitive'
                    }
                },
                {
                    lastName: {
                        contains: this.search,
                        mode: 'insensitive'
                    }
                },
                {
                    email: {
                        contains: this.search,
                        mode: 'insensitive'
                    }
                }
            ];
        }

        return where;
    }
}
```

### 3. **File Upload DTO**

```typescript
// upload-file.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';

export enum FileType {
    IMAGE = 'image',
    DOCUMENT = 'document',
    VIDEO = 'video'
}

export class UploadFileDto {
    @ApiProperty({
        description: 'Tệp tin cần upload',
        type: 'string',
        format: 'binary'
    })
    file: Express.Multer.File;

    @ApiProperty({
        description: 'Loại tệp tin',
        enum: FileType,
        example: FileType.IMAGE
    })
    @IsEnum(FileType, { message: 'Loại tệp tin không hợp lệ' })
    type: FileType;

    @ApiProperty({
        description: 'Mô tả tệp tin',
        example: 'Avatar người dùng',
        maxLength: 255,
        required: false
    })
    @Trim()
    @IsOptional()
    @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
    @MaxLength(255, { message: 'Mô tả không được vượt quá 255 ký tự' })
    description?: string;
}

export class FileResponseDto {
    @ApiProperty({
        description: 'ID của tệp tin',
        example: 1
    })
    fileId: number;

    @ApiProperty({
        description: 'Tên tệp tin gốc',
        example: 'avatar.jpg'
    })
    originalName: string;

    @ApiProperty({
        description: 'Tên tệp tin đã lưu',
        example: '1642758000000_avatar.jpg'
    })
    fileName: string;

    @ApiProperty({
        description: 'URL truy cập tệp tin',
        example: 'https://example.com/uploads/1642758000000_avatar.jpg'
    })
    url: string;

    @ApiProperty({
        description: 'Kích thước tệp tin (bytes)',
        example: 1024000
    })
    size: number;

    @ApiProperty({
        description: 'MIME type',
        example: 'image/jpeg'
    })
    mimeType: string;

    @ApiProperty({
        description: 'Loại tệp tin',
        enum: FileType,
        example: FileType.IMAGE
    })
    type: FileType;

    @ApiProperty({
        description: 'Ngày upload',
        example: '2024-01-01T00:00:00.000Z'
    })
    createdAt: Date;
}
```

---

## 🐛 Troubleshooting

### 1. **Validation không hoạt động**

```typescript
// ❌ Thiếu ValidationPipe trong main.ts
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
}

// ✅ Thêm ValidationPipe
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true, // Loại bỏ properties không có trong DTO
        forbidNonWhitelisted: true, // Throw error nếu có extra properties
        transform: true, // Tự động transform types
        disableErrorMessages: false, // Hiển thị error messages
    }));
    
    await app.listen(3000);
}
```

### 2. **Transform không hoạt động**

```typescript
// ❌ Thiếu @Type decorator
export class QueryDto {
    @Transform(({ value }) => parseInt(value))
    page: number; // Có thể không work
}

// ✅ Sử dụng @Type decorator
export class QueryDto {
    @Type(() => Number)
    @Transform(({ value }) => parseInt(value))
    page: number;
}
```

### 3. **Nested validation không hoạt động**

```typescript
// ❌ Thiếu @ValidateNested và @Type
export class CreateUserDto {
    @IsObject()
    address: AddressDto; // Validation cho AddressDto không chạy
}

// ✅ Thêm @ValidateNested và @Type
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
    @ValidateNested()
    @Type(() => AddressDto)
    address: AddressDto;
}
```

### 4. **Array validation không hoạt động**

```typescript
// ❌ Thiếu { each: true }
export class CreateUserDto {
    @IsString() // Chỉ validate array, không validate từng element
    hobbies: string[];
}

// ✅ Thêm { each: true }
export class CreateUserDto {
    @IsArray()
    @IsString({ each: true }) // Validate từng element trong array
    hobbies: string[];
}
```

### 5. **Custom decorator không hoạt động**

```typescript
// ❌ Không register decorator đúng cách
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        // Missing registerDecorator call
    };
}

// ✅ Register decorator đúng cách
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isPhoneNumber',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return typeof value === 'string' && /^[0-9]{10,11}$/.test(value);
                }
            }
        });
    };
}
```

---

## 🎯 Checklist cho DTO hoàn chỉnh

### ✅ **Input DTO (Request)**
- [ ] Import đúng decorators
- [ ] @ApiProperty cho required fields
- [ ] @ApiPropertyOptional cho optional fields  
- [ ] @IsOptional() cho optional fields
- [ ] @Trim() cho string fields
- [ ] Validation decorators phù hợp
- [ ] Error messages bằng tiếng Việt
- [ ] Transform decorators nếu cần

### ✅ **Output DTO (Response)**
- [ ] @ApiProperty cho tất cả fields
- [ ] Constructor nhận Partial<T>
- [ ] Static factory methods (fromEntity, etc.)
- [ ] Computed properties (getters) nếu cần
- [ ] Không có validation decorators

### ✅ **Query DTO**
- [ ] Kế thừa từ ListQueryDto nếu có pagination
- [ ] @Type() cho number/boolean từ query string
- [ ] @Transform() nếu cần custom transformation
- [ ] Helper methods (toPrismaWhere, toFilterOptions)

### ✅ **File Structure**
- [ ] Tên file theo convention (kebab-case)
- [ ] Export classes với tên rõ ràng
- [ ] Group related DTOs trong cùng file/folder
- [ ] Import paths sử dụng relative paths

---

## 📚 Tài liệu tham khảo

- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [Class Validator](https://github.com/typestack/class-validator)
- [Class Transformer](https://github.com/typestack/class-transformer)
- [Swagger/OpenAPI](https://docs.nestjs.com/openapi/introduction)

---

*Tài liệu này được tạo để hướng dẫn team phát triển viết DTO một cách nhất quán và hiệu quả trong dự án NestJS với Clean Architecture.*
