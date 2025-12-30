import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { redis } from "@/lib/redis";

const LIMIT_MS = 5 * 60 * 1000; // 5 min
const CODE_TTL = 10 * 60; // 10 min

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

        // check user
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
        } catch {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const rateKey = `reset:rate:${email}`;
        const codeKey = `reset:code:${email}`;

        const last = await redis.get(rateKey);
        const now = Date.now();

        if (last) {
            const diff = now - Number(last);
            if (diff < LIMIT_MS) {
                const retryAfter = Math.ceil((LIMIT_MS - diff) / 1000);
                return NextResponse.json({ retryAfter }, { status: 429 });
            }
        }

        // generate code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // save code
        await redis.set(codeKey, code, { ex: CODE_TTL });
        await redis.set(rateKey, now.toString(), { ex: 300 });

        console.log("RESET CODE:", code); // temporary instead smtp

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
