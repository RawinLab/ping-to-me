# 🔗 03 - Link Management Testing

## ภาพรวม
ทดสอบการจัดการ Short Links รวมถึงการสร้าง แก้ไข ลบ และตั้งค่าต่างๆ

---

## 📝 Test Cases

### 3.1 สร้าง Short Link

#### LINK-001: สร้าง Link ด้วย Random Slug
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links/new` หรือคลิก "Create Link"
2. กรอก Destination URL: `https://google.com`
3. ปล่อย Custom Slug ว่าง
4. คลิกปุ่ม "Create Link"

**Expected Results:**
- ✅ Link ถูกสร้างสำเร็จ
- ✅ ระบบสร้าง Random Slug ให้
- ✅ แสดงข้อความ Success
- ✅ Link ปรากฏในรายการ

---

#### LINK-002: สร้าง Link ด้วย Custom Slug
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |
| **Test Data** | Slug: `my-custom-link` |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links/new`
2. กรอก Destination URL: `https://example.com`
3. กรอก Custom Slug: `my-custom-link`
4. คลิกปุ่ม "Create Link"

**Expected Results:**
- ✅ Link ถูกสร้างด้วย Slug `my-custom-link`
- ✅ Short URL แสดงเป็น `https://ptm.link/my-custom-link`

---

#### LINK-003: สร้าง Link ด้วย URL ไม่ถูกต้อง
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links/new`
2. กรอก URL: `invalid-url`
3. คลิกปุ่ม "Create Link"

**Expected Results:**
- ✅ แสดง Validation Error
- ✅ ไม่ได้สร้าง Link
- ✅ Field แสดง Invalid state

---

#### LINK-004: สร้าง Link ด้วย Slug ซ้ำ
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Link ที่ใช้ Slug `existing-slug` อยู่แล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links/new`
2. กรอก URL: `https://example.com`
3. กรอก Custom Slug: `existing-slug` (ที่มีอยู่แล้ว)
4. คลิกปุ่ม "Create Link"

**Expected Results:**
- ✅ แสดง Error "Slug already taken"
- ✅ ไม่ได้สร้าง Link

---

#### LINK-005: สร้าง Link พร้อม Tags
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links/new`
2. กรอก Destination URL: `https://example.com`
3. เลือก Tags: "Marketing", "Social"
4. คลิกปุ่ม "Create Link"

**Expected Results:**
- ✅ Link ถูกสร้างพร้อม Tags
- ✅ Tags แสดงใน Link detail

---

#### LINK-006: สร้าง Link พร้อม Expiration Date
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links/new`
2. กรอก Destination URL: `https://example.com`
3. เปิด "Set Expiration"
4. เลือก Date/Time ในอนาคต
5. คลิกปุ่ม "Create Link"

**Expected Results:**
- ✅ Link ถูกสร้างพร้อม Expiration Date
- ✅ แสดง Expiration Date ใน Link detail
- ✅ Link จะ Expire หลังเวลาที่กำหนด

---

#### LINK-007: สร้าง Link พร้อม Password Protection
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links/new`
2. กรอก Destination URL: `https://example.com`
3. เปิด "Password Protection"
4. กรอก Password: `secret123`
5. คลิกปุ่ม "Create Link"

**Expected Results:**
- ✅ Link ถูกสร้างแบบ Password Protected
- ✅ เมื่อเข้า Link จะต้องกรอก Password ก่อน

---

#### LINK-008: สร้าง Link พร้อม UTM Parameters
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links/new`
2. กรอก Destination URL: `https://example.com`
3. เปิด "UTM Parameters"
4. กรอก:
   - Source: `newsletter`
   - Medium: `email`
   - Campaign: `spring_sale`
5. คลิกปุ่ม "Create Link"

**Expected Results:**
- ✅ Link ถูกสร้างพร้อม UTM Parameters
- ✅ Redirect URL จะมี UTM ต่อท้าย

---

### 3.2 แก้ไข Link

#### LINK-010: เปิด Edit Modal
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Link อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก Icon ดินสอ (Edit) ข้าง Link ที่ต้องการ

**Expected Results:**
- ✅ Edit Modal เปิดขึ้น
- ✅ แสดงข้อมูล Link ปัจจุบัน
- ✅ สามารถแก้ไขได้

---

#### LINK-011: แก้ไข Destination URL
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Link อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เปิด Edit Modal ของ Link
2. แก้ไข Destination URL เป็น `https://new-destination.com`
3. คลิกปุ่ม "Save"

