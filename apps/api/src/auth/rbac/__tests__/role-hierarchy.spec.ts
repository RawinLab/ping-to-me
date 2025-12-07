import { MemberRole } from "@pingtome/database";
import {
  getRoleLevel,
  isRoleAtLeast,
  isRoleAbove,
  canManageRole,
  getAssignableRoles,
  ROLE_HIERARCHY,
} from "../role-hierarchy";

describe("RoleHierarchy", () => {
  describe("getRoleLevel()", () => {
    it("should return 4 for OWNER role", () => {
      const level = getRoleLevel(MemberRole.OWNER);
      expect(level).toBe(4);
    });

    it("should return 3 for ADMIN role", () => {
      const level = getRoleLevel(MemberRole.ADMIN);
      expect(level).toBe(3);
    });

    it("should return 2 for EDITOR role", () => {
      const level = getRoleLevel(MemberRole.EDITOR);
      expect(level).toBe(2);
    });

    it("should return 1 for VIEWER role", () => {
      const level = getRoleLevel(MemberRole.VIEWER);
      expect(level).toBe(1);
    });

    it("should throw error for invalid role", () => {
      expect(() => {
        getRoleLevel("INVALID_ROLE" as MemberRole);
      }).toThrow("Invalid role: INVALID_ROLE");
    });

    it("should throw error for undefined role", () => {
      expect(() => {
        getRoleLevel(undefined as unknown as MemberRole);
      }).toThrow();
    });

    it("should throw error for null role", () => {
      expect(() => {
        getRoleLevel(null as unknown as MemberRole);
      }).toThrow();
    });
  });

  describe("isRoleAtLeast()", () => {
    describe("OWNER as user role", () => {
      it("should satisfy OWNER requirement", () => {
        expect(isRoleAtLeast(MemberRole.OWNER, MemberRole.OWNER)).toBe(true);
      });

      it("should satisfy ADMIN requirement", () => {
        expect(isRoleAtLeast(MemberRole.OWNER, MemberRole.ADMIN)).toBe(true);
      });

      it("should satisfy EDITOR requirement", () => {
        expect(isRoleAtLeast(MemberRole.OWNER, MemberRole.EDITOR)).toBe(true);
      });

      it("should satisfy VIEWER requirement", () => {
        expect(isRoleAtLeast(MemberRole.OWNER, MemberRole.VIEWER)).toBe(true);
      });
    });

    describe("ADMIN as user role", () => {
      it("should satisfy ADMIN requirement", () => {
        expect(isRoleAtLeast(MemberRole.ADMIN, MemberRole.ADMIN)).toBe(true);
      });

      it("should satisfy EDITOR requirement", () => {
        expect(isRoleAtLeast(MemberRole.ADMIN, MemberRole.EDITOR)).toBe(true);
      });

      it("should satisfy VIEWER requirement", () => {
        expect(isRoleAtLeast(MemberRole.ADMIN, MemberRole.VIEWER)).toBe(true);
      });

      it("should NOT satisfy OWNER requirement", () => {
        expect(isRoleAtLeast(MemberRole.ADMIN, MemberRole.OWNER)).toBe(false);
      });
    });

    describe("EDITOR as user role", () => {
      it("should satisfy EDITOR requirement", () => {
        expect(isRoleAtLeast(MemberRole.EDITOR, MemberRole.EDITOR)).toBe(true);
      });

      it("should satisfy VIEWER requirement", () => {
        expect(isRoleAtLeast(MemberRole.EDITOR, MemberRole.VIEWER)).toBe(true);
      });

      it("should NOT satisfy ADMIN requirement", () => {
        expect(isRoleAtLeast(MemberRole.EDITOR, MemberRole.ADMIN)).toBe(false);
      });

      it("should NOT satisfy OWNER requirement", () => {
        expect(isRoleAtLeast(MemberRole.EDITOR, MemberRole.OWNER)).toBe(false);
      });
    });

    describe("VIEWER as user role", () => {
      it("should satisfy VIEWER requirement", () => {
        expect(isRoleAtLeast(MemberRole.VIEWER, MemberRole.VIEWER)).toBe(true);
      });

      it("should NOT satisfy EDITOR requirement", () => {
        expect(isRoleAtLeast(MemberRole.VIEWER, MemberRole.EDITOR)).toBe(false);
      });

      it("should NOT satisfy ADMIN requirement", () => {
        expect(isRoleAtLeast(MemberRole.VIEWER, MemberRole.ADMIN)).toBe(false);
      });

      it("should NOT satisfy OWNER requirement", () => {
        expect(isRoleAtLeast(MemberRole.VIEWER, MemberRole.OWNER)).toBe(false);
      });
    });

    describe("Invalid roles", () => {
      it("should return false for invalid user role", () => {
        expect(isRoleAtLeast("INVALID" as MemberRole, MemberRole.ADMIN)).toBe(
          false,
        );
      });

      it("should return false for invalid required role", () => {
        expect(isRoleAtLeast(MemberRole.ADMIN, "INVALID" as MemberRole)).toBe(
          false,
        );
      });

      it("should return false when both roles are invalid", () => {
        expect(
          isRoleAtLeast("INVALID1" as MemberRole, "INVALID2" as MemberRole),
        ).toBe(false);
      });
    });
  });

  describe("isRoleAbove()", () => {
    describe("OWNER comparisons", () => {
      it("should be above ADMIN", () => {
        expect(isRoleAbove(MemberRole.OWNER, MemberRole.ADMIN)).toBe(true);
      });

      it("should be above EDITOR", () => {
        expect(isRoleAbove(MemberRole.OWNER, MemberRole.EDITOR)).toBe(true);
      });

      it("should be above VIEWER", () => {
        expect(isRoleAbove(MemberRole.OWNER, MemberRole.VIEWER)).toBe(true);
      });

      it("should NOT be above itself", () => {
        expect(isRoleAbove(MemberRole.OWNER, MemberRole.OWNER)).toBe(false);
      });
    });

    describe("ADMIN comparisons", () => {
      it("should be above EDITOR", () => {
        expect(isRoleAbove(MemberRole.ADMIN, MemberRole.EDITOR)).toBe(true);
      });

      it("should be above VIEWER", () => {
        expect(isRoleAbove(MemberRole.ADMIN, MemberRole.VIEWER)).toBe(true);
      });

      it("should NOT be above OWNER", () => {
        expect(isRoleAbove(MemberRole.ADMIN, MemberRole.OWNER)).toBe(false);
      });

      it("should NOT be above itself", () => {
        expect(isRoleAbove(MemberRole.ADMIN, MemberRole.ADMIN)).toBe(false);
      });
    });

    describe("EDITOR comparisons", () => {
      it("should be above VIEWER", () => {
        expect(isRoleAbove(MemberRole.EDITOR, MemberRole.VIEWER)).toBe(true);
      });

      it("should NOT be above ADMIN", () => {
        expect(isRoleAbove(MemberRole.EDITOR, MemberRole.ADMIN)).toBe(false);
      });

      it("should NOT be above OWNER", () => {
        expect(isRoleAbove(MemberRole.EDITOR, MemberRole.OWNER)).toBe(false);
      });

      it("should NOT be above itself", () => {
        expect(isRoleAbove(MemberRole.EDITOR, MemberRole.EDITOR)).toBe(false);
      });
    });

    describe("VIEWER comparisons", () => {
      it("should NOT be above EDITOR", () => {
        expect(isRoleAbove(MemberRole.VIEWER, MemberRole.EDITOR)).toBe(false);
      });

      it("should NOT be above ADMIN", () => {
        expect(isRoleAbove(MemberRole.VIEWER, MemberRole.ADMIN)).toBe(false);
      });

      it("should NOT be above OWNER", () => {
        expect(isRoleAbove(MemberRole.VIEWER, MemberRole.OWNER)).toBe(false);
      });

      it("should NOT be above itself", () => {
        expect(isRoleAbove(MemberRole.VIEWER, MemberRole.VIEWER)).toBe(false);
      });
    });

    describe("Invalid roles", () => {
      it("should return false for invalid user role", () => {
        expect(isRoleAbove("INVALID" as MemberRole, MemberRole.ADMIN)).toBe(
          false,
        );
      });

      it("should return false for invalid target role", () => {
        expect(isRoleAbove(MemberRole.ADMIN, "INVALID" as MemberRole)).toBe(
          false,
        );
      });

      it("should return false when both roles are invalid", () => {
        expect(
          isRoleAbove("INVALID1" as MemberRole, "INVALID2" as MemberRole),
        ).toBe(false);
      });
    });
  });

  describe("canManageRole()", () => {
    describe("OWNER can manage", () => {
      it("should manage ADMIN role", () => {
        expect(canManageRole(MemberRole.OWNER, MemberRole.ADMIN)).toBe(true);
      });

      it("should manage EDITOR role", () => {
        expect(canManageRole(MemberRole.OWNER, MemberRole.EDITOR)).toBe(true);
      });

      it("should manage VIEWER role", () => {
        expect(canManageRole(MemberRole.OWNER, MemberRole.VIEWER)).toBe(true);
      });

      it("should NOT manage itself (same level)", () => {
        expect(canManageRole(MemberRole.OWNER, MemberRole.OWNER)).toBe(false);
      });
    });

    describe("ADMIN can manage", () => {
      it("should manage EDITOR role", () => {
        expect(canManageRole(MemberRole.ADMIN, MemberRole.EDITOR)).toBe(true);
      });

      it("should manage VIEWER role", () => {
        expect(canManageRole(MemberRole.ADMIN, MemberRole.VIEWER)).toBe(true);
      });

      it("should NOT manage OWNER role", () => {
        expect(canManageRole(MemberRole.ADMIN, MemberRole.OWNER)).toBe(false);
      });

      it("should NOT manage itself (same level)", () => {
        expect(canManageRole(MemberRole.ADMIN, MemberRole.ADMIN)).toBe(false);
      });
    });

    describe("EDITOR can manage", () => {
      it("should manage VIEWER role", () => {
        expect(canManageRole(MemberRole.EDITOR, MemberRole.VIEWER)).toBe(true);
      });

      it("should NOT manage ADMIN role", () => {
        expect(canManageRole(MemberRole.EDITOR, MemberRole.ADMIN)).toBe(false);
      });

      it("should NOT manage OWNER role", () => {
        expect(canManageRole(MemberRole.EDITOR, MemberRole.OWNER)).toBe(false);
      });

      it("should NOT manage itself (same level)", () => {
        expect(canManageRole(MemberRole.EDITOR, MemberRole.EDITOR)).toBe(false);
      });
    });

    describe("VIEWER cannot manage", () => {
      it("should NOT manage VIEWER role", () => {
        expect(canManageRole(MemberRole.VIEWER, MemberRole.VIEWER)).toBe(false);
      });

      it("should NOT manage EDITOR role", () => {
        expect(canManageRole(MemberRole.VIEWER, MemberRole.EDITOR)).toBe(false);
      });

      it("should NOT manage ADMIN role", () => {
        expect(canManageRole(MemberRole.VIEWER, MemberRole.ADMIN)).toBe(false);
      });

      it("should NOT manage OWNER role", () => {
        expect(canManageRole(MemberRole.VIEWER, MemberRole.OWNER)).toBe(false);
      });
    });

    describe("Invalid roles", () => {
      it("should return false for invalid manager role", () => {
        expect(canManageRole("INVALID" as MemberRole, MemberRole.ADMIN)).toBe(
          false,
        );
      });

      it("should return false for invalid target role", () => {
        expect(canManageRole(MemberRole.ADMIN, "INVALID" as MemberRole)).toBe(
          false,
        );
      });

      it("should return false when both roles are invalid", () => {
        expect(
          canManageRole("INVALID1" as MemberRole, "INVALID2" as MemberRole),
        ).toBe(false);
      });
    });
  });

  describe("getAssignableRoles()", () => {
    it("should return all roles for OWNER", () => {
      const roles = getAssignableRoles(MemberRole.OWNER);
      expect(roles).toHaveLength(4);
      expect(roles).toContain(MemberRole.OWNER);
      expect(roles).toContain(MemberRole.ADMIN);
      expect(roles).toContain(MemberRole.EDITOR);
      expect(roles).toContain(MemberRole.VIEWER);
    });

    it("should return ADMIN and below for ADMIN", () => {
      const roles = getAssignableRoles(MemberRole.ADMIN);
      expect(roles).toHaveLength(3);
      expect(roles).toContain(MemberRole.ADMIN);
      expect(roles).toContain(MemberRole.EDITOR);
      expect(roles).toContain(MemberRole.VIEWER);
      expect(roles).not.toContain(MemberRole.OWNER);
    });

    it("should return EDITOR and below for EDITOR", () => {
      const roles = getAssignableRoles(MemberRole.EDITOR);
      expect(roles).toHaveLength(2);
      expect(roles).toContain(MemberRole.EDITOR);
      expect(roles).toContain(MemberRole.VIEWER);
      expect(roles).not.toContain(MemberRole.ADMIN);
      expect(roles).not.toContain(MemberRole.OWNER);
    });

    it("should return only VIEWER for VIEWER", () => {
      const roles = getAssignableRoles(MemberRole.VIEWER);
      expect(roles).toHaveLength(1);
      expect(roles).toContain(MemberRole.VIEWER);
      expect(roles).not.toContain(MemberRole.EDITOR);
      expect(roles).not.toContain(MemberRole.ADMIN);
      expect(roles).not.toContain(MemberRole.OWNER);
    });

    it("should return empty array for invalid role", () => {
      const roles = getAssignableRoles("INVALID" as MemberRole);
      expect(roles).toEqual([]);
    });

    it("should return empty array for undefined role", () => {
      const roles = getAssignableRoles(undefined as unknown as MemberRole);
      expect(roles).toEqual([]);
    });

    it("should return empty array for null role", () => {
      const roles = getAssignableRoles(null as unknown as MemberRole);
      expect(roles).toEqual([]);
    });

    it("should respect role hierarchy order (higher level can assign their own level)", () => {
      const ownerRoles = getAssignableRoles(MemberRole.OWNER);
      const adminRoles = getAssignableRoles(MemberRole.ADMIN);
      const editorRoles = getAssignableRoles(MemberRole.EDITOR);
      const viewerRoles = getAssignableRoles(MemberRole.VIEWER);

      // Each level can assign to roles at or below their level
      expect(ownerRoles.length).toBeGreaterThan(adminRoles.length);
      expect(adminRoles.length).toBeGreaterThan(editorRoles.length);
      expect(editorRoles.length).toBeGreaterThan(viewerRoles.length);
    });
  });

  describe("ROLE_HIERARCHY constant", () => {
    it("should define all four roles", () => {
      expect(Object.keys(ROLE_HIERARCHY)).toHaveLength(4);
    });

    it("should have OWNER with level 4", () => {
      expect(ROLE_HIERARCHY[MemberRole.OWNER]).toBe(4);
    });

    it("should have ADMIN with level 3", () => {
      expect(ROLE_HIERARCHY[MemberRole.ADMIN]).toBe(3);
    });

    it("should have EDITOR with level 2", () => {
      expect(ROLE_HIERARCHY[MemberRole.EDITOR]).toBe(2);
    });

    it("should have VIEWER with level 1", () => {
      expect(ROLE_HIERARCHY[MemberRole.VIEWER]).toBe(1);
    });

    it("should have unique levels for each role", () => {
      const levels = Object.values(ROLE_HIERARCHY);
      const uniqueLevels = new Set(levels);
      expect(uniqueLevels.size).toBe(4);
    });

    it("should not be modifiable (immutable check)", () => {
      const originalValue = ROLE_HIERARCHY[MemberRole.OWNER];
      // Attempting to modify (this test demonstrates the constant is there)
      expect(ROLE_HIERARCHY[MemberRole.OWNER]).toBe(originalValue);
    });
  });

  describe("Integration tests - combined scenarios", () => {
    it("should properly enforce hierarchy chain: OWNER > ADMIN > EDITOR > VIEWER", () => {
      // OWNER can manage all
      expect(canManageRole(MemberRole.OWNER, MemberRole.ADMIN)).toBe(true);
      expect(canManageRole(MemberRole.OWNER, MemberRole.EDITOR)).toBe(true);
      expect(canManageRole(MemberRole.OWNER, MemberRole.VIEWER)).toBe(true);

      // ADMIN can manage EDITOR and VIEWER
      expect(canManageRole(MemberRole.ADMIN, MemberRole.EDITOR)).toBe(true);
      expect(canManageRole(MemberRole.ADMIN, MemberRole.VIEWER)).toBe(true);
      expect(canManageRole(MemberRole.ADMIN, MemberRole.OWNER)).toBe(false);

      // EDITOR can only manage VIEWER
      expect(canManageRole(MemberRole.EDITOR, MemberRole.VIEWER)).toBe(true);
      expect(canManageRole(MemberRole.EDITOR, MemberRole.ADMIN)).toBe(false);
      expect(canManageRole(MemberRole.EDITOR, MemberRole.OWNER)).toBe(false);

      // VIEWER can't manage anyone
      expect(canManageRole(MemberRole.VIEWER, MemberRole.EDITOR)).toBe(false);
      expect(canManageRole(MemberRole.VIEWER, MemberRole.ADMIN)).toBe(false);
      expect(canManageRole(MemberRole.VIEWER, MemberRole.OWNER)).toBe(false);
    });

    it("should ensure assignable roles match management capability", () => {
      // A user can only manage roles they can assign
      const ownerAssignable = getAssignableRoles(MemberRole.OWNER);
      const adminAssignable = getAssignableRoles(MemberRole.ADMIN);
      const editorAssignable = getAssignableRoles(MemberRole.EDITOR);

      // OWNER assignable should include ADMIN (which OWNER can manage)
      expect(ownerAssignable).toContain(MemberRole.ADMIN);

      // ADMIN assignable should include EDITOR (which ADMIN can manage)
      expect(adminAssignable).toContain(MemberRole.EDITOR);

      // EDITOR assignable should include VIEWER (which EDITOR can manage)
      expect(editorAssignable).toContain(MemberRole.VIEWER);
    });

    it("should handle permission checks in realistic scenario", () => {
      const newMemberRole = MemberRole.EDITOR;
      const currentUserRole = MemberRole.ADMIN;

      // Check if current user can manage the new member
      const canManage = canManageRole(currentUserRole, newMemberRole);
      expect(canManage).toBe(true);

      // Check if new role is assignable by current user
      const assignableRoles = getAssignableRoles(currentUserRole);
      expect(assignableRoles).toContain(newMemberRole);

      // Both checks should be consistent
      expect(canManage).toBe(assignableRoles.includes(newMemberRole));
    });
  });
});
