# دليل المستخدم | User Manual
## SanadFlow Study Hub v3.0

---

# المحتويات | Contents

1. [البدء | Getting Started](#1-البدء--getting-started)
2. [الأحاديث | Hadiths](#2-الأحاديث--hadiths)
3. [السبورة البيضاء | Whiteboard](#3-السبورة-البيضاء--whiteboard)
4. [التعاون | Collaboration](#4-التعاون--collaboration)
5. [أسئلة شائعة | FAQ](#5-أسئلة-شائعة--faq)

---

## 1. البدء | Getting Started

### Data Import
To populate the database with sample Hadiths:

```bash
# Run the import script
npx tsx scripts/import-sample-data.ts
```

This will:
1. Ensure a test user and workspace exist
2. Import 5 sample Hadiths from `data/sample-hadiths.csv`

### إنشاء حساب |
**العربية:**
1. اذهب إلى صفحة التسجيل
2. أدخل بريدك الإلكتروني وكلمة المرور
3. اضغط "إنشاء حساب"
4. تحقق من بريدك الإلكتروني للتأكيد

**English:**
1. Go to the signup page
2. Enter your email and password
3. Click "Create Account"
4. Check your email for confirmation

### تسجيل الدخول | Logging In

**العربية:**
1. اذهب إلى صفحة تسجيل الدخول
2. أدخل بريدك الإلكتروني وكلمة المرور
3. اضغط "تسجيل الدخول"

**English:**
1. Go to the login page
2. Enter your email and password
3. Click "Sign In"

### لوحة التحكم | Dashboard Overview

**العربية:**
بعد تسجيل الدخول، سترى:
- **خزانة الأحاديث**: عرض جميع الأحاديث
- **السبورة البيضاء**: رسم شجرات الإعراب
- **الإعدادات**: إدارة حسابك

**English:**
After logging in, you'll see:
- **Hadith Library**: View all hadiths
- **Whiteboard**: Draw I'rab trees
- **Settings**: Manage your account

---

## 2. الأحاديث | Hadiths

### إضافة حديث جديد | Adding a New Hadith

**العربية:**
1. اضغط على "إضافة حديث"
2. أدخل نص الحديث بالعربية
3. أضف الترجمة الإنجليزية (اختياري)
4. حدد درجة الحديث (صحيح / حسن / ضعيف)
5. أدخل المصدر (مثال: البخاري 1)
6. اضغط "حفظ"

**English:**
1. Click "Add Hadith"
2. Enter the Arabic text of the hadith
3. Add English translation (optional)
4. Select grading (Sahih / Hasan / Daif)
5. Enter the source (e.g., Bukhari 1)
6. Click "Save"

### البحث في الأحاديث | Searching Hadiths

**العربية:**
- استخدم شريط البحث في أعلى الصفحة
- يمكنك البحث بالعربية أو الإنجليزية
- ستظهر النتائج مباشرة أثناء الكتابة

**English:**
- Use the search bar at the top of the page
- Search works in Arabic and English
- Results appear as you type

### التعديل والحذف | Editing and Deleting

**العربية:**
1. اضغط على الحديث لفتحه
2. اضغط "تعديل" لتغيير المحتوى
3. اضغط "حذف" لإزالة الحديث (سيُنقل إلى المحذوفات)

**English:**
1. Click on a hadith to open it
2. Click "Edit" to modify content
3. Click "Delete" to remove (moves to trash)

---

## 3. السبورة البيضاء | Whiteboard

### رسم شجرة الإعراب | Drawing I'rab Trees

**العربية:**
1. اذهب إلى "السبورة البيضاء"
2. استخدم أداة "النص" لإضافة كلمات عربية
3. استخدم أداة "السهم" للربط بين الكلمات
4. استخدم الألوان لتمييز أنواع الإعراب:
   - 🟢 أخضر: الفاعل
   - 🔵 أزرق: المفعول به
   - 🟡 أصفر: المبتدأ والخبر

**English:**
1. Go to "Whiteboard"
2. Use the "Text" tool to add Arabic words
3. Use the "Arrow" tool to connect words
4. Use colors to distinguish I'rab types:
   - 🟢 Green: Subject (Fa'il)
   - 🔵 Blue: Object (Maf'ul)
   - 🟡 Yellow: Mubtada' and Khabar

### الأدوات المتاحة | Available Tools

| الأداة | Tool | الاستخدام | Usage |
|--------|------|-----------|-------|
| ✏️ قلم | Pencil | رسم حر | Free draw |
| ⬜ مستطيل | Rectangle | إطارات | Boxes |
| ➡️ سهم | Arrow | روابط | Connections |
| 📝 نص | Text | كتابة | Writing |
| 🖼️ صورة | Image | إدراج صور | Insert images |

### تصدير الرسم | Exporting Diagrams

**العربية:**
1. اضغط على قائمة "ملف"
2. اختر "تصدير كصورة PNG"
3. سيتم تحميل الصورة تلقائياً

**English:**
1. Click the "File" menu
2. Select "Export as PNG"
3. The image will download automatically

---

## 4. التعاون | Collaboration

### دعوة أعضاء | Inviting Members

**العربية:**
1. اضغط على "مشاركة" في أعلى الصفحة
2. انسخ رابط الدعوة
3. أرسل الرابط لزملائك
4. يمكنهم الانضمام فوراً بعد تسجيل الدخول

**English:**
1. Click "Share" at the top of the page
2. Copy the invitation link
3. Send the link to your classmates
4. They can join immediately after signing in

### التحرير المتزامن | Real-time Editing

**العربية:**
- يمكن لعدة مستخدمين التعديل في نفس الوقت
- ستظهر مؤشرات زملائك بألوان مختلفة
- التغييرات تُحفظ تلقائياً كل 10 ثوانٍ

**English:**
- Multiple users can edit simultaneously
- Teammates' cursors appear in different colors
- Changes are auto-saved every 10 seconds

### رؤية المؤشرات | Seeing Cursors

**العربية:**
كل مستخدم له لون مؤشر خاص:
- اسم المستخدم يظهر بجانب المؤشر
- يمكنك رؤية ما يكتبه زملاؤك مباشرة

**English:**
Each user has a unique cursor color:
- Username appears next to the cursor
- You can see what teammates are typing live

---

## 5. أسئلة شائعة | FAQ

### كيف أغير اللغة؟ | How do I change language?

**العربية:**
اذهب إلى الإعدادات ← اللغة ← اختر العربية أو الإنجليزية

**English:**
Go to Settings → Language → Select Arabic or English

### كيف أصدّر البيانات؟ | How do I export data?

**العربية:**
اذهب إلى الإعدادات ← تصدير البيانات ← اختر الصيغة (CSV أو JSON)

**English:**
Go to Settings → Export Data → Choose format (CSV or JSON)

### نسيت كلمة المرور | I forgot my password

**العربية:**
1. اضغط "نسيت كلمة المرور" في صفحة الدخول
2. أدخل بريدك الإلكتروني
3. تحقق من بريدك للرابط

**English:**
1. Click "Forgot Password" on login page
2. Enter your email
3. Check email for reset link

### كيف أحذف حسابي؟ | How do I delete my account?

**العربية:**
اذهب إلى الإعدادات ← الخصوصية ← حذف الحساب (لا يمكن التراجع)

**English:**
Go to Settings → Privacy → Delete Account (irreversible)

### أين أجد المساعدة؟ | Where do I get help?

**العربية:**
- راسلنا على: support@sanadflow.app
- انضم لمجموعة واتساب للدعم

**English:**
- Email us at: support@sanadflow.app
- Join our WhatsApp support group

---

## ملاحظات للنص العربي | Arabic Text Notes

> **تلميح**: النظام يدعم الكتابة من اليمين لليسار (RTL) تلقائياً. لا حاجة لأي إعدادات خاصة.

> **Tip**: The system automatically supports Right-to-Left (RTL) text. No special configuration needed.

---

## نموذج استبيان الملاحظات | Feedback Form Template

*استخدم هذا النموذج لإنشاء Google Form*

1. **سهولة الاستخدام** (1-5): كيف تقيم سهولة البدء؟
   - Ease of use (1-5): How easy was it to get started?

2. **جودة النص العربي** (1-5): كيف تقيم الكتابة بالعربية؟
   - Arabic input quality (1-5): How well does Arabic text input work?

3. **السبورة البيضاء** (1-5): ما مدى فائدة السبورة لرسم الإعراب؟
   - Whiteboard usefulness (1-5): How useful is the whiteboard for I'rab diagrams?

4. **المشاكل**: هل واجهت أي مشاكل تقنية؟ (نص حر)
   - Issues encountered: Did you experience any issues? (open text)

5. **الاقتراحات**: ما الميزات التي تود رؤيتها؟ (نص حر)
   - Feature requests: What features would you like to see? (open text)

6. **التوصية (NPS)** (0-10): هل تنصح بالمنصة لزملائك؟
   - Recommendation (NPS) (0-10): Would you recommend this platform?

---

*آخر تحديث | Last Updated: January 2026*
*الإصدار | Version: 3.0*
