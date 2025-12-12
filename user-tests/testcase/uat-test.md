# 📋 PingToMe - User Acceptance Testing (UAT) Guide

## 🎯 ภาพรวม

เอกสารนี้เป็นคู่มือการทดสอบระบบ PingToMe สำหรับผู้ใช้งาน (User Acceptance Testing) ครอบคลุมทุก Feature และทุก Role ของระบบ

## 👥 User Roles

ระบบมี 4 บทบาทหลัก:

| Role       | คำอธิบาย                                        |
| ---------- | ----------------------------------------------- |
| **OWNER**  | เจ้าของ Organization - มีสิทธิ์ทั้งหมด          |
| **ADMIN**  | ผู้ดูแลระบบ - จัดการ members, settings, billing |
| **EDITOR** | ผู้แก้ไข - สร้าง/แก้ไข links, analytics         |
| **VIEWER** | ผู้ชม - ดูข้อมูลได้อย่างเดียว                   |

## 🧑‍💻 Test Accounts

| Role   | Email                      | Password           |
| ------ | -------------------------- | ------------------ |
| OWNER  | `e2e-owner@pingtome.test`  | `TestPassword123!` |
| ADMIN  | `e2e-admin@pingtome.test`  | `TestPassword123!` |
| EDITOR | `e2e-editor@pingtome.test` | `TestPassword123!` |
| VIEWER | `e2e-viewer@pingtome.test` | `TestPassword123!` |

---

## 📚 Test Cases by Feature

ทดสอบตามลำดับดังนี้:

### 1. [Authentication](./01-authentication.md)

- การสมัครสมาชิก
- การเข้าสู่ระบบ
- การรีเซ็ตรหัสผ่าน
- การจัดการโปรไฟล์
- การออกจากระบบ

### 2. [Dashboard](./02-dashboard.md)

- แสดง Metrics
- Recent Activity
- Date Range Filters
- Top Performing Links
- Quick Actions

### 3. [Link Management](./03-link-management.md)

- สร้าง Short Link
- แก้ไข Link
- ลบ Link
- Custom Slug
- Tags & Campaigns
- Expiration & Password Protection
- UTM Parameters
- Link Status Control

### 4. [Link Analytics](./04-link-analytics.md)

- ดู Analytics
- Device Tracking
- Geo-location
- Time Series
- Referrer Tracking
- Export Data

### 5. [Organization](./05-organization.md)

- สร้าง/แก้ไข Organization
- Organization Settings
- Organization Switcher
- Folders
- Tags & Campaigns

### 6. [Custom Domains](./06-custom-domains.md)

- เพิ่ม Custom Domain
- Verify Domain
- ลบ Domain
- SSL Management
- Default Domain

### 7. [QR Codes](./07-qr-codes.md)

- สร้าง QR Code
- Customize QR Code
- Download QR Code
- Save Configuration

### 8. [Bio Pages](./08-bio-pages.md)

- สร้าง Bio Page
- แก้ไข Bio Page
- เพิ่ม/ลบ Links
- Theme Customization
- Public Rendering

### 9. [Bulk Operations](./09-bulk-operations.md)

- Import Links (CSV)
- Export Links
- Bulk Delete
- Bulk Tagging
- Bulk Status Change

### 10. [Notifications](./10-notifications.md)

- In-App Notifications
- Mark as Read
- Notification Settings

### 11. [Audit Logs](./11-audit-logs.md)

- ดู Audit Logs
- Filter Logs
- Export Logs
- RBAC Access

### 12. [Billing & Quota](./12-billing-quota.md)

- ดู Plans
- Usage Dashboard
- Quota Enforcement
- Subscription Management

### 13. [Team Management](./13-team-management.md)

- Invite Members
- Accept/Decline Invitation
- Remove Members
- Change Roles

### 14. [Role-Based Access Control (RBAC)](./14-rbac.md)

- Permission Matrix
- Access Verification
- API Restrictions

---

## ✅ Test Result Template

```markdown
## Test Result Summary

**Tester:** [ชื่อ]
**Date:** [วันที่]
**Environment:** [Production/Staging]
**Role Tested:** [OWNER/ADMIN/EDITOR/VIEWER]

### Results

| Test ID  | Test Name         | Status            | Notes |
| -------- | ----------------- | ----------------- | ----- |
| AUTH-001 | User Registration | ✅ PASS / ❌ FAIL |       |
| ...      | ...               | ...               |       |

### Issues Found

1. [Issue description]
   - Steps to reproduce
   - Expected vs Actual
   - Screenshot (if any)
```

---

## 🔄 Test Execution Order

1. **ทดสอบ Authentication ก่อน** - เพื่อให้สามารถเข้าสู่ระบบได้
2. **ทดสอบ Dashboard** - ตรวจสอบว่าระบบทำงานปกติ
3. **ทดสอบ Link Management** - Feature หลักของระบบ
4. **ทดสอบ Features อื่นๆ** - ตามลำดับในรายการ
5. **ทดสอบ RBAC** - ทดสอบด้วย Role ต่างๆ

---

## 📝 Notes

- ทุกการทดสอบควรทำซ้ำด้วยทุก Role (OWNER, ADMIN, EDITOR, VIEWER) เพื่อตรวจสอบ Permission
- จดบันทึก Screenshot เมื่อพบ Bug
- รายงาน Issue ที่พบทันที

---

_เอกสารนี้สร้างจาก E2E Test Cases ของระบบ_
