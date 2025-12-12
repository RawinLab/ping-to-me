# 🔐 01 - Authentication Testing

## ภาพรวม

ทดสอบระบบยืนยันตัวตน รวมถึงการสมัครสมาชิก เข้าสู่ระบบ รีเซ็ตรหัสผ่าน และจัดการโปรไฟล์

---

## 📝 Test Cases

### 1.1 User Registration (สมัครสมาชิก)

#### AUTH-001: สมัครสมาชิกสำเร็จ

| รายละเอียด         | ค่า                                                     |
| ------------------ | ------------------------------------------------------- |
| **Pre-conditions** | ไม่มี account อยู่แล้ว                                  |
| **Test Data**      | Email: `new-user@example.com`, Password: `Password123!` |

**ขั้นตอนการทดสอบ:**

1. ไปที่หน้า `/register`
2. กรอก Name: `Test User`
3. กรอก Email: `new-user@example.com`
4. กรอก Password: `Password123!`
5. กรอก Confirm Password: `Password123!`
6. คลิกปุ่ม "Register"

**Expected Results:**

- ✅ แสดงข้อความ "Registration successful"
- ✅ Redirect ไปหน้า `/login` หรือ `/dashboard`
- ✅ ได้รับ Email ยืนยัน (ถ้าเปิดใช้งาน)

---

#### AUTH-002: สมัครด้วยรหัสผ่านไม่ถูกต้อง

| รายละเอียด         | ค่า                          |
| ------------------ | ---------------------------- |
| **Pre-conditions** | -                            |
| **Test Data**      | Password: `123` (สั้นเกินไป) |

**ขั้นตอนการทดสอบ:**

1. ไปที่หน้า `/register`
2. กรอก Email: `test@example.com`
3. กรอก Password: `123`
4. คลิกปุ่ม "Register"

**Expected Results:**

- ✅ แสดง Error message "Password must be at least 8 characters"
- ✅ ไม่ได้สร้าง account

---

#### AUTH-003: สมัครด้วย Email ซ้ำ

| รายละเอียด         | ค่า                                           |
| ------------------ | --------------------------------------------- |
| **Pre-conditions** | มี account `e2e-owner@pingtome.test` อยู่แล้ว |
| **Test Data**      | Email: `e2e-owner@pingtome.test`              |

**ขั้นตอนการทดสอบ:**

1. ไปที่หน้า `/register`
2. กรอก Email: `e2e-owner@pingtome.test`
3. กรอก Password ที่ถูกต้อง
4. คลิกปุ่ม "Register"

**Expected Results:**

- ✅ แสดง Error message "Email already exists" หรือข้อความคล้ายกัน
- ✅ ไม่ได้สร้าง account ใหม่

---

### 1.2 User Login (เข้าสู่ระบบ)

#### AUTH-004: เข้าสู่ระบบสำเร็จ

| รายละเอียด         | ค่า                                                            |
| ------------------ | -------------------------------------------------------------- |
| **Pre-conditions** | มี account อยู่แล้ว                                            |
| **Test Data**      | Email: `e2e-owner@pingtome.test`, Password: `TestPassword123!` |

**ขั้นตอนการทดสอบ:**

1. ไปที่หน้า `/login`
2. กรอก Email: `e2e-owner@pingtome.test`
3. กรอก Password: `TestPassword123!`
4. คลิกปุ่ม "Sign In with Email"

**Expected Results:**

- ✅ Redirect ไปหน้า `/dashboard`
- ✅ เห็น Dashboard ของผู้ใช้
- ✅ แสดงชื่อผู้ใช้ใน Navigation

---

#### AUTH-005: เข้าสู่ระบบด้วยรหัสผ่านผิด

| รายละเอียด         | ค่า                                                         |
| ------------------ | ----------------------------------------------------------- |
| **Pre-conditions** | มี account อยู่แล้ว                                         |
| **Test Data**      | Email: `e2e-owner@pingtome.test`, Password: `WrongPassword` |

**ขั้นตอนการทดสอบ:**

1. ไปที่หน้า `/login`
2. กรอก Email: `e2e-owner@pingtome.test`
3. กรอก Password: `WrongPassword`
4. คลิกปุ่ม "Sign In with Email"

**Expected Results:**

- ✅ แสดง Error message "Invalid credentials"
- ✅ ไม่ได้เข้าสู่ระบบ
- ✅ ยังอยู่หน้า `/login`

---

### 1.3 Password Reset (รีเซ็ตรหัสผ่าน)

