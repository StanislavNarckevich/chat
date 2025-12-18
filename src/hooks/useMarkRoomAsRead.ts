// hooks/useMarkRoomAsRead.ts
import { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/providers/auth-provider';

export function useMarkRoomAsRead(roomId: string | undefined) {
    const { user } = useAuthContext();

    useEffect(() => {
        if (!user?.uid || !roomId) return;

        const roomRef = doc(db, "rooms", roomId);

        // Reset the unread counter when entering a room
        updateDoc(roomRef, {
            [`unreadCount.${user.uid}`]: 0
        }).catch(() => {

        });
    }, [roomId, user?.uid]);
}