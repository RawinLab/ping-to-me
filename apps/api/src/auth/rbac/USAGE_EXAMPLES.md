# Permission Guard Usage Examples

This document provides comprehensive examples of how to use the `PermissionGuard` in the NestJS RBAC system.

## Overview

The `PermissionGuard` provides fine-grained permission checking based on:

- User's role in an organization
- Required permissions defined via decorators
- Resource ownership for 'own' context permissions
- Organization context extracted from requests

## Setup

### 1. Import Required Dependencies

```typescript
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard, Permission, RequirePermissions } from "../auth/rbac";
```

### 2. Apply Guards to Controller

The `PermissionGuard` must be used AFTER `JwtAuthGuard` since it requires an authenticated user.

```typescript
@Controller("links")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class LinksController {
  // Controller methods...
}
```

## Basic Usage

### Single Permission (Read Access)

```typescript
@Get()
@Permission({ resource: 'link', action: 'read' })
async findAll(@Request() req) {
  const { user } = req;
  // User must have 'link:read' permission in their organization
  return this.linksService.findAll(user.organizationId);
}
```

### Single Permission (Create Access)

```typescript
@Post()
@Permission({ resource: 'link', action: 'create' })
async create(@Body() createLinkDto: CreateLinkDto, @Request() req) {
  const { user } = req;
  // User must have 'link:create' permission
  return this.linksService.create(createLinkDto, user.id);
}
```

### Single Permission (Update Access)

```typescript
@Put(':id')
@Permission({ resource: 'link', action: 'update' })
async update(
  @Param('id') id: string,
  @Body() updateLinkDto: UpdateLinkDto,
) {
  // User must have 'link:update' permission
  return this.linksService.update(id, updateLinkDto);
}
```

### Single Permission (Delete Access)

```typescript
@Delete(':id')
@Permission({ resource: 'link', action: 'delete' })
async remove(@Param('id') id: string) {
  // User must have 'link:delete' permission
  return this.linksService.remove(id);
}
```

## Context-Based Permissions

### Own Context (User Can Only Access Their Own Resources)

```typescript
@Delete(':id')
@Permission({ resource: 'link', action: 'delete', context: 'own' })
async deleteOwnLink(@Param('id') id: string, @Request() req) {
  const { user } = req;
  // User must:
  // 1. Have 'link:delete' permission with 'own' scope
  // 2. Actually own the link (userId matches)
  return this.linksService.remove(id, user.id);
}
```

### Organization Context

```typescript
@Get(':id')
@Permission({ resource: 'link', action: 'read', context: 'organization' })
async findOne(@Param('id') id: string, @Request() req) {
  const { user } = req;
  // User can read any link in their organization
  return this.linksService.findOne(id, user.organizationId);
}
```

## Multiple Permissions (OR Condition)

User needs ANY of the specified permissions.

```typescript
@Put(':id')
@Permission([
  { resource: 'link', action: 'update' },
  { resource: 'link', action: 'delete' }
])
async updateOrDelete(
  @Param('id') id: string,
  @Body() dto: UpdateLinkDto,
) {
  // User needs EITHER 'link:update' OR 'link:delete' permission
  return this.linksService.update(id, dto);
}
```

## Multiple Permissions (AND Condition)

User needs ALL of the specified permissions.

```typescript
@Get(':id/analytics')
@RequirePermissions([
  { resource: 'link', action: 'read' },
  { resource: 'analytics', action: 'read' }
])
async getLinkAnalytics(@Param('id') id: string) {
  // User must have BOTH 'link:read' AND 'analytics:read' permissions
  return this.analyticsService.getLinkStats(id);
}
```

## Organization Management Examples

### Organization Settings

```typescript
@Controller("organizations")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OrganizationsController {
  @Get(":orgId")
  @Permission({ resource: "organization", action: "read" })
  async findOne(@Param("orgId") orgId: string) {
    // Any member can read organization details
    return this.organizationsService.findOne(orgId);
  }

  @Put(":orgId")
  @Permission({ resource: "organization", action: "update" })
  async update(
    @Param("orgId") orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    // Only OWNER and ADMIN (with limited scope) can update
    return this.organizationsService.update(orgId, dto);
  }

  @Delete(":orgId")
  @Permission({ resource: "organization", action: "delete" })
  async remove(@Param("orgId") orgId: string) {
    // Only OWNER can delete organization
    return this.organizationsService.remove(orgId);
  }
}
```

### Team Management

