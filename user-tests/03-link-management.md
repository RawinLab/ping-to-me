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

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| LINK-001 | Create - Random Slug | | |
| LINK-002 | Create - Custom Slug | | |
| LINK-003 | Create - Invalid URL | | |
| LINK-004 | Create - Duplicate Slug | | |
| LINK-005 | Create - With Tags | | |
| LINK-006 | Create - With Expiration | | |
| LINK-007 | Create - Password Protected | | |
| LINK-008 | Create - UTM Parameters | | |
| LINK-010 | Edit - Open Modal | | |
| LINK-011 | Edit - Destination URL | | |
| LINK-012 | Edit - Title & Tags | | |
| LINK-013 | Edit - Validation Error | | |
| LINK-020 | Status - Disable | | |
| LINK-021 | Status - Enable | | |
| LINK-022 | Status - Archive | | |
| LINK-030 | Delete Link | | |
| LINK-040 | View - List Mode | | |
| LINK-041 | View - Grid Mode | | |
| LINK-042 | Search Links | | |
| LINK-043 | Filter by Status | | |
| LINK-044 | Filter by Tags | | |
| LINK-050 | Select Multiple | | |
| LINK-051 | Select All | | |

