# 👥 13 - Team Management Testing

## ภาพรวม
ทดสอบการจัดการ Team Members รวมถึงการ Invite, Accept/Decline Invitation, Change Role และ Remove Members

---

## 📝 Test Cases

### 13.1 Invite Members

#### MIR-001: ส่ง Invitation ไปยัง Email ใหม่
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/team`
2. คลิกปุ่ม "Invite Member"
3. กรอก Email: `newmember@example.com`
4. เลือก Role: "Editor"
5. (Optional) เพิ่ม Personal Message
6. คลิก "Send Invitation"

**Expected Results:**
- ✅ Dialog "Invite Team Member" เปิดขึ้น
- ✅ Invitation ถูกส่งสำเร็จ
- ✅ แสดงใน Pending Invitations (ถ้ามี list)
- ✅ Email ถูกส่งไปยังผู้รับ

---

#### MIR-002: ไม่สามารถ Invite Member ที่มีอยู่แล้ว
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | Email นั้นเป็น Member อยู่แล้ว |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก "Invite Member"
2. กรอก Email ของ Member ที่มีอยู่แล้ว
3. คลิก "Send Invitation"

**Expected Results:**
- ✅ แสดง Error "User is already a member"
- ✅ Invitation ไม่ถูกส่ง

---

#### MIR-003: Validate Email Format
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | - |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก "Invite Member"
2. กรอก Email ไม่ถูก Format: `invalid-email`

**Expected Results:**
- ✅ ปุ่ม "Send Invitation" disabled
- ✅ แสดง Validation error

---

#### MIR-004: Role Options ตาม User Role
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | - |
| **Role** | OWNER |

**ขั้นตอนการทดสอบ:**
1. คลิก "Invite Member"
2. ดู Role dropdown

**Expected Results:**
- ✅ OWNER เห็น: Admin, Editor, Viewer
- ✅ ADMIN เห็น: Editor, Viewer
- ✅ ไม่สามารถ invite role สูงกว่าตัวเอง

---

### 13.2 Accept Invitation

#### MIR-010: Accept Invitation (Existing User)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ได้รับ Invitation, มี Account อยู่แล้ว |
| **Role** | - |

**ขั้นตอนการทดสอบ:**
1. เปิด Link จาก Email Invitation
2. (ถ้าต้องล็อกอิน) Login
3. คลิก "Accept Invitation"

**Expected Results:**
- ✅ แสดง Invitation details (Org name, Role, Inviter)
- ✅ แสดง "Logged in as [email]"
- ✅ Accept สำเร็จ
- ✅ Redirect ไป Dashboard ของ Org ใหม่

---

#### MIR-011: Accept Invitation (New User)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ได้รับ Invitation, ไม่มี Account |
| **Role** | - |

**ขั้นตอนการทดสอบ:**
1. เปิด Link จาก Email Invitation
2. แสดง Registration Form
3. กรอก Name, Password, Confirm Password
4. คลิก "Create Account & Join"

**Expected Results:**
- ✅ แสดง Registration Form
- ✅ Account ถูกสร้าง
- ✅ เข้าร่วม Organization สำเร็จ
- ✅ Redirect ไป Dashboard

---

#### MIR-012: Expired Invitation
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | Invitation หมดอายุ |
| **Role** | - |

**ขั้นตอนการทดสอบ:**
1. เปิด Expired Invitation Link

**Expected Results:**
- ✅ แสดง "Invitation Expired" message
- ✅ ไม่สามารถ Accept ได้
- ✅ แนะนำให้ติดต่อ Admin เพื่อขอ Invite ใหม่

---

#### MIR-013: Invalid Invitation Token
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | Token ไม่ถูกต้อง |
| **Role** | - |

**ขั้นตอนการทดสอบ:**
1. เปิด URL `/invitations/invalid-token`

**Expected Results:**
- ✅ แสดง "Invalid Invitation" message
- ✅ ไม่สามารถ Accept ได้

---

#### MIR-014: Already Accepted Invitation
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | Invitation ถูก Accept แล้ว |
| **Role** | - |

**ขั้นตอนการทดสอบ:**
1. เปิด Invitation Link ที่ Accept ไปแล้ว

**Expected Results:**
- ✅ แสดง "Already Accepted" message
- ✅ Link ไป Dashboard

---

### 13.3 Decline Invitation

#### MIR-020: Decline Invitation
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | ได้รับ Invitation |
| **Role** | - |

**ขั้นตอนการทดสอบ:**
1. เปิด Invitation Link
2. คลิก "Decline Invitation"
3. ยืนยันใน Confirm Dialog

**Expected Results:**
- ✅ Dialog ถาม "Are you sure?"
- ✅ Invitation ถูก Decline
- ✅ แสดง "Invitation Declined" message

---

### 13.4 Manage Invitations

#### MIR-030: ดู Pending Invitations
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Pending Invitations |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Team
2. ดูส่วน Pending Invitations

**Expected Results:**
- ✅ แสดงรายการ Pending Invitations
- ✅ แสดง Email, Role, Expires

---

#### MIR-031: Resend Invitation
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Pending Invitation |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก "Resend" บน Pending Invitation

**Expected Results:**
- ✅ Email ถูกส่งใหม่
- ✅ แสดง Success message

---

#### MIR-032: Cancel Invitation
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Pending Invitation |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก "Cancel" บน Pending Invitation
2. ยืนยัน

**Expected Results:**
- ✅ Invitation ถูก Cancel
- ✅ หายจากรายการ
- ✅ Link จะใช้ไม่ได้อีก

---

### 13.5 Member Management

#### MIR-040: ดู Team Members
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Members |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/settings/team`

