// app/api/auth/verify-code/route.ts
import { NextResponse } from "next/server";
import { getOtpForPhone, deleteOtpForPhone } from "@/lib/otp-store";
import { createCustomToken } from "@/lib/auth-server";

export async function POST(req: Request) {
    try {
        const { phone, code, role = "client" } = await req.json();
        if (!phone || !code) return NextResponse.json({ error: "Missing phone or code" }, { status: 400 });

        const savedOtp = await getOtpForPhone(phone);
        if (!savedOtp || savedOtp !== code) {
            return NextResponse.json({ error: "Invalid code" }, { status: 401 });
        }

        await deleteOtpForPhone(phone);

        // Generate a custom Firebase token
        const token = await createCustomToken(phone, role);

        return NextResponse.json({ token });
    } catch (err: any) {
        console.error("verify-code error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
