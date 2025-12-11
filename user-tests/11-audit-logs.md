# 📋 11 - Audit Logs Testing

## ภาพรวม
ทดสอบระบบ Audit Logs รวมถึงการดู, Filter, Search และ Export Logs

---

## 📝 Test Cases

### 11.1 View Audit Logs

#### AUD-001: เข้าถึงหน้า Audit Logs
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN (Full), EDITOR, VIEWER (Own only) |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/audit-logs`

**Expected Results:**
- ✅ หน้า Audit Logs แสดงผล
- ✅ แสดง Title "Audit Logs"
- ✅ แสดง Activity Log section
- ✅ แสดง Filters section

---

#### AUD-002: แสดงรายการ Activity
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Activity ในระบบ |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ดูรายการ Audit Logs

**Expected Results:**
- ✅ แสดง Activity items
- ✅ แต่ละ item แสดง: Action, Resource, User, Timestamp
- ✅ แสดง Status (Success/Failed)

**Activity Types:**
- link.created, link.updated, link.deleted
- member.invited, member.role_changed, member.removed
- auth.login, auth.logout
- domain.added, domain.verified
- organization.updated

---

### 11.2 Audit Log Filters

#### AUD-010: Filter by Action
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Audit Logs |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก "All Actions" dropdown
2. เลือก "Link Created"

**Expected Results:**
- ✅ แสดงเฉพาะ Actions ที่เลือก
- ✅ Dropdown แสดงค่าที่เลือก

---

#### AUD-011: Filter by Resource
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Audit Logs |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก "All Resources" dropdown
2. เลือก "Link"

**Expected Results:**
- ✅ แสดงเฉพาะ Resource ที่เลือก
- ✅ Log items เป็น Link-related

**Resource Types:**
- Link
- User
- OrganizationMember
- Domain
- Organization

---

#### AUD-012: Filter by Date Range
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Audit Logs |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก Date Range selector
2. เลือก "Last 30 days"

**Expected Results:**
- ✅ แสดงเฉพาะ Logs ในช่วง 30 วัน
- ✅ Date selector แสดงค่าที่เลือก

---

#### AUD-013: Filter by Status
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Audit Logs |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก "All Status" dropdown
2. เลือก "Success"

**Expected Results:**
- ✅ แสดงเฉพาะ Logs ที่ Success
- ✅ ไม่แสดง Failed logs

---

#### AUD-014: Search within Logs
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Audit Logs |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. พิมพ์ในช่อง Search: `link`
2. รอผลลัพธ์

**Expected Results:**
- ✅ แสดง Logs ที่ match คำค้นหา
- ✅ Match ได้กับ Action, Resource, Details

---

#### AUD-015: Clear Filters
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ใช้ Filters แล้ว |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. เลือก Filters หลายตัว
2. คลิก "Clear Filters"

**Expected Results:**
- ✅ Filters ทั้งหมดถูก Reset
- ✅ แสดง Logs ทั้งหมด
- ✅ Search box ว่าง

---

### 11.3 Audit Log Details

#### AUD-020: ดู Log Details
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Logs |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิกบน Log item เพื่อดู Details

**Expected Results:**
- ✅ แสดง Full Details
- ✅ แสดง IP Address
- ✅ แสดง User Agent
- ✅ แสดง Changes (before/after) ถ้ามี

---

#### AUD-021: ดู Before/After Changes
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Update Log (เช่น link.updated) |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ดู Log ที่เป็น Update action

**Expected Results:**
- ✅ แสดง Before values
- ✅ แสดง After values
- ✅ Highlight ความต่าง

---

### 11.4 Pagination

#### AUD-030: Pagination Works
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Logs มากกว่า 1 page |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ดู Pagination controls
2. คลิก "Next"

**Expected Results:**
- ✅ Previous/Next buttons แสดงผล
- ✅ คลิก Next ไปหน้าถัดไป
- ✅ แสดง Page number ปัจจุบัน

---

### 11.5 Export Audit Logs

#### AUD-040: Export เป็น CSV
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Logs |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิกปุ่ม "Export CSV"

**Expected Results:**
- ✅ Download ไฟล์ CSV
- ✅ ไฟล์มี Columns: Timestamp, User ID, Action, Resource, Status
- ✅ Data ตรงกับที่แสดงในหน้า (รวม Filters)

---

#### AUD-041: Export เป็น JSON
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Logs |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิกปุ่ม "Export JSON"

**Expected Results:**
- ✅ Download ไฟล์ JSON
- ✅ JSON structure ถูกต้อง
- ✅ มีข้อมูลครบถ้วน

---

#### AUD-042: Export Respects Filters
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ใช้ Filters แล้ว |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. Apply Filter (เช่น Resource = Link)
2. Export CSV

**Expected Results:**
- ✅ ไฟล์ Export มีเฉพาะ Data ที่ Filter
- ✅ ไม่รวม Data นอก Filter

---

### 11.6 RBAC for Audit Logs

#### AUD-050: OWNER ดู Logs ทั้งหมด
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบเป็น OWNER |
| **Role** | OWNER |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Audit Logs

**Expected Results:**
- ✅ เห็น Logs ของทุกคนใน Organization
- ✅ เห็น Export buttons
- ✅ Full access

---

#### AUD-051: ADMIN ดู Logs ทั้งหมด
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบเป็น ADMIN |
| **Role** | ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Audit Logs

**Expected Results:**
- ✅ เห็น Logs ของทุกคนใน Organization
- ✅ เห็น Export buttons

---

#### AUD-052: EDITOR ดูเฉพาะ Own Activity
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบเป็น EDITOR |
| **Role** | EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Audit Logs

**Expected Results:**
- ✅ เห็นเฉพาะ Activity ของตัวเอง
- ✅ ไม่เห็น Activity ของคนอื่น

---

#### AUD-053: VIEWER ดูเฉพาะ Own Activity
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบเป็น VIEWER |
| **Role** | VIEWER |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Audit Logs

**Expected Results:**
- ✅ เห็นเฉพาะ Activity ของตัวเอง
- ✅ ไม่เห็น Activity ของคนอื่น

---

#### AUD-054: Unauthorized Access
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ไม่ได้ล็อกอิน |
| **Role** | - |

**ขั้นตอนการทดสอบ:**
1. เปิด URL `/dashboard/settings/audit-logs` โดยตรง

**Expected Results:**
- ✅ Redirect ไปหน้า Login
- ✅ ไม่แสดง Audit Logs

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| View All Org Logs | ✅ | ✅ | ❌ | ❌ |
| View Own Logs | ✅ | ✅ | ✅ | ✅ |
| Filter Logs | ✅ | ✅ | ✅ | ✅ |
| Search Logs | ✅ | ✅ | ✅ | ✅ |
| Export CSV | ✅ | ✅ | ❌ | ❌ |
| Export JSON | ✅ | ✅ | ❌ | ❌ |

---

## ✅ Test Result

### Round 1 - 2025-12-11

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| AUD-001 | Access Audit Logs | ✅ PASS | Page exists at correct path, title "Audit Logs" shown (lines 500-501) |
| AUD-002 | View Activity List | ✅ PASS | Shows Action, Resource, Timestamp, Status (lines 730-820) |
| AUD-010 | Filter by Action | ✅ PASS | Dropdown works, API filters correctly (lines 580-603) |
| AUD-011 | Filter by Resource | ✅ PASS | Dropdown works, API filters correctly (lines 605-629) |
| AUD-012 | Filter by Date Range | ✅ PASS | Date presets work: 24h, 7d, 30d, 90d, All time (lines 557-578) |
| AUD-013 | Filter by Status | ✅ PASS | Success/Failure dropdown works (lines 632-652) |
| AUD-014 | Search Logs | ✅ PASS | Search matches action/resource fields (lines 545-553) |
| AUD-015 | Clear Filters | ✅ PASS | clearFilters() resets all state (lines 461-470) |
| AUD-020 | View Log Details | ❌ FAIL | Log items NOT clickable, no detail modal, User Agent not displayed |
| AUD-021 | Before/After Changes | ⚠️ PARTIAL | Shows field NAMES only, not actual before/after VALUES (lines 787-795) |
| AUD-030 | Pagination | ✅ PASS | Previous/Next buttons, page indicator work (lines 825-854) |
| AUD-040 | Export CSV | ✅ PASS | CSV export with 11 columns including required 5 (controller lines 209-221) |
| AUD-041 | Export JSON | ✅ PASS | JSON export with proper structure (controller lines 193-201) |
| AUD-042 | Export with Filters | ✅ PASS | All filters correctly passed to export API (frontend lines 422-430) |
| AUD-050 | OWNER Access | ✅ PASS | Full access to all org logs, export buttons visible |
| AUD-051 | ADMIN Access | ✅ PASS | Full access to all org logs |
| AUD-052 | EDITOR Access | ✅ PASS | /audit/logs 403, /audit/my-activity returns own logs |
| AUD-053 | VIEWER Access | ✅ PASS | /audit/logs 403, /audit/my-activity returns own logs |
| AUD-054 | Unauthorized | ❌ FAIL | Returns 500 instead of 401 - JwtAuthGuard bug |

### Round 1 Summary

**Total: 16.5/19 PASS (87%)**

| Category | Passed | Total | Rate |
|----------|--------|-------|------|
| View Audit Logs | 2 | 2 | 100% |
| Filters | 6 | 6 | 100% |
| Log Details | 0.5 | 2 | 25% |
| Pagination | 1 | 1 | 100% |
| Export | 3 | 3 | 100% |
| RBAC | 4 | 5 | 80% |
| **Total** | **16.5** | **19** | **87%** |

### Issues Found (Round 1)

#### 1. AUD-020: Missing Log Detail View
- **Issue:** Log items display inline only, no clickable detail modal
- **Missing Features:**
  - User Agent not displayed anywhere in UI
  - No onClick handler on log items
  - No Dialog/Sheet component for full details
- **Backend:** GET `/audit/logs/:id` endpoint EXISTS and works
- **Fix Required:** Add detail modal with full log info

#### 2. AUD-021: Incomplete Before/After Display
- **Issue:** Only shows changed field NAMES, not actual VALUES
- **Current:** "Changes: title, description"
- **Expected:** "title: Old Value → New Value"
- **Fix Required:** Enhance display or add to detail modal

#### 3. AUD-054: Unauthorized Returns 500
- **Issue:** API returns 500 Internal Server Error instead of 401 Unauthorized
- **Expected:** 401 Unauthorized with redirect
- **Cause:** JwtAuthGuard not properly handling missing tokens
- **Fix Required:** Update guard error handling

### Implementation Evidence

**Frontend File:** `/apps/web/app/dashboard/settings/audit-logs/page.tsx` (887 lines)
**Backend Controller:** `/apps/api/src/audit/audit.controller.ts` (246 lines)
**Backend Service:** `/apps/api/src/audit/audit.service.ts` (576 lines)

**Verified Features:**
- ✅ Page routing and UI layout
- ✅ All filter dropdowns with proper state management
- ✅ Search input with real-time filtering
- ✅ Clear Filters button
- ✅ Pagination controls (20 items/page)
- ✅ CSV export with proper escaping
- ✅ JSON export with pretty print
- ✅ RBAC permission checks via @Permission decorator
- ✅ /audit/my-activity endpoint for EDITOR/VIEWER roles

---

### Round 2 - 2025-12-11 (After Fixes)

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| AUD-001 | Access Audit Logs | ✅ PASS | No changes needed |
| AUD-002 | View Activity List | ✅ PASS | No changes needed |
| AUD-010 | Filter by Action | ✅ PASS | No changes needed |
| AUD-011 | Filter by Resource | ✅ PASS | No changes needed |
| AUD-012 | Filter by Date Range | ✅ PASS | No changes needed |
| AUD-013 | Filter by Status | ✅ PASS | No changes needed |
| AUD-014 | Search Logs | ✅ PASS | No changes needed |
| AUD-015 | Clear Filters | ✅ PASS | No changes needed |
| AUD-020 | View Log Details | ✅ PASS | **FIXED** - Dialog modal opens on click, shows full details (line 894) |
| AUD-021 | Before/After Changes | ✅ PASS | **FIXED** - Shows actual VALUES with red/green color coding (lines 1014-1024) |
| AUD-030 | Pagination | ✅ PASS | No changes needed |
| AUD-040 | Export CSV | ✅ PASS | No changes needed |
| AUD-041 | Export JSON | ✅ PASS | No changes needed |
| AUD-042 | Export with Filters | ✅ PASS | No changes needed |
| AUD-050 | OWNER Access | ✅ PASS | No changes needed |
| AUD-051 | ADMIN Access | ✅ PASS | No changes needed |
| AUD-052 | EDITOR Access | ✅ PASS | No changes needed |
| AUD-053 | VIEWER Access | ✅ PASS | No changes needed |
| AUD-054 | Unauthorized | ✅ PASS | **FIXED** - Returns 401 with "No auth token" message |

### Round 2 Summary

**Total: 19/19 PASS (100%)**

| Category | Passed | Total | Rate |
|----------|--------|-------|------|
| View Audit Logs | 2 | 2 | 100% |
| Filters | 6 | 6 | 100% |
| Log Details | 2 | 2 | 100% |
| Pagination | 1 | 1 | 100% |
| Export | 3 | 3 | 100% |
| RBAC | 5 | 5 | 100% |
| **Total** | **19** | **19** | **100%** |

### Fixes Applied (Commit: 7adc457)

#### 1. AUD-020/021: Log Detail Dialog Modal
**File:** `/apps/web/app/dashboard/settings/audit-logs/page.tsx`

Changes:
- Added `selectedLog` state (line 362)
- Added `cursor-pointer` and `onClick` to log items (lines 740-741)
- Added Dialog component for full log details (lines 894-1090)
- **User Agent** now displayed in Network Information section (lines 973-979)
- **Before/After VALUES** now shown with proper formatting (lines 999-1032)
  - Before values in red (line 1014)
  - After values in green (line 1022)
  - Objects serialized with JSON.stringify (lines 1016, 1024)

Dialog sections:
1. Action Information (action, resource, resourceId, status)
2. Network Information (IP Address, **User Agent**, Location)
3. Changes (before/after with color coding)
4. Additional Details (JSON formatted)
5. Metadata (Log ID, User ID, Organization ID, Timestamp)

#### 2. AUD-054: JwtAuthGuard 401 Response
**File:** `/apps/api/src/auth/guards/jwt-auth.guard.ts`

Changes:
- Added `handleRequest()` override to catch auth errors
- Returns `UnauthorizedException` (401) instead of propagating 500 errors
- Message: "No auth token" or specific JWT error message

Before: `{"statusCode":500,"message":"Internal server error"}`
After: `{"message":"No auth token","error":"Unauthorized","statusCode":401}`

---

## MODULE 11 COMPLETE - ALL UAT TESTS PASS (100%)

