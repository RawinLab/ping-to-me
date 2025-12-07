import { MemberRole } from '@pingtome/database';
import {
  getPermissions,
  hasPermission,
  PERMISSION_MATRIX,
  type Resource,
  type Action,
  type PermissionScope,
} from '../permission-matrix';

describe('PermissionMatrix', () => {
  describe('OWNER Role', () => {
    const role = MemberRole.OWNER;

    it('should have access to the PERMISSION_MATRIX', () => {
      expect(PERMISSION_MATRIX[role]).toBeDefined();
    });

    describe('Link permissions', () => {
      it('should grant OWNER all link permissions', () => {
        expect(hasPermission(role, 'link', 'create')).toBe(true);
        expect(hasPermission(role, 'link', 'read')).toBe(true);
        expect(hasPermission(role, 'link', 'update')).toBe(true);
        expect(hasPermission(role, 'link', 'delete')).toBe(true);
        expect(hasPermission(role, 'link', 'bulk')).toBe(true);
        expect(hasPermission(role, 'link', 'export')).toBe(true);
      });

      it('should grant OWNER full scope (*) for link permissions', () => {
        const perms = getPermissions(role, 'link', 'create');
        expect(perms).toEqual(['*']);
      });
    });

    describe('Organization permissions', () => {
      it('should grant OWNER delete organization permission', () => {
        expect(hasPermission(role, 'organization', 'delete')).toBe(true);
      });

      it('should grant OWNER organization read and update permissions', () => {
        expect(hasPermission(role, 'organization', 'read')).toBe(true);
        expect(hasPermission(role, 'organization', 'update')).toBe(true);
      });

      it('should grant OWNER full scope (*) for organization delete', () => {
        const perms = getPermissions(role, 'organization', 'delete');
        expect(perms).toEqual(['*']);
      });
    });

    describe('Billing permissions', () => {
      it('should grant OWNER manage billing permission', () => {
        expect(hasPermission(role, 'billing', 'manage')).toBe(true);
      });

      it('should grant OWNER billing read permission', () => {
        expect(hasPermission(role, 'billing', 'read')).toBe(true);
      });

      it('should grant OWNER full scope (*) for billing manage', () => {
        const perms = getPermissions(role, 'billing', 'manage');
        expect(perms).toEqual(['*']);
      });
    });

    describe('Team permissions', () => {
      it('should grant OWNER all team permissions', () => {
        expect(hasPermission(role, 'team', 'read')).toBe(true);
        expect(hasPermission(role, 'team', 'invite')).toBe(true);
        expect(hasPermission(role, 'team', 'update-role')).toBe(true);
        expect(hasPermission(role, 'team', 'remove')).toBe(true);
      });

      it('should grant OWNER full scope (*) for team permissions', () => {
        const perms = getPermissions(role, 'team', 'update-role');
        expect(perms).toEqual(['*']);
      });
    });

    describe('Domain permissions', () => {
      it('should grant OWNER all domain permissions', () => {
        expect(hasPermission(role, 'domain', 'create')).toBe(true);
        expect(hasPermission(role, 'domain', 'read')).toBe(true);
        expect(hasPermission(role, 'domain', 'update')).toBe(true);
        expect(hasPermission(role, 'domain', 'delete')).toBe(true);
        expect(hasPermission(role, 'domain', 'verify')).toBe(true);
      });
    });

    describe('API Key permissions', () => {
      it('should grant OWNER all api-key permissions', () => {
        expect(hasPermission(role, 'api-key', 'create')).toBe(true);
        expect(hasPermission(role, 'api-key', 'read')).toBe(true);
        expect(hasPermission(role, 'api-key', 'revoke')).toBe(true);
      });
    });

    describe('Audit permissions', () => {
      it('should grant OWNER audit read and export', () => {
        expect(hasPermission(role, 'audit', 'read')).toBe(true);
        expect(hasPermission(role, 'audit', 'export')).toBe(true);
      });
    });

    describe('Analytics permissions', () => {
      it('should grant OWNER analytics read and export', () => {
        expect(hasPermission(role, 'analytics', 'read')).toBe(true);
        expect(hasPermission(role, 'analytics', 'export')).toBe(true);
      });
    });

    describe('BioPage permissions', () => {
      it('should grant OWNER all biopage permissions', () => {
        expect(hasPermission(role, 'biopage', 'create')).toBe(true);
        expect(hasPermission(role, 'biopage', 'read')).toBe(true);
        expect(hasPermission(role, 'biopage', 'update')).toBe(true);
        expect(hasPermission(role, 'biopage', 'delete')).toBe(true);
      });
    });

    describe('Campaign permissions', () => {
      it('should grant OWNER all campaign permissions', () => {
        expect(hasPermission(role, 'campaign', 'create')).toBe(true);
        expect(hasPermission(role, 'campaign', 'read')).toBe(true);
        expect(hasPermission(role, 'campaign', 'update')).toBe(true);
        expect(hasPermission(role, 'campaign', 'delete')).toBe(true);
      });
    });

    describe('Tag permissions', () => {
      it('should grant OWNER all tag permissions', () => {
        expect(hasPermission(role, 'tag', 'create')).toBe(true);
        expect(hasPermission(role, 'tag', 'read')).toBe(true);
        expect(hasPermission(role, 'tag', 'update')).toBe(true);
        expect(hasPermission(role, 'tag', 'delete')).toBe(true);
      });
    });
  });

  describe('ADMIN Role', () => {
    const role = MemberRole.ADMIN;

    it('should have access to the PERMISSION_MATRIX', () => {
      expect(PERMISSION_MATRIX[role]).toBeDefined();
    });

    describe('Link permissions', () => {
      it('should grant ADMIN most link permissions', () => {
        expect(hasPermission(role, 'link', 'create')).toBe(true);
        expect(hasPermission(role, 'link', 'read')).toBe(true);
        expect(hasPermission(role, 'link', 'update')).toBe(true);
        expect(hasPermission(role, 'link', 'delete')).toBe(true);
        expect(hasPermission(role, 'link', 'export')).toBe(true);
      });

      it('should grant ADMIN bulk with organization scope', () => {
        const perms = getPermissions(role, 'link', 'bulk');
        expect(perms).toEqual(['organization']);
      });
    });

    describe('Organization permissions', () => {
      it('should not grant ADMIN delete organization permission', () => {
        expect(hasPermission(role, 'organization', 'delete')).toBe(false);
      });

      it('should grant ADMIN read and limited update', () => {
        expect(hasPermission(role, 'organization', 'read')).toBe(true);
        expect(hasPermission(role, 'organization', 'update')).toBe(true);
      });

      it('should grant ADMIN limited scope for organization update', () => {
        const perms = getPermissions(role, 'organization', 'update');
        expect(perms).toEqual(['limited']);
      });
    });

    describe('Billing permissions', () => {
      it('should not grant ADMIN manage billing permission', () => {
        expect(hasPermission(role, 'billing', 'manage')).toBe(false);
      });

      it('should grant ADMIN billing read permission', () => {
        expect(hasPermission(role, 'billing', 'read')).toBe(true);
      });
    });

    describe('Team permissions', () => {
      it('should grant ADMIN team read permission', () => {
        expect(hasPermission(role, 'team', 'read')).toBe(true);
      });

      it('should grant ADMIN invite non-OWNER roles with exclude-owner scope', () => {
        const perms = getPermissions(role, 'team', 'invite');
        expect(perms).toEqual(['exclude-owner']);
        expect(hasPermission(role, 'team', 'invite')).toBe(true);
      });

      it('should grant ADMIN update-role with exclude-owner scope', () => {
        const perms = getPermissions(role, 'team', 'update-role');
        expect(perms).toEqual(['exclude-owner']);
      });

      it('should not grant ADMIN permission to change OWNER role', () => {
        const perms = getPermissions(role, 'team', 'update-role');
        expect(perms).toContain('exclude-owner');
        expect(perms).not.toContain('*');
      });

      it('should grant ADMIN remove with exclude-owner scope', () => {
        const perms = getPermissions(role, 'team', 'remove');
        expect(perms).toEqual(['exclude-owner']);
      });
    });

    describe('Domain permissions', () => {
      it('should grant ADMIN all domain permissions', () => {
        expect(hasPermission(role, 'domain', 'create')).toBe(true);
        expect(hasPermission(role, 'domain', 'read')).toBe(true);
        expect(hasPermission(role, 'domain', 'update')).toBe(true);
        expect(hasPermission(role, 'domain', 'delete')).toBe(true);
        expect(hasPermission(role, 'domain', 'verify')).toBe(true);
      });
    });

    describe('API Key permissions', () => {
      it('should grant ADMIN create and read api-key', () => {
        expect(hasPermission(role, 'api-key', 'create')).toBe(true);
        expect(hasPermission(role, 'api-key', 'read')).toBe(true);
      });

      it('should grant ADMIN read with mixed scopes (own, organization)', () => {
        const perms = getPermissions(role, 'api-key', 'read');
        expect(perms).toEqual(['own', 'organization']);
      });

      it('should grant ADMIN revoke with own scope', () => {
        const perms = getPermissions(role, 'api-key', 'revoke');
        expect(perms).toEqual(['own']);
      });
    });

    describe('Audit permissions', () => {
      it('should grant ADMIN audit read', () => {
        expect(hasPermission(role, 'audit', 'read')).toBe(true);
      });

      it('should not grant ADMIN audit export', () => {
        expect(hasPermission(role, 'audit', 'export')).toBe(false);
      });
    });

    describe('Analytics permissions', () => {
      it('should grant ADMIN analytics read and export', () => {
        expect(hasPermission(role, 'analytics', 'read')).toBe(true);
        expect(hasPermission(role, 'analytics', 'export')).toBe(true);
      });
    });

    describe('BioPage permissions', () => {
      it('should grant ADMIN biopage create and read', () => {
        expect(hasPermission(role, 'biopage', 'create')).toBe(true);
        expect(hasPermission(role, 'biopage', 'read')).toBe(true);
      });

      it('should grant ADMIN update and delete with mixed scopes', () => {
        const updatePerms = getPermissions(role, 'biopage', 'update');
        const deletePerms = getPermissions(role, 'biopage', 'delete');
        expect(updatePerms).toEqual(['own', 'organization']);
        expect(deletePerms).toEqual(['own', 'organization']);
      });
    });

    describe('Campaign permissions', () => {
      it('should grant ADMIN all campaign permissions', () => {
        expect(hasPermission(role, 'campaign', 'create')).toBe(true);
        expect(hasPermission(role, 'campaign', 'read')).toBe(true);
        expect(hasPermission(role, 'campaign', 'update')).toBe(true);
        expect(hasPermission(role, 'campaign', 'delete')).toBe(true);
      });
    });

    describe('Tag permissions', () => {
      it('should grant ADMIN all tag permissions', () => {
        expect(hasPermission(role, 'tag', 'create')).toBe(true);
        expect(hasPermission(role, 'tag', 'read')).toBe(true);
        expect(hasPermission(role, 'tag', 'update')).toBe(true);
        expect(hasPermission(role, 'tag', 'delete')).toBe(true);
      });
    });
  });

  describe('EDITOR Role', () => {
    const role = MemberRole.EDITOR;

    it('should have access to the PERMISSION_MATRIX', () => {
      expect(PERMISSION_MATRIX[role]).toBeDefined();
    });

    describe('Link permissions', () => {
      it('should grant EDITOR create link permission', () => {
        expect(hasPermission(role, 'link', 'create')).toBe(true);
      });

      it('should grant EDITOR read with own and organization scopes', () => {
        const perms = getPermissions(role, 'link', 'read');
        expect(perms).toEqual(['own', 'organization']);
      });

      it('should grant EDITOR update own links only', () => {
        const perms = getPermissions(role, 'link', 'update');
        expect(perms).toEqual(['own']);
        expect(hasPermission(role, 'link', 'update')).toBe(true);
      });

      it('should not grant EDITOR update others links', () => {
        const perms = getPermissions(role, 'link', 'update');
        expect(perms).not.toContain('*');
        expect(perms).not.toContain('organization');
      });

      it('should grant EDITOR delete own links only', () => {
        const perms = getPermissions(role, 'link', 'delete');
        expect(perms).toEqual(['own']);
      });

      it('should grant EDITOR export own links only', () => {
        const perms = getPermissions(role, 'link', 'export');
        expect(perms).toEqual(['own']);
      });
    });

    describe('Team permissions', () => {
      it('should grant EDITOR read team', () => {
        expect(hasPermission(role, 'team', 'read')).toBe(true);
      });

      it('should not grant EDITOR invite permission', () => {
        expect(hasPermission(role, 'team', 'invite')).toBe(false);
      });

      it('should not grant EDITOR update-role permission', () => {
        expect(hasPermission(role, 'team', 'update-role')).toBe(false);
      });

      it('should not grant EDITOR remove permission', () => {
        expect(hasPermission(role, 'team', 'remove')).toBe(false);
      });

      it('should not be able to manage any team members', () => {
        expect(hasPermission(role, 'team', 'invite')).toBe(false);
        expect(hasPermission(role, 'team', 'update-role')).toBe(false);
        expect(hasPermission(role, 'team', 'remove')).toBe(false);
      });
    });

    describe('Domain permissions', () => {
      it('should grant EDITOR read domain only', () => {
        expect(hasPermission(role, 'domain', 'read')).toBe(true);
      });

      it('should not grant EDITOR create domain', () => {
        expect(hasPermission(role, 'domain', 'create')).toBe(false);
      });

      it('should not grant EDITOR update domain', () => {
        expect(hasPermission(role, 'domain', 'update')).toBe(false);
      });

      it('should not grant EDITOR delete domain', () => {
        expect(hasPermission(role, 'domain', 'delete')).toBe(false);
      });

      it('should not grant EDITOR verify domain', () => {
        expect(hasPermission(role, 'domain', 'verify')).toBe(false);
      });
    });

    describe('Organization permissions', () => {
      it('should grant EDITOR read organization', () => {
        expect(hasPermission(role, 'organization', 'read')).toBe(true);
      });

      it('should not grant EDITOR update organization', () => {
        expect(hasPermission(role, 'organization', 'update')).toBe(false);
      });
    });

    describe('Billing permissions', () => {
      it('should not grant EDITOR billing read', () => {
        expect(hasPermission(role, 'billing', 'read')).toBe(false);
      });

      it('should not grant EDITOR billing manage', () => {
        expect(hasPermission(role, 'billing', 'manage')).toBe(false);
      });
    });

    describe('API Key permissions', () => {
      it('should not grant EDITOR api-key permissions', () => {
        expect(hasPermission(role, 'api-key', 'create')).toBe(false);
        expect(hasPermission(role, 'api-key', 'read')).toBe(false);
        expect(hasPermission(role, 'api-key', 'revoke')).toBe(false);
      });
    });

    describe('Audit permissions', () => {
      it('should not grant EDITOR audit permissions', () => {
        expect(hasPermission(role, 'audit', 'read')).toBe(false);
        expect(hasPermission(role, 'audit', 'export')).toBe(false);
      });
    });

    describe('Analytics permissions', () => {
      it('should grant EDITOR analytics with own and organization scope', () => {
        const perms = getPermissions(role, 'analytics', 'read');
        expect(perms).toEqual(['own', 'organization']);
      });

      it('should not grant EDITOR analytics export', () => {
        expect(hasPermission(role, 'analytics', 'export')).toBe(false);
      });
    });

    describe('BioPage permissions', () => {
      it('should grant EDITOR create biopage', () => {
        expect(hasPermission(role, 'biopage', 'create')).toBe(true);
      });

      it('should grant EDITOR read with own and organization scope', () => {
        const perms = getPermissions(role, 'biopage', 'read');
        expect(perms).toEqual(['own', 'organization']);
      });

      it('should grant EDITOR update own biopage only', () => {
        const perms = getPermissions(role, 'biopage', 'update');
        expect(perms).toEqual(['own']);
      });

      it('should grant EDITOR delete own biopage only', () => {
        const perms = getPermissions(role, 'biopage', 'delete');
        expect(perms).toEqual(['own']);
      });
    });

    describe('Campaign permissions', () => {
      it('should grant EDITOR read campaign only', () => {
        expect(hasPermission(role, 'campaign', 'read')).toBe(true);
      });

      it('should not grant EDITOR create campaign', () => {
        expect(hasPermission(role, 'campaign', 'create')).toBe(false);
      });

      it('should not grant EDITOR update campaign', () => {
        expect(hasPermission(role, 'campaign', 'update')).toBe(false);
      });

      it('should not grant EDITOR delete campaign', () => {
        expect(hasPermission(role, 'campaign', 'delete')).toBe(false);
      });
    });

    describe('Tag permissions', () => {
      it('should grant EDITOR create tag', () => {
        expect(hasPermission(role, 'tag', 'create')).toBe(true);
      });

      it('should grant EDITOR read tag', () => {
        expect(hasPermission(role, 'tag', 'read')).toBe(true);
      });

      it('should grant EDITOR update own tag only', () => {
        const perms = getPermissions(role, 'tag', 'update');
        expect(perms).toEqual(['own']);
      });

      it('should not grant EDITOR delete tag', () => {
        expect(hasPermission(role, 'tag', 'delete')).toBe(false);
      });
    });
  });

  describe('VIEWER Role', () => {
    const role = MemberRole.VIEWER;

    it('should have access to the PERMISSION_MATRIX', () => {
      expect(PERMISSION_MATRIX[role]).toBeDefined();
    });

    describe('Link permissions', () => {
      it('should grant VIEWER read links with organization scope', () => {
        const perms = getPermissions(role, 'link', 'read');
        expect(perms).toEqual(['organization']);
      });

      it('should not grant VIEWER create links', () => {
        expect(hasPermission(role, 'link', 'create')).toBe(false);
      });

      it('should not grant VIEWER update links', () => {
        expect(hasPermission(role, 'link', 'update')).toBe(false);
      });

      it('should not grant VIEWER delete links', () => {
        expect(hasPermission(role, 'link', 'delete')).toBe(false);
      });

      it('should not grant VIEWER bulk operations', () => {
        expect(hasPermission(role, 'link', 'bulk')).toBe(false);
      });

      it('should not grant VIEWER export links', () => {
        expect(hasPermission(role, 'link', 'export')).toBe(false);
      });
    });

    describe('Analytics permissions', () => {
      it('should grant VIEWER read analytics with organization scope', () => {
        const perms = getPermissions(role, 'analytics', 'read');
        expect(perms).toEqual(['organization']);
      });

      it('should not grant VIEWER export analytics', () => {
        expect(hasPermission(role, 'analytics', 'export')).toBe(false);
      });
    });

    describe('Organization permissions', () => {
      it('should grant VIEWER read organization', () => {
        expect(hasPermission(role, 'organization', 'read')).toBe(true);
      });

      it('should not grant VIEWER update organization', () => {
        expect(hasPermission(role, 'organization', 'update')).toBe(false);
      });

      it('should not grant VIEWER delete organization', () => {
        expect(hasPermission(role, 'organization', 'delete')).toBe(false);
      });
    });

    describe('Team permissions', () => {
      it('should grant VIEWER read team', () => {
        expect(hasPermission(role, 'team', 'read')).toBe(true);
      });

      it('should not grant VIEWER invite permission', () => {
        expect(hasPermission(role, 'team', 'invite')).toBe(false);
      });

      it('should not grant VIEWER update-role permission', () => {
        expect(hasPermission(role, 'team', 'update-role')).toBe(false);
      });

      it('should not grant VIEWER remove permission', () => {
        expect(hasPermission(role, 'team', 'remove')).toBe(false);
      });
    });

    describe('Domain permissions', () => {
      it('should grant VIEWER read domain only', () => {
        expect(hasPermission(role, 'domain', 'read')).toBe(true);
      });

      it('should not grant VIEWER create domain', () => {
        expect(hasPermission(role, 'domain', 'create')).toBe(false);
      });

      it('should not grant VIEWER update domain', () => {
        expect(hasPermission(role, 'domain', 'update')).toBe(false);
      });

      it('should not grant VIEWER delete domain', () => {
        expect(hasPermission(role, 'domain', 'delete')).toBe(false);
      });

      it('should not grant VIEWER verify domain', () => {
        expect(hasPermission(role, 'domain', 'verify')).toBe(false);
      });
    });

    describe('Billing permissions', () => {
      it('should not grant VIEWER any billing permissions', () => {
        expect(hasPermission(role, 'billing', 'read')).toBe(false);
        expect(hasPermission(role, 'billing', 'manage')).toBe(false);
      });
    });

    describe('API Key permissions', () => {
      it('should not grant VIEWER any api-key permissions', () => {
        expect(hasPermission(role, 'api-key', 'create')).toBe(false);
        expect(hasPermission(role, 'api-key', 'read')).toBe(false);
        expect(hasPermission(role, 'api-key', 'revoke')).toBe(false);
      });
    });

    describe('Audit permissions', () => {
      it('should not grant VIEWER any audit permissions', () => {
        expect(hasPermission(role, 'audit', 'read')).toBe(false);
        expect(hasPermission(role, 'audit', 'export')).toBe(false);
      });
    });

    describe('BioPage permissions', () => {
      it('should grant VIEWER read biopage with organization scope', () => {
        const perms = getPermissions(role, 'biopage', 'read');
        expect(perms).toEqual(['organization']);
      });

      it('should not grant VIEWER create biopage', () => {
        expect(hasPermission(role, 'biopage', 'create')).toBe(false);
      });

      it('should not grant VIEWER update biopage', () => {
        expect(hasPermission(role, 'biopage', 'update')).toBe(false);
      });

      it('should not grant VIEWER delete biopage', () => {
        expect(hasPermission(role, 'biopage', 'delete')).toBe(false);
      });
    });

    describe('Campaign permissions', () => {
      it('should grant VIEWER read campaign only', () => {
        expect(hasPermission(role, 'campaign', 'read')).toBe(true);
      });

      it('should not grant VIEWER create campaign', () => {
        expect(hasPermission(role, 'campaign', 'create')).toBe(false);
      });

      it('should not grant VIEWER update campaign', () => {
        expect(hasPermission(role, 'campaign', 'update')).toBe(false);
      });

      it('should not grant VIEWER delete campaign', () => {
        expect(hasPermission(role, 'campaign', 'delete')).toBe(false);
      });
    });

    describe('Tag permissions', () => {
      it('should grant VIEWER read tag only', () => {
        expect(hasPermission(role, 'tag', 'read')).toBe(true);
      });

      it('should not grant VIEWER create tag', () => {
        expect(hasPermission(role, 'tag', 'create')).toBe(false);
      });

      it('should not grant VIEWER update tag', () => {
        expect(hasPermission(role, 'tag', 'update')).toBe(false);
      });

      it('should not grant VIEWER delete tag', () => {
        expect(hasPermission(role, 'tag', 'delete')).toBe(false);
      });
    });
  });

  describe('getPermissions() Function', () => {
    it('should return correct scopes for valid resource and action', () => {
      const perms = getPermissions(MemberRole.OWNER, 'link', 'create');
      expect(perms).toEqual(['*']);
      expect(Array.isArray(perms)).toBe(true);
    });

    it('should return null for invalid role', () => {
      const perms = getPermissions('INVALID' as MemberRole, 'link', 'create');
      expect(perms).toBeNull();
    });

    it('should return null for invalid resource', () => {
      const perms = getPermissions(
        MemberRole.OWNER,
        'invalid-resource' as Resource,
        'create',
      );
      expect(perms).toBeNull();
    });

    it('should return null for invalid action', () => {
      const perms = getPermissions(
        MemberRole.OWNER,
        'link',
        'invalid-action' as Action,
      );
      expect(perms).toBeNull();
    });

    it('should normalize single scope to array', () => {
      const perms = getPermissions(MemberRole.OWNER, 'link', 'create');
      expect(Array.isArray(perms)).toBe(true);
      expect(perms?.length).toBeGreaterThan(0);
    });

    it('should return array of scopes for permissions with multiple scopes', () => {
      const perms = getPermissions(MemberRole.ADMIN, 'api-key', 'read');
      expect(Array.isArray(perms)).toBe(true);
      expect(perms?.length).toBe(2);
      expect(perms).toContain('own');
      expect(perms).toContain('organization');
    });

    it('should return null when role has resource but not action', () => {
      const perms = getPermissions(MemberRole.VIEWER, 'link', 'create');
      expect(perms).toBeNull();
    });

    it('should handle all valid roles', () => {
      const roles = [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.EDITOR, MemberRole.VIEWER];
      roles.forEach((role) => {
        const perms = getPermissions(role, 'link', 'read');
        expect(perms).not.toBeNull();
      });
    });

    it('should handle all valid resources', () => {
      const resources: Resource[] = [
        'link',
        'analytics',
        'organization',
        'team',
        'domain',
        'billing',
        'api-key',
        'audit',
        'biopage',
        'campaign',
        'tag',
      ];
      resources.forEach((resource) => {
        const perms = getPermissions(MemberRole.OWNER, resource, 'read');
        expect(perms).not.toBeNull();
      });
    });

    it('should handle all valid actions', () => {
      const actions: Action[] = [
        'create',
        'read',
        'update',
        'delete',
        'bulk',
        'export',
        'invite',
        'verify',
        'manage',
        'update-role',
        'remove',
        'revoke',
      ];
      actions.forEach((action) => {
        const perms = getPermissions(MemberRole.OWNER, 'link', action);
        if (perms !== null) {
          expect(Array.isArray(perms)).toBe(true);
        }
      });
    });
  });

  describe('hasPermission() Function', () => {
    it('should return true when permission exists', () => {
      expect(hasPermission(MemberRole.OWNER, 'link', 'create')).toBe(true);
    });

    it('should return false when permission does not exist', () => {
      expect(hasPermission(MemberRole.VIEWER, 'link', 'create')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('INVALID' as MemberRole, 'link', 'create')).toBe(false);
    });

    it('should return false for invalid resource', () => {
      expect(
        hasPermission(MemberRole.OWNER, 'invalid-resource' as Resource, 'create'),
      ).toBe(false);
    });

    it('should return false for invalid action', () => {
      expect(
        hasPermission(MemberRole.OWNER, 'link', 'invalid-action' as Action),
      ).toBe(false);
    });

    it('should correctly identify permissions regardless of scope type', () => {
      // Single scope
      expect(hasPermission(MemberRole.EDITOR, 'link', 'create')).toBe(true);

      // Multiple scopes
      expect(hasPermission(MemberRole.ADMIN, 'api-key', 'read')).toBe(true);

      // No permission
      expect(hasPermission(MemberRole.VIEWER, 'link', 'delete')).toBe(false);
    });

    it('should differentiate between roles correctly', () => {
      expect(hasPermission(MemberRole.OWNER, 'billing', 'manage')).toBe(true);
      expect(hasPermission(MemberRole.ADMIN, 'billing', 'manage')).toBe(false);
      expect(hasPermission(MemberRole.EDITOR, 'billing', 'manage')).toBe(false);
      expect(hasPermission(MemberRole.VIEWER, 'billing', 'manage')).toBe(false);
    });

    it('should handle resource/action combinations that do not exist', () => {
      expect(hasPermission(MemberRole.OWNER, 'api-key', 'delete')).toBe(false);
      expect(hasPermission(MemberRole.ADMIN, 'billing', 'manage')).toBe(false);
    });
  });

  describe('Permission Matrix Consistency', () => {
    it('should not have undefined values in PERMISSION_MATRIX', () => {
      Object.values(PERMISSION_MATRIX).forEach((rolePerms) => {
        expect(rolePerms).toBeDefined();
        Object.values(rolePerms).forEach((resourcePerms) => {
          expect(resourcePerms).toBeDefined();
          Object.values(resourcePerms).forEach((scope) => {
            expect(scope).toBeDefined();
          });
        });
      });
    });

    it('should have all scopes as valid PermissionScope type', () => {
      const validScopes: PermissionScope[] = ['*', 'own', 'organization', 'limited', 'exclude-owner'];

      Object.values(PERMISSION_MATRIX).forEach((rolePerms) => {
        Object.values(rolePerms).forEach((resourcePerms) => {
          Object.values(resourcePerms).forEach((scope) => {
            if (Array.isArray(scope)) {
              scope.forEach((s) => {
                expect(validScopes).toContain(s);
              });
            } else {
              expect(validScopes).toContain(scope);
            }
          });
        });
      });
    });

    it('should have well-defined role hierarchy in permissions', () => {
      // Owner should have most permissions
      const ownerPermCount = Object.values(PERMISSION_MATRIX[MemberRole.OWNER]).length;
      const adminPermCount = Object.values(PERMISSION_MATRIX[MemberRole.ADMIN]).length;
      const editorPermCount = Object.values(PERMISSION_MATRIX[MemberRole.EDITOR]).length;
      const viewerPermCount = Object.values(PERMISSION_MATRIX[MemberRole.VIEWER]).length;

      expect(ownerPermCount).toBeGreaterThanOrEqual(adminPermCount);
      expect(adminPermCount).toBeGreaterThanOrEqual(editorPermCount);
      expect(editorPermCount).toBeGreaterThanOrEqual(viewerPermCount);
    });

    it('should have all roles defined in PERMISSION_MATRIX', () => {
      const allRoles = Object.values(MemberRole);
      allRoles.forEach((role) => {
        expect(PERMISSION_MATRIX[role]).toBeDefined();
      });
    });
  });

  describe('Edge Cases and Boundary Tests', () => {
    it('should handle null checks correctly', () => {
      expect(getPermissions(MemberRole.OWNER, 'link', 'read')).not.toBeNull();
      expect(getPermissions(MemberRole.VIEWER, 'billing', 'manage')).toBeNull();
    });

    it('should handle wildcard scope correctly', () => {
      const ownerLinkPerms = getPermissions(MemberRole.OWNER, 'link', 'read');
      expect(ownerLinkPerms).toContain('*');
    });

    it('should handle exclude-owner scope correctly for ADMIN', () => {
      const perms = getPermissions(MemberRole.ADMIN, 'team', 'invite');
      expect(perms).toContain('exclude-owner');
      expect(perms).not.toContain('*');
    });

    it('should handle own scope correctly for EDITOR', () => {
      const perms = getPermissions(MemberRole.EDITOR, 'link', 'update');
      expect(perms).toContain('own');
      expect(perms).not.toContain('organization');
    });

    it('should handle organization scope correctly', () => {
      const viewerPerms = getPermissions(MemberRole.VIEWER, 'link', 'read');
      expect(viewerPerms).toEqual(['organization']);
    });

    it('should handle limited scope for organization update', () => {
      const perms = getPermissions(MemberRole.ADMIN, 'organization', 'update');
      expect(perms).toEqual(['limited']);
    });

    it('should correctly return empty array never being returned', () => {
      const result = getPermissions(MemberRole.OWNER, 'link', 'read');
      expect(Array.isArray(result)).toBe(true);
      if (result) {
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should handle mixed scope arrays properly', () => {
      const adminApiKeyPerms = getPermissions(MemberRole.ADMIN, 'api-key', 'read');
      expect(Array.isArray(adminApiKeyPerms)).toBe(true);
      expect(adminApiKeyPerms?.length).toBe(2);
    });

    it('should not grant permissions that are not explicitly defined', () => {
      // VIEWER should have very limited permissions
      expect(hasPermission(MemberRole.VIEWER, 'link', 'create')).toBe(false);
      expect(hasPermission(MemberRole.VIEWER, 'link', 'update')).toBe(false);
      expect(hasPermission(MemberRole.VIEWER, 'link', 'delete')).toBe(false);
      expect(hasPermission(MemberRole.VIEWER, 'team', 'invite')).toBe(false);
    });
  });

  describe('Authorization Rule Enforcement', () => {
    it('should enforce role hierarchy correctly', () => {
      // OWNER > ADMIN > EDITOR > VIEWER
      const testCases = [
        { role: MemberRole.OWNER, resource: 'billing' as Resource, action: 'manage' as Action, expected: true },
        { role: MemberRole.ADMIN, resource: 'billing' as Resource, action: 'manage' as Action, expected: false },
        { role: MemberRole.EDITOR, resource: 'billing' as Resource, action: 'manage' as Action, expected: false },
        { role: MemberRole.VIEWER, resource: 'billing' as Resource, action: 'manage' as Action, expected: false },
      ];

      testCases.forEach(({ role, resource, action, expected }) => {
        expect(hasPermission(role, resource, action)).toBe(expected);
      });
    });

    it('should enforce scope boundaries correctly', () => {
      // OWNER can do everything with * scope
      expect(hasPermission(MemberRole.OWNER, 'link', 'update')).toBe(true);

      // EDITOR can only update own links
      const editorPerms = getPermissions(MemberRole.EDITOR, 'link', 'update');
      expect(editorPerms).toEqual(['own']);

      // VIEWER cannot update links at all
      expect(hasPermission(MemberRole.VIEWER, 'link', 'update')).toBe(false);
    });

    it('should prevent privilege escalation attempts', () => {
      // ADMIN cannot modify OWNER
      expect(hasPermission(MemberRole.ADMIN, 'team', 'update-role')).toBe(true);
      const perms = getPermissions(MemberRole.ADMIN, 'team', 'update-role');
      expect(perms).toContain('exclude-owner');
      expect(perms).not.toContain('*');

      // EDITOR cannot manage team at all
      expect(hasPermission(MemberRole.EDITOR, 'team', 'update-role')).toBe(false);

      // VIEWER cannot manage team at all
      expect(hasPermission(MemberRole.VIEWER, 'team', 'update-role')).toBe(false);
    });

    it('should enforce resource-specific restrictions', () => {
      // Only OWNER can delete organization
      expect(hasPermission(MemberRole.OWNER, 'organization', 'delete')).toBe(true);
      expect(hasPermission(MemberRole.ADMIN, 'organization', 'delete')).toBe(false);
      expect(hasPermission(MemberRole.EDITOR, 'organization', 'delete')).toBe(false);
      expect(hasPermission(MemberRole.VIEWER, 'organization', 'delete')).toBe(false);

      // Only OWNER can manage billing
      expect(hasPermission(MemberRole.OWNER, 'billing', 'manage')).toBe(true);
      expect(hasPermission(MemberRole.ADMIN, 'billing', 'manage')).toBe(false);
      expect(hasPermission(MemberRole.EDITOR, 'billing', 'manage')).toBe(false);
      expect(hasPermission(MemberRole.VIEWER, 'billing', 'manage')).toBe(false);
    });
  });
});
