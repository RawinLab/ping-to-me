# 👤 08 - Bio Pages Testing

## ภาพรวม
ทดสอบการสร้างและจัดการ Bio Pages (Link in Bio) รวมถึงการ Customize Theme และเพิ่ม Links

---

## 📝 Test Cases

### 8.1 Create Bio Page

#### BIO-001: สร้าง Bio Page ใหม่
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | เข้าสู่ระบบแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า `/dashboard/biopages`
2. คลิกปุ่ม "Create Bio Page"
3. กรอก Title: `My Profile`
4. กรอก Slug: `john-doe`
5. คลิกปุ่ม "Create"

**Expected Results:**
- ✅ Bio Page ถูกสร้าง
- ✅ แสดงในรายการ Bio Pages
- ✅ URL: `https://ptm.bio/john-doe`

---

#### BIO-002: สร้าง Bio Page ด้วย Slug ซ้ำ
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page ที่ใช้ Slug นั้นแล้ว |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. สร้าง Bio Page ใหม่
2. ใช้ Slug ที่มีอยู่แล้ว

**Expected Results:**
- ✅ แสดง Error "Slug already taken"
- ✅ ไม่ได้สร้าง Bio Page

---

### 8.2 Edit Bio Page

#### BIO-010: แก้ไข Title และ Description
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้าแก้ไข Bio Page
2. แก้ไข Title: `John Doe - Developer`
3. แก้ไข Description: `Web Developer & Designer`
4. คลิกปุ่ม "Save"

**Expected Results:**
- ✅ ข้อมูลถูกอัพเดต
- ✅ Public page แสดงข้อมูลใหม่

---

#### BIO-011: เปลี่ยน Profile Image
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. คลิก Upload Profile Image
2. เลือกไฟล์รูปภาพ
3. Crop/Adjust (ถ้ามี)
4. บันทึก

**Expected Results:**
- ✅ รูปโปรไฟล์แสดงบน Bio Page
- ✅ รูปถูก Resize อัตโนมัติ

---

### 8.3 Theme Customization

#### BIO-020: เปลี่ยน Theme/Layout
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เข้าแก้ไข Bio Page
2. ไปที่ส่วน Theme
3. เลือก Layout: `Grid` หรือ `Stacked`

**Expected Results:**
- ✅ Preview แสดง Layout ใหม่
- ✅ บันทึกแล้ว Public page เปลี่ยน

**Layout Options:**
- Stacked (Vertical)
- Grid
- Minimal
- Cards

---

#### BIO-021: เปลี่ยนสี Theme
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เข้าแก้ไข Bio Page
2. เลือก Theme Color หรือ Custom Colors
3. บันทึก

**Expected Results:**
- ✅ สี Background/Text เปลี่ยน
- ✅ Preview อัพเดตทันที

---

#### BIO-022: เปลี่ยน Button Style
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เข้าแก้ไข Bio Page
2. เลือก Button Style: `Rounded`, `Square`, `Outline`

**Expected Results:**
- ✅ Style ของ Links Button เปลี่ยน
- ✅ Preview อัพเดตทันที

---

### 8.4 Manage Bio Links

#### BIO-030: เพิ่ม Link ใน Bio Page
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เข้าแก้ไข Bio Page
2. คลิก "Add Link"
3. กรอก Title: `My Website`
4. กรอก URL: `https://example.com`
5. บันทึก

**Expected Results:**
- ✅ Link แสดงใน Bio Page
- ✅ คลิกได้และ Redirect ถูกต้อง

---

#### BIO-031: แก้ไข Bio Link
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Link ใน Bio Page |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. คลิก Edit บน Link
2. เปลี่ยน Title หรือ URL
3. บันทึก

**Expected Results:**
- ✅ Link ถูกอัพเดต
- ✅ Public page แสดงข้อมูลใหม่

---

#### BIO-032: ลบ Bio Link
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Link ใน Bio Page |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. คลิก Delete บน Link
2. ยืนยันการลบ

**Expected Results:**
- ✅ Link หายจาก Bio Page
- ✅ Public page ไม่แสดง Link นั้นแล้ว

---

#### BIO-033: จัดเรียง Links (Reorder)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มีหลาย Links ใน Bio Page |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ลาก Link ไปตำแหน่งใหม่ (Drag & Drop)
2. บันทึก

**Expected Results:**
- ✅ ลำดับ Links เปลี่ยน
- ✅ Public page แสดงตามลำดับใหม่

---

### 8.5 Social Links

#### BIO-040: เพิ่ม Social Links
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. เข้าแก้ไข Bio Page
2. ไปที่ส่วน Social Links
3. เพิ่ม Twitter: `@johndoe`
4. เพิ่ม Instagram: `johndoe`
5. บันทึก

**Expected Results:**
- ✅ Social Icons แสดงบน Bio Page
- ✅ คลิกแล้วไปยัง Social Profile

**Supported Social Platforms:**
- Twitter/X
- Instagram
- Facebook
- LinkedIn
- TikTok
- YouTube
- GitHub

---

### 8.6 Public Bio Page

#### BIO-050: ดู Public Bio Page
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page ที่ Published |
| **Role** | Public (ไม่ต้องล็อกอิน) |

**ขั้นตอนการทดสอบ:**
1. เปิด URL: `https://ptm.bio/{slug}`

