# 🏢 05 - Organization Testing

## ภาพรวม
ทดสอบการจัดการ Organization รวมถึงการสร้าง แก้ไข Organization, การจัดการ Folders, Tags และ Campaigns

---

## 📝 Test Cases

### 5.1 Organization CRUD

#### ORG-001: สร้าง Organization ใหม่
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | ทุก Role (สามารถสร้าง Org ใหม่ได้) |

**ขั้นตอนการทดสอบ:**
1. คลิก Organization Switcher (มุมซ้ายบน)
2. คลิก "Create Organization"
3. กรอก Organization Name: `My New Org`
4. คลิกปุ่ม "Create"

**Expected Results:**
- ✅ Organization ถูกสร้าง
- ✅ Switch ไปยัง Organization ใหม่
- ✅ แสดงใน Organization Switcher

---

#### ORG-002: แก้ไข Organization Details
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, เป็น OWNER หรือ ADMIN |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/organization`
2. แก้ไข Organization Name
3. เพิ่ม/เปลี่ยน Logo
4. คลิกปุ่ม "Save"

**Expected Results:**
- ✅ ข้อมูลถูกอัพเดต
- ✅ Logo แสดงใน Switcher
- ✅ แสดงข้อความ Success

---

#### ORG-003: แก้ไข Timezone
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เป็น OWNER หรือ ADMIN |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/organization`
2. เปลี่ยน Timezone เป็น `Asia/Bangkok`
3. คลิกปุ่ม "Save"

**Expected Results:**
- ✅ Timezone ถูกอัพเดต
- ✅ เวลาในระบบแสดงตาม Timezone ใหม่

---

#### ORG-004: Organization Switcher
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี 2+ Organizations |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. คลิก Organization Switcher
2. เลือก Organization อื่น

**Expected Results:**
- ✅ Switch ไปยัง Organization ที่เลือก
- ✅ แสดง Links ของ Organization นั้น
- ✅ Dashboard แสดงข้อมูลของ Organization ที่เลือก

---

### 5.2 Folder Management

#### FLD-001: สร้าง Folder
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Links หรือ Folders
2. คลิก "Create Folder"
3. กรอกชื่อ: `Work Links`
4. เลือกสี
5. คลิกปุ่ม "Create"

**Expected Results:**
- ✅ Folder ถูกสร้าง
- ✅ แสดงในรายการ Folders
- ✅ แสดงสีที่เลือก

---

#### FLD-002: ดู Links ใน Folder
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Folder พร้อม Links |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. คลิกเลือก Folder จาก Sidebar หรือ Filter
2. ดูรายการ Links

**Expected Results:**
- ✅ แสดงเฉพาะ Links ใน Folder นั้น
- ✅ Folder name แสดงเป็น Active

---

#### FLD-003: ย้าย Link ไป Folder
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Link และ Folder |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Link ที่ต้องการย้าย
2. คลิก "Move to Folder"
3. เลือก Folder ปลายทาง

**Expected Results:**
- ✅ Link ถูกย้ายไป Folder
- ✅ Link แสดงใน Folder ใหม่

---

#### FLD-004: ลบ Folder
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Folder (ว่างหรือมี Links) |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. คลิกขวา Folder หรือ Menu
2. เลือก "Delete"
3. ยืนยันการลบ

**Expected Results:**
- ✅ Folder ถูกลบ
- ✅ Links ใน Folder ย้ายไป Root หรือถูกลบ (ตาม policy)

---

#### FLD-005: สร้าง Nested Folder (Sub-folder)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Parent Folder |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. คลิกขวา Parent Folder
2. เลือก "Create Sub-folder"
3. กรอกชื่อ Sub-folder
4. คลิก "Create"

**Expected Results:**
- ✅ Sub-folder ถูกสร้างภายใต้ Parent
- ✅ แสดง Hierarchy ถูกต้อง

---

### 5.3 Tag Management

#### TAG-001: สร้าง Tag
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Tags หรือ Settings > Tags
2. คลิก "Create Tag"
3. กรอกชื่อ: `Marketing`
4. เลือกสี
5. คลิกปุ่ม "Create"

**Expected Results:**
- ✅ Tag ถูกสร้าง
- ✅ สามารถใช้ Tag กับ Links ได้

