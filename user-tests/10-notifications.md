# 🔔 10 - Notifications Testing

## ภาพรวม
ทดสอบระบบ Notifications รวมถึง In-App Notifications, Mark as Read และ Settings

---

## 📝 Test Cases

### 10.1 In-App Notifications

#### NOTIF-001: แสดง Notification Badge
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Unread Notifications |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบ
2. ดู Navigation Bar

**Expected Results:**
- ✅ Bell Icon แสดงอยู่
- ✅ Badge แสดงจำนวน Unread
- ✅ Badge สีแดงหรือเด่นชัด

---

#### NOTIF-002: เปิด Notification Dropdown
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Notifications |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. คลิก Bell Icon

**Expected Results:**
- ✅ Dropdown เปิดขึ้น
- ✅ แสดงรายการ Notifications
- ✅ แสดง Title, Message, Time
- ✅ Unread items มีสไตล์ต่างจาก Read

---

#### NOTIF-003: ดู Notification Types
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Notifications หลายประเภท |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ดูรายการ Notifications

**Expected Results:**
- ✅ แสดง INFO notifications (สีฟ้า)
- ✅ แสดง WARNING notifications (สีเหลือง)
- ✅ แสดง ERROR notifications (สีแดง) ถ้ามี
- ✅ แต่ละประเภทมี Icon/Color ต่างกัน

**Notification Types:**
- INFO: ข้อมูลทั่วไป, Welcome
- WARNING: Link Expired, Quota Near Limit
- ERROR: Payment Failed, Domain Verification Failed

---

### 10.2 Mark as Read

#### NOTIF-010: Mark All as Read
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Unread Notifications |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เปิด Notification Dropdown
2. คลิก "Mark all read"

**Expected Results:**
- ✅ ทุก Notifications เป็น Read
- ✅ Badge หายไป (หรือแสดง 0)
- ✅ ปุ่ม "Mark all read" หายไป

---

#### NOTIF-011: Mark Single as Read
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Unread Notification |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เปิด Notification Dropdown
2. คลิกบน Notification item

**Expected Results:**
- ✅ Notification นั้นเป็น Read
- ✅ Badge count ลดลง 1
- ✅ Style เปลี่ยนเป็น Read state

---

### 10.3 Notification Content

#### NOTIF-020: Link Expired Notification
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Link ที่ Expired |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. สร้าง Link ที่มี Expiration ในอดีต
2. รอหรือ Trigger notification
3. ดู Notifications

**Expected Results:**
- ✅ แสดง "Link Expired" notification
- ✅ แสดงชื่อ/Slug ของ Link
- ✅ Type: WARNING

---

#### NOTIF-021: Welcome Notification
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | User ใหม่ |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. สร้าง Account ใหม่
2. เข้าสู่ระบบ
3. ดู Notifications

**Expected Results:**
- ✅ แสดง "Welcome to PingToMe!" notification
- ✅ Type: INFO

---

#### NOTIF-022: New Team Member Notification
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มีคน Accept Invitation เข้า Org |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. Invite member
2. Member accepts invitation
3. ดู Notifications

**Expected Results:**
- ✅ แสดง "New team member joined" notification
- ✅ แสดงชื่อ Member
- ✅ Type: INFO

---

### 10.4 Notification Settings

#### NOTIF-030: ดู Notification Settings
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings`
2. ดูส่วน Notification Settings

**Expected Results:**
- ✅ แสดง Toggle สำหรับ Email Notifications
- ✅ แสดง Toggle สำหรับ Marketing Emails
- ✅ แสดงค่าปัจจุบัน

---

#### NOTIF-031: Toggle Email Notifications
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Settings |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. Toggle "Email Notifications" Off
2. บันทึก

**Expected Results:**
- ✅ Setting ถูกบันทึก
- ✅ จะไม่ได้รับ Email Notifications

---

#### NOTIF-032: Toggle Marketing Emails
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Settings |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. Toggle "Marketing Emails" Off
2. บันทึก

**Expected Results:**
- ✅ Setting ถูกบันทึก
- ✅ จะไม่ได้รับ Marketing Emails

---

### 10.5 Empty State

#### NOTIF-040: No Notifications
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ไม่มี Notifications |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. เปิด Notification Dropdown เมื่อไม่มี Notifications

**Expected Results:**
- ✅ แสดง Empty State
- ✅ ข้อความ "No notifications" หรือคล้ายกัน
- ✅ ไม่มี Badge บน Bell Icon

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| View Notifications | ✅ | ✅ | ✅ | ✅ |
| Mark as Read | ✅ | ✅ | ✅ | ✅ |
| Notification Settings | ✅ | ✅ | ✅ | ✅ |
| Receive Team Notifications | ✅ | ✅ | ❌ | ❌ |

---

## ✅ Test Result

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| NOTIF-001 | Notification Badge | | |
| NOTIF-002 | Open Dropdown | | |
| NOTIF-003 | Notification Types | | |
| NOTIF-010 | Mark All as Read | | |
| NOTIF-011 | Mark Single as Read | | |
| NOTIF-020 | Link Expired | | |
| NOTIF-021 | Welcome Notification | | |
| NOTIF-022 | New Team Member | | |
| NOTIF-030 | View Settings | | |
| NOTIF-031 | Toggle Email | | |
| NOTIF-032 | Toggle Marketing | | |
| NOTIF-040 | No Notifications | | |

