import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword)
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const sessionKey = `reset:session:${email}`;
    const savedToken = await redis.get(sessionKey);

    if (!savedToken || savedToken !== token)
        return NextResponse.json({ error: "Invalid session" }, { status: 403 });

    try {
        const user = await admin.auth().getUserByEmail(email);

        await admin.auth().updateUser(user.uid, {
            password: newPassword,
        });

        // remove tokens and code
        await redis.del(sessionKey);
        await redis.del(`reset:code:${email}`);

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