---

#### TAG-002: ดู Tag Usage Statistics
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Tags พร้อม Links |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Tags
2. ดูรายการ Tags

**Expected Results:**
- ✅ แสดงจำนวน Links ในแต่ละ Tag
- ✅ แสดง Usage statistics

---

#### TAG-003: Filter Links by Tag
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Links พร้อม Tags |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Links
2. คลิก Tag Filter
3. เลือก Tag: `Marketing`

**Expected Results:**
- ✅ แสดงเฉพาะ Links ที่มี Tag นั้น
- ✅ Filter badge แสดงผล

---

#### TAG-004: ลบ Tag
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Tag |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Tags
2. คลิก Delete บน Tag
3. ยืนยันการลบ

**Expected Results:**
- ✅ Tag ถูกลบ
- ✅ Links ที่เคยมี Tag นี้จะไม่มีอีกต่อไป

---

#### TAG-005: Merge Duplicate Tags
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Tags ซ้ำกัน (เช่น "marketing", "Marketing") |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Tags
2. เลือก Tags ที่ต้องการ Merge
3. คลิก "Merge Tags"
4. เลือก Tag ที่จะเก็บไว้

**Expected Results:**
- ✅ Tags ถูกรวมเป็นหนึ่ง
- ✅ Links ทั้งหมดอยู่ภายใต้ Tag ใหม่

---

### 5.4 Campaign Management

#### CMP-001: สร้าง Campaign
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Campaigns
2. คลิก "Create Campaign"
3. กรอกชื่อ: `Summer Sale 2024`
4. เลือก Start/End Date
5. คลิกปุ่ม "Create"

**Expected Results:**
- ✅ Campaign ถูกสร้าง
- ✅ สามารถ assign Links ไปยัง Campaign ได้

---

#### CMP-002: ดู Campaign Analytics
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Campaign พร้อม Links |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Campaigns
2. คลิกเลือก Campaign
3. ดู Analytics

**Expected Results:**
- ✅ แสดง Total Clicks ของทุก Links ใน Campaign
- ✅ แสดง Performance metrics
- ✅ แสดง Date range ของ Campaign

---

#### CMP-003: Assign Link to Campaign
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Link และ Campaign |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. สร้างหรือแก้ไข Link
2. เลือก Campaign จาก dropdown

**Expected Results:**
- ✅ Link ถูก assign ไปยัง Campaign
- ✅ แสดง Campaign badge บน Link

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| Create Organization | ✅ | ✅ | ✅ | ✅ |
| Edit Organization | ✅ | ✅ | ❌ | ❌ |
| Organization Switcher | ✅ | ✅ | ✅ | ✅ |
| Create Folder | ✅ | ✅ | ✅ | ❌ |
| Delete Folder | ✅ | ✅ | ✅ | ❌ |
| Create Tag | ✅ | ✅ | ✅ | ❌ |
| Delete Tag | ✅ | ✅ | ✅ | ❌ |
| Merge Tags | ✅ | ✅ | ❌ | ❌ |
| Create Campaign | ✅ | ✅ | ✅ | ❌ |
| View Campaigns | ✅ | ✅ | ✅ | ✅ |

---

## ✅ Test Result

