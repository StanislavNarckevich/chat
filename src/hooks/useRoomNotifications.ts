// hooks/useRoomNotifications.ts
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/providers/auth-provider';
import { toast } from 'sonner';
import {collection, onSnapshot, query, where} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {useTranslations} from "next-intl";


export function useRoomNotifications() {
    const { user } = useAuthContext();
    const pathname = usePathname();
    const t = useTranslations("notifications")

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "rooms"),
            where("participants", "array-contains", user.uid),
            where("status", "==", "active")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type !== "modified") return;

                const room = change.doc.data();
                const lastMsg = room.lastMessage;

                if (!lastMsg) return;

                const isMyMessage = lastMsg.author_id === user.uid;
                const currentRoomId = pathname.match(/\/rooms\/([^/?#]+)/)?.[1];
                const isInThisRoom = currentRoomId === change.doc.id;

                // Condition: the message is not from me + I am NOT in this chat
                if (!isMyMessage && !isInThisRoom) {
                    const preview = lastMsg.hasFile
                        ? `${t("photoFrom")} ${lastMsg.author_name}`
                        : lastMsg.text || t("message");

                    toast(`${room.title || t("privateChat")}`, {
                        description: `${lastMsg.author_name}: ${preview}`,
                        duration: 6000,
                        action: {
                            label: t("open"),
                            onClick: () => window.location.href = `/rooms/${change.doc.id}`
                        },
                        onAutoClose: () => {}
                    });

                    const audio = new Audio("/notification.wav");
                    audio.volume = 0.5;
                    audio.play().catch(() => {});
                }
            });
        });

        return () => unsub();
    }, [user, pathname]);
}