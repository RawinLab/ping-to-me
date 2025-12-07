/**
 * API Token Scopes System
 *
 * Defines granular scopes for API tokens, allowing fine-grained access control
 * beyond the organization-level RBAC system. API tokens can be restricted to
 * specific resources and actions.
 */

/**
 * Available API scopes for token-based authentication
 * Format: {resource}:{action}
 * Special scope: 'admin' grants full access to all resources and actions
 */
export type ApiScope =
  // Link scopes
  | 'link:read'
  | 'link:create'
  | 'link:update'
  | 'link:delete'
  | 'link:export'
  | 'link:bulk'

  // Analytics scopes
  | 'analytics:read'
  | 'analytics:export'

  // Domain scopes
  | 'domain:read'
  | 'domain:create'
  | 'domain:verify'
  | 'domain:delete'

  // Campaign scopes
  | 'campaign:read'
  | 'campaign:create'
  | 'campaign:update'
  | 'campaign:delete'

  // Tag scopes
  | 'tag:read'
  | 'tag:create'
  | 'tag:update'
  | 'tag:delete'

  // BioPage scopes
  | 'biopage:read'
  | 'biopage:create'
  | 'biopage:update'
  | 'biopage:delete'

  // Team scopes (read-only for API tokens)
  | 'team:read'

  // Admin scope (full access)
  | 'admin';

/**
 * Complete list of all available API scopes
 */
export const API_SCOPES: readonly ApiScope[] = [
  // Link scopes
  'link:read',
  'link:create',
  'link:update',
  'link:delete',
  'link:export',
  'link:bulk',

  // Analytics scopes
  'analytics:read',
  'analytics:export',

  // Domain scopes
  'domain:read',
  'domain:create',
  'domain:verify',
  'domain:delete',

  // Campaign scopes
  'campaign:read',
  'campaign:create',
  'campaign:update',
  'campaign:delete',

  // Tag scopes
  'tag:read',
  'tag:create',
  'tag:update',
  'tag:delete',

  // BioPage scopes
  'biopage:read',
  'biopage:create',
  'biopage:update',
  'biopage:delete',

  // Team scopes
  'team:read',

  // Admin scope
  'admin',
] as const;

/**
 * Human-readable descriptions for each API scope
 * Used in UI for scope selection and documentation
 */
export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  // Link scopes
  'link:read': 'Read and list links',
  'link:create': 'Create new links',
  'link:update': 'Update existing links',
  'link:delete': 'Delete links',
  'link:export': 'Export link data',
  'link:bulk': 'Perform bulk operations on links',

  // Analytics scopes
  'analytics:read': 'View analytics data for links',
  'analytics:export': 'Export analytics reports',

  // Domain scopes
  'domain:read': 'Read and list custom domains',
  'domain:create': 'Add new custom domains',
  'domain:verify': 'Verify domain ownership',
  'domain:delete': 'Remove custom domains',

  // Campaign scopes
  'campaign:read': 'View campaigns',
  'campaign:create': 'Create new campaigns',
  'campaign:update': 'Update existing campaigns',
  'campaign:delete': 'Delete campaigns',

  // Tag scopes
  'tag:read': 'View tags',
  'tag:create': 'Create new tags',
  'tag:update': 'Update existing tags',
  'tag:delete': 'Delete tags',

  // BioPage scopes
  'biopage:read': 'View bio pages',
  'biopage:create': 'Create new bio pages',
  'biopage:update': 'Update existing bio pages',
  'biopage:delete': 'Delete bio pages',

  // Team scopes
  'team:read': 'View team members (read-only)',

  // Admin scope
  'admin': 'Full access to all resources and actions',
};

/**
 * Check if a scope string is a valid API scope
 * @param scope - The scope string to validate
 * @returns true if the scope is valid, false otherwise
 */
export function isValidScope(scope: string): scope is ApiScope {
  return API_SCOPES.includes(scope as ApiScope);
}

/**
 * Check if the provided scopes cover a specific resource and action
 * Handles the special 'admin' scope which grants access to everything
 *
 * @param scopes - Array of scopes to check
 * @param resource - The resource being accessed (e.g., 'link', 'domain')
 * @param action - The action being performed (e.g., 'read', 'create')
 * @returns true if the scopes include the required permission or 'admin'
 *
 * @example
 * scopeCoversAction(['link:read', 'link:create'], 'link', 'read') // true
 * scopeCoversAction(['link:read'], 'link', 'create') // false
 * scopeCoversAction(['admin'], 'link', 'delete') // true
 */
export function scopeCoversAction(
  scopes: string[],
  resource: string,
  action: string,
): boolean {
  // Admin scope grants access to everything
  if (scopes.includes('admin')) {
    return true;
  }

  // Check for exact match: resource:action
  const requiredScope = `${resource}:${action}`;
  return scopes.includes(requiredScope);
}

/**
 * Get all available scopes for a specific resource
 * @param resource - The resource name (e.g., 'link', 'domain', 'campaign')
 * @returns Array of scopes for the resource
 *
 * @example
 * getResourceScopes('link')
 * // Returns: ['link:read', 'link:create', 'link:update', 'link:delete', 'link:export', 'link:bulk']
 */
export function getResourceScopes(resource: string): string[] {
  return API_SCOPES.filter(scope => {
    // Admin is a special scope, not resource-specific
    if (scope === 'admin') {
      return false;
    }
    // Check if scope starts with resource:
    return scope.startsWith(`${resource}:`);
  });
}

/**
 * Parse a scope string into an array of valid scopes
 * Handles comma-separated and space-separated formats
 * Filters out invalid scopes
 *
 * @param scopeString - Space or comma-separated scope string
 * @returns Array of valid ApiScope values
 *
 * @example
 * parseScopes('link:read link:create') // ['link:read', 'link:create']
 * parseScopes('link:read, link:create, invalid:scope') // ['link:read', 'link:create']
 * parseScopes('admin') // ['admin']
 */
export function parseScopes(scopeString: string): ApiScope[] {
  if (!scopeString || scopeString.trim() === '') {
    return [];
  }

  // Split by comma or space, trim whitespace, filter empty strings
  const scopeTokens = scopeString
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Filter to only valid scopes
  return scopeTokens.filter(isValidScope);
}

/**
 * Scope groupings for common use cases
 * These can be used to quickly assign sets of related permissions
 */
export const SCOPE_GROUPS = {
  /**
   * Read-only access to all resources
   */
  READ_ONLY: [
    'link:read',
    'analytics:read',
    'domain:read',
    'campaign:read',
    'tag:read',
    'biopage:read',
    'team:read',
  ] as ApiScope[],

  /**
   * Full link management (most common for link shortener APIs)
   */
  LINK_MANAGEMENT: [
    'link:read',
    'link:create',
    'link:update',
    'link:delete',
    'link:export',
    'link:bulk',
    'analytics:read',
  ] as ApiScope[],

  /**
   * Content management (links, campaigns, tags, biopages)
   */
  CONTENT_MANAGEMENT: [
    'link:read',
    'link:create',
    'link:update',
    'link:delete',
    'campaign:read',
    'campaign:create',
    'campaign:update',
    'tag:read',
    'tag:create',
    'tag:update',
    'biopage:read',
    'biopage:create',
    'biopage:update',
  ] as ApiScope[],

  /**
   * Analytics and reporting
   */
  ANALYTICS: [
    'analytics:read',
    'analytics:export',
  ] as ApiScope[],
} as const;
