# Module 1.11: Notifications - Development Plan

## Executive Summary

**Module**: 1.11 Notifications
**Status**: ~40% Complete
**Priority**: Medium
**Complexity**: Medium

The Notifications module has basic infrastructure (database, API, UI) but lacks the critical integration: no feature modules actually create notifications. The system is poll-based (60-second intervals) with no real-time delivery or email integration.

---

## Current Implementation Status

### Database Schema

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // INFO, WARNING, ERROR
  title     String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Backend Status (~50% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Notification Model | Implemented | schema.prisma |
| Create Notification | Implemented | notifications.service.ts |
| List Notifications | Implemented | Max 50, newest first |
| Unread Count | Implemented | getUnreadCount() |
| Mark as Read | Implemented | Single and all |
| Event Triggers | NOT IMPLEMENTED | No modules call create() |
| Templates | NOT IMPLEMENTED | - |
| Email Integration | NOT IMPLEMENTED | - |
| Real-time (WebSocket) | NOT IMPLEMENTED | - |

### Frontend Status (~70% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Notification Center | Implemented | NotificationCenter.tsx |
| Bell Icon | Implemented | Layout header |
| Unread Badge | Implemented | Red badge with count |
| Notification List | Implemented | Popover with scroll |
| Mark as Read | Implemented | Click to mark |
| Mark All Read | Implemented | Button action |
| Relative Timestamps | Implemented | date-fns |
| Polling (60s) | Implemented | useEffect interval |
| Preferences UI | NOT IMPLEMENTED | - |

### E2E Tests (~60% Complete)

| Test ID | Scenario | Status |
|---------|----------|--------|
| NOTIF-001 | Display notifications | Active |
| NOTIF-002 | Mark as read | Active |
| NOTIF-004 | Notification settings | Partial |

---

## Critical Gap: No Event Triggers

**Current Problem**: The `NotificationsService.create()` method exists but is NEVER called by any feature module. Notifications are never automatically created.

### Required Integrations

| Module | Event | Notification Type |
|--------|-------|-------------------|
| Links | Link expired | WARNING |
| Links | Link disabled by admin | ERROR |
| Organizations | Member invited | INFO |
| Organizations | Role changed | INFO |
| Payments | Subscription renewed | INFO |
| Payments | Payment failed | ERROR |
| Payments | Plan downgraded | WARNING |
| Quota | 80% usage reached | WARNING |
| Quota | Limit exceeded | ERROR |
| Domains | Verification succeeded | INFO |
| Domains | Verification failed | WARNING |

---

## Gap Analysis

### Critical Gaps

1. **No Event Triggers**
   - NotificationsService.create() never called
   - Users receive no notifications

2. **No Real-time Delivery**
   - 60-second polling only
   - No WebSocket or SSE

### Important Gaps

3. **No Email Integration**
   - Mail service exists but not connected
   - No email notifications

4. **No User Preferences**
   - Can't opt-out of notification types
   - No email/in-app toggle

5. **No Templates**
   - Hardcoded messages required
   - No i18n support

---

## Feature Breakdown by Priority

### Priority 0 (Critical) - Must Have

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| NOT-001 | Link expiration notification | Add to LinksService | - | Unit |
| NOT-002 | Quota warning notification | Add to QuotaService | - | Unit |
| NOT-003 | Payment notification | Add to PaymentsService | - | Unit |

### Priority 1 (Important)

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| NOT-004 | Notification templates | Create templates | - | Unit |
| NOT-005 | Email notifications | Connect MailService | - | Unit |
| NOT-006 | User preferences | Add settings table | Settings page | E2E |

### Priority 2 (Enhancement)

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| NOT-007 | Real-time WebSocket | Add WS gateway | Update polling | Integration |
| NOT-008 | Notification categories | Add category field | Filter UI | E2E |
| NOT-009 | Bulk actions | Delete/archive | UI controls | E2E |

---

## Implementation Details

### 1. Add Event Triggers

```typescript
// apps/api/src/links/links.service.ts
// After link creation:
await this.notificationsService.create(
  userId,
  'INFO',
  'Link Created',
  `Your link "${title}" has been created successfully.`
);

// When link expires:
await this.notificationsService.create(
  link.userId,
  'WARNING',
  'Link Expired',
  `Your link "${link.title}" has expired.`
);
```

```typescript
// apps/api/src/quota/quota.service.ts
// When usage reaches 80%:
if (percentUsed >= 80 && percentUsed < 100) {
  await this.notificationsService.create(
    userId,
    'WARNING',
    'Usage Alert',
    `You've used ${percentUsed}% of your monthly ${resource} quota.`
  );
}

