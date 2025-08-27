# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.0-beta] - 2025-08-27

### 🧪 Beta Release Notice
This is a beta release for testing and feedback. APIs may change before the stable v1.0.0 release.
Use in development/testing environments only.

### 🆕 Added
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
  - CORS configuration with environment-based settings
  - Comprehensive error handling with custom exceptions
  - Request/Response DTOs with validation

- **API Documentation**
  - Swagger/OpenAPI integration
  - Configurable Swagger setup with environment variables
  - Comprehensive API documentation for all endpoints

- **Security Features**
  - JWT token family management
  - Refresh token rotation mechanism
  - Password strength requirements with validation
  - Input validation and sanitization
  - CORS security headers
  - Custom CORS decorators and interceptors

- **Developer Experience**
  - Hot reload in development mode
  - Automated build and release scripts (PowerShell & Bash)
  - Code generation scripts for modules
  - Comprehensive .gitignore configuration
  - Environment-based configuration system
  - Release documentation and guidelines

### 🔧 API Endpoints
- `POST /api/auth/register/admin` - Register admin account
- `POST /api/auth/register/student` - Register student account
- `POST /api/auth/login/admin` - Admin login
- `POST /api/auth/login/student` - Student login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout current device
- `POST /api/auth/logout/all-devices` - Logout all devices

### 🛠 Technical Stack
- **Backend**: NestJS 11.x with TypeScript
- **Database**: MySQL with Prisma ORM 5.x
- **Authentication**: JWT with rotation mechanism
- **Documentation**: Swagger/OpenAPI 3.0
- **Validation**: class-validator, class-transformer
- **Security**: bcrypt, CORS, input validation

### 📊 Database Schema
- Users table with polymorphic relationships
- Admin and Student profile tables
- Refresh tokens table with family tracking and rotation
- Migration system with Prisma Migrate

### 📋 Beta Limitations
- No production deployment configuration
- Limited error handling for edge cases
- API endpoints may change in stable release
- Documentation may be incomplete for some features

### 🔮 Planned for Stable Release
- Production deployment guides
- Additional security hardening
- Performance optimizations
- Comprehensive testing suite
- API stability guarantees

[v1.0.0-beta]: https://github.com/Minhduc7904/BEE/releases/tag/v1.0.0-beta
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