```typescript
@Controller("organizations/:orgId/members")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TeamController {
  @Get()
  @Permission({ resource: "team", action: "read" })
  async findAll(@Param("orgId") orgId: string) {
    // Any member can view team members
    return this.teamService.findAll(orgId);
  }

  @Post("invite")
  @Permission({ resource: "team", action: "invite" })
  async invite(@Param("orgId") orgId: string, @Body() dto: InviteMemberDto) {
    // OWNER and ADMIN can invite (with 'exclude-owner' scope for ADMIN)
    return this.teamService.invite(orgId, dto);
  }

  @Put(":memberId/role")
  @Permission({ resource: "team", action: "update-role" })
  async updateRole(
    @Param("orgId") orgId: string,
    @Param("memberId") memberId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    // OWNER and ADMIN can update roles (ADMIN cannot modify OWNER)
    return this.teamService.updateRole(orgId, memberId, dto);
  }

  @Delete(":memberId")
  @Permission({ resource: "team", action: "remove" })
  async remove(
    @Param("orgId") orgId: string,
    @Param("memberId") memberId: string,
  ) {
    // OWNER and ADMIN can remove members (ADMIN cannot remove OWNER)
    return this.teamService.remove(orgId, memberId);
  }
}
```

## Domain Management

```typescript
@Controller("organizations/:orgId/domains")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DomainsController {
  @Get()
  @Permission({ resource: "domain", action: "read" })
  async findAll(@Param("orgId") orgId: string) {
    // All members can view domains
    return this.domainsService.findAll(orgId);
  }

  @Post()
  @Permission({ resource: "domain", action: "create" })
  async create(@Param("orgId") orgId: string, @Body() dto: CreateDomainDto) {
    // OWNER and ADMIN can create domains
    return this.domainsService.create(orgId, dto);
  }

  @Post(":domainId/verify")
  @Permission({ resource: "domain", action: "verify" })
  async verify(
    @Param("orgId") orgId: string,
    @Param("domainId") domainId: string,
  ) {
    // OWNER and ADMIN can verify domains
    return this.domainsService.verify(orgId, domainId);
  }

  @Delete(":domainId")
  @Permission({ resource: "domain", action: "delete" })
  async remove(
    @Param("orgId") orgId: string,
    @Param("domainId") domainId: string,
  ) {
    // OWNER and ADMIN can delete domains
    return this.domainsService.remove(orgId, domainId);
  }
}
```

## Billing Management

```typescript
@Controller("organizations/:orgId/billing")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class BillingController {
  @Get()
  @Permission({ resource: "billing", action: "read" })
  async getBillingInfo(@Param("orgId") orgId: string) {
    // OWNER and ADMIN can view billing info
    return this.billingService.getBillingInfo(orgId);
  }

  @Post("subscription")
  @Permission({ resource: "billing", action: "manage" })
  async updateSubscription(
    @Param("orgId") orgId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    // Only OWNER can manage billing
    return this.billingService.updateSubscription(orgId, dto);
  }

  @Post("payment-method")
  @Permission({ resource: "billing", action: "manage" })
  async updatePaymentMethod(
    @Param("orgId") orgId: string,
    @Body() dto: PaymentMethodDto,
  ) {
    // Only OWNER can update payment methods
    return this.billingService.updatePaymentMethod(orgId, dto);
  }
}
```

## Analytics Examples

```typescript
@Controller("organizations/:orgId/analytics")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AnalyticsController {
  @Get("links/:linkId")
  @RequirePermissions([
    { resource: "link", action: "read" },
    { resource: "analytics", action: "read" },
  ])
  async getLinkAnalytics(
    @Param("orgId") orgId: string,
    @Param("linkId") linkId: string,
  ) {
    // User must have both link:read AND analytics:read
    return this.analyticsService.getLinkAnalytics(linkId);
  }

  @Get("export")
  @Permission({ resource: "analytics", action: "export" })
  async exportAnalytics(@Param("orgId") orgId: string) {
    // OWNER and ADMIN can export analytics
    return this.analyticsService.export(orgId);
  }
}
```

## Bio Pages

```typescript
@Controller("organizations/:orgId/biopages")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class BioPagesController {
  @Get()
  @Permission({ resource: "biopage", action: "read" })
  async findAll(@Param("orgId") orgId: string) {
    // All members can view bio pages
    return this.bioPagesService.findAll(orgId);
  }

  @Post()
  @Permission({ resource: "biopage", action: "create" })
  async create(
    @Param("orgId") orgId: string,
    @Body() dto: CreateBioPageDto,
    @Request() req,
  ) {
    // OWNER, ADMIN, EDITOR can create bio pages
    return this.bioPagesService.create(orgId, dto, req.user.id);
  }

  @Put(":id")
  @Permission({ resource: "biopage", action: "update", context: "own" })
  async update(
    @Param("orgId") orgId: string,
    @Param("id") id: string,
    @Body() dto: UpdateBioPageDto,
  ) {
    // EDITOR can only update their own bio pages
    // ADMIN can update own or organization bio pages
    // OWNER can update any bio page
    return this.bioPagesService.update(id, dto);
  }

  @Delete(":id")
  @Permission({ resource: "biopage", action: "delete", context: "own" })
  async remove(@Param("orgId") orgId: string, @Param("id") id: string) {
    // Same ownership rules as update
    return this.bioPagesService.remove(id);
  }
}
```

## API Keys

