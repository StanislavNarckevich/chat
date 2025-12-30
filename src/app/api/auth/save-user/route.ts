import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import {maskPhone} from "@/lib/save-user-to-firestore";



export async function POST(req: Request) {
    try {
        const {
            uid, email, phone, name, photoURL, role = "client",
            position, company, language = "TR", notification = "email", maskedPhone } = await req.json();

        if (!uid) {
            return NextResponse.json({ error: "Missing UID" }, { status: 400 });
        }

        const db = admin.firestore();

        // ---------- Role handling ----------
        const userRecord = await admin.auth().getUser(uid);
        const currentClaims = userRecord.customClaims || {};
        const currentRole = currentClaims.role as string | undefined;

        if (role && (!currentRole || currentRole !== role)) {
            await admin.auth().setCustomUserClaims(uid, { ...currentClaims, role });
        }

        const finalRole = role;

        // ---------- Update private user data ----------
        await db.collection("users_private").doc(uid).set(
            {
                uid,
                email: email || null,
                phone: phone || null,
                role: finalRole,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        // ---------- Update public user data ----------
        await db.collection("users_public").doc(uid).set(
            {
                uid,
                name: name || null,
                photoURL: photoURL || null,
                maskedPhone:
                    maskedPhone ||
                    (finalRole !== "admin" ? maskPhone(phone || "") : phone),
                role: finalRole,
                position: position || null,
                company: company || null,
                language: language || "TR",
                notification: notification || "email",

                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("save-user error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
