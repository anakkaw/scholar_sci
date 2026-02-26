/**
 * In-memory rate limiter (per-process).
 *
 * Note: เหมาะสำหรับ single-instance deployment.
 * หากใช้ multi-instance / serverless ควรเปลี่ยนเป็น Redis (เช่น Upstash)
 * เพื่อให้ rate limit ทำงานร่วมกันข้าม instance ได้
 */

interface Entry {
    count: number;
    resetAt: number;
}

const store = new Map<string, Entry>();

/** Lazy cleanup เพื่อป้องกัน memory leak */
let lastCleanup = Date.now();
function maybeCleanup() {
    const now = Date.now();
    if (now - lastCleanup > 5 * 60_000) {
        for (const [key, entry] of store) {
            if (entry.resetAt < now) store.delete(key);
        }
        lastCleanup = now;
    }
}

/**
 * นับ request และตรวจสอบว่าเกิน limit หรือไม่
 * ใช้กับ: forgot-password, register
 */
export function rateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
): { allowed: boolean; retryAfterSec: number } {
    maybeCleanup();
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSec: 0 };
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
        return {
            allowed: false,
            retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
        };
    }

    return { allowed: true, retryAfterSec: 0 };
}

/**
 * ตรวจสอบว่า key ถูก lock อยู่หรือไม่ โดยไม่เพิ่ม counter
 * ใช้ก่อนประมวลผล login เพื่อ check brute-force
 */
export function isRateLimited(
    key: string,
    maxRequests: number
): { limited: boolean; retryAfterSec: number } {
    maybeCleanup();
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) return { limited: false, retryAfterSec: 0 };
    if (entry.count >= maxRequests) {
        return {
            limited: true,
            retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
        };
    }
    return { limited: false, retryAfterSec: 0 };
}

/**
 * เพิ่ม counter สำหรับ key (ใช้นับ failed login attempts)
 */
export function incrementCounter(key: string, windowMs: number): void {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
    } else {
        entry.count += 1;
    }
}

/**
 * รีเซ็ต counter สำหรับ key (ใช้หลัง login สำเร็จ)
 */
export function resetLimit(key: string): void {
    store.delete(key);
}
