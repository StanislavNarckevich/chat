// app/api/invite/create/route.ts
import { NextResponse } from "next/server";
import { admin, adminDb, adminAuth } from "@/lib/firebase-admin";
import crypto from "crypto";



export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { roomId } = body;
        if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

        // Check header Authorization: Bearer <idToken>
        const authHeader = req.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = await adminAuth.verifyIdToken(token);
        const uid = decoded.uid;

        // Check role in users_public
        const userDoc = await adminDb.doc(`users_public/${uid}`).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        const role = userData?.role || "client";
        if (!["admin", "manager"].includes(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Create invite
        const tokenValue = crypto.randomBytes(16).toString("hex");
        const inviteRef = adminDb.collection("invites").doc();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней

        await inviteRef.set({
            roomId,
            invitedBy: uid,
            token: tokenValue,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
            used: false,
        });

        const inviteId = inviteRef.id;
        const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const link = `${base}/login?inviteId=${inviteId}`;

        return NextResponse.json({ inviteId, link });
    } catch (err: any) {
        console.error("invite create error", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
