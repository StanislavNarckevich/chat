// app/rooms/RoomList.tsx
"use client";

import { memo } from "react";
import { RoomCard } from "./RoomCard";

type Props = {
    rooms: any[];
    creatorNames: Record<string, string>;
    currentUserId?: string;
    onArchive: (id: string, status: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    t: (key: string) => string;
};

function RoomListComponent({
                               rooms,
                               creatorNames,
                               currentUserId,
                               onArchive,
                               onDelete,
                               t,
                           }: Props) {
    if (rooms.length === 0) {
        return <p className="text-center text-gray-500 py-16 text-lg">{t("list.noRooms")}</p>;
    }

    return (
        <ul className="space-y-6">
            {rooms.map((room) => (
                <RoomCard
                    key={room.id}
                    room={room}
                    creatorName={creatorNames[room.created_by] || t("unknown")}
                    currentUserId={currentUserId}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    t={t}
                />
            ))}
        </ul>
    );
}

export const RoomList = memo(RoomListComponent);