**Expected Results:**
- ✅ แสดง Profile Image, Title, Description
- ✅ แสดง Links ทั้งหมด
- ✅ แสดง Social Icons
- ✅ Theme/Layout ตรงกับที่ตั้งค่า

---

#### BIO-051: Bio Page ไม่พบ (404)
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | - |
| **Role** | Public |

**ขั้นตอนการทดสอบ:**
1. เปิด URL: `https://ptm.bio/nonexistent-slug`

**Expected Results:**
- ✅ แสดงหน้า 404
- ✅ แสดงข้อความ "Page not found"

---

#### BIO-052: Track Link Clicks
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page พร้อม Links |
| **Role** | Public |

**ขั้นตอนการทดสอบ:**
1. เปิด Public Bio Page
2. คลิก Link ใดก็ได้

**Expected Results:**
- ✅ Redirect ไปยัง Destination
- ✅ Click ถูกบันทึก (ดูใน Analytics)

---

### 8.7 Delete Bio Page

#### BIO-060: ลบ Bio Page
| รายละเอียด | ค่า |
|------------|-----|
| **Pre-conditions** | มี Bio Page อยู่ |
| **Role** | OWNER, ADMIN, EDITOR |

**ขั้นตอนการทดสอบ:**
1. ไปที่หน้า Bio Pages
2. คลิก Delete บน Bio Page
3. ยืนยันการลบ

**Expected Results:**
- ✅ Bio Page ถูกลบ
- ✅ Public URL แสดง 404

---

## 🔄 RBAC Testing Matrix

| Test Case | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| View Bio Pages | ✅ | ✅ | ✅ | ✅ |
| Create Bio Page | ✅ | ✅ | ✅ | ❌ |
| Edit Bio Page | ✅ | ✅ | ✅ | ❌ |
| Delete Bio Page | ✅ | ✅ | ✅ | ❌ |
| Add/Edit Links | ✅ | ✅ | ✅ | ❌ |
| Customize Theme | ✅ | ✅ | ✅ | ❌ |

---

## ✅ Test Result

### Round 1 - Code Review Testing (2025-12-11)

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| BIO-001 | Create Bio Page | ✅ PASS | Create Page button, form fields, POST API endpoint all working |
| BIO-002 | Duplicate Slug | ⚠️ PARTIAL | Backend validates duplicate, but shows generic error "Failed to save" |
| BIO-010 | Edit Title/Description | ✅ PASS | Form fields, PATCH API, preview updates work |
| BIO-011 | Change Profile Image | ❌ NOT_IMPL | No upload UI or API endpoint - DB field exists but feature incomplete |
| BIO-020 | Change Theme/Layout | ✅ PASS | LayoutSelector works (Stacked/Grid only, not 4 options in spec) |
| BIO-021 | Change Theme Colors | ✅ PASS | 6 presets + custom colors, live preview |
| BIO-022 | Change Button Style | ✅ PASS | Rounded/Square/Pill styles + shadow option |
| BIO-030 | Add Link | ✅ PASS | Select dropdown, POST API, duplicate prevention |
| BIO-031 | Edit Link | ✅ PASS | LinkStyleEditor modal with live preview |
| BIO-032 | Delete Link | ✅ PASS | AlertDialog confirmation, API delete |
| BIO-033 | Reorder Links | ✅ PASS | Drag & drop with @dnd-kit, transaction-based API |
| BIO-040 | Add Social Links | ✅ PASS | 9 platforms (7 required + Email, WhatsApp) |
| BIO-050 | View Public Page | ✅ PASS | All content renders, theme applied |
| BIO-051 | 404 Page | ✅ PASS | NotFoundException handled, friendly 404 UI |
| BIO-052 | Track Clicks | ✅ PASS | Beacon API, rate-limited tracking endpoint |
| BIO-060 | Delete Bio Page | ❌ NOT_IMPL | API DELETE endpoint exists but NO UI button |

### Summary

| Category | Passed | Total | Rate |
|----------|--------|-------|------|
| Create Bio Page | 1.5 | 2 | 75% |
| Edit Bio Page | 1 | 2 | 50% |
| Theme Customization | 3 | 3 | 100% |
| Manage Bio Links | 4 | 4 | 100% |
| Social Links | 1 | 1 | 100% |
| Public Bio Page | 3 | 3 | 100% |
| Delete Bio Page | 0 | 1 | 0% |
| **Total** | **13.5** | **16** | **84%** |

### Issues to Fix

1. **BIO-002 (Error Handling)**
   - Backend uses generic `Error()` instead of NestJS `ConflictException`
   - Frontend shows "Failed to save bio page" instead of "Slug already taken"
   - **Fix**: Update `biopages.service.ts` line 33 and `BioPageBuilder.tsx` error handling

2. **BIO-011 (Profile Image Upload)**
   - Database has `avatarUrl` field but no upload functionality
   - Missing: Upload UI component, API endpoint with FileInterceptor
   - **Fix**: Add AvatarUploader component similar to org logo upload

3. **BIO-020 (Layout Options)**
   - Spec lists 4 layouts: Stacked, Grid, Minimal, Cards
   - Only 2 implemented: Stacked, Grid
   - **Fix**: Add Minimal and Cards layout options to LayoutSelector

4. **BIO-060 (Delete Bio Page)**
   - Backend API `DELETE /biopages/:id` exists and works
   - No delete button in dashboard list or edit page
   - **Fix**: Add delete button with confirmation dialog to bio page cards

