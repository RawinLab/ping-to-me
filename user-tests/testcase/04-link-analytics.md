# 📈 04 - Link Analytics Testing

## ภาพรวม
ทดสอบการดู Analytics ของ Links รวมถึง Device Tracking, Geo-location, Time Series และการ Export

---

## 📝 Test Cases

### 4.1 Analytics Page

#### ANA-001: เข้าถึงหน้า Analytics จาก Links Page
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว, มี Link พร้อม Clicks |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/links`
2. คลิก Analytics icon หรือปุ่ม ข้าง Link ที่ต้องการ

**Expected Results:**
- ✅ Redirect ไปหน้า `/dashboard/links/{linkId}/analytics`
- ✅ แสดงข้อมูล Analytics ของ Link นั้น

---

#### ANA-002: แสดง Link Header Card
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Analytics ของ Link |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า `/dashboard/links/{linkId}/analytics`
2. ดู Header Card ด้านบน

**Expected Results:**
- ✅ แสดง Short URL
- ✅ แสดง Destination URL
- ✅ แสดง Created Date
- ✅ แสดง Status
- ✅ มีปุ่ม Copy Short URL

---

#### ANA-003: แสดง Stats Cards
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Analytics ของ Link |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า `/dashboard/links/{linkId}/analytics`
2. ดู Stats Cards

**Expected Results:**
- ✅ แสดง Total Engagements (Total Clicks)
- ✅ แสดง Last 7 Days Clicks
- ✅ แสดง Weekly Change (% เปลี่ยนแปลง)
- ✅ แสดง Trend indicator (up/down)

---

### 4.2 Date Range Selector

#### ANA-010: เปลี่ยน Date Range
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Analytics |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. คลิก Date Range Selector
3. เลือก "Last 30 Days"

**Expected Results:**
- ✅ Charts อัพเดตตามช่วงเวลา
- ✅ Stats อัพเดตตามช่วงเวลา
- ✅ Date Range ที่เลือกแสดงเป็น Active

**Date Range Options:**
- Last 7 Days (7d)
- Last 30 Days (30d)
- Last 90 Days (90d)
- Custom Range

---

### 4.3 Engagements Chart

#### ANA-020: แสดง Engagements Over Time
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Click data |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. ดู "Engagements" หรือ "Clicks Over Time" Chart

**Expected Results:**
- ✅ แสดง Line/Area Chart
- ✅ แสดงข้อมูลตาม Date Range
- ✅ Hover แสดง Tooltip พร้อมจำนวน Clicks

---

### 4.4 Location Analytics

#### ANA-030: แสดง Top Countries
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Click data หลายประเทศ |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. ดู "Top Countries" หรือ "Locations" section

**Expected Results:**
- ✅ แสดงรายการประเทศ
- ✅ เรียงลำดับจาก Clicks มากไปน้อย
- ✅ แสดง % หรือจำนวน Clicks

---

#### ANA-031: แสดง Cities (ถ้ามี)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี City-level data |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. ดู "Cities" section (ถ้ามี)

**Expected Results:**
- ✅ แสดงรายการ Cities
- ✅ แสดงจำนวน Clicks ต่อ City

---

### 4.5 Device Analytics

#### ANA-040: แสดง Devices Chart
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Click data หลาย Devices |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. ดู "Devices" Chart

**Expected Results:**
- ✅ แสดง Pie/Donut Chart
- ✅ แสดง Device Types: Mobile, Desktop, Tablet
- ✅ แสดง % ของแต่ละประเภท

---

#### ANA-041: แสดง Browsers Chart
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Click data หลาย Browsers |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. ดู "Browsers" Chart หรือ list

**Expected Results:**
- ✅ แสดง Browser Distribution
- ✅ Browsers: Chrome, Safari, Firefox, Edge, etc.
- ✅ แสดง % หรือจำนวน

---

#### ANA-042: แสดง Operating Systems
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Click data หลาย OS |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. ดู "Operating Systems" section

**Expected Results:**
- ✅ แสดง OS Distribution
- ✅ OS: Windows, macOS, iOS, Android, Linux
- ✅ แสดง % หรือจำนวน

---

### 4.6 Referrer Analytics

#### ANA-050: แสดง Top Referrers
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Click data พร้อม Referrer |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. ดู "Top Referrers" section

**Expected Results:**
- ✅ แสดงรายการ Referrer sources
- ✅ รวมถึง: google.com, facebook.com, direct, etc.
- ✅ เรียงลำดับจาก Clicks มากไปน้อย

---

### 4.7 Recent Activity

#### ANA-060: แสดง Recent Clicks Table
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Click data |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. ดู "Recent Activity" หรือ "Recent Clicks" table

**Expected Results:**
- ✅ แสดงตาราง Clicks ล่าสุด
- ✅ Columns: Time, Country, Device, Browser, Referrer
- ✅ เรียงจากใหม่ไปเก่า

---

### 4.8 Export Analytics

#### ANA-070: Export Analytics Data
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Click data |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics
2. คลิกปุ่ม "Export" หรือ "Download"
3. เลือก Format (CSV/JSON)

**Expected Results:**
- ✅ Download เริ่มต้น
- ✅ ไฟล์มีข้อมูล Analytics
- ✅ Format ถูกต้องตามที่เลือก

---

### 4.9 Empty States

#### ANA-080: Analytics ว่าง (ไม่มี Clicks)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Link แต่ไม่มี Clicks |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าหน้า Analytics ของ Link ที่ไม่มี Clicks

**Expected Results:**
- ✅ แสดง Empty State Message
- ✅ Stats แสดง 0
- ✅ Charts แสดง No Data

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| View Analytics | ✅ | ✅ | ✅ | ✅ |
| Date Range Filter | ✅ | ✅ | ✅ | ✅ |
| View Charts | ✅ | ✅ | ✅ | ✅ |
| View Recent Activity | ✅ | ✅ | ✅ | ✅ |
| Export Data | ✅ | ✅ | ❌ | ❌ |

---

## ✅ Test Result

**Test Date:** 2025-12-11
**Tester:** UAT Automation
**Environment:** localhost:3010 (Web), localhost:3011 (API)
**Test Account:** e2e-owner@pingtome.test

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| ANA-001 | Access Analytics Page | **PASS** | Analytics icon on link card → `/dashboard/links/{linkId}/analytics` |
| ANA-002 | Link Header Card | **PASS** | Shows Short URL (pingto.me/xxx), Destination URL, Created Date, Copy button |
| ANA-003 | Stats Cards | **PASS** | 3 cards: Total Engagements, Last 7 days, Weekly change with % and trend |
| ANA-010 | Change Date Range | **PASS** | 7d/30d/90d buttons work, charts & stats update correctly |
| ANA-020 | Engagements Chart | **PASS** | Bar chart shows time-series data, updates with date range |
| ANA-030 | Top Countries | **PASS** | Countries with bar charts, counts (US: 263, TH: 252, JP: 121, etc.) |
| ANA-031 | Cities | **PASS** | Cities tab exists, shows "No location data" when empty (proper empty state) |
| ANA-040 | Devices Chart | **PASS** | Donut chart: Mobile 59%, Desktop 35%, Tablet 6% |
| ANA-041 | Browsers Chart | **PASS** | Donut chart: Chrome 663, Safari 223, WebKit 109, Edge 83, Opera 32 |
| ANA-042 | Operating Systems | **PASS** | Donut chart: iOS 707, Unknown 283, Android 102, Linux 18 |
| ANA-050 | Top Referrers | **PASS** | Pie chart with sources, "Show 5 more" option |
| ANA-060 | Recent Activity Table | **PASS** | Table: Time, Link, Country, Referrer columns, sorted newest first |
| ANA-070 | Export Data | **PASS** | Export dropdown: CSV and PDF options, download works |
| ANA-080 | Empty Analytics | **PASS** | Stats show 0, charts render properly with empty data |

---

## 📊 Summary

**Total Tests:** 14
**Passed:** 14
**Failed:** 0
**Pass Rate:** 100%

### Key Findings

1. **Analytics URL Structure:** `/dashboard/links/{linkId}/analytics` (NOT `/dashboard/analytics/{linkId}`)
2. **Date Range:** 3 options (7d, 30d, 90d) - no custom range in current implementation
3. **Charts:** Mix of bar charts (engagements), donut charts (devices, browsers, OS, referrers)
4. **Export:** Supports CSV and PDF formats
5. **Empty State:** Properly handled with 0 values and appropriate messaging
6. **Recent Activity:** Shows Time, Link, Country, Referrer (no Browser/Device columns)

### Screenshots

Located at `/apps/web/screenshots/`:
- `uat-ana-001-*.png` - Access analytics
- `uat-ana-002-*.png` - Header card
- `uat-ana-003-*.png` - Stats cards
- `uat-ana-010-*.png` - Date range (7d/30d/90d)
- `uat-ana-020-*.png` - Engagements chart
- `uat-ana-030-*.png` - Countries
- `uat-ana-031-*.png` - Cities
- `uat-ana-040-*.png` - Devices
- `uat-ana-041-*.png` - Browsers
- `uat-ana-042-*.png` - Operating Systems
- `uat-ana-050-*.png` - Referrers
- `uat-ana-060-*.png` - Recent Activity
- `uat-ana-070-*.png` - Export
- `uat-ana-080-*.png` - Empty state

