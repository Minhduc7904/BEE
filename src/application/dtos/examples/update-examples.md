// src/application/dtos/examples/update-examples.md
# Ví dụ sử dụng Update DTOs

## 1. UpdateUserDto
```typescript
import { UpdateUserDto } from '../user/user.dto';

// Cập nhật thông tin cơ bản của user
const updateUserData: UpdateUserDto = {
  username: 'new_username',
  email: 'new.email@example.com',
  firstName: 'Tên Mới',
  lastName: 'Họ Mới'
};

// Chỉ cập nhật một số field
const partialUpdate: UpdateUserDto = {
  email: 'updated.email@example.com'
};
```

## 2. UpdateStudentDto
```typescript
import { UpdateStudentDto } from '../student/student.dto';

// Cập nhật thông tin student (kế thừa từ UpdateUserDto)
const updateStudentData: UpdateStudentDto = {
  // User fields
  firstName: 'Tên Mới',
  lastName: 'Họ Mới',
  email: 'student.new@example.com',
  
  // Student fields
  studentPhone: '0123456789',
  parentPhone: '0987654321',
  grade: 11,
  school: 'THPT Nguyễn Du'
};

// Chỉ cập nhật thông tin sinh viên
const studentOnlyUpdate: UpdateStudentDto = {
  grade: 12,
  school: 'THPT Lê Quý Đôn'
};
```

## 3. UpdateAdminDto
```typescript
import { UpdateAdminDto } from '../admin/admin.dto';

// Cập nhật thông tin admin (kế thừa từ UpdateUserDto)
const updateAdminData: UpdateAdminDto = {
  // User fields
  firstName: 'Giáo Viên',
  lastName: 'Nguyễn',
  email: 'teacher.nguyen@school.edu',
  
  // Admin fields
  subject: 'Toán học',
  description: 'Giáo viên toán với 15 năm kinh nghiệm',
  specialization: 'Hình học, Đại số, Giải tích'
};

// Chỉ cập nhật thông tin admin
const adminOnlyUpdate: UpdateAdminDto = {
  subject: 'Vật lý',
  specialization: 'Cơ học, Điện học'
};
```

## 4. Validation
Tất cả các DTO đều có validation:
- Optional fields: Tất cả fields đều optional
- String validation: Kiểm tra kiểu dữ liệu
- Length validation: Giới hạn độ dài
- Email validation: Kiểm tra format email
- Phone validation: Kiểm tra format số điện thoại (10-11 số)
- Grade validation: Từ 1 đến 12

## 5. Sử dụng trong Controller
```typescript
@Patch('users/:id')
async updateUser(@Param('id') id: number, @Body() updateDto: UpdateUserDto) {
  return await this.userService.update(id, updateDto);
}

@Patch('students/:id')
async updateStudent(@Param('id') id: number, @Body() updateDto: UpdateStudentDto) {
  return await this.studentService.update(id, updateDto);
}

@Patch('admins/:id')
async updateAdmin(@Param('id') id: number, @Body() updateDto: UpdateAdminDto) {
  return await this.adminService.update(id, updateDto);
}
```