**Expected Results:**
- ✅ URL ถูกอัพเดต
- ✅ Link redirect ไปยัง URL ใหม่

---

#### LINK-012: แก้ไข Title และ Tags
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Link อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เปิด Edit Modal ของ Link
2. แก้ไข Title: `New Title`
3. เพิ่ม/ลบ Tags
4. คลิกปุ่ม "Save"

**Expected Results:**
- ✅ Title และ Tags ถูกอัพเดต
- ✅ แสดงผลในรายการ Links

---

#### LINK-013: Validation Error ขณะแก้ไข
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เปิด Edit Modal ของ Link
2. ลบ Destination URL ทิ้ง (ปล่อยว่าง)
3. คลิกปุ่ม "Save"

**Expected Results:**
- ✅ แสดง Validation Error
- ✅ ไม่ได้บันทึก
- ✅ Modal ยังเปิดอยู่

---

### 3.3 จัดการ Link Status

#### LINK-020: Disable Link
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Active Link |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก Menu (⋮) ข้าง Link
3. เลือก "Disable"

**Expected Results:**
- ✅ Status เปลี่ยนเป็น DISABLED
- ✅ Link แสดงเป็น Disabled
- ✅ เมื่อเข้า Link จะได้ 403

---

#### LINK-021: Enable Link (Restore)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Disabled Link |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก Menu (⋮) ข้าง Disabled Link
3. เลือก "Enable"

**Expected Results:**
- ✅ Status เปลี่ยนเป็น ACTIVE
- ✅ Link ใช้งานได้ปกติ

---

#### LINK-022: Archive Link
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Active Link |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก Menu (⋮) ข้าง Link
3. เลือก "Archive"

**Expected Results:**
- ✅ Status เปลี่ยนเป็น ARCHIVED
- ✅ Link ไม่แสดงใน Active list
- ✅ เมื่อเข้า Link จะได้ 410 Gone

---

### 3.4 ลบ Link

#### LINK-030: ลบ Link
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Link อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก Menu (⋮) ข้าง Link
3. เลือก "Delete"
4. ยืนยันการลบ

**Expected Results:**
- ✅ Link ถูกลบออก
- ✅ ไม่แสดงในรายการ
- ✅ Short URL ใช้งานไม่ได้

---

### 3.5 View Links

#### LINK-040: View Mode - List
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Links |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิกปุ่ม View Mode "List"

**Expected Results:**
- ✅ แสดง Links เป็น List/Table
- ✅ แสดงข้อมูล: Slug, URL, Status, Clicks, Created

---

#### LINK-041: View Mode - Grid
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Links |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิกปุ่ม View Mode "Grid"

**Expected Results:**
- ✅ แสดง Links เป็น Card Grid
- ✅ แต่ละ Card แสดงข้อมูลพื้นฐาน

---

#### LINK-042: Search Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Links |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. พิมพ์ค้นหาใน Search box: `marketing`

**Expected Results:**
- ✅ กรอง Links ที่ match
- ✅ แสดงเฉพาะ Links ที่เกี่ยวข้อง

---

#### LINK-043: Filter by Status
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Links หลาย Status |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก Status Filter
3. เลือก "Active"

**Expected Results:**
- ✅ แสดงเฉพาะ Active Links
- ✅ Filter badge แสดงผล

---

#### LINK-044: Filter by Tags
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Links พร้อม Tags |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก Tag Filter
3. เลือก Tag "Marketing"

**Expected Results:**
- ✅ แสดงเฉพาะ Links ที่มี Tag นั้น
- ✅ Tag badge แสดงผล

---

### 3.6 Link Selection & Actions

#### LINK-050: Select Multiple Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มีหลาย Links |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก Checkbox ของ Link หลายตัว

**Expected Results:**
- ✅ Links ถูกเลือก
- ✅ Bulk Action Bar แสดงขึ้น
- ✅ แสดงจำนวนที่เลือก

---

#### LINK-051: Select All Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มีหลาย Links |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก "Select All" Checkbox

**Expected Results:**
- ✅ ทุก Links ถูกเลือก
- ✅ Bulk Action Bar แสดงขึ้น

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| Create Link | ✅ | ✅ | ✅ | ❌ |
| Edit Link | ✅ | ✅ | ✅ | ❌ |
| Delete Link | ✅ | ✅ | ✅ | ❌ |
| Change Status | ✅ | ✅ | ✅ | ❌ |
| View Links | ✅ | ✅ | ✅ | ✅ |
| Search/Filter | ✅ | ✅ | ✅ | ✅ |
| Copy Short URL | ✅ | ✅ | ✅ | ✅ |

