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

**Test Date:** 2025-12-11
**Tester:** UAT Automation
**Environment:** localhost:3010 (Web), localhost:3011 (API)
**Test Account:** e2e-owner@pingtome.test

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| ORG-001 | Create Organization | **PARTIAL** | Works but via `/dashboard/organization` page, not from org switcher |
| ORG-002 | Edit Organization Details | **NOT_IMPL** | No UI to edit org name/logo; `/dashboard/settings/organization` returns 404 |
| ORG-003 | Edit Timezone | **NOT_IMPL** | No timezone configuration UI; DB field exists but no frontend |
| ORG-004 | Organization Switcher | **NOT_IMPL** | `OrganizationSwitcher.tsx` component exists but NOT integrated into layout |
| FLD-001 | Create Folder | **PASS** | "New Folder" button works, color picker with 10 colors, folder appears in list |
| FLD-002 | View Links in Folder | **PASS** | "View Links" button navigates to `/dashboard/links?folder=[id]` |
| FLD-003 | Move Link to Folder | **NOT_IMPL** | Backend API exists (`POST /folders/:id/links/:linkId`) but no UI |
| FLD-004 | Delete Folder | **PASS** | Trash icon, confirmation dialog, links preserved (moved to root) |
| FLD-005 | Create Nested Folder | **NOT_IMPL** | Backend supports hierarchy (`parentId`, `/folders/tree`) but no UI |
| TAG-001 | Create Tag | **FAIL** | Tag input exists in link form but no visual feedback |
| TAG-002 | Tag Usage Statistics | **NOT_IMPL** | No `/dashboard/tags` page (404); Backend has full stats API |
| TAG-003 | Filter by Tag | **NOT_IMPL** | No tag filter in links page; Backend has autocomplete API |
| TAG-004 | Delete Tag | **NOT_IMPL** | No Tags management page |
| TAG-005 | Merge Duplicate Tags | **NOT_IMPL** | No Tags page; Backend has merge API |
| CMP-001 | Create Campaign | **NOT_IMPL** | No `/dashboard/campaigns` page (404); `CampaignsManager.tsx` exists but unused |
| CMP-002 | Campaign Analytics | **NOT_IMPL** | Backend has `/campaigns/:id/analytics` but no frontend |
| CMP-003 | Assign Link to Campaign | **NOT_IMPL** | No campaign selector in link forms; Backend has `campaignId` on Link |

---

## 📊 Summary

**Total Tests:** 17
**Passed:** 4 (3 full + 1 partial)
**Not Implemented:** 12
**Failed:** 1
**Pass Rate:** 24%

### Key Findings

**Backend vs Frontend Gap:**
Most features have **complete backend implementations** but are **missing frontend UI**:
- `OrganizationSwitcher.tsx` - Fully built but not integrated
- `CampaignsManager.tsx` - Fully built but not integrated
- Tags API - Complete with CRUD, stats, autocomplete, merge
- Folders API - Complete with hierarchy support, link assignment

### What Works
1. ✅ Create Folder (with colors)
2. ✅ View Links in Folder (URL-based filter)
3. ✅ Delete Folder (with confirmation)
4. ✅ Create Organization (via /dashboard/organization page)

### What's Missing (Quick Wins)
1. ❌ Add `OrganizationSwitcher` to dashboard layout header (~30 min)
2. ❌ Create `/dashboard/tags` page using existing API (~4-6 hours)
3. ❌ Create `/dashboard/campaigns` page using existing component (~2-3 hours)
4. ❌ Add link-to-folder assignment UI (~2 hours)

### Screenshots
Located at `/apps/web/screenshots/`:
- `uat-05-01-org-*.png` - Organization tests
- `uat-05-02-fld-*.png` - Folder tests
- `uat-05-03-tag-*.png` - Tag tests
- `uat-05-04-cmp-*.png` - Campaign tests