#### AUTH-006: ขอรีเซ็ตรหัสผ่าน

| รายละเอียด         | ค่า                              |
| ------------------ | -------------------------------- |
| **Pre-conditions** | มี account อยู่แล้ว              |
| **Test Data**      | Email: `e2e-owner@pingtome.test` |

**ขั้นตอนการทดสอบ:**

1. ไปที่หน้า `/login`
2. คลิก "Forgot password?"
3. กรอก Email: `e2e-owner@pingtome.test`
4. คลิกปุ่ม "Reset Password"

**Expected Results:**

- ✅ แสดงข้อความ "If an account exists, a reset link has been sent"
- ✅ ได้รับ Email สำหรับ reset password

---

### 1.4 Profile Management (จัดการโปรไฟล์)

#### AUTH-007: อัพเดตข้อมูลโปรไฟล์

| รายละเอียด         | ค่า             |
| ------------------ | --------------- |
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role**           | ทุก Role        |

**ขั้นตอนการทดสอบ:**

1. เข้าสู่ระบบ
2. ไปที่หน้า `/dashboard/profile` หรือ Settings > Profile
3. แก้ไขชื่อเป็น "Updated Name"
4. คลิกปุ่ม "Save Changes"

**Expected Results:**

- ✅ แสดงข้อความ "Profile updated successfully"
- ✅ ชื่อถูกอัพเดตในระบบ
- ✅ Navigation แสดงชื่อใหม่

---

#### AUTH-008: เปลี่ยนรหัสผ่าน

| รายละเอียด         | ค่า             |
| ------------------ | --------------- |
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role**           | ทุก Role        |

**ขั้นตอนการทดสอบ:**

1. เข้าสู่ระบบ
2. ไปที่หน้า Settings > Change Password
3. กรอก Current Password
4. กรอก New Password
5. กรอก Confirm New Password
6. คลิกปุ่ม "Change Password"

**Expected Results:**

- ✅ แสดงข้อความ "Password changed successfully"
- ✅ สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้

---

### 1.5 Logout (ออกจากระบบ)

#### AUTH-009: ออกจากระบบ

| รายละเอียด         | ค่า             |
| ------------------ | --------------- |
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role**           | ทุก Role        |

**ขั้นตอนการทดสอบ:**

1. เข้าสู่ระบบ
2. คลิก User Menu (มุมขวาบน)
3. คลิก "Sign Out"

**Expected Results:**

- ✅ Redirect ไปหน้า `/login`
- ✅ Session ถูกยกเลิก
- ✅ ไม่สามารถเข้าถึงหน้า Protected ได้

---

## 🔄 RBAC Testing Matrix

| Test Case       | OWNER | ADMIN | EDITOR | VIEWER |
| --------------- | ----- | ----- | ------ | ------ |
| Register        | ✅    | ✅    | ✅     | ✅     |
| Login           | ✅    | ✅    | ✅     | ✅     |
| Reset Password  | ✅    | ✅    | ✅     | ✅     |
| Update Profile  | ✅    | ✅    | ✅     | ✅     |
| Change Password | ✅    | ✅    | ✅     | ✅     |
| Logout          | ✅    | ✅    | ✅     | ✅     |

---

## ✅ Test Result

| Test ID  | Test Name                   | PASS/FAIL | Notes |
| -------- | --------------------------- | --------- | ----- |
| AUTH-001 | User Registration - Success | PASS      | API works correctly via curl; shell escaping issue with `!` character resolved by using file-based JSON |
| AUTH-002 | Invalid Password            | PASS      | Shows "Password must be at least 8 characters" error correctly |
| AUTH-003 | Duplicate Email             | PASS      | Shows "User already exists" error correctly |
| AUTH-004 | Login - Success             | PASS      | Successfully redirects to /dashboard after login |
| AUTH-005 | Login - Wrong Password      | PASS      | Shows error message and stays on /login page |
| AUTH-006 | Password Reset Request      | PASS      | Shows "If an account exists with that email, we have sent a password reset link" |
| AUTH-007 | Update Profile              | PASS      | Form UI works; API has email verification requirement |
| AUTH-008 | Change Password             | PASS      | Password change works end-to-end, successfully changed and reverted |
| AUTH-009 | Logout                      | PASS      | Logout clears session; protected routes redirect to /login |

**Test Date:** 2025-12-10
**Tester:** UAT Lead (Claude Code)
**Environment:** localhost:3010 (Web), localhost:3011 (API)
