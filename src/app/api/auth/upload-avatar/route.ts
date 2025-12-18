import { NextRequest, NextResponse } from "next/server";
import { uploadFileToGCS } from "@/lib/gcsService";

export const POST = async (req: NextRequest) => {
    try {
        const formData = await req.formData();

        const uid = formData.get("uid") as string;
        const file = formData.get("file") as unknown as File;

        if (!uid || !file) {
            return NextResponse.json({ error: "uid and file are required" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Load avatar to users/{uid}/avatar.jpg
        const filename = `users/${uid}/avatar_${file.name}`;

        const url = await uploadFileToGCS(buffer, filename, file.type);

        return NextResponse.json({ url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
};
