# ScholarSci

ระบบจัดเก็บประวัติและความก้าวหน้าของนักศึกษาทุน (Scholarship Student Portal & Admin Dashboard)

## เทคโนโลยีที่ใช้ (Tech Stack)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL (with Prisma ORM)
- **Authentication:** NextAuth.js (Credentials + Google OAuth)
- **File Storage:** Supabase Storage (รองรับไฟล์สูงสุด 2MB)

## ความต้องการของระบบ (Prerequisites)
- Node.js 18.17 หรือใหม่กว่า
- PostgreSQL database (สามารถใช้ Supabase, Neon หรือ Local ได้)
- Supabase Project สำหรับ Storage

## การติดตั้งและการเริ่มต้นใช้งาน (Local Setup)

1. **โคลนโปรเจกต์และติดตั้ง Packages**
   ```bash
   npm install
   ```

2. **ตั้งค่า Environment Variables**
   คัดลอกไฟล์ `.env.example` เป็น `.env` และกำหนดค่าต่างๆ ให้ครบถ้วน
   ```bash
   cp .env.example .env
   ```

3. **ตั้งค่าฐานข้อมูล (Database Setup)**
   รันคำสั่ง Prisma เพื่อสร้างตารางและ Seed ข้อมูลเริ่มต้น
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```
   *(หมายเหตุ: บัญชีแอดมินเริ่มต้นคือ `admin@scholarsci.com` / รหัสผ่าน: `admin1234`)*

4. **รันเซิร์ฟเวอร์สำหรับการพัฒนา (Development Server)**
   ```bash
   npm run dev
   ```
   ระบบจะทำงานที่ `http://localhost:3000`

## การตั้งค่า Google OAuth (สำหรับนักศึกษา)
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่
3. ไปที่ **APIs & Services > Credentials**
4. คลิก **Create Credentials > OAuth client ID**
5. เลือก Application type เป็น **Web application**
6. ส่วน **Authorized Authorized redirect URIs** ให้ใส่:
   - `http://localhost:3000/api/auth/callback/google` (สำหรับทดสอบในเครื่อง)
   - `https://your-domain.com/api/auth/callback/google` (สำหรับ Production)
7. นำ `Client ID` และ `Client Secret` ที่ได้ ไปใส่ในไฟล์ `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)

## การตั้งค่า Supabase Storage (สำหรับอัปโหลดไฟล์)
1. ไปที่ [Supabase](https://supabase.com/) และเข้าสู่โปรเจกต์ของคุณ
2. ไปเมนู **Storage** และคลิก **New Bucket**
3. ตั้งชื่อ Bucket ว่า `scholarsci` (เปิดเป็น Public หรือไม่ก็ได้ ขึ้นอยู่กับนโยบาย)
4. ไปที่ **Project Settings > API** เพื่อนำค่า `Project URL`, `anon key` และ `service_role key` มาใส่ใน `.env`
5. กำหนด Storage Policies ให้สิทธิ์การ Insert และ Select ตามที่จำเป็น 

## โครงสร้างระบบคร่าวๆ
- **Student Portal:** `(student)` route group - ติิดตามความก้าวหน้า, พอร์ตโฟลิโอ, ผลงาน, และดาวน์โหลดคู่มือ
- **Admin Portal:** `admin` route group - จัดการผู้ใช้, รายงานภาพรวม, สร้างทุนการศึกษา, อัปโหลดเอกสาร
- **API Endpoints:** การจัดการข้อมูลทั้งหมดใช้ **Next.js Server Actions** (อยู่ในโฟลเดอร์ `/actions`) และมี API สำหรับอัปโหลดไฟล์ที่ `/api/upload`

## สำหรับการนำไปใช้งานจริง (Deployment)
1. โปรเจกต์นี้สามารถนำไป Deploy บน Vercel ได้โดยตรง
2. อย่าลืมตั้งค่า Environment Variables (`.env` ทั้งหมด) บน Vercel Settings ด้วย
3. รันเช็คบิลด์ผ่าน `npm run build` ก่อน Deploy เสมอ
