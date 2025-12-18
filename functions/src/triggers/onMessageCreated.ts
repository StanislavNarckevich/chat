// functions/src/index.ts
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}

export const onMessageCreated = onDocumentCreated(
    "rooms/{roomId}/messages/{messageId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) return;

        const message = snapshot.data();
        const roomId = event.params.roomId;

        if (!message?.author_id) {
            logger.warn("Message without author_id", { roomId });
            return;
        }

        const roomRef = admin.firestore().collection("rooms").doc(roomId);

        try {
            const roomSnap = await roomRef.get();
            if (!roomSnap.exists) return;

            const roomData = roomSnap.data()!;
            const participants: string[] = roomData.participants || [];

            const rawText =
                message.text?.trim() ||
                (message.file_url ? "Photo" : "Message");

            const previewText =
                rawText.length > 35 ? rawText.slice(0, 35) + "..." : rawText;

            const updates: any = {
                lastMessage: {
                    text: previewText,
                    author_id: message.author_id,
                    author_name: message.author_name || "User",
                    hasFile: !!message.file_url,
                },
                lastMessageAt: FieldValue.serverTimestamp(),
            };

            participants.forEach((uid) => {
                if (uid === message.author_id) {
                    updates[`unreadCount.${uid}`] = 0;
                } else {
                    updates[`unreadCount.${uid}`] = FieldValue.increment(1);
                }
            });

            await roomRef.update(updates);
        } catch (error) {
            logger.error("Error in onMessageCreated", { error });
        }
    }
);