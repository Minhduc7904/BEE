// src/application/dtos/index.ts
// Base DTOs
export * from './common/base-response.dto';
export * from './common/error-response.dto';

// Pagination DTOs
export * from './pagination/list-query.dto';

// Auth DTOs
export * from './auth/login-request.dto';
export * from './auth/login-response.dto';
export * from './auth/logout.dto';
export * from './auth/refresh-token.dto';
export * from './auth/register-request.dto';
export * from './auth/register-response.dto';

// Document DTOs
export * from './document/document.dto';

// Image DTOs
export * from './image/create-image.dto';
export * from './image/create-media-image.dto';
export * from './image/create-question-image.dto';
export * from './image/create-solution-image.dto';

// Log DTOs
export * from './log/log.dto';

// Role DTOs
export * from './role/role.dto';
export * from './role/user-role.dto';

// Student DTOs
export * from './student/student.dto';
export * from './student/student-list-query.dto';

// User DTOs
export * from './user/user.dto';

// Admin DTOs
export * from './admin/admin.dto';
