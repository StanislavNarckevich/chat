import { NextResponse } from "next/server";
import { getLastSendTimestamp, saveLastSendTimestamp } from "@/lib/otp-store"; // Путь к вашему файлу

const LIMIT_SECONDS = 5 * 60;
const LIMIT_MS = LIMIT_SECONDS * 1000;

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();
        if (!phone) {
            return NextResponse.json({ error: "Missing phone" }, { status: 400 });
        }

        const lastTimestamp = await getLastSendTimestamp(phone);
        const now = Date.now();

        if (lastTimestamp) {
            const diff = now - lastTimestamp;
            if (diff < LIMIT_MS) {
                const retryAfter = Math.ceil((LIMIT_MS - diff) / 1000);
                return NextResponse.json(
                    { allowed: false, retryAfter },
                    { status: 429 }
                );
            }
        }

        // Save timestamp + TTL
        await saveLastSendTimestamp(phone, now, LIMIT_SECONDS);

        return NextResponse.json({ allowed: true, retryAfter: LIMIT_SECONDS });
    } catch (e) {
        console.error("[send-otp] error:", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}