import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for accessing API scope requirements in guards
 */
export const SCOPE_KEY = 'api_scope';

/**
 * RequireScope decorator for API token-based authorization
 *
 * This decorator enforces API token scope requirements for routes.
 * It supports both single scope and array of scopes (OR condition).
 *
 * Scopes follow the format: `resource:action` (e.g., 'link:read', 'link:create')
 *
 * Special scopes:
 * - `admin` - Grants full access to all resources and actions
 *
 * @param scope - Single scope string or array of scopes (OR condition)
 *
 * @example
 * // Single scope - API key must have this scope
 * @RequireScope('link:read')
 * getLinks() { }
 *
 * @example
 * // Multiple scopes (OR) - API key needs ANY of these scopes
 * @RequireScope(['link:read', 'link:create'])
 * createOrReadLink() { }
 *
 * @example
 * // Admin scope grants full access
 * @RequireScope('admin')
 * adminOnlyRoute() { }
 *
 * @example
 * // Use with NestJS guards
 * @Controller('links')
 * @UseGuards(ApiScopeGuard)
 * export class LinksController {
 *   @Get()
 *   @RequireScope('link:read')
 *   findAll() {}
 *
 *   @Post()
 *   @RequireScope('link:create')
 *   create() {}
 *
 *   @Patch(':id')
 *   @RequireScope(['link:update', 'admin'])
 *   update() {}
 * }
 */
export const RequireScope = (scope: string | string[]) =>
  SetMetadata(SCOPE_KEY, scope);
