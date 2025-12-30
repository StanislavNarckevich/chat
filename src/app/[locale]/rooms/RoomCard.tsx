// app/rooms/RoomCard.tsx
"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/providers/auth-provider";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

type Props = {
    room: any;
    creatorName: string;
    currentUserId?: string;
    unreadCount: number;
    onArchive: (id: string, status: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    t: (key: string) => string;
};

function RoomCardComponent({
                               room,
                               creatorName,
                               currentUserId,
                               unreadCount,
                               onArchive,
                               onDelete,
                               t,
                           }: Props) {
    const { role, user } = useAuthContext();
    const router = useRouter();
    const { confirm, dialog } = useConfirmDialog();

    const isOwner = role === "manager" && room.created_by === user?.uid;
    const canManage = role === "admin" || isOwner;

    // const unreadCount = currentUserId ? room.unreadCount?.[currentUserId] ?? 0 : 0;
    const hasUnread = unreadCount > 0;

    const openRoom = () => router.push(`/rooms/${room.id}`);

    const handleDelete = async () => {
        const ok = await confirm();
        if (!ok) return;
        await onDelete(room.id);
    };

    return (
        <>
            {dialog}

            <li className="relative bg-white dark:bg-zinc-900 p-6 rounded-lg shadow flex justify-between items-start gap-6 transition-all hover:shadow-md">
                {/* Unread badge */}
                {hasUnread && (
                    <div className="absolute -top-3 -right-3 z-10 animate-pulse">
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-zinc-900">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </div>
                    </div>
                )}

                <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                        {room.title || t("untitled")}
                        {room.status === "active" && (
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                    </h2>

                    {room.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-3">{room.description}</p>
                    )}

                    {/* Last message preview  */}
                    {room.lastMessage && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                            {room.lastMessage.author_name && (
                                <span className="font-medium">{room.lastMessage.author_name}: </span>
                            )}
                            {room.lastMessage.text || (room.lastMessage.hasFile ? t("photo") : t("message"))}
                        </p>
                    )}

                    <p className="text-sm text-gray-500 mt-3">
                        {t("list.status")}:{" "}
                        <span className="font-medium">
              {room.status === "active" ? t("list.active") : t("list.inactive")}
            </span>{" "}
                        | {t("list.createdBy")}: <span className="font-medium">{creatorName}</span>
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <Button onClick={openRoom} className={hasUnread ? "font-bold" : ""}>
                        {hasUnread ? `${t("list.open")} (${unreadCount})` : t("list.openChat")}
                    </Button>

                    {canManage && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onArchive(room.id, room.status)}
                            >
                                {room.status === "active" ? t("list.archive") : t("list.activate")}
                            </Button>

                            <Button variant="destructive" size="sm" onClick={handleDelete}>
                                {t("list.delete")}
                            </Button>
                        </>
                    )}
                </div>
            </li>
        </>
    );
}


export const RoomCard = memo(RoomCardComponent, (prev, next) => {
    const prevRoom = prev.room;
    const nextRoom = next.room;


    return (
        prevRoom.id === nextRoom.id &&
        prevRoom.title === nextRoom.title &&
        prevRoom.description === nextRoom.description &&
        prevRoom.status === nextRoom.status &&
        prevRoom.lastMessage?.text === nextRoom.lastMessage?.text &&
        prevRoom.lastMessage?.author_name === nextRoom.lastMessage?.author_name &&
        prevRoom.lastMessage?.hasFile === nextRoom.lastMessage?.hasFile &&
        (prevRoom.lastMessage?.timestamp?.seconds ?? 0) === (nextRoom.lastMessage?.timestamp?.seconds ?? 0) &&
        prev.unreadCount === next.unreadCount &&
        prev.creatorName === next.creatorName
    );
});