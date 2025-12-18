// app/api/invite/apply/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb, admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { inviteId } = body;
        if (!inviteId) return NextResponse.json({ error: "inviteId required" }, { status: 400 });

        // Check Authorization header (idToken)
        const authHeader = req.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = await adminAuth.verifyIdToken(token);
        const uid = decoded.uid;

        const inviteRef = adminDb.collection("invites").doc(inviteId);
        const inviteSnap = await inviteRef.get();
        if (!inviteSnap.exists) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });

        const invite = inviteSnap.data();
        if (invite!.used) return NextResponse.json({ error: "Invite already used" }, { status: 400 });

        const now = new Date();
        if (invite!.expiresAt && invite!.expiresAt.toDate && invite!.expiresAt.toDate() < now) {
            return NextResponse.json({ error: "Invite expired" }, { status: 400 });
        }

        const roomId = invite!.roomId;
        if (!roomId) return NextResponse.json({ error: "Invite missing roomId" }, { status: 500 });

        // Add to participants
        const roomRef = adminDb.collection("rooms").doc(roomId);
        await roomRef.update({
            participants: admin.firestore.FieldValue.arrayUnion(uid),
        });

        // update invite
        await inviteRef.update({
            used: true,
            usedBy: uid,
            usedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ roomId });
    } catch (err: any) {
        console.error("invite apply error", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
