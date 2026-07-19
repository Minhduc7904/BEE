# Clean Architecture Rules

## Dependency rules

- Domain code may depend only on domain code and shared value types that do not depend on frameworks.
- Application code may depend on domain ports/entities and application DTOs; it must not call Prisma directly.
- Infrastructure implements domain ports and may depend on Prisma and external services; it must not contain HTTP request handling.
- Presentation depends on application use cases and DTOs; controllers must not contain business rules or database queries.

## Domain and repository rules

- Model business concepts as domain entities rather than returning Prisma records outside infrastructure.
- Define repository contracts in `src/domain/repositories` and query/filter data types in `src/domain/interface`.
- Use interfaces/tokens in use cases, never concrete Prisma repositories.
- Keep Prisma relation selection and Prisma-to-domain conversion inside a repository and mapper.

## Application rules

- Give each meaningful action a focused use case with an `execute` method.
- Put validation of request shape in DTOs and validation of cross-field/business rules in use cases.
- Use `UNIT_OF_WORK` for workflows that change multiple aggregates or require audit logging/atomicity.
- Return response DTOs from use cases, not raw domain entities or Prisma values.

## Presentation rules

- Controllers only bind route, DTO, permission/auth context, status code, and use case invocation.
- Use permission codes for privileged operations. Self-service endpoints use `RequirePermission()` only when JWT authentication is required without a permission.
- Never accept ownership fields from a self-service request when they can be derived from `@CurrentUser`.
- Validate IDs with `ParseIntPipe`; keep route ordering unambiguous by placing static routes before parameter routes.

## DTO and pagination rules

- Reuse `src/shared/decorators/validate` instead of reimplementing common number, enum, string, boolean, and date validation.
- Extend `ListQueryDto` for paginated lists; define only feature-specific filters.
- Whitelist sort fields in `to...PaginationOptions`; never pass an arbitrary client sort field to Prisma.
- Use separate query DTOs when admin and self-service APIs expose different filters.

## Change discipline

- Before editing a function, class, or method, run the required GitNexus impact analysis and assess the blast radius.
- Follow the `database-schema-changes` skill for schema changes and inspect generated SQL before continuing.
- Generate Prisma Client and build after schema changes; build and test after code changes.
- Register every new repository, use case module, controller, enum export, and permission definition where the application expects it.
