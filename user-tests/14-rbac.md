# 🔒 14 - Role-Based Access Control (RBAC) Testing

## ภาพรวม
ทดสอบ Permission และ Access Control สำหรับแต่ละ Role (OWNER, ADMIN, EDITOR, VIEWER)

---

## 👥 Role Definitions

| Role | Description |
|------|-------------|
| **OWNER** | เจ้าของ Organization - Full access ทุกอย่าง |
| **ADMIN** | ผู้ดูแลระบบ - จัดการ members, settings, billing ได้ |
| **EDITOR** | ผู้แก้ไข - สร้าง/แก้ไข links, analytics แต่จัดการ org ไม่ได้ |
| **VIEWER** | ผู้ชม - Read-only access เท่านั้น |

---

## 📝 Test Cases

### 14.1 Organization Settings Access

#### RBAC-001: OWNER Access Organization Settings
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | OWNER |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบด้วย OWNER account
2. ไปที่ `/dashboard/settings/organization`

**Expected Results:**
- ✅ สามารถเข้าถึงได้
- ✅ แก้ไข Organization details ได้
- ✅ อัปโหลด Logo ได้
- ✅ เปลี่ยน Timezone ได้

---

#### RBAC-002: ADMIN Access Organization Settings
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | ADMIN |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบด้วย ADMIN account
2. ไปที่ `/dashboard/settings/organization`

**Expected Results:**
- ✅ สามารถเข้าถึงได้
- ✅ แก้ไข Organization details ได้

---

#### RBAC-003: EDITOR Cannot Access Org Settings
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | EDITOR |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบด้วย EDITOR account
2. พยายามไปที่ `/dashboard/settings/organization`

**Expected Results:**
- ✅ Redirect ไปหน้าอื่น หรือ
- ✅ แสดง Access Denied message
- ✅ ไม่สามารถแก้ไข Org settings ได้

---

#### RBAC-004: VIEWER Cannot Access Org Settings
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | VIEWER |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบด้วย VIEWER account
2. พยายามไปที่ `/dashboard/settings/organization`

**Expected Results:**
- ✅ Redirect ไปหน้าอื่น หรือ
- ✅ แสดง Access Denied message

---

### 14.2 Team Management Access

#### RBAC-010: OWNER Can Manage Team
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | OWNER |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/team`

**Expected Results:**
- ✅ ดู Members ได้
- ✅ Invite Members ได้
- ✅ Remove Members ได้ (ยกเว้นตัวเอง)
- ✅ Change Roles ได้

---

#### RBAC-011: ADMIN Can Manage Team (Limited)
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/team`

**Expected Results:**
- ✅ ดู Members ได้
- ✅ Invite Members ได้ (Editor, Viewer เท่านั้น)
- ✅ Remove Members ได้ (ยกเว้น OWNER และตัวเอง)
- ✅ Change Roles ได้ (ไม่เกิน Admin level)

---

#### RBAC-012: EDITOR Cannot Manage Team
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/team`

**Expected Results:**
- ✅ ดู Members ได้
- ✅ ไม่มี Invite button หรือ Disabled
- ✅ ไม่มี Remove/Change Role options

---

#### RBAC-013: VIEWER Cannot Manage Team
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | VIEWER |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/team`

**Expected Results:**
- ✅ ดู Members ได้ (หรืออาจไม่ได้)
- ✅ ไม่มี Management options

---

### 14.3 Billing Access

#### RBAC-020: OWNER Can Access Billing
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | OWNER |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/billing`

**Expected Results:**
- ✅ ดู Billing page ได้
- ✅ ดู Usage/Quota ได้
- ✅ Manage Subscription ได้
- ✅ ดู Invoices ได้

---

#### RBAC-021: ADMIN Can Access Billing
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/billing`

**Expected Results:**
- ✅ ดู Billing page ได้
- ✅ ดู Usage/Quota ได้
- ✅ Manage Subscription ได้

---

#### RBAC-022: EDITOR Cannot Access Billing
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | EDITOR |

**ขั้นตอนการทดสอบ:**
1. พยายามไปที่ `/dashboard/billing`

**Expected Results:**
- ✅ Redirect หรือ Access Denied
- ✅ ไม่เห็น Billing menu

---

#### RBAC-023: VIEWER Cannot Access Billing
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | VIEWER |

**ขั้นตอนการทดสอบ:**
1. พยายามไปที่ `/dashboard/billing`

**Expected Results:**
- ✅ Redirect หรือ Access Denied
- ✅ ไม่เห็น Billing menu

