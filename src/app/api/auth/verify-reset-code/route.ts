import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
    const { email, code } = await req.json();

    if (!email || !code)
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const codeKey = `reset:code:${email}`;
    const sessionKey = `reset:session:${email}`;

    const saved = await redis.get(codeKey);
    if (!saved) return NextResponse.json({ error: "Code expired" }, { status: 400 });

    if (saved !== code)
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    // create session token
    const token = crypto.randomUUID();
    await redis.set(sessionKey, token, { ex: 60*15 }); // 15 min

    return NextResponse.json({
        ok: true,
        token,
    });
}
