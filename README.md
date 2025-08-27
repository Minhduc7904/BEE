# 🐝 BEE API

A robust NestJS-based API with JWT authentication, built following Clean Architecture principles.

## 🚀 Features

- **JWT Authentication System** with refresh token rotation
- **Role-based Access** (Admin & Student)
- **Clean Architecture** implementation
- **Prisma ORM** with MySQL database
- **Swagger API Documentation**
- **Comprehensive Security** features
- **Automated Release Process**

## 🏗 Architecture

```
src/
├── application/     # Use cases and DTOs
├── domain/         # Entities and repositories interfaces
├── infrastructure/ # Database, services implementations
├── presentation/   # Controllers and HTTP layer
├── shared/         # Common utilities and exceptions
└── config/         # Application configuration
```

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/admin` | Register admin account |
| POST | `/api/auth/register/student` | Register student account |
| POST | `/api/auth/login/admin` | Admin login |
| POST | `/api/auth/login/student` | Student login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout current device |
| POST | `/api/auth/logout/all-devices` | Logout all devices |

## 🛠 Quick Start

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

### Prerequisites
- Node.js 18+ 
- MySQL 8+
- npm or yarn

### Installation

1. **Clone repository**
```bash
git clone https://github.com/Minhduc7904/BEE.git
cd BEE
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Setup database**
```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

5. **Start development server**
```bash
npm run start:dev
```

## 📊 Scripts

```bash
# Development
npm run start:dev        # Start with hot reload
npm run start:debug      # Start with debug mode

# Build & Production
npm run build           # Build for production
npm run start:prod      # Start production server

# Testing
npm run test            # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:cov        # Test coverage

# Release Management
npm run release         # Create new release
npm run release:patch   # Patch version bump
npm run release:minor   # Minor version bump  
npm run release:major   # Major version bump

# Code Quality
npm run lint            # ESLint check
npm run format          # Prettier format

# Utilities
npm run gen:create      # Generate new module
npm run gen:delete      # Delete module
```

## 📚 Documentation

- **[Release Guide](./docs/RELEASE.md)** - How to create and manage releases
- **[API Documentation](http://localhost:3000/docs)** - Swagger/OpenAPI docs (when running)
- **[Changelog](./CHANGELOG.md)** - Version history and changes

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/dbname"

# Server  
PORT=3000
NODE_ENV=development

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
```

### Database Schema

The application uses Prisma ORM with the following main entities:
- **User** - Base user entity
- **Admin** - Admin profile extending User
- **Student** - Student profile extending User  
- **UserRefreshToken** - Refresh token management

## 🌐 API Documentation

When running the application, visit:
- **Swagger UI**: http://localhost:3000/docs
- **API Base URL**: http://localhost:3000/api

## 🚢 Deployment

### Docker (Recommended)

```bash
# Build and start with Docker Compose
docker-compose up -d

# Or build manually
docker build -t bee-api .
docker run -p 3000:3000 bee-api
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📜 License

This project is [MIT licensed](LICENSE).

## 🆘 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/Minhduc7904/BEE/issues)
- **Releases**: [GitHub Releases](https://github.com/Minhduc7904/BEE/releases)

---

**Built with ❤️ using NestJS**

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
