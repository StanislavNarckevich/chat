import { NextRequest, NextResponse } from "next/server";
import { deleteFileFromGCS } from "@/lib/gcsService";

export const POST = async (req: NextRequest) => {
    try {
        const { fileUrl } = await req.json();

        if (!fileUrl) {
            return NextResponse.json({ error: "fileUrl is required" }, { status: 400 });
        }

        await deleteFileFromGCS(fileUrl);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
};