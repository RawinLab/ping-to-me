"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePermission } from "@/hooks/usePermission";
import type { Resource, Action } from "@/lib/permissions";

interface PermissionGateProps {
  // Single permission check
  resource?: Resource;
  action?: Action;

  // Multiple permissions (for complex cases)
  permissions?: Array<{ resource: Resource; action: Action }>;

  // How to combine multiple permissions
  mode?: "any" | "all"; // default: 'any'

  // Children to render if permitted
  children: ReactNode;

  // Fallback to render if not permitted (default: null)
  fallback?: ReactNode;

  // Show error message if not permitted
  showError?: boolean;

  // Custom error message
  errorMessage?: string;
}

function PermissionDenied({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center p-4 text-sm text-gray-500 bg-gray-50 rounded-md border border-gray-200">
      <svg
        className="w-5 h-5 mr-2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      {message}
    </div>
  );
}

export function PermissionGate({
  resource,
  action,
  permissions,
  mode = "any",
  children,
  fallback = null,
  showError = false,
  errorMessage,
}: PermissionGateProps) {
  const t = useTranslations("shared");
  const defaultMessage = t("permissionDenied");
  const { can, canAny, canAll } = usePermission();

  let hasAccess = false;

  // Single permission check
  if (resource && action) {
    hasAccess = can(resource, action);
  }
  // Multiple permissions check
  else if (permissions && permissions.length > 0) {
    hasAccess = mode === "all" ? canAll(permissions) : canAny(permissions);
  }
  // Edge case: no permission criteria provided, deny by default
  else {
    hasAccess = false;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showError) {
    return <PermissionDenied message={errorMessage || defaultMessage} />;
  }

  return <>{fallback}</>;
}

// Usage examples:

// Basic usage - single permission check
// <PermissionGate resource="link" action="create">
//   <CreateLinkButton />
// </PermissionGate>

// With fallback - show alternative UI when permission denied
// <PermissionGate resource="billing" action="manage" fallback={<UpgradePrompt />}>
//   <BillingSettings />
// </PermissionGate>

// With error message - display permission denied message
// <PermissionGate resource="audit" action="read" showError>
//   <AuditLogs />
// </PermissionGate>

// Multiple permissions (ANY) - user needs at least one permission
// <PermissionGate
//   permissions={[
//     { resource: 'link', action: 'update' },
//     { resource: 'link', action: 'delete' }
//   ]}
// >
//   <LinkActions />
// </PermissionGate>

// Multiple permissions (ALL required) - user needs all permissions
// <PermissionGate
//   permissions={[
//     { resource: 'team', action: 'read' },
//     { resource: 'team', action: 'invite' }
//   ]}
//   mode="all"
// >
//   <TeamManagement />
// </PermissionGate>

// Custom error message
// <PermissionGate
//   resource="domain"
//   action="create"
//   showError
//   errorMessage="Only admins can add custom domains"
// >
//   <AddDomainButton />
// </PermissionGate>