**Expected Results:**
- ✅ แสดงรายการ Members
- ✅ แสดง Name, Email, Role
- ✅ Current user มี "You" badge

---

#### MIR-041: Remove Member
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Member (ไม่ใช่ตัวเอง, ไม่ใช่ OWNER) |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิกปุ่ม Delete บน Member row
2. ยืนยันใน Confirm Dialog

**Expected Results:**
- ✅ Dialog ถาม "Are you sure?"
- ✅ Member ถูกลบ
- ✅ หายจากรายการ

---

#### MIR-042: ไม่สามารถ Remove OWNER
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | - |
| **Role** | ADMIN |

**ขั้นตอนการทดสอบ:**
1. ดู OWNER row ในรายการ Members

**Expected Results:**
- ✅ ไม่มี Delete button สำหรับ OWNER
- ✅ หรือ Delete button disabled

---

#### MIR-043: ไม่สามารถ Remove ตัวเอง
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | - |
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ดู Row ของตัวเอง (มี "You" badge)

**Expected Results:**
- ✅ ไม่มี Delete button สำหรับตัวเอง
- ✅ หรือมี "Leave Organization" แทน

---

### 13.6 Change Role

#### MIR-050: Change Member Role
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Member |
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. คลิก Role dropdown บน Member row
2. เลือก Role ใหม่

**Expected Results:**
- ✅ Role ถูกเปลี่ยน
- ✅ แสดง Success message
- ✅ Audit Log บันทึก

---

#### MIR-051: ไม่สามารถเปลี่ยน Role ของ OWNER
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | - |
| **Role** | ADMIN |

**ขั้นตอนการทดสอบ:**
1. ดู OWNER row

**Expected Results:**
- ✅ Role dropdown disabled หรือไม่แสดง
- ✅ ไม่สามารถเปลี่ยน Role ของ OWNER

---

### 13.7 Validation

#### MIR-060: Password Validation (New User Registration)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Accept Invitation (New User) |
| **Role** | - |

**ขั้นตอนการทดสอบ:**
1. กรอก Password สั้นเกินไป: `short`
2. คลิก Submit

**Expected Results:**
- ✅ แสดง Error "Password must be at least 8 characters"
- ✅ ไม่สร้าง Account

---

#### MIR-061: Password Mismatch
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | อยู่หน้า Accept Invitation (New User) |
| **Role** | - |

**ขั้นตอนการทดสอบ:**
1. กรอก Password: `Password123!`
2. กรอก Confirm Password: `DifferentPassword!`
3. คลิก Submit

**Expected Results:**
- ✅ แสดง Error "Passwords do not match"
- ✅ ไม่สร้าง Account

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| View Team Members | ✅ | ✅ | ✅ | ✅ |
| Invite Members | ✅ | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ |
| Change Roles | ✅ | ✅ (ไม่เกิน Admin) | ❌ | ❌ |
| Cancel Invitations | ✅ | ✅ | ❌ | ❌ |

---

## ✅ Test Result

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| MIR-001 | Send Invitation | | |
| MIR-002 | Invite Existing Member | | |
| MIR-003 | Email Validation | | |
| MIR-004 | Role Options | | |
| MIR-010 | Accept (Existing User) | | |
| MIR-011 | Accept (New User) | | |
| MIR-012 | Expired Invitation | | |
| MIR-013 | Invalid Token | | |
| MIR-014 | Already Accepted | | |
| MIR-020 | Decline Invitation | | |
| MIR-030 | View Pending | | |
| MIR-031 | Resend Invitation | | |
| MIR-032 | Cancel Invitation | | |
| MIR-040 | View Team Members | | |
| MIR-041 | Remove Member | | |
| MIR-042 | Cannot Remove OWNER | | |
| MIR-043 | Cannot Remove Self | | |
| MIR-050 | Change Role | | |
| MIR-051 | Cannot Change OWNER Role | | |
| MIR-060 | Password Validation | | |
| MIR-061 | Password Mismatch | | |

