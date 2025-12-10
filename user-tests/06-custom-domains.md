# 🌐 06 - Custom Domains Testing

## ภาพรวม
ทดสอบการจัดการ Custom Domains รวมถึงการเพิ่ม, Verify, ลบ Domains และการจัดการ SSL

---

## 📝 Test Cases

### 6.1 Add Custom Domain

#### DOM-001: เพิ่ม Custom Domain
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN |
| **Test Data** | Domain: `links.mycompany.com` |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`
2. คลิกปุ่ม "Add Domain"
3. กรอก Domain: `links.mycompany.com`
4. คลิกปุ่ม "Add"

**Expected Results:**
- ✅ Domain ถูกเพิ่มในรายการ
- ✅ Status แสดงเป็น "Pending Verification"
- ✅ แสดง DNS Records ที่ต้องตั้งค่า

---

#### DOM-002: แสดง DNS Configuration
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เพิ่ม Domain แล้ว |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ดูรายละเอียดของ Pending Domain
2. ดู DNS Records

**Expected Results:**
- ✅ แสดง CNAME Record ที่ต้องตั้งค่า
- ✅ แสดง TXT Record สำหรับ verification (ถ้ามี)
- ✅ มีปุ่ม Copy สำหรับแต่ละ Record

---

### 6.2 Domain Verification

#### DOM-010: Verify Domain สำเร็จ
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ตั้งค่า DNS Records เรียบร้อย |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`
2. คลิกปุ่ม "Verify" บน Pending Domain

**Expected Results:**
- ✅ Verification สำเร็จ
- ✅ Status เปลี่ยนเป็น "Verified"
- ✅ Domain พร้อมใช้งาน

---

#### DOM-011: Verify Domain ไม่สำเร็จ
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | DNS Records ไม่ถูกต้องหรือยังไม่ propagate |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`
2. คลิกปุ่ม "Verify" บน Domain ที่ DNS ไม่ถูกต้อง

**Expected Results:**
- ✅ แสดง Error message "DNS records not found"
- ✅ Status ยังคงเป็น "Pending"
- ✅ แนะนำให้รอ DNS propagation

---

### 6.3 Domain Management

#### DOM-020: Set Default Domain
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Verified Domain |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`
2. คลิก Menu (⋮) บน Domain
3. เลือก "Set as Default"

**Expected Results:**
- ✅ Domain ถูกตั้งเป็น Default
- ✅ แสดง "Default" badge
- ✅ Links ใหม่จะใช้ Domain นี้

---

#### DOM-021: Search and Filter Domains
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มีหลาย Domains |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`
2. พิมพ์ค้นหาใน Search box
3. กรอง Status: Verified/Pending

**Expected Results:**
- ✅ แสดงผลตามการค้นหา
- ✅ Filter ทำงานถูกต้อง

---

#### DOM-022: ลบ Domain
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Domain (ไม่ใช่ Default) |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`
2. คลิก Menu (⋮) บน Domain
3. เลือก "Remove"
4. ยืนยันการลบ

**Expected Results:**
- ✅ Domain ถูกลบ
- ✅ ไม่แสดงในรายการ
- ✅ Links ที่ใช้ Domain นี้จะกลับไปใช้ Default

---

### 6.4 SSL Management

#### DOM-030: SSL Certificate Provisioning
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | Domain Verified |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ดู Domain ที่ Verified
2. ตรวจสอบ SSL Status

**Expected Results:**
- ✅ SSL Certificate ถูก Provision อัตโนมัติ
- ✅ แสดง SSL Status: "Active" หรือ "Provisioning"
- ✅ แสดง Expiry Date

---

#### DOM-031: View SSL Details
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี SSL Certificate |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิกดูรายละเอียด Domain
2. ดู SSL Certificate Info

**Expected Results:**
- ✅ แสดง Issuer
- ✅ แสดง Issue Date
- ✅ แสดง Expiry Date
- ✅ แสดง Auto-Renewal Status

---

#### DOM-032: SSL Auto-Renewal
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี SSL Certificate |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ตรวจสอบ Auto-Renewal Toggle

**Expected Results:**
- ✅ Auto-Renewal เปิดใช้งาน (Default)
- ✅ สามารถ Toggle On/Off ได้
- ✅ แสดง Next Renewal Date (ถ้าเปิด)

---

### 6.5 Domain Usage

#### DOM-040: ใช้ Custom Domain กับ Link
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Verified Custom Domain |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. สร้าง Link ใหม่
2. เลือก Custom Domain จาก dropdown

**Expected Results:**
- ✅ Short URL แสดงเป็น Custom Domain
- ✅ Link redirect ทำงานผ่าน Custom Domain

---

### 6.6 RBAC for Domains

#### DOM-050: VIEWER ไม่สามารถเพิ่ม Domain
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบด้วย VIEWER |
| **Role** | VIEWER |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`
2. พยายามเพิ่ม Domain

**Expected Results:**
- ✅ ปุ่ม "Add Domain" ไม่แสดง หรือ Disabled
- ✅ ไม่สามารถจัดการ Domains ได้

---

#### DOM-051: EDITOR ไม่สามารถจัดการ Domain
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบด้วย EDITOR |
| **Role** | EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`
2. พยายามเพิ่ม/ลบ/verify Domain

**Expected Results:**
- ✅ สามารถดู Domains ได้
- ✅ ไม่สามารถเพิ่ม/ลบ/แก้ไขได้
- ✅ Management buttons ไม่แสดง

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| View Domains | ✅ | ✅ | ✅ | ✅ |
| Add Domain | ✅ | ✅ | ❌ | ❌ |
| Verify Domain | ✅ | ✅ | ❌ | ❌ |
| Remove Domain | ✅ | ✅ | ❌ | ❌ |
| Set Default | ✅ | ✅ | ❌ | ❌ |
| Manage SSL | ✅ | ✅ | ❌ | ❌ |
| Use Custom Domain (Links) | ✅ | ✅ | ✅ | ❌ |

---

## ✅ Test Result

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| DOM-001 | Add Custom Domain | | |
| DOM-002 | DNS Configuration | | |
| DOM-010 | Verify - Success | | |
| DOM-011 | Verify - Failure | | |
| DOM-020 | Set Default Domain | | |
| DOM-021 | Search & Filter | | |
| DOM-022 | Remove Domain | | |
| DOM-030 | SSL Provisioning | | |
| DOM-031 | SSL Details | | |
| DOM-032 | SSL Auto-Renewal | | |
| DOM-040 | Use Custom Domain | | |
| DOM-050 | VIEWER Access | | |
| DOM-051 | EDITOR Access | | |

