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

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| AUD-001 | Access Audit Logs | | |
| AUD-002 | View Activity List | | |
| AUD-010 | Filter by Action | | |
| AUD-011 | Filter by Resource | | |
| AUD-012 | Filter by Date Range | | |
| AUD-013 | Filter by Status | | |
| AUD-014 | Search Logs | | |
| AUD-015 | Clear Filters | | |
| AUD-020 | View Log Details | | |
| AUD-021 | Before/After Changes | | |
| AUD-030 | Pagination | | |
| AUD-040 | Export CSV | | |
| AUD-041 | Export JSON | | |
| AUD-042 | Export with Filters | | |
| AUD-050 | OWNER Access | | |
| AUD-051 | ADMIN Access | | |
| AUD-052 | EDITOR Access | | |
| AUD-053 | VIEWER Access | | |
| AUD-054 | Unauthorized | | |

