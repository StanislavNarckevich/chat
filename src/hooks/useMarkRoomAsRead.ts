// hooks/useMarkRoomAsRead.ts
import { useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { useAuthContext } from "@/providers/auth-provider";

export function useMarkRoomAsRead(roomId: string | undefined) {
    const { user } = useAuthContext();

    useEffect(() => {
        if (!user?.uid || !roomId) return;

        const markAsRead = httpsCallable(functions, "markRoomAsRead");

        markAsRead({ roomId }).catch(() => {
            // можно логировать, но UI не ломаем
        });
    }, [roomId, user?.uid]);
}
