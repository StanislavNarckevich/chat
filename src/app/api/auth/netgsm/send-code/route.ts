// app/api/auth/netgsm/send-code/route.ts
import { NextResponse } from "next/server";
import { saveOtpForPhone, generateOtp } from "@/lib/otp-store";
import { sendSms } from "@/lib/netgsm";

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();
        if (!phone) return NextResponse.json({ error: "Missing phone" }, { status: 400 });

        const otp = generateOtp();
        await saveOtpForPhone(phone, otp, 300);
        await sendSms(phone, `Ваш код: ${otp}`);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("send-code error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
