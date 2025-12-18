// app/rooms/[roomId]/MessageBubble.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/providers/auth-provider";
import { format } from "date-fns";
import { Edit2, Trash2, Download, Paperclip, FileText, ImageIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Message = {
    id: string;
    text: string;
    author_id: string;
    author_name: string;
    author_photo?: string | null;
    created_at: Timestamp;
    edited_at?: Timestamp;
    file_url?: string;
    file_name?: string;
    file_type?: string;
};

type Props = {
    message: Message;
    isOwn: boolean;
    t: (key: string) => string;
    roomId: string;
};

export function MessageBubble({ message, isOwn, t, roomId }: Props) {
    const { user, role } = useAuthContext();
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(message.text);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const canEdit = useMemo(() => {
        if (!isOwn || message.file_url) return false;
        const createdAtMs = message.created_at.toMillis();
        const nowMs = Date.now();
        return nowMs - createdAtMs < 15 * 60 * 1000; // 15 min
    }, [isOwn, message.created_at, message.file_url]);

    const canDelete = isOwn || role === "admin" || role === "manager";

    const handleSave = async () => {
        if (editText.trim() === message.text) return setEditing(false);
        await updateDoc(doc(db, "rooms", roomId, "messages", message.id), {
            text: editText.trim(),
            edited_at: Timestamp.now(),
        });
        setEditing(false);
    };

    const handleDelete = async () => {
        try {
            if (message.file_url) {
                const response = await fetch("/api/delete-chat-file", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileUrl: message.file_url }),
                });

                if (!response.ok) throw new Error("Delete failed");
            }

            await deleteDoc(doc(db, "rooms", roomId, "messages", message.id));

            toast.success(t("deleted"));
        } catch (e) {
            toast.error(t("errorDeleting"));
        } finally {
            setShowDeleteDialog(false);
        }
    };

    const time = format(message.created_at.toDate(), "HH:mm");
    const editedTime = message.edited_at ? ` (edited ${format(message.edited_at.toDate(), "HH:mm")})` : "";

    // Подсветка @упоминаний и ссылок
    const highlightedText = message.text
        .replace(
            /@([\wа-яёğüşöçıİ]+)/gi,
            '<span class="font-bold text-blue-600 dark:text-blue-400">@$1</span>'
        )
        .replace(
            /(https?:\/\/[^\s<]+)/gi,
            '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline">$1</a>'
        );

    // Иконка для файла в зависимости от типа (похоже на Telegram)
    const getFileIcon = (fileType?: string) => {
        if (fileType?.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
        if (fileType?.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
        // Добавьте больше типов по необходимости (doc, zip etc.)
        return <Paperclip className="h-5 w-5 text-gray-500" />;
    };

    const hasText = !!message.text.trim();
    const hasFile = !!message.file_url;

    return (
        <div className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Avatar className="h-10 w-10 cursor-pointer">
                            <AvatarImage src={message.author_photo || undefined} />
                            <AvatarFallback>{message.author_name[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side={isOwn ? "right" : "left"}>
                        <p>{message.author_name}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <div className={`flex flex-col max-w-lg ${isOwn ? "items-end" : ""}`}>
                {/* Bubble wrapper */}
                <div className="relative group">
                    <div
                        className={`
                            rounded-xl shadow-sm transition-all text-sm
                            ${hasText || editing ? 'px-3 py-1' : ''}
                            ${isOwn ? "bg-green-300 dark:bg-green-700 text-gray-900 dark:text-white" : "bg-gray-50 dark:bg-zinc-800 text-foreground"}
                        `}
                    >
                        {editing ? (
                            <div className="flex gap-2 items-center">
                                <Textarea
                                    autoFocus
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSave();
                                        }
                                    }}
                                    className="bg-transparent outline-none flex-1 text-sm resize-none min-h-[100px] max-h-[200px] overflow-y-auto"
                                    placeholder="Edit message..."
                                />
                                <div className="flex flex-col gap-1">
                                    <Button size="sm" variant="secondary" onClick={handleSave}>
                                        Save
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => setEditing(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {hasText && (
                                    <div dangerouslySetInnerHTML={{ __html: highlightedText }} className="break-words" />
                                )}

                                {hasFile && (
                                    <div className={`${hasText ? 'mt-2' : ''}`}>
                                        {message.file_type?.startsWith("image/") ? (
                                            <a href={message.file_url} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={message.file_url}
                                                    alt={message.file_name}
                                                    className="max-w-xs rounded-lg cursor-pointer"
                                                />
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-md max-w-md">
                                                {getFileIcon(message.file_type)}
                                                <div className="flex-1 truncate">
                                                    <p className="text-sm font-medium truncate">{message.file_name}</p>
                                                    <p className="text-xs text-gray-500">{message.file_type?.split("/")[1]?.toUpperCase() || "FILE"}</p>
                                                </div>
                                                <a
                                                    href={message.file_url}
                                                    download={message.file_name}
                                                    className="flex items-center gap-1 text-blue-600 hover:underline"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Edit/Delete */}
                    {(canEdit || canDelete) && !editing && (
                        <div className="absolute -bottom-7 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                                <Button
                                    size="icon"
                                    className="h-6 w-6 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-md"
                                    onClick={() => setEditing(true)}
                                >
                                    <Edit2 className="h-3 w-3" />
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    size="icon"
                                    className="h-6 w-6 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-md"
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Time */}
                <div className={`text-[10px] text-gray-500 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                    {time}{editedTime}
                </div>
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
                        <DialogDescription>{t("confirmDelete")}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            {t("cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            {t("delete")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}