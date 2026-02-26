import * as z from "zod";

export const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: "กรุณากรอกอีเมลที่ถูกต้อง" }),
});

export const ResetPasswordSchema = z.object({
    password: z.string().min(6, { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }),
    confirmPassword: z.string().min(1, { message: "กรุณายืนยันรหัสผ่าน" }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
});

export const LoginSchema = z.object({
    email: z.string().email({
        message: "กรุณากรอกอีเมลที่ถูกต้อง",
    }),
    password: z.string().min(1, {
        message: "กรุณากรอกรหัสผ่าน",
    }),
});

export const RegisterSchema = z.object({
    fullName: z.string().min(1, { message: "กรุณากรอกชื่อ-นามสกุล" }),
    email: z.string()
        .email({ message: "กรุณากรอกอีเมลที่ถูกต้อง" })
        .refine((v) => v.toLowerCase().endsWith("@nu.ac.th"), {
            message: "ต้องใช้อีเมลมหาวิทยาลัยนเรศวร (@nu.ac.th) เท่านั้น",
        }),
    password: z.string().min(6, { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }),
    confirmPassword: z.string().min(1, { message: "กรุณายืนยันรหัสผ่าน" }),
    scholarshipId: z.string().min(1, { message: "กรุณาเลือกทุนการศึกษา" }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
});

export const MAJOR_OPTIONS = [
    "คณิตศาสตร์",
    "เคมี",
    "ชีววิทยา",
    "ฟิสิกส์",
    "วิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ",
] as const;

export const DEGREE_LEVEL_OPTIONS = ["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"] as const;

export const ProfileSchema = z.object({
    fullName: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
    nickname: z.string().optional(),
    studentIdCode: z.string().min(1, "กรุณากรอกรหัสนิสิต"),
    major: z.enum(MAJOR_OPTIONS).optional().or(z.literal("")),
    faculty: z.string().optional(),
    degreeLevel: z.enum(DEGREE_LEVEL_OPTIONS).optional().or(z.literal("")),
    phone: z.string().optional(),
    backupEmail: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
    address: z.string().optional(),
    profileImageUrl: z.string().optional(),
});

export const AchievementSchema = z.object({
    type: z.enum(["ACTIVITY", "PUBLICATION", "COMPETITION", "PATENT", "PROJECT", "AWARD", "OTHER"], { required_error: "กรุณาเลือกประเภทผลงาน/กิจกรรม" }),
    title: z.string().min(1, "กรุณากรอกชื่อผลงาน"),
    description: z.string().optional(),
    date: z.string().optional(),
    coAuthors: z.string().optional(),
    referenceUrl: z.string().url("รูปแบบ URL ไม่ถูกต้อง").optional().or(z.literal("")),
    attachmentUrl: z.string().optional(),
    attachmentName: z.string().optional(),
    attachmentSize: z.number().optional(),
    attachmentType: z.string().optional(),
});

export const ReportSchema = z.object({
    milestoneId:   z.string().optional(),
    academicYear:  z.string().min(4, "กรุณาระบุปีการศึกษา (พ.ศ.)"),
    semester:      z.string().min(1, "กรุณาเลือกภาคเรียน"),
    summary:       z.string().min(10, "กรุณากรอกสรุปความคืบหน้าอย่างน้อย 10 ตัวอักษร"),
    attachmentUrl:  z.string().optional(),
    attachmentName: z.string().optional(),
    attachmentSize: z.number().optional(),
    attachmentType: z.string().optional(),
});


export const MilestoneSchema = z.object({
    id:              z.string().optional(),
    title:           z.string().min(1, "กรุณาระบุชื่อรายงาน"),
    description:     z.string().optional(),
    targetYearLevel: z.coerce.number().min(1, "กรุณาระบุปีการศึกษา").max(6),
    targetSemester:  z.string().min(1, "กรุณาเลือกภาคเรียน"),
    orderIndex:      z.coerce.number().default(0),
});

export const ScholarshipSchema = z.object({
    name: z.string().min(1, "กรุณาระบุชื่อทุนการศึกษา"),
    description: z.string().optional(),
    active: z.boolean().default(true),
    minGpa:  z.union([z.literal(""), z.coerce.number().min(0, "GPA ต้องไม่ต่ำกว่า 0").max(4, "GPA ต้องไม่เกิน 4.00")]).optional(),
    minGpax: z.union([z.literal(""), z.coerce.number().min(0, "GPAX ต้องไม่ต่ำกว่า 0").max(4, "GPAX ต้องไม่เกิน 4.00")]).optional(),
    milestones: z.array(MilestoneSchema).optional(),
});

export const AcademicRecordSchema = z.object({
    academicYear:   z.string().min(4, "กรุณาระบุปีการศึกษา (พ.ศ.)"),
    semester:       z.string().min(1, "กรุณาเลือกภาคเรียน"),
    gpa:            z.coerce.number().min(0, "GPA ต้องไม่ต่ำกว่า 0").max(4, "GPA ต้องไม่เกิน 4.00"),
    gpax:           z.coerce.number().min(0, "GPAX ต้องไม่ต่ำกว่า 0").max(4, "GPAX ต้องไม่เกิน 4.00"),
    transcriptUrl:  z.string().url("URL ไม่ถูกต้อง").optional().or(z.literal("")),
    transcriptName: z.string().optional(),
    transcriptSize: z.number().optional(),
    transcriptType: z.string().optional(),
});

export const DocumentSchema = z.object({
    title: z.string().min(1, "กรุณาระบุชื่อเอกสาร"),
    category: z.string().min(1, "กรุณาระบุหมวดหมู่"),
    scholarshipScope: z.enum(["ALL", "SPECIFIC"]),
    scholarshipId: z.string().nullable().optional(),
    fileUrl: z.string().url("URL ของไฟล์ไม่ถูกต้อง"),
    fileName: z.string().min(1, "กรุณาระบุชื่อไฟล์"),
    fileSizeBytes: z.number().min(1, "ขนาดไฟล์ไม่ถูกต้อง"),
    mimeType: z.string().min(1, "ประเภทไฟล์ไม่ถูกต้อง"),
    isPublished: z.boolean().default(false),
});