```typescript
@Controller("organizations/:orgId/api-keys")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ApiKeysController {
  @Get()
  @Permission({ resource: "api-key", action: "read" })
  async findAll(@Param("orgId") orgId: string, @Request() req) {
    // OWNER can read all keys
    // ADMIN can read own + organization keys
    // Implementation should filter based on scope
    return this.apiKeysService.findAll(orgId, req.user.id);
  }

  @Post()
  @Permission({ resource: "api-key", action: "create" })
  async create(
    @Param("orgId") orgId: string,
    @Body() dto: CreateApiKeyDto,
    @Request() req,
  ) {
    // OWNER and ADMIN can create API keys
    return this.apiKeysService.create(orgId, dto, req.user.id);
  }

  @Delete(":apiKeyId")
  @Permission({ resource: "api-key", action: "revoke", context: "own" })
  async revoke(
    @Param("orgId") orgId: string,
    @Param("apiKeyId") apiKeyId: string,
  ) {
    // OWNER can revoke any key
    // ADMIN can only revoke their own keys
    return this.apiKeysService.revoke(apiKeyId);
  }
}
```

## Bulk Operations

```typescript
@Controller("organizations/:orgId/links")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class LinksController {
  @Post("bulk-import")
  @Permission({ resource: "link", action: "bulk" })
  async bulkImport(@Param("orgId") orgId: string, @Body() dto: BulkImportDto) {
    // OWNER has full bulk access
    // ADMIN has organization-scoped bulk
    return this.linksService.bulkImport(orgId, dto);
  }

  @Post("bulk-delete")
  @Permission({ resource: "link", action: "bulk" })
  async bulkDelete(@Param("orgId") orgId: string, @Body() dto: BulkDeleteDto) {
    // OWNER and ADMIN (with org scope) can bulk delete
    return this.linksService.bulkDelete(orgId, dto.linkIds);
  }

  @Get("export")
  @Permission({ resource: "link", action: "export" })
  async export(@Param("orgId") orgId: string, @Request() req) {
    // OWNER and ADMIN can export all links
    // EDITOR can only export their own links
    return this.linksService.export(orgId, req.user.id);
  }
}
```

## Audit Logs

```typescript
@Controller("organizations/:orgId/audit")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditController {
  @Get()
  @Permission({ resource: "audit", action: "read" })
  async findAll(@Param("orgId") orgId: string) {
    // OWNER and ADMIN can view audit logs
    return this.auditService.findAll(orgId);
  }

  @Get("export")
  @Permission({ resource: "audit", action: "export" })
  async export(@Param("orgId") orgId: string) {
    // Only OWNER can export audit logs
    return this.auditService.export(orgId);
  }
}
```

## Error Handling

The PermissionGuard throws `ForbiddenException` when access is denied:

```typescript
{
  "statusCode": 403,
  "message": "Insufficient permissions for link:delete",
  "error": "Forbidden",
  "details": {
    "requiredPermission": "link:delete",
    "userId": "user-uuid"
  }
}
```

### Handling Permission Errors in Frontend

```typescript
try {
  await api.delete(`/links/${linkId}`);
} catch (error) {
  if (error.response?.status === 403) {
    // Show user-friendly message
    toast.error("You do not have permission to delete this link");
  }
}
```

## Best Practices

### 1. Always Use with JwtAuthGuard

```typescript
// ✅ Correct
@UseGuards(JwtAuthGuard, PermissionGuard)

// ❌ Wrong - PermissionGuard requires authenticated user
@UseGuards(PermissionGuard)
```

### 2. Provide Organization Context

Ensure requests include organization ID in one of these locations:

- Route params: `:orgId`, `:organizationId`
- Request body: `organizationId`, `orgId`
- Query params: `organizationId`, `orgId`

### 3. Use Context Appropriately

```typescript
// ✅ For user-owned resources
@Permission({ resource: 'link', action: 'delete', context: 'own' })

// ✅ For organization-wide access
@Permission({ resource: 'link', action: 'read', context: 'organization' })

// ✅ For unrestricted access (role-based only)
@Permission({ resource: 'organization', action: 'read' })
```

### 4. Combine with Service-Level Checks

The guard provides initial authorization, but add business logic checks in services:

```typescript
async updateLink(linkId: string, userId: string, dto: UpdateLinkDto) {
  const link = await this.prisma.link.findUnique({ where: { id: linkId } });

  // Additional business logic validation
  if (link.expirationDate && link.expirationDate < new Date()) {
    throw new BadRequestException('Cannot update expired link');
  }

  return this.prisma.link.update({ where: { id: linkId }, data: dto });
}
```

## Permission Matrix Reference

See `permission-matrix.ts` for the complete permission matrix showing what each role can do.

| Role   | Link (Create/Read/Update/Delete)          | Analytics      | Organization   | Team                   | Billing   |
| ------ | ----------------------------------------- | -------------- | -------------- | ---------------------- | --------- |
| OWNER  | Full access (\*)                          | Full           | Full           | Full                   | Full      |
| ADMIN  | Full (bulk: org scope)                    | Full           | Limited update | Manage (exclude owner) | Read only |
| EDITOR | Create, Read (own/org), Update/Delete own | Read (own/org) | Read only      | Read only              | None      |
| VIEWER | Read (org)                                | Read (org)     | Read only      | Read only              | None      |