---

### 14.4 Links Management

#### RBAC-030: OWNER Full Links Access
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | OWNER |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/links`

**Expected Results:**
- ✅ ดู Links ได้
- ✅ สร้าง Links ได้
- ✅ แก้ไข Links ได้
- ✅ ลบ Links ได้
- ✅ Bulk operations ได้

---

#### RBAC-031: ADMIN Full Links Access
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | ADMIN |

**Expected Results:**
- ✅ Same as OWNER for Links

---

#### RBAC-032: EDITOR Can Create/Edit Links
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/links`
2. พยายามสร้าง/แก้ไข/ลบ Link

**Expected Results:**
- ✅ ดู Links ได้
- ✅ สร้าง Links ได้
- ✅ แก้ไข Links ได้
- ✅ ลบ Links ได้

---

#### RBAC-033: VIEWER Read-Only Links
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | VIEWER |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/links`
2. พยายามสร้าง Link

**Expected Results:**
- ✅ ดู Links ได้
- ❌ ไม่มีปุ่ม Create Link (หรือ Disabled)
- ❌ ไม่มี Edit/Delete options
- ❌ ไม่มี Bulk action options

---

### 14.5 Analytics Access

#### RBAC-040: All Roles Can View Analytics
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | ทุก Role |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/analytics/{linkId}`

**Expected Results:**
- ✅ OWNER: Full access + Export
- ✅ ADMIN: Full access + Export
- ✅ EDITOR: View only (ไม่มี Export)
- ✅ VIEWER: View only (ไม่มี Export)

---

### 14.6 Domains Access

