# 📦 09 - Bulk Operations Testing

## ภาพรวม
ทดสอบการ Import/Export Links และการดำเนินการ Bulk (Delete, Tag, Status Change)

---

## 📝 Test Cases

### 9.1 Import Links

#### BULK-001: Import Links via CSV
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิกปุ่ม "Import"
3. เลือกไฟล์ CSV ที่มีข้อมูล Links

**CSV Format:**
```csv
originalUrl,slug
https://google.com,google
https://facebook.com,fb
```

4. คลิกปุ่ม "Import Links"

**Expected Results:**
- ✅ Modal แสดง "Import Links from CSV"
- ✅ แสดง Preview ของข้อมูล
- ✅ Import สำเร็จ
- ✅ แสดง Import Report (Success/Failed)

---

#### BULK-002: Import Links - Validation Error
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. Import CSV ที่มี Invalid URLs

**CSV Content:**
```csv
originalUrl
https://valid.com
invalid-url
```

**Expected Results:**
- ✅ แสดง Import Report
- ✅ แสดง Success count และ Failed count
- ✅ แสดง Error details สำหรับ rows ที่ failed
- ✅ Invalid URL แสดง "Invalid URL" error

---

#### BULK-003: Download CSV Template
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Import |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. คลิก "Download Template"

**Expected Results:**
- ✅ Download ไฟล์ CSV Template
- ✅ Template มี Headers ที่ถูกต้อง

---

### 9.2 Export Links

#### BULK-010: Export Links เป็น CSV
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Links ในระบบ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิกปุ่ม "Export"
3. เลือก Format: CSV

**Expected Results:**
- ✅ Download ไฟล์ CSV
- ✅ ไฟล์มีข้อมูล Links ทั้งหมด
- ✅ Columns: originalUrl, slug, shortUrl, status, createdAt, etc.

---

#### BULK-011: Export Filtered Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Links หลาย Status/Tags |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. Filter Links ตาม Tag หรือ Status
2. คลิก "Export"

**Expected Results:**
- ✅ Export เฉพาะ Links ที่ Filter
- ✅ ไฟล์มีเฉพาะข้อมูลที่เลือก

---

### 9.3 Bulk Delete

#### BULK-020: Bulk Delete Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มีหลาย Links |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. เลือก Links หลายตัว (Check boxes)
3. คลิกปุ่ม "Delete Selected"
4. ยืนยันการลบใน Confirm Dialog

**Expected Results:**
- ✅ Links ที่เลือกถูกลบทั้งหมด
- ✅ แสดงจำนวนที่ลบสำเร็จ
- ✅ Links หายจากรายการ

---

#### BULK-021: Bulk Delete - Confirm Dialog
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เลือก Links แล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Links
2. คลิก "Delete Selected"
3. Dialog ปรากฏ
4. คลิก "Cancel"

**Expected Results:**
- ✅ Dialog แสดงจำนวน Links ที่จะลบ
- ✅ คลิก Cancel ปิด Dialog
- ✅ ไม่มี Links ถูกลบ

---

### 9.4 Bulk Tagging

#### BULK-030: Bulk Add Tag
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Links และ Tags |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Links หลายตัว
2. คลิก "Tag Selected"
3. เลือก Tag: `Marketing`
4. คลิก "Add Tag"

**Expected Results:**
- ✅ Dialog "Add Tag to Links" เปิด
- ✅ Tag ถูกเพิ่มให้ทุก Links ที่เลือก
- ✅ แสดงจำนวนที่ Tag สำเร็จ

---

#### BULK-031: Bulk Create New Tag
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เลือก Links แล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Links
2. คลิก "Tag Selected"
3. พิมพ์ Tag ใหม่ที่ไม่เคยมี
4. คลิก "Create and Add"

**Expected Results:**
- ✅ Tag ใหม่ถูกสร้าง
- ✅ Tag ถูกเพิ่มให้ทุก Links ที่เลือก

---

### 9.5 Bulk Status Change

#### BULK-040: Bulk Disable Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Active Links |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Active Links
2. คลิก "Disable Selected"
3. ยืนยัน

**Expected Results:**
- ✅ Links ที่เลือกเปลี่ยนเป็น DISABLED
- ✅ Status badge เปลี่ยน
- ✅ Links ไม่ทำงาน (403 เมื่อเข้า)

---

#### BULK-041: Bulk Enable Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Disabled Links |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Disabled Links
2. คลิก "Enable Selected"
3. ยืนยัน

**Expected Results:**
- ✅ Links ที่เลือกเปลี่ยนเป็น ACTIVE
- ✅ Links ใช้งานได้ปกติ

---

#### BULK-042: Bulk Archive Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Active Links |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Links
2. คลิก "Archive Selected"
3. ยืนยัน

**Expected Results:**
- ✅ Links ที่เลือกเปลี่ยนเป็น ARCHIVED
- ✅ ไม่แสดงใน Active list
- ✅ เข้า Link จะได้ 410 Gone

---

### 9.6 Bulk Move to Folder

#### BULK-050: Move Links to Folder
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Links และ Folders |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Links หลายตัว
2. คลิก "Move to Folder"
3. เลือก Folder ปลายทาง
4. ยืนยัน

**Expected Results:**
- ✅ Links ย้ายไปยัง Folder ที่เลือก
- ✅ แสดงใน Folder นั้น

---

### 9.7 Bulk Action Bar

#### BULK-060: Bulk Action Bar แสดงผล
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เลือก Links แล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Links 1+ ตัว
2. ดู Bulk Action Bar

**Expected Results:**
- ✅ Action Bar แสดงขึ้น
- ✅ แสดงจำนวน Selected
- ✅ แสดงปุ่ม Actions ทั้งหมด

---

#### BULK-061: Clear Selection
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เลือก Links แล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เลือก Links
2. คลิก "Clear Selection" หรือ X

**Expected Results:**
- ✅ ยกเลิกการเลือกทั้งหมด
- ✅ Action Bar หายไป

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| Import Links | ✅ | ✅ | ✅ | ❌ |
| Export Links | ✅ | ✅ | ✅ | ❌ |
| Bulk Delete | ✅ | ✅ | ✅ | ❌ |
| Bulk Tagging | ✅ | ✅ | ✅ | ❌ |
| Bulk Status Change | ✅ | ✅ | ✅ | ❌ |
| Bulk Move | ✅ | ✅ | ✅ | ❌ |

---

## ✅ Test Result

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| BULK-001 | Import via CSV | | |
| BULK-002 | Import Validation Error | | |
| BULK-003 | Download Template | | |
| BULK-010 | Export CSV | | |
| BULK-011 | Export Filtered | | |
| BULK-020 | Bulk Delete | | |
| BULK-021 | Delete Confirm Dialog | | |
| BULK-030 | Bulk Add Tag | | |
| BULK-031 | Create New Tag | | |
| BULK-040 | Bulk Disable | | |
| BULK-041 | Bulk Enable | | |
| BULK-042 | Bulk Archive | | |
| BULK-050 | Move to Folder | | |
| BULK-060 | Action Bar Display | | |
| BULK-061 | Clear Selection | | |

