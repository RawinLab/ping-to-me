# 🔔 10 - Notifications Testing

## ภาพรวม
ทดสอบระบบ Notifications รวมถึง In-App Notifications, Mark as Read และ Settings

---

## 📝 Test Cases

### 10.1 In-App Notifications

#### NOTIF-001: แสดง Notification Badge
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Unread Notifications |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบ
2. ดู Navigation Bar

**Expected Results:**
- ✅ Bell Icon แสดงอยู่
- ✅ Badge แสดงจำนวน Unread
- ✅ Badge สีแดงหรือเด่นชัด

---

#### NOTIF-002: เปิด Notification Dropdown
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Notifications |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. คลิก Bell Icon

**Expected Results:**
- ✅ Dropdown เปิดขึ้น
- ✅ แสดงรายการ Notifications
- ✅ แสดง Title, Message, Time
- ✅ Unread items มีสไตล์ต่างจาก Read

---

#### NOTIF-003: ดู Notification Types
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Notifications หลายประเภท |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ดูรายการ Notifications

**Expected Results:**
- ✅ แสดง INFO notifications (สีฟ้า)
- ✅ แสดง WARNING notifications (สีเหลือง)
- ✅ แสดง ERROR notifications (สีแดง) ถ้ามี
- ✅ แต่ละประเภทมี Icon/Color ต่างกัน

**Notification Types:**
- INFO: ข้อมูลทั่วไป, Welcome
- WARNING: Link Expired, Quota Near Limit
- ERROR: Payment Failed, Domain Verification Failed

---

### 10.2 Mark as Read

#### NOTIF-010: Mark All as Read
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Unread Notifications |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เปิด Notification Dropdown
2. คลิก "Mark all read"

**Expected Results:**
- ✅ ทุก Notifications เป็น Read
- ✅ Badge หายไป (หรือแสดง 0)
- ✅ ปุ่ม "Mark all read" หายไป

---

#### NOTIF-011: Mark Single as Read
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Unread Notification |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เปิด Notification Dropdown
2. คลิกบน Notification item

**Expected Results:**
- ✅ Notification นั้นเป็น Read
- ✅ Badge count ลดลง 1
- ✅ Style เปลี่ยนเป็น Read state

---

### 10.3 Notification Content

#### NOTIF-020: Link Expired Notification
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Link ที่ Expired |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. สร้าง Link ที่มี Expiration ในอดีต
2. รอหรือ Trigger notification
3. ดู Notifications

**Expected Results:**
- ✅ แสดง "Link Expired" notification
- ✅ แสดงชื่อ/Slug ของ Link
- ✅ Type: WARNING

---

#### NOTIF-021: Welcome Notification
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | User ใหม่ |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. สร้าง Account ใหม่
2. เข้าสู่ระบบ
3. ดู Notifications

**Expected Results:**
- ✅ แสดง "Welcome to PingToMe!" notification
- ✅ Type: INFO

---

#### NOTIF-022: New Team Member Notification
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มีคน Accept Invitation เข้า Org |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. Invite member
2. Member accepts invitation
3. ดู Notifications

**Expected Results:**
- ✅ แสดง "New team member joined" notification
- ✅ แสดงชื่อ Member
- ✅ Type: INFO

---

### 10.4 Notification Settings