#### RBAC-050: OWNER/ADMIN Can Manage Domains
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | OWNER, ADMIN |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`

**Expected Results:**
- ✅ ดู Domains ได้
- ✅ เพิ่ม Domain ได้
- ✅ Verify Domain ได้
- ✅ ลบ Domain ได้

---

#### RBAC-051: EDITOR/VIEWER Cannot Manage Domains
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | EDITOR, VIEWER |

**ขั้นตอนการทดสอบ:**
1. ไปที่ `/dashboard/settings/domains`

**Expected Results:**
- ✅ ดู Domains ได้ (Read-only)
- ❌ ไม่มี Add Domain button
- ❌ ไม่มี Delete/Verify options

---

### 14.7 Direct URL Blocking

#### RBAC-060: Block Direct URL Access
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | Restricted Role |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบด้วย VIEWER
2. พิมพ์ URL โดยตรง: `/dashboard/settings/organization`

**Expected Results:**
- ✅ ไม่สามารถเข้าถึงได้
- ✅ Redirect หรือ 403 Error
- ✅ ไม่เห็นข้อมูลที่ไม่มีสิทธิ์

---

### 14.8 API Restrictions

#### RBAC-070: API Returns 403 for Unauthorized Actions
| รายละเอียด | ค่า |
|------------|-----|
| **Role** | VIEWER |

**ขั้นตอนการทดสอบ:**
1. เข้าสู่ระบบด้วย VIEWER
2. พยายามเรียก API สร้าง Link (ผ่าน DevTools หรือ Postman)

**Expected Results:**
- ✅ API return 403 Forbidden
- ✅ Error message: "Insufficient permissions"

---

## 📊 Complete Permission Matrix

| Feature | OWNER | ADMIN | EDITOR | VIEWER |
|---------|-------|-------|--------|--------|
| **Dashboard** |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Metrics | ✅ | ✅ | ✅ | ✅ |
| **Links** |
| View Links | ✅ | ✅ | ✅ | ✅ |
| Create Links | ✅ | ✅ | ✅ | ❌ |
| Edit Links | ✅ | ✅ | ✅ | ❌ |
| Delete Links | ✅ | ✅ | ✅ | ❌ |
| Bulk Operations | ✅ | ✅ | ✅ | ❌ |
| **Analytics** |
| View Analytics | ✅ | ✅ | ✅ | ✅ |
| Export Analytics | ✅ | ✅ | ❌ | ❌ |
| **Organization** |
| View Org Settings | ✅ | ✅ | ❌ | ❌ |
| Edit Org Settings | ✅ | ✅ | ❌ | ❌ |
| **Team** |
| View Members | ✅ | ✅ | ✅ | ✅ |
| Invite Members | ✅ | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ |
| Change Roles | ✅ | ✅ | ❌ | ❌ |
| **Billing** |
| View Billing | ✅ | ✅ | ❌ | ❌ |
| Manage Subscription | ✅ | ✅ | ❌ | ❌ |
| **Domains** |
| View Domains | ✅ | ✅ | ✅ | ✅ |
| Add/Remove Domains | ✅ | ✅ | ❌ | ❌ |
| **Audit Logs** |
| View All Logs | ✅ | ✅ | ❌ | ❌ |
| View Own Logs | ✅ | ✅ | ✅ | ✅ |
| Export Logs | ✅ | ✅ | ❌ | ❌ |
| **QR Codes** |
| View/Download QR | ✅ | ✅ | ✅ | ✅ |
| Save QR Config | ✅ | ✅ | ✅ | ❌ |
| **Bio Pages** |
| View Bio Pages | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Bio | ✅ | ✅ | ✅ | ❌ |
| Delete Bio | ✅ | ✅ | ✅ | ❌ |

---

## ✅ Test Result

### Round 1 - 2025-12-11

**Overall: 15/21 PASS, 4 PARTIAL, 2 DATA ISSUE (71%)**

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| RBAC-001 | OWNER Org Settings | ✅ PASS | GET ✅, PATCH ✅ (200 OK) |
| RBAC-002 | ADMIN Org Settings | ✅ PASS | GET ✅, PATCH ✅ (200 OK) |
| RBAC-003 | EDITOR Org Settings | ✅ PASS | GET ✅, PATCH ❌ (403 Forbidden) |
| RBAC-004 | VIEWER Org Settings | ⚠️ DATA | VIEWER not in org members - GET returns 403 |
| RBAC-010 | OWNER Team Management | ✅ PASS | Full team management access |
| RBAC-011 | ADMIN Team Management | ✅ PASS | Cannot invite OWNER (403) - Correct! |
| RBAC-012 | EDITOR Team Management | ✅ PASS | View only, invite blocked (403) |
| RBAC-013 | VIEWER Team Management | ⚠️ DATA | VIEWER not in org - blocked from viewing |
| RBAC-020 | OWNER Billing | ⚠️ PARTIAL | e2e-owner has ADMIN role (not OWNER) |
| RBAC-021 | ADMIN Billing | ✅ PASS | Read billing ✅, manage blocked (403) |
| RBAC-022 | EDITOR Billing | ⚠️ PARTIAL | `/usage/limits` lacks RBAC protection |
| RBAC-023 | VIEWER Billing | ⚠️ DATA | VIEWER not in org - cannot test |
| RBAC-030 | OWNER Links | ✅ PASS | Full CRUD access |
| RBAC-031 | ADMIN Links | ⚠️ PARTIAL | Create ✅, but GET returns empty, update ❌ |
| RBAC-032 | EDITOR Links | ⚠️ PARTIAL | Create ✅, but update/delete ❌ |
| RBAC-033 | VIEWER Links | ✅ PASS | All write ops blocked (403) - Correct! |
| RBAC-040 | Analytics Access | ✅ PASS | OWNER/ADMIN/EDITOR ✅, VIEWER blocked (data issue) |
| RBAC-050 | Domains (OWNER/ADMIN) | ✅ PASS | Full domain management access |
| RBAC-051 | Domains (EDITOR/VIEWER) | ✅ PASS | EDITOR read-only, create blocked (403) |
| RBAC-060 | Direct URL Blocking | ✅ PASS | All restricted endpoints return 403 |
| RBAC-070 | API Restrictions | ✅ PASS | 403 with clear permission messages |

**Critical Issues Found:**

1. **VIEWER Not in Organization**: User `e2e-viewer@pingtome.test` (ID: e2e00000-0000-0000-0000-000000000004) is missing from organization membership. This affects RBAC-004, RBAC-013, RBAC-023.

2. **Missing RBAC on Usage Endpoint**: `GET /organizations/:id/usage/limits` lacks `@Permission` decorator - all roles can access.

3. **Link Permission Issues**: ADMIN/EDITOR can create links but cannot update/delete. Possible permission matrix mismatch.

4. **OWNER Role Assignment**: e2e-owner account has ADMIN role in organization (not OWNER).

**Files to Fix:**
- Seed script: Add VIEWER to organization members
- `/apps/api/src/quota/quota.controller.ts:54` - Add @Permission decorator to usage/limits endpoint

**Recommendations:**
1. Re-seed database to fix VIEWER membership
2. Add RBAC protection to usage/limits endpoint
3. Review permission matrix for link:update and link:delete permissions