// When limit exceeded:
if (percentUsed >= 100) {
  await this.notificationsService.create(
    userId,
    'ERROR',
    'Limit Reached',
    `You've reached your ${resource} limit. Upgrade to continue.`
  );
}
```

### 2. Notification Templates

```typescript
// apps/api/src/notifications/templates.ts
export const NOTIFICATION_TEMPLATES = {
  LINK_CREATED: {
    type: 'INFO',
    title: 'Link Created',
    message: 'Your link "{{linkTitle}}" has been created.',
  },
  LINK_EXPIRED: {
    type: 'WARNING',
    title: 'Link Expired',
    message: 'Your link "{{linkTitle}}" has expired.',
  },
  QUOTA_WARNING: {
    type: 'WARNING',
    title: 'Usage Alert',
    message: 'You have used {{percentage}}% of your {{resource}} quota.',
  },
  PAYMENT_FAILED: {
    type: 'ERROR',
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please update your billing.',
  },
};

// Usage:
await this.notificationsService.createFromTemplate(
  userId,
  'LINK_EXPIRED',
  { linkTitle: link.title }
);
```

### 3. Email Integration

```typescript
// apps/api/src/notifications/notifications.service.ts
async create(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  options?: { sendEmail?: boolean }
) {
  // Create in-app notification
  const notification = await this.prisma.notification.create({
    data: { userId, type, title, message },
  });

  // Optionally send email
  if (options?.sendEmail) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, notificationPreferences: true },
    });

    if (user?.notificationPreferences?.email) {
      await this.mailService.sendNotificationEmail(
        user.email,
        title,
        message
      );
    }
  }

  return notification;
}
```

### 4. User Preferences

```prisma
model UserNotificationPreferences {
  id                 String  @id @default(cuid())
  userId             String  @unique
  emailNotifications Boolean @default(true)
  linkExpiry         Boolean @default(true)
  quotaWarnings      Boolean @default(true)
  paymentAlerts      Boolean @default(true)
  teamUpdates        Boolean @default(true)
  marketingEmails    Boolean @default(false)
}
```

---

## Unit Test Cases

```typescript
describe('NotificationsService', () => {
  describe('create', () => {
    it('should create notification in database', async () => {
      const notification = await service.create(
        userId, 'INFO', 'Test', 'Message'
      );
      expect(notification.id).toBeDefined();
    });

    it('should send email when sendEmail option is true', async () => {
      await service.create(userId, 'INFO', 'Test', 'Message', { sendEmail: true });
      expect(mailService.send).toHaveBeenCalled();
    });

    it('should respect user email preferences', async () => {
      // User has email disabled
      await service.create(userId, 'INFO', 'Test', 'Message', { sendEmail: true });
      expect(mailService.send).not.toHaveBeenCalled();
    });
  });

  describe('createFromTemplate', () => {
    it('should interpolate template variables', async () => {
      const notification = await service.createFromTemplate(
        userId,
        'LINK_EXPIRED',
        { linkTitle: 'My Link' }
      );
      expect(notification.message).toContain('My Link');
    });
  });
});
```

## E2E Test Cases

```typescript
test('NOTIF-005: Receive notification on link expiry', async ({ page }) => {
  // Create link with expiration in past
  // Wait for notification
  // Verify notification appears
});

test('NOTIF-006: Configure notification preferences', async ({ page }) => {
  // Navigate to settings
  // Toggle email notifications off
  // Save preferences
  // Verify setting persisted
});

test('NOTIF-007: Bulk delete notifications', async ({ page }) => {
  // Create multiple notifications
  // Select all
  // Delete selected
  // Verify cleared
});
```

---

## Summary

Module 1.11 Notifications is approximately 40% complete. The infrastructure exists but the critical integration is missing: **no feature modules create notifications**.

**Critical Actions**:
1. Add notification triggers to LinksService (link expiry)
2. Add notification triggers to QuotaService (usage warnings)
3. Add notification triggers to PaymentsService (payment events)

**Important Actions**:
1. Create notification templates
2. Integrate with MailService for email notifications
3. Add user notification preferences

**Future Enhancements**:
1. Real-time delivery via WebSocket
2. Notification categories and filtering
3. Bulk operations (delete, archive)
