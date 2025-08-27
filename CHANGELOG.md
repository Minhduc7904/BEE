# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.0] - 2025-08-27

### Added
- **Authentication System**
  - User registration for Admin and Student roles
  - JWT-based authentication with access and refresh tokens
  - Token rotation mechanism for enhanced security
  - Secure password hashing with bcrypt + SHA-256 pre-hashing
  - Logout functionality with single device and all devices options

- **Architecture & Infrastructure**
  - Clean Architecture implementation with Domain, Application, Infrastructure, and Presentation layers
  - Repository pattern with Unit of Work
  - Prisma ORM integration with MySQL database
  - Global API prefix (/api)
  - Comprehensive error handling with custom exceptions
  - Request/Response DTOs with validation

- **API Documentation**
  - Swagger/OpenAPI integration
  - Configurable Swagger setup
  - Comprehensive API documentation for all endpoints

- **Security Features**
  - JWT token family management
  - Refresh token rotation
  - Password strength requirements
  - Input validation and sanitization
  - CORS configuration

- **Developer Experience**
  - Hot reload in development mode
  - Automated build and release scripts
  - Code generation scripts for modules
  - Comprehensive .gitignore
  - Environment-based configuration

### API Endpoints
- `POST /api/auth/register/admin` - Register admin account
- `POST /api/auth/register/student` - Register student account
- `POST /api/auth/login/admin` - Admin login
- `POST /api/auth/login/student` - Student login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout current device
- `POST /api/auth/logout/all-devices` - Logout all devices

### Technical Stack
- **Backend**: NestJS with TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with rotation mechanism
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Security**: bcrypt, helmet, CORS

### Database Schema
- Users table with polymorphic relationships
- Admin and Student profile tables
- Refresh tokens table with family tracking
- Migration system with Prisma

[v1.0.0]: https://github.com/Minhduc7904/BEE/releases/tag/v1.0.0
