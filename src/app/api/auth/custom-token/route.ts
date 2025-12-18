// app/api/auth/custom-token/route.ts
import { NextResponse } from "next/server";
import {admin , adminDb as db} from "@/lib/firebase-admin";
import {deleteLastSendTimestamp} from "@/lib/otp-store";

export async function POST(req: Request) {
    try {
        const { phone, role } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: "Missing phone" }, { status: 400 });
        }

        // Check if the user already exists
        const userRecord = await admin.auth().getUserByPhoneNumber(phone).catch(() => null);

        let uid: string;

        if (userRecord) {
            uid = userRecord.uid;
            // Update the role if necessary
            await admin.auth().setCustomUserClaims(uid, { role });
        } else {
            // Create a new user
            const newUser = await admin.auth().createUser({
                phoneNumber: phone,
            });
            uid = newUser.uid;

            await admin.auth().setCustomUserClaims(uid, { role });
        }

        // Save the profile to Firestore
        await db.collection("users_private").doc(uid).set(
            {
                uid,
                phone,
                role,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );
        // Save the profile to Firestore
        await db.collection("users_public").doc(uid).set(
            {
                uid,
                phone,
                role,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        // Create a custom token
        const token = await admin.auth().createCustomToken(uid, { role });
        await deleteLastSendTimestamp(phone);

        return NextResponse.json({ token });
    } catch (error: any) {
        console.error("custom-token error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