---

## ✅ Test Result

**Test Date:** 2025-12-10
**Tester:** UAT Lead (Claude Code)
**Environment:** localhost:3010 (Web), localhost:3011 (API)
**Test Account:** e2e-owner@pingtome.test

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| LINK-001 | Create - Random Slug | **PASS** | Link created with auto-generated random slug. Success message "Link Created!" shown. |
| LINK-002 | Create - Custom Slug | **PASS** | Custom slug `uat-custom-{timestamp}` created successfully. Appears in short URL. |
| LINK-003 | Create - Invalid URL | **PASS** | Validation error "Please enter a valid URL" shown. Form submission blocked. |
| LINK-004 | Create - Duplicate Slug | **PASS** | Error "Slug already taken" shown. Duplicate prevented correctly. |
| LINK-005 | Create - With Tags | **PASS** | Tags input in Link Details section. Accepts comma-separated values. |
| LINK-006 | Create - With Expiration | **PASS** | Expiration in Advanced Settings. Uses datetime-local input. Works correctly. |
| LINK-007 | Create - Password Protected | **PASS** | Password field in Advanced Settings. Successfully set password protection. |
| LINK-008 | Create - UTM Parameters | **PASS** | UTM fields (Source, Medium, Campaign) in Advanced Settings. Appended to destination URL. |
| LINK-010 | Edit - Open Modal | **PASS** | Edit modal opens via pencil icon on hover. Shows current link data. |
| LINK-011 | Edit - Destination URL | **PASS** | URL updated to new-destination.com. Changes persisted after save. |
| LINK-012 | Edit - Title & Tags | **PASS** | Title and tags updated successfully. Changes visible after reopen. |
| LINK-013 | Edit - Validation Error | **PASS** | Empty URL shows "Please enter a valid URL". Save blocked, modal stays open. |
| LINK-020 | Status - Disable | **PASS** | Link disabled via 3-dot menu. "Disabled" badge shown. Persists on reload. |
| LINK-021 | Status - Enable | **PASS** | Disabled link restored via "Enable link" option. Badge removed. |
| LINK-022 | Status - Archive | **PASS** | Link archived successfully. Visible in archived filter view. |
| LINK-030 | Delete Link | **PASS** | Link deleted with confirmation. Success toast "Link deleted successfully". |
| LINK-040 | View - List Mode | **PASS** | 3-button toggle (List/Table/Grid). Card layout with all link info. |
| LINK-041 | View - Grid Mode | **PASS** | Responsive 3-column grid layout. Clean card design. |
| LINK-042 | Search Links | **PASS** | Real-time search filtering. Instant results as you type. |
| LINK-043 | Filter by Status | **PASS** | Dropdown: All/Active/Disabled/Expired/Archived. Works correctly. |
| LINK-044 | Filter by Tags | **PASS** | Advanced filters modal with Tags, Link Type, QR Code filters. |
| LINK-050 | Select Multiple | **PASS** | **FIXED** - Select All checkbox in toolbar, checkboxes on link cards. Bulk Action Bar appears with count. |
| LINK-051 | Select All | **PASS** | **FIXED** - Select All checkbox toggles all links. Bulk Action Bar shows selected count and actions. |

### Summary
- **Total Tests:** 23
- **Passed:** 23 (100%)
- **Not Implemented:** 0
- **Failed:** 0

### Notes
1. **Create Link Form Structure:**
   - Link Details (default open): URL, slug, title, tags
   - Sharing Options (default open): QR code, bio page
   - Advanced Settings (collapsed): expiration, password, UTM
2. **View Modes:** List, Table, Grid - 3 options available
3. **Status Management:** Full support for Disable/Enable/Archive via context menu
4. **Bulk Selection:** **IMPLEMENTED** - Select All checkbox in toolbar, individual checkboxes on cards, Bulk Action Bar with count and actions
5. **Duplicate Detection:** System also detects duplicate URLs (bonus feature)

### Round 2 - 2025-12-12 (Bulk Selection Fix)

**LINK-050 & LINK-051 FIXED:**
- Added Select All checkbox in toolbar with proper styling
- Added `toggleSelectAll()` method to LinksTableRef interface
- Added `onLinksCountChange` callback to track total links
- Bulk Action Bar shows selected count with actions (Delete, Add Tag, Move to Folder, etc.)
- Only visible for OWNER/ADMIN/EDITOR roles (RBAC enforced)
- Commit: `696edf6 feat(web): add bulk selection checkboxes to links page`

