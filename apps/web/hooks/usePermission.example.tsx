/**
 * Example usage of the usePermission hook
 *
 * This file demonstrates how to use the usePermission hook in various scenarios.
 */

import { usePermission } from './usePermission';

// Example 1: Basic permission check
function DeleteLinkButton({ linkId }: { linkId: string }) {
  const { canDeleteLink } = usePermission();

  if (!canDeleteLink()) {
    return null; // Hide button if no permission
  }

  return (
    <button onClick={() => handleDelete(linkId)}>
      Delete Link
    </button>
  );
}

// Example 2: Using the generic can() method
function LinkActions() {
  const { can } = usePermission();

  return (
    <div>
      <button disabled={!can('link', 'create')}>Create</button>
      <button disabled={!can('link', 'update')}>Edit</button>
      <button disabled={!can('link', 'delete')}>Delete</button>
      <button disabled={!can('link', 'export')}>Export</button>
    </div>
  );
}

// Example 3: Role-based conditional rendering
function AdminPanel() {
  const { isAdmin, isOwner } = usePermission();

  return (
    <div>
      {isAdmin && <div>Admin Controls</div>}
      {isOwner && <div>Owner-only Settings</div>}
    </div>
  );
}

// Example 4: Check multiple permissions
function BulkOperationsButton() {
  const { canAll } = usePermission();

  const canPerformBulk = canAll([
    { resource: 'link', action: 'bulk' },
    { resource: 'link', action: 'delete' },
  ]);

  return (
    <button disabled={!canPerformBulk}>
      Bulk Delete
    </button>
  );
}

// Example 5: Team management
function TeamMemberRow({ member }: { member: { role: string } }) {
  const { canManageRole, canRemoveMembers, getAssignableRoles } = usePermission();

  const canManageThisMember = canManageRole(member.role as any);
  const assignableRoles = getAssignableRoles();

  return (
    <div>
      <span>{member.role}</span>
      {canManageThisMember && (
        <>
          <select>
            {assignableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          {canRemoveMembers() && <button>Remove</button>}
        </>
      )}
    </div>
  );
}

// Example 6: Feature access with permission check
function SettingsPage() {
  const {
    canAccessBilling,
    canManageBilling,
    canAccessAudit,
    canManageDomains,
  } = usePermission();

  return (
    <div>
      <h1>Settings</h1>

      {canAccessBilling() && (
        <section>
          <h2>Billing</h2>
          {canManageBilling() ? (
            <button>Manage Subscription</button>
          ) : (
            <p>View only</p>
          )}
        </section>
      )}

      {canManageDomains() && (
        <section>
          <h2>Custom Domains</h2>
          <button>Add Domain</button>
        </section>
      )}

      {canAccessAudit() && (
        <section>
          <h2>Audit Logs</h2>
        </section>
      )}
    </div>
  );
}

// Example 7: Using canAny for OR conditions
function ExportButton() {
  const { canAny } = usePermission();

  const canExportAnything = canAny([
    { resource: 'link', action: 'export' },
    { resource: 'analytics', action: 'export' },
    { resource: 'audit', action: 'export' },
  ]);

  if (!canExportAnything) {
    return null;
  }

  return <button>Export Data</button>;
}

// Example 8: Display current role
function UserRoleBadge() {
  const { role, isOwner, isAdmin, isEditor } = usePermission();

  if (!role) {
    return null;
  }

  const getBadgeColor = () => {
    if (isOwner) return 'bg-purple-500';
    if (isAdmin) return 'bg-blue-500';
    if (isEditor) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <span className={`px-2 py-1 rounded text-white ${getBadgeColor()}`}>
      {role}
    </span>
  );
}

// Helper function (not exported in the example)
function handleDelete(linkId: string) {
  console.log('Deleting link:', linkId);
}