#### NOTIF-030: ดู Notification Settings
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings`
2. ดูส่วน Notification Settings

**Expected Results:**
- ✅ แสดง Toggle สำหรับ Email Notifications
- ✅ แสดง Toggle สำหรับ Marketing Emails
- ✅ แสดงค่าปัจจุบัน

---

#### NOTIF-031: Toggle Email Notifications
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Settings |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. Toggle "Email Notifications" Off
2. บันทึก

**Expected Results:**
- ✅ Setting ถูกบันทึก
- ✅ จะไม่ได้รับ Email Notifications

---

#### NOTIF-032: Toggle Marketing Emails
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Settings |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. Toggle "Marketing Emails" Off
2. บันทึก

**Expected Results:**
- ✅ Setting ถูกบันทึก
- ✅ จะไม่ได้รับ Marketing Emails

---

### 10.5 Empty State

#### NOTIF-040: No Notifications
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ไม่มี Notifications |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เปิด Notification Dropdown เมื่อไม่มี Notifications

**Expected Results:**
- ✅ แสดง Empty State
- ✅ ข้อความ "No notifications" หรือคล้ายกัน
- ✅ ไม่มี Badge บน Bell Icon

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| View Notifications | ✅ | ✅ | ✅ | ✅ |
| Mark as Read | ✅ | ✅ | ✅ | ✅ |
| Notification Settings | ✅ | ✅ | ✅ | ✅ |
| Receive Team Notifications | ✅ | ✅ | ❌ | ❌ |

---

## ✅ Test Result

### Round 1 - 2025-12-11

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| NOTIF-001 | Notification Badge | ✅ PASS | Bell icon visible, red badge shows unread count |
| NOTIF-002 | Open Dropdown | ✅ PASS | Dropdown opens, shows Title/Message/Time, blue dot for unread |
| NOTIF-003 | Notification Types | ⚠️ PARTIAL | All types display but no type-specific colors (unified blue dot) |
| NOTIF-010 | Mark All as Read | ✅ PASS | All notifications marked read, badge disappears, button hides |
| NOTIF-011 | Mark Single as Read | ✅ PASS | API works, blue dot removed, badge count decreases |
| NOTIF-020 | Link Expired | ❌ NOT_IMPL | Cron job exists but doesn't create notifications |
| NOTIF-021 | Welcome Notification | ❌ NOT_IMPL | No auto-create on registration |
| NOTIF-022 | New Team Member | ❌ NOT_IMPL | No notification on invitation accept |
| NOTIF-030 | View Settings | ❌ NOT_IMPL | Notification Settings section missing from Profile page |
| NOTIF-031 | Toggle Email | ❌ NOT_IMPL | No toggle exists |
| NOTIF-032 | Toggle Marketing | ❌ NOT_IMPL | No toggle exists |
| NOTIF-040 | No Notifications | ✅ PASS | "No notifications" message, no badge displayed |

### Summary - Round 1

| Category | Passed | Total | Rate |
|----------|--------|-------|------|
| In-App Notifications (001-003) | 2.5 | 3 | 83% |
| Mark as Read (010-011) | 2 | 2 | 100% |
| Notification Content (020-022) | 0 | 3 | 0% |
| Notification Settings (030-032) | 0 | 3 | 0% |
| Empty State (040) | 1 | 1 | 100% |
| **Total** | **5.5** | **12** | **46%** |

### Issues Found

**NOTIF-003 (PARTIAL):**
- Current: All notification types use same style (blue dot for unread)
- Expected: INFO=blue, WARNING=yellow, ERROR=red icons/colors
- Fix: Add type-based styling to NotificationCenter.tsx

**NOTIF-020/021/022 (NOT_IMPLEMENTED):**
- System triggers (Link Expired, Welcome, Team Join) don't create notifications
- Need to inject NotificationsService into relevant modules (tasks, auth, invitations)

**NOTIF-030/031/032 (NOT_IMPLEMENTED):**
- No Notification Settings section in Profile page
- Need to add UI toggles and backend API for notification preferences

### Fix Recommendations

1. **Type-Based Styling (NOTIF-003)** - Low effort
   - Update `NotificationCenter.tsx` to add icon/color based on `notification.type`

2. **Auto-Create Notifications (NOTIF-020/021/022)** - Medium effort
   - Inject NotificationsService into:
     - `expire-links.task.ts` for Link Expired
     - `auth.service.ts` for Welcome
     - `invitations.service.ts` for New Team Member

3. **Notification Settings (NOTIF-030/031/032)** - Medium-High effort
   - Add UI toggles to Profile Settings page
   - Add API endpoints for notification preferences
   - Add database fields to User model

---

### Round 2 - 2025-12-11

**Fixes Implemented (Commit: dcef6cf):**
1. **NOTIF-003**: Added type-based styling with Info/AlertTriangle/AlertCircle icons
2. **NOTIF-020/021/022**: Injected NotificationsService into tasks, auth, invitations modules
3. **NOTIF-030/031/032**: Added Notification Settings to Profile page + API endpoints

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| NOTIF-001 | Notification Badge | ✅ PASS | No changes needed |
| NOTIF-002 | Open Dropdown | ✅ PASS | No changes needed |
| NOTIF-003 | Notification Types | ✅ PASS | **FIXED** - Type-specific icons/colors (INFO=blue, WARNING=amber, ERROR=red) |
| NOTIF-010 | Mark All as Read | ✅ PASS | No changes needed |
| NOTIF-011 | Mark Single as Read | ✅ PASS | No changes needed |
| NOTIF-020 | Link Expired | ✅ PASS | **FIXED** - NotificationsService injected into expire-links.task.ts |
| NOTIF-021 | Welcome Notification | ✅ PASS | **FIXED** - Created on registration (email/password + OAuth) |
| NOTIF-022 | New Team Member | ✅ PASS | **FIXED** - Notifies OWNER/ADMIN on invitation accept |
| NOTIF-030 | View Settings | ✅ PASS | **FIXED** - Settings card in Profile page |
| NOTIF-031 | Toggle Email | ✅ PASS | **FIXED** - Switch component with API integration |
| NOTIF-032 | Toggle Marketing | ✅ PASS | **FIXED** - Switch component with API integration |
| NOTIF-040 | No Notifications | ✅ PASS | No changes needed |

### Summary - Round 2

| Category | Round 1 | Round 2 | Total | Rate |
|----------|---------|---------|-------|------|
| In-App Notifications (001-003) | 2.5 | 0.5 | 3/3 | 100% |
| Mark as Read (010-011) | 2 | 0 | 2/2 | 100% |
| Notification Content (020-022) | 0 | 3 | 3/3 | 100% |
| Notification Settings (030-032) | 0 | 3 | 3/3 | 100% |
| Empty State (040) | 1 | 0 | 1/1 | 100% |
| **Total** | **5.5** | **6.5** | **12/12** | **100%** |

### Implementation Details

**Type-Based Styling (NOTIF-003):**
- Added `getNotificationStyle(type)` helper function
- INFO: text-blue-500 + Info icon
- WARNING: text-amber-500 + AlertTriangle icon
- ERROR: text-red-500 + AlertCircle icon
- Icon on LEFT, unread dot on RIGHT

**Auto Notifications (NOTIF-020/021/022):**
- Link Expired: WARNING notification with link slug
- Welcome: INFO notification on registration
- Team Member: INFO notification to OWNER/ADMIN (excludes new member)
- Error handling doesn't fail main operations

**Notification Settings (NOTIF-030/031/032):**
- Database: Added `emailNotificationsEnabled` and `marketingEmailsEnabled` to User model
- API: GET/PATCH `/notifications/settings` endpoints
- UI: Notification Settings card in Profile page with Switch toggles
- Optimistic updates with error rollback

---

## ✅ MODULE 10 COMPLETE - ALL 12 TESTS PASS (100%)

