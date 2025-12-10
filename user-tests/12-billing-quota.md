# 💳 12 - Billing & Quota Testing

## ภาพรวม
ทดสอบระบบ Billing, Plans, Usage Quota และ Subscription Management

---

## 📝 Test Cases

### 12.1 View Plans

#### QPM-001: ดู Available Plans
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | - |
| **Role** | Public / All Roles |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/pricing`

**Expected Results:**
- ✅ แสดง Plan Cards (Free, Pro, Enterprise)
- ✅ แสดงราคาของแต่ละ Plan
- ✅ แสดง Features/Limits ของแต่ละ Plan

**Plans:**
| Plan | Price | Links/Month | Custom Domains | Team Members |
|------|-------|-------------|----------------|--------------|
| Free | $0 | 50 | 1 | 1 |
| Pro | $9/mo | Unlimited | 10 | 5 |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

---

#### QPM-002: ดู Plan Features
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Pricing |
| **Role** | Public |

**ขั้นตอนการทดสอบ:**
1. ดูรายละเอียด Features ของแต่ละ Plan

**Expected Results:**
- ✅ Free: 50 links/month, 1 custom domain, 1 member
- ✅ Pro: Unlimited links, 10 custom domains, 5 members
- ✅ Enterprise: Unlimited everything

---

#### QPM-003: ดู Pricing Information
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Pricing |
| **Role** | Public |

**ขั้นตอนการทดสอบ:**
1. ดูราคาของแต่ละ Plan

**Expected Results:**
- ✅ Free: แสดง "Free"
- ✅ Pro: แสดง "$9/month"
- ✅ Enterprise: แสดง "Contact Sales"

---

### 12.2 Usage Dashboard

#### QPM-010: ดู Current Usage
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/billing`

**Expected Results:**
- ✅ แสดง Usage Dashboard
- ✅ แสดง "Links this month" พร้อม Progress Bar
- ✅ แสดง "Custom domains" พร้อม Progress Bar
- ✅ แสดง "Team members" พร้อม Progress Bar
- ✅ แสดง "API calls" พร้อม Progress Bar

---

#### QPM-011: Progress Bars แสดงผล
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Usage data |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ดู Progress Bars บน Usage Dashboard

**Expected Results:**
- ✅ Progress Bar แสดง % การใช้งาน
- ✅ สีเปลี่ยนตาม % (เขียว < 80%, เหลือง 80-99%, แดง 100%)
- ✅ แสดง "Used / Limit" numbers

---

#### QPM-012: Unlimited Resources แสดงถูกต้อง
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เป็น Pro user |
| **Role** | OWNER, ADMIN (Pro plan) |

**ขั้นตอนการทดสอบ:**
1. ดู Usage ของ Pro plan

**Expected Results:**
- ✅ Links แสดง "Unlimited" badge
- ✅ ไม่แสดง Progress Bar สำหรับ Unlimited items
- ✅ แสดงจำนวน Used แต่ไม่มี Limit

---

### 12.3 Quota Enforcement

#### QPM-020: ถูกบล็อกเมื่อเกิน Quota
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | Free user, ใช้ 50 links แล้ว |
| **Role** | Free plan users |

**ขั้นตอนการทดสอบ:**
1. พยายามสร้าง Link ใหม่เมื่อถึง Limit

**Expected Results:**
- ✅ แสดง Error "Quota limit exceeded"
- ✅ ไม่สามารถสร้าง Link ได้
- ✅ แนะนำให้ Upgrade

---

#### QPM-021: API Calls Quota
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ใช้ API calls ถึง Limit |
| **Role** | Free plan users |

**ขั้นตอนการทดสอบ:**
1. เรียก API เมื่อถึง API calls limit

**Expected Results:**
- ✅ API return 429 (Too Many Requests)
- ✅ Error message แจ้ง quota exceeded

---

### 12.4 Usage Alerts

#### QPM-030: Warning ที่ 80% Usage
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | Usage >= 80% |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ใช้งานจนถึง 80%+ ของ Limit
2. ดูหน้า Billing

**Expected Results:**
- ✅ แสดง Warning Alert
- ✅ แสดง "Almost full" badge
- ✅ Progress Bar สีเหลือง

---

#### QPM-031: Error ที่ 100% Usage
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | Usage = 100% |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ใช้งานจนถึง 100% ของ Limit
2. ดูหน้า Billing

**Expected Results:**
- ✅ แสดง Error Alert
- ✅ แสดง "Limit reached" badge
- ✅ Progress Bar สีแดง
- ✅ แสดงปุ่ม Upgrade

---

### 12.5 Subscription Management

#### QPM-040: ดู Current Subscription
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Active Subscription |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/billing`

**Expected Results:**
- ✅ แสดง Current Plan (Free/Pro)
- ✅ แสดง Status: "Active"
- ✅ แสดง Renewal/Expiry Date (สำหรับ Pro)

---

#### QPM-041: Free User เห็น Upgrade CTA
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เป็น Free user |
| **Role** | OWNER, ADMIN (Free plan) |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Billing

**Expected Results:**
- ✅ แสดงปุ่ม "Upgrade to Pro"
- ✅ แสดง Benefits ของ Pro plan

---

#### QPM-042: Pro User เห็น Manage Billing
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เป็น Pro user |
| **Role** | OWNER, ADMIN (Pro plan) |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Billing

**Expected Results:**
- ✅ แสดงปุ่ม "Manage Billing"
- ✅ คลิกแล้ว Redirect ไป Stripe Portal (หรือ Billing provider)

---

### 12.6 Billing History

#### QPM-050: ดู Billing History
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Payment history |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Billing
2. ดู Billing History section

**Expected Results:**
- ✅ แสดงตาราง Invoices
- ✅ Columns: Date, Amount, Status
- ✅ แสดง "Paid" status badge

---

#### QPM-051: Download Invoice
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Invoice |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก Download icon บน Invoice

**Expected Results:**
- ✅ Download ไฟล์ PDF
- ✅ Invoice มีข้อมูลครบถ้วน

---

### 12.7 Plan Comparison

#### QPM-060: Feature Comparison Table
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Pricing |
| **Role** | Public |

**ขั้นตอนการทดสอบ:**
1. ดูตาราง Feature Comparison

**Expected Results:**
- ✅ แสดง Comparison Table
- ✅ แสดง Features ในแต่ละ Row
- ✅ แสดง Check/X สำหรับ แต่ละ Plan

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| View Pricing (Public) | ✅ | ✅ | ✅ | ✅ |
| View Usage Dashboard | ✅ | ✅ | ❌ | ❌ |
| View Billing History | ✅ | ✅ | ❌ | ❌ |
| Manage Subscription | ✅ | ✅ | ❌ | ❌ |
| Download Invoices | ✅ | ✅ | ❌ | ❌ |

---

## ✅ Test Result

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| QPM-001 | View Available Plans | | |
| QPM-002 | View Plan Features | | |
| QPM-003 | View Pricing | | |
| QPM-010 | View Current Usage | | |
| QPM-011 | Progress Bars | | |
| QPM-012 | Unlimited Resources | | |
| QPM-020 | Quota Block | | |
| QPM-021 | API Quota | | |
| QPM-030 | 80% Warning | | |
| QPM-031 | 100% Error | | |
| QPM-040 | View Subscription | | |
| QPM-041 | Free User Upgrade CTA | | |
| QPM-042 | Pro User Manage Billing | | |
| QPM-050 | Billing History | | |
| QPM-051 | Download Invoice | | |
| QPM-060 | Feature Comparison | | |

