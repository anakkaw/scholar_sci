-- ============================================================
-- Enable Row Level Security (RLS) for all application tables
-- ============================================================
-- หมายเหตุ: โปรเจกต์นี้ใช้ Prisma server-side ผ่าน postgres role
-- ซึ่ง bypass RLS โดยอัตโนมัติ → การเปิด RLS จึงไม่กระทบการทำงาน
-- แต่ช่วยปิดกั้น direct Supabase client access (anon/authenticated role)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- USER & AUTH TABLES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "User"                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailVerificationToken"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken"         ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- STUDENT & SCHOLARSHIP TABLES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "StudentProfile"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Scholarship"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReportMilestone"            ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- ACTIVITY TABLES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "Achievement"                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MandatoryActivity"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MandatoryActivityParticipation"     ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- REPORT & ACADEMIC TABLES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "ProgressReport"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AcademicRecord"             ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- DOCUMENT & ATTACHMENT TABLES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "EvidenceAttachment"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document"                   ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- AUDIT TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "AuditLog"                   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================
-- ทุก table ปิด direct access จาก anon/authenticated role
-- (การเข้าถึงทั้งหมดผ่าน Prisma server-side เท่านั้น)
-- postgres role / service_role bypass RLS โดยอัตโนมัติ
-- ============================================================

-- User
CREATE POLICY "block_public_access" ON "User"
  FOR ALL TO anon, authenticated USING (false);

-- Account
CREATE POLICY "block_public_access" ON "Account"
  FOR ALL TO anon, authenticated USING (false);

-- EmailVerificationToken
CREATE POLICY "block_public_access" ON "EmailVerificationToken"
  FOR ALL TO anon, authenticated USING (false);

-- PasswordResetToken
CREATE POLICY "block_public_access" ON "PasswordResetToken"
  FOR ALL TO anon, authenticated USING (false);

-- StudentProfile
CREATE POLICY "block_public_access" ON "StudentProfile"
  FOR ALL TO anon, authenticated USING (false);

-- Scholarship
CREATE POLICY "block_public_access" ON "Scholarship"
  FOR ALL TO anon, authenticated USING (false);

-- ReportMilestone
CREATE POLICY "block_public_access" ON "ReportMilestone"
  FOR ALL TO anon, authenticated USING (false);

-- Achievement
CREATE POLICY "block_public_access" ON "Achievement"
  FOR ALL TO anon, authenticated USING (false);

-- MandatoryActivity
CREATE POLICY "block_public_access" ON "MandatoryActivity"
  FOR ALL TO anon, authenticated USING (false);

-- MandatoryActivityParticipation
CREATE POLICY "block_public_access" ON "MandatoryActivityParticipation"
  FOR ALL TO anon, authenticated USING (false);

-- ProgressReport
CREATE POLICY "block_public_access" ON "ProgressReport"
  FOR ALL TO anon, authenticated USING (false);

-- AcademicRecord
CREATE POLICY "block_public_access" ON "AcademicRecord"
  FOR ALL TO anon, authenticated USING (false);

-- EvidenceAttachment
CREATE POLICY "block_public_access" ON "EvidenceAttachment"
  FOR ALL TO anon, authenticated USING (false);

-- Document
CREATE POLICY "block_public_access" ON "Document"
  FOR ALL TO anon, authenticated USING (false);

-- AuditLog
CREATE POLICY "block_public_access" ON "AuditLog"
  FOR ALL TO anon, authenticated USING (false);
