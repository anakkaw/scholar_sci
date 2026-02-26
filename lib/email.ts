import nodemailer from "nodemailer";

// Use function to lazily resolve URL (env may be fixed at runtime by auth.ts)
function getAppUrl(): string {
    const raw = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
    if (raw.startsWith("http")) return raw;
    return `https://${raw}`;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "ScholarSci <watcharaponga@nu.ac.th>";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ── Shared email template ────────────────────────────────────────────────────

function emailHtml(heading: string, body: string, buttonText: string, buttonUrl: string, footer: string) {
    return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8" /></head>
<body style="font-family:sans-serif;background:#fefce8;padding:32px;">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #fde68a;">
    <h2 style="color:#92400e;margin-top:0;">${heading}</h2>
    <p style="color:#374151;">สวัสดี,</p>
    <p style="color:#374151;">${body}</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${buttonUrl}"
         style="background:#b45309;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        ${buttonText}
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;">หรือคัดลอก URL ต่อไปนี้ไปวางในเบราว์เซอร์:</p>
    <p style="color:#92400e;font-size:12px;word-break:break-all;">${buttonUrl}</p>
    <hr style="border:none;border-top:1px solid #fde68a;margin:24px 0;" />
    <p style="color:#9ca3af;font-size:12px;margin:0;">${footer}</p>
  </div>
</body>
</html>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: FROM_EMAIL,
        to: email,
        subject: "รีเซ็ตรหัสผ่าน — ScholarSci",
        html: emailHtml(
            "รีเซ็ตรหัสผ่าน",
            "เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่",
            "รีเซ็ตรหัสผ่าน",
            resetUrl,
            `ลิงก์นี้จะหมดอายุใน <strong>1 ชั่วโมง</strong><br />หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้ — บัญชีของคุณยังคงปลอดภัย`,
        ),
    });
}

export async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${getAppUrl()}/verify-email?token=${token}`;
    await transporter.sendMail({
        from: FROM_EMAIL,
        to: email,
        subject: "ยืนยันอีเมลของคุณ — ScholarSci",
        html: emailHtml(
            "ยืนยันอีเมลของคุณ",
            "กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลและเปิดใช้งานบัญชีนิสิตทุนของคุณ",
            "ยืนยันอีเมล",
            verifyUrl,
            `ลิงก์นี้จะหมดอายุใน <strong>24 ชั่วโมง</strong><br />หากคุณไม่ได้สมัครใช้งาน ScholarSci กรุณาเพิกเฉยต่ออีเมลนี้`,
        ),
    });
}
