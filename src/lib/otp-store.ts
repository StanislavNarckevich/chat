import { redis } from "@/lib/redis";

const OTP_KEY_PREFIX = "otp:";
const LAST_SEND_KEY_PREFIX = "otp:last:";
const DEFAULT_TTL_SECONDS = 300;

/**
 * Generate a random OTP (6 digits)
 */
export function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Save OTP for phone with TTL (in seconds)
 */
export async function saveOtpForPhone(phone: string, otp: string, ttl: number = DEFAULT_TTL_SECONDS) {
    await redis.set(`${OTP_KEY_PREFIX}${phone}`, otp, "EX", ttl);
}

/**
 * Getting an OTP for your phone
 */
export async function getOtpForPhone(phone: string): Promise<string | null> {
    return await redis.get(`${OTP_KEY_PREFIX}${phone}`);
}

/**
 * Delete the OTP after verification
 */
export async function deleteOtpForPhone(phone: string) {
    await redis.del(`${OTP_KEY_PREFIX}${phone}`);
}

/**
 * Save last send timestamp for phone with TTL (in seconds)
 */
export async function saveLastSendTimestamp(phone: string, timestamp: number, ttl: number = DEFAULT_TTL_SECONDS) {
    await redis.set(`${LAST_SEND_KEY_PREFIX}${phone}`, timestamp.toString(), "EX", ttl);
}

/**
 * Get last send timestamp for phone
 */
export async function getLastSendTimestamp(phone: string): Promise<number | null> {
    const value = await redis.get(`${LAST_SEND_KEY_PREFIX}${phone}`);
    return value ? Number(value) : null;
}

/**
 * Delete the OTP after verification
 */
export async function deleteLastSendTimestamp(phone: string) {
    await redis.del(`${LAST_SEND_KEY_PREFIX}${phone}`);
}