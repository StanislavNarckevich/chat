// app/rooms/[roomId]/MessageInput.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = {
    roomId: string;
    userId: string;
    userName: string;
    userPhoto?: string | null;
    t: (key: string) => string;
    roomCreatorId: string;
};

export function MessageInput({ roomId, userId, userName, userPhoto, t, roomCreatorId }: Props) {
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sendMessage = async () => {
        if (!text.trim() && !file) return;

        let fileUrl = "", fileName = "", fileType = "";

        if (file) {
            setUploading(true);
            try {
                const formData = new FormData();
                formData.append("roomId", roomId);
                formData.append("userId", userId);
                formData.append("file", file);

                const response = await fetch("/api/file/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) throw new Error("Upload failed");

                const { url } = await response.json();
                fileUrl = url;
                fileName = file.name;
                fileType = file.type;
            } catch (err) {
                console.error(err);
                toast.error(t("uploadError"));
                setUploading(false);
                return;
            } finally {
                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setUploading(false);
            }
        }

        try {
            const messageData = {
                text: text.trim(),
                author_id: userId,
                author_name: userName,
                author_photo: userPhoto,
                created_at: serverTimestamp(),
                room_creator_id: roomCreatorId,
                file_url: fileUrl || null,
                file_name: fileName || null,
                file_type: fileType || null,
            };

            await addDoc(collection(db, "rooms", roomId, "messages"), messageData);

            // toast.success(t("sent"));
        } catch (err) {
            console.error(err);
            toast.error(t("sendingError"));
        } finally {
            setText("");
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getDisplayedFileName = (name: string) => {
        if (name.length <= 20) return name;
        const parts = name.split('.');
        const ext = parts.pop() || '';
        const base = parts.join('.');
        const truncatedBase = base.length > 17 ? base.slice(0, 17) + '...' : base;
        return truncatedBase + (ext ? '.' + ext : '');
    };

    return (
        <div className="flex items-center gap-3">
            <label className="cursor-pointer">
                <Paperclip className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    disabled={uploading}
                />
            </label>

            {file && (
                <div className="flex items-center text-sm bg-muted px-3 py-1.5 rounded-full gap-2">
                    <span>{getDisplayedFileName(file.name)}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={removeFile}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder={t("placeholder")}
                disabled={uploading}
                className="flex-1"
            />

            <Button onClick={sendMessage} disabled={uploading || (!text.trim() && !file)}>
                <Send className="h-5 w-5" />
            </Button>
        </div>
    );
}