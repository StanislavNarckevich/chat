// app/api/rooms/route.ts
import {NextRequest, NextResponse} from "next/server";
import { admin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const db = admin.firestore();
const auth = admin.auth();

export async function POST(req: Request) {
    const authHeader = req.headers.get("authorization")?.split(" ")[1];
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const decoded = await auth.verifyIdToken(authHeader);
        const role = decoded.role as string | undefined;
        console.log(role)
        if (!["admin", "manager"].includes(role || "")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { title, description, participants = [] } = await req.json();
        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const cleanParticipants = Array.isArray(participants)
            ? participants.filter((p: any) => typeof p === "string" && p.trim())
            : [];

        const roomRef = await db.collection("rooms").add({
            title: title.trim(),
            description: description?.trim() || "",
            status: "active",
            created_by: decoded.uid,
            created_at: FieldValue.serverTimestamp(),
            participants: Array.from(new Set([decoded.uid, ...cleanParticipants])), // creator + selected
        });

        return NextResponse.json({ id: roomRef.id }, { status: 201 });
    } catch (error: any) {
        console.error("create-room error:", error);
        return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization")?.split(" ")[1];
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const decoded = await auth.verifyIdToken(authHeader);
        const role = decoded.role as string | undefined;

        let query: any = db.collection("rooms");
        const { status = "active" } = Object.fromEntries(req.nextUrl.searchParams);

        query = query.where("status", "==", status);

        if (role === "admin") {

        } else if (role === "manager") {
            query = query.where("created_by", "==", decoded.uid);
        } else {
            query = query.where("participants", "array-contains", decoded.uid);
        }

        const snapshot = await query.get();
        const rooms = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(rooms);
    } catch (error: any) {
        console.error("list-rooms error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}