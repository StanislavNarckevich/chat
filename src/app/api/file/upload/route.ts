import { NextRequest, NextResponse } from "next/server";
import { uploadFileToGCS } from "@/lib/gcsService";

export const POST = async (req: NextRequest) => {
    try {
        const formData = await req.formData();

        const roomId = formData.get("roomId") as string;
        const userId = formData.get("userId") as string;
        const file = formData.get("file") as unknown as File;

        if (!roomId || !userId || !file) {
            return NextResponse.json({ error: "roomId, userId and file are required" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Путь в GCS: rooms/{roomId}/files/{timestamp}_{userId}_{file.name}
        const ext = file.name.split(".").pop() || "";
        const filename = `rooms/${roomId}/files/${Date.now()}_${userId}.${ext}`;

        const url = await uploadFileToGCS(buffer, filename, file.type);

        return NextResponse.json({ url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
};