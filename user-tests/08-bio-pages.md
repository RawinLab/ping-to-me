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

| Test ID | Test Name | PASS/FAIL | Notes |
|---------|-----------|-----------|-------|
| BIO-001 | Create Bio Page | | |
| BIO-002 | Duplicate Slug | | |
| BIO-010 | Edit Title/Description | | |
| BIO-011 | Change Profile Image | | |
| BIO-020 | Change Theme/Layout | | |
| BIO-021 | Change Theme Colors | | |
| BIO-022 | Change Button Style | | |
| BIO-030 | Add Link | | |
| BIO-031 | Edit Link | | |
| BIO-032 | Delete Link | | |
| BIO-033 | Reorder Links | | |
| BIO-040 | Add Social Links | | |
| BIO-050 | View Public Page | | |
| BIO-051 | 404 Page | | |
| BIO-052 | Track Clicks | | |
| BIO-060 | Delete Bio Page | | |

