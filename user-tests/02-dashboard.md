# 📊 02 - Dashboard Testing

## ภาพรวม
ทดสอบหน้า Dashboard หลักของระบบ รวมถึงการแสดง Metrics, Recent Activity, Date Filters และ Quick Actions

---

## 📝 Test Cases

### 2.1 Dashboard Overview

#### DASH-001: แสดง Metrics หลัก
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบ
2. ไปที่หน้า `/dashboard`

**Expected Results:**
- ✅ แสดงการ์ด "Total Links" พร้อมจำนวน
- ✅ แสดงการ์ด "Total Clicks" พร้อมจำนวน
- ✅ แสดงการ์ด "Recent Clicks" หรือ "Active Links"
- ✅ แสดง % การเปลี่ยนแปลงจากช่วงก่อนหน้า (ถ้ามี)

---

#### DASH-002: แสดง Recent Activity
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Links ในระบบ |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard`
2. ดูส่วน "Recent Activity" หรือ "Your Links"

**Expected Results:**
- ✅ แสดงรายการ Links ล่าสุด
- ✅ แสดงข้อมูล: Slug, Original URL, Status, Clicks
- ✅ สามารถคลิกเพื่อดูรายละเอียดได้

---

#### DASH-003: ใช้งาน Date Range Filter
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard`
2. คลิกปุ่ม "Last 7 Days" หรือ Date Range Selector
3. เลือก "Last 30 Days"

**Expected Results:**
- ✅ ปุ่มแสดงสถานะ Active
- ✅ Metrics อัพเดตตามช่วงเวลาที่เลือก
- ✅ Chart/Graph แสดงข้อมูลของช่วงเวลาที่เลือก

**Date Range Options:**
- Last 7 Days
- Last 30 Days
- Last 90 Days
- Custom Range

---

#### DASH-004: แสดง Top Performing Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Links พร้อม Clicks |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard`
2. ดูส่วน "Top Performing Links"

**Expected Results:**
- ✅ แสดงรายการ Links ที่มี Clicks มากที่สุด
- ✅ เรียงลำดับจากมากไปน้อย
- ✅ แสดงจำนวน Clicks ของแต่ละ Link

---

#### DASH-005: ใช้งาน Quick Actions
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard`
2. คลิกปุ่ม "Create Link" หรือ Quick Action อื่นๆ

**Expected Results:**
- ✅ Quick Action buttons แสดงผล
- ✅ คลิก "Create Link" → ไปหน้าสร้าง Link ใหม่
- ✅ คลิก "View All" → ไปหน้ารายการ Links

---

### 2.2 Dashboard Widgets

#### DASH-006: แสดง Browsers Chart
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Click data |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard`
2. ดูส่วน "Browsers" หรือ Widget แสดง Browser stats

**Expected Results:**
- ✅ แสดง Chart ประเภท Browser
- ✅ แสดง % การใช้งานแต่ละ Browser (Chrome, Safari, Firefox, etc.)

---

#### DASH-007: แสดง OS Chart
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Click data |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard`
2. ดูส่วน "Operating Systems" Widget

**Expected Results:**
- ✅ แสดง Chart ประเภท OS
- ✅ แสดง % การใช้งานแต่ละ OS (Windows, macOS, iOS, Android, etc.)

---

#### DASH-008: แสดง Engagements Chart
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Click data |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard`
2. ดูส่วน "Engagements" Chart (Line/Area chart)

**Expected Results:**
- ✅ แสดง Time Series Chart ของ Clicks
- ✅ แสดงข้อมูลตาม Date Range ที่เลือก
- ✅ Hover แสดงรายละเอียด

---

### 2.3 Empty States

#### DASH-009: Dashboard ว่าง (ไม่มี Links)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, ไม่มี Links |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบด้วย Account ที่ไม่มี Links
2. ไปที่หน้า `/dashboard`

**Expected Results:**
- ✅ แสดง Empty State Message
- ✅ แสดงปุ่ม "Create your first link" หรือ CTA
- ✅ Metrics แสดง 0

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| View Metrics | ✅ | ✅ | ✅ | ✅ |
| View Recent Activity | ✅ | ✅ | ✅ | ✅ |
| Date Range Filter | ✅ | ✅ | ✅ | ✅ |
| Top Performing Links | ✅ | ✅ | ✅ | ✅ |
| Quick Actions (Create) | ✅ | ✅ | ✅ | ❌ |
| View Widgets | ✅ | ✅ | ✅ | ✅ |

> **Note:** VIEWER ไม่สามารถสร้าง Link ได้ ปุ่ม Quick Action อาจไม่แสดงหรือ Disabled

---

## ✅ Test Result

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| DASH-001 | View Metrics | | |
| DASH-002 | Recent Activity | | |
| DASH-003 | Date Range Filter | | |
| DASH-004 | Top Performing Links | | |
| DASH-005 | Quick Actions | | |
| DASH-006 | Browsers Chart | | |
| DASH-007 | OS Chart | | |
| DASH-008 | Engagements Chart | | |
| DASH-009 | Empty Dashboard | | |

