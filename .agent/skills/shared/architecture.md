# BEE Architecture

## Stack and entry points

- NestJS API with the global `/api` prefix in `src/main.ts`.
- MySQL is accessed through Prisma; the source of truth is `prisma/schema.prisma`.
- `src/app.module.ts` composes Prisma, infrastructure, application, and presentation modules.

## Layer direction

`presentation -> application -> domain <- infrastructure`

- `presentation/`: HTTP controllers and WebSocket gateways. Controllers parse request DTOs, enforce guards/permissions, read current-user data, and delegate to use cases.
- `application/`: DTOs, use cases, application interfaces, and feature application modules. Use cases own orchestration and business workflows.
- `domain/`: entities, repository ports, and domain interfaces. It must not import NestJS, Prisma, HTTP, or infrastructure code.
- `infrastructure/`: Prisma repositories, mappers, external integrations, and concrete services. It implements domain ports and registers DI providers.

## Feature layout

For a feature named `feature`, follow existing neighboring modules:

```text
src/domain/entities/feature/
src/domain/interface/feature/
src/domain/repositories/feature.repository.ts
src/infrastructure/mappers/feature/
src/infrastructure/repositories/feature/
src/application/dtos/feature/
src/application/use-cases/feature/
src/presentation/controllers/feature.controller.ts
```

Register its repository provider/export in `InfrastructureModule`, its use-case module in `ApplicationModule`, and its controller in `PresentationModule`.

## Data flow

1. A controller receives a validated DTO and auth context.
2. A use case applies the workflow and uses repository interfaces via DI tokens such as `IQuestionRepository`.
3. A Prisma repository queries/persists data and maps Prisma records to domain entities.
4. A response DTO maps the domain entity to the API response shape.

## Project conventions

- Keep database names in `schema.prisma` explicit with `@map`/`@@map` and indexed for supported filters.
- Use `BaseResponseDto` for a single result and `PaginationResponseDto` for a list.
- List DTOs extend `ListQueryDto`, whitelist allowed sort fields, and translate themselves into domain filter/pagination objects.
- Use `RequirePermission(PERMISSION_CODES...)` for privileged endpoints. Use `RequirePermission()` with no code for authenticated self-service endpoints when no permission is required.
- Add new system permission codes to both `src/shared/constants/permissions/permission.codes.ts` and `src/shared/constants/permissions.constants.ts`; update role seed mappings when a default role should receive them.
- Use `ExceptionHandler.execute` in controllers and project custom exceptions for expected business failures.

## Database changes

Read and follow `.agent/skills/database-schema-changes/SKILL.md` before every Prisma schema change.