**Test Date:** 2025-12-11 (Updated)
**Tester:** UAT Automation + Manual Verification
**Environment:** localhost:3010 (Web), localhost:3001 (API)
**Test Account:** e2e-owner@pingtome.test

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| ORG-001 | Create Organization | **PASS** | ✅ Now works via OrganizationSwitcher in header + `/dashboard/organization` page |
| ORG-002 | Edit Organization Details | **PASS** | ✅ `/dashboard/settings/organization` with name, logo upload |
| ORG-003 | Edit Timezone | **PASS** | ✅ Timezone dropdown in Organization Settings page |
| ORG-004 | Organization Switcher | **PASS** | ✅ OrganizationSwitcher integrated into dashboard layout header |
| FLD-001 | Create Folder | **PASS** | "New Folder" button works, color picker with 10 colors, folder appears in list |
| FLD-002 | View Links in Folder | **PASS** | "View Links" button navigates to `/dashboard/links?folder=[id]` |
| FLD-003 | Move Link to Folder | **PASS** | ✅ MoveLinkToFolderDialog added to LinksTable with folder selection dropdown |
| FLD-004 | Delete Folder | **PASS** | Trash icon, confirmation dialog, links preserved (moved to root) |
| FLD-005 | Create Nested Folder | **PASS** | ✅ Tree hierarchy with expand/collapse, create sub-folder in folder menu |
| TAG-001 | Create Tag | **PASS** | ✅ `/dashboard/tags` page with full CRUD, color picker (10 colors) |
| TAG-002 | Tag Usage Statistics | **PASS** | ✅ Tags page shows link count per tag, statistics from backend API |
| TAG-003 | Filter by Tag | **PASS** | ✅ FiltersModal now has Tag, Campaign, and Folder filters |
| TAG-004 | Delete Tag | **PASS** | ✅ Delete button with confirmation dialog on Tags page |
| TAG-005 | Merge Duplicate Tags | **PASS** | ✅ Merge feature with source/target tag selection on Tags page |
| CMP-001 | Create Campaign | **PASS** | ✅ `/dashboard/campaigns` page with full CRUD, dates, UTM params, goals |
| CMP-002 | Campaign Analytics | **PASS** | ✅ `/dashboard/campaigns/[id]/analytics` with charts, tables, export |
| CMP-003 | Assign Link to Campaign | **PASS** | ✅ Campaign selector dropdown added to Link creation form |

---

## 📊 Summary

**Total Tests:** 17
**Passed:** 17 (100%)
**Not Implemented:** 0
**Failed:** 0
**Pass Rate:** 100% → **Improved from 82% → 65% → 24%**

### Key Findings - Updated 2025-12-11

**Implemented Features (This Session):**
1. ✅ **OrganizationSwitcher** - Now integrated into dashboard layout header
2. ✅ **Tags Management Page** (`/dashboard/tags`) - Full CRUD with colors, merge, statistics
3. ✅ **Campaigns Management Page** (`/dashboard/campaigns`) - Full CRUD with dates, UTM, goals
4. ✅ **Sidebar Navigation** - Tags and Campaigns added to dashboard sidebar
5. ✅ **Campaign/Folder Selectors** - Added to Link creation form
6. ✅ **Move Link to Folder** - MoveLinkToFolderDialog with folder color indicators
7. ✅ **Enhanced Filters** - Campaign and Folder filters added to FiltersModal
8. ✅ **Organization Settings** - Edit name, logo, timezone at `/dashboard/settings/organization`
9. ✅ **Nested Folders** - Tree hierarchy with expand/collapse, create sub-folders
10. ✅ **Campaign Analytics** - Full analytics page with charts and export

### What Works Now
1. ✅ Create Folder (with colors)
2. ✅ View Links in Folder (URL-based filter)
3. ✅ Delete Folder (with confirmation)
4. ✅ **Move Link to Folder** - Dialog from link menu
5. ✅ **Nested Folders** - Tree view with sub-folders
6. ✅ Create Organization (via OrganizationSwitcher + /dashboard/organization)
7. ✅ **Organization Switcher** - Switch between orgs, create new org
8. ✅ **Edit Organization** - Name, logo, timezone settings
9. ✅ **Create/Edit/Delete Tags** - Full tag management with colors
10. ✅ **Tag Statistics** - View link count per tag
11. ✅ **Merge Tags** - Merge duplicate tags
12. ✅ **Filter by Tag/Campaign/Folder** - FiltersModal with all filters
13. ✅ **Create/Edit/Delete Campaigns** - Full campaign management
14. ✅ **Campaign Status** - Draft/Active/Paused/Completed with badges
15. ✅ **UTM Parameters** - Campaign-level UTM configuration
16. ✅ **Assign Link to Campaign** - Campaign selector in link form
17. ✅ **Assign Link to Folder** - Folder selector in link form
18. ✅ **Campaign Analytics** - Full analytics with charts, tables, export

### All Features Complete!
Module 05 Organization Testing is now 100% complete.

### Screenshots
Located at `/apps/web/screenshots/`:
- `uat-tags-*.png` - Tags management page tests
- `uat-campaigns-*.png` - Campaigns management page tests
- `uat-org-switcher-*.png` - Organization switcher tests

