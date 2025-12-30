// functions/src/triggers/onMessageCreated.ts
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

export const onMessageCreated = onDocumentCreated(
    "rooms/{roomId}/messages/{messageId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) return;

        const message = snapshot.data();
        const roomId = event.params.roomId;

        if (!message?.author_id) return;

        const roomRef = db.collection("rooms").doc(roomId);
        const roomSnap = await roomRef.get();
        if (!roomSnap.exists) return;

        const roomData = roomSnap.data()!;
        const participants: string[] = roomData.participants || [];

        const rawText =
            message.text?.trim() ||
            (message.file_url ? "Photo" : "Message");

        const previewText =
            rawText.length > 35 ? rawText.slice(0, 35) + "..." : rawText;

        await roomRef.update({
            lastMessage: {
                text: previewText,
                author_id: message.author_id,
                author_name: message.author_name || "User",
                hasFile: !!message.file_url,
            },
            lastMessageAt: FieldValue.serverTimestamp(),
        });

        const updates: Promise<any>[] = [];

        for (const uid of participants) {
            if (uid === message.author_id) continue;

            const userRef = db.collection("users_private").doc(uid);
            updates.push(
                userRef.set(
                    {
                        unreadTotal: FieldValue.increment(1),
                        unreadRooms: {
                            [roomId]: FieldValue.increment(1),
                        },
                    },
                    { merge: true }
                )
            );
        }

        await Promise.all(updates);
    }
);
