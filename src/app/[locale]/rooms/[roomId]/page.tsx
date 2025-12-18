// app/rooms/[roomId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/providers/auth-provider";
import { useTranslations } from "next-intl";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import {RoomHeaderMenu} from "@/app/[locale]/rooms/[roomId]/RoomHeaderMenu";
import {useGlobalLoader} from "@/providers/global-loader-provider";
import {useMarkRoomAsRead} from "@/hooks/useMarkRoomAsRead";
import {useRequireAuth} from "@/hooks/useRequireAuth";

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

export default function RoomChatPage() {
    const t = useTranslations("chat");
    const { roomId } = useParams() as { roomId: string };
    const { user, loading: authLoading } = useAuthContext();
    const router = useRouter();
    const { setGlobalLoading } = useGlobalLoader();

    const [messages, setMessages] = useState<Message[]>([]);
    const [roomTitle, setRoomTitle] = useState("Loading...");
    const [roomCreatorId, setRoomCreatorId] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [currentParticipants, setCurrentParticipants] = useState<string[]>([]);
    const [roomLoading, setRoomLoading] = useState(true);

    const userName = user?.displayName || t("unknown"); //!Todo update from users data
    const userPhoto = user?.photoURL || null;

    useMarkRoomAsRead(roomId);
    useRequireAuth()

    // === Loading messages and room title ===
    useEffect(() => {
        if (!user) return;

        let messagesLoaded = false;
        let roomLoaded = false;

        // Messages
        const messagesQuery = query(
            collection(db, "rooms", roomId, "messages"),
            orderBy("created_at", "asc")
        );

        const unsubMessages = onSnapshot(messagesQuery, (snap) => {
            const msgs: Message[] = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    text: data.text || "",
                    author_id: data.author_id || "",
                    author_name: data.author_name,
                    author_photo: data.author_photo || null,
                    created_at: data.created_at || Timestamp.now(),
                    edited_at: data.edited_at,
                    file_url: data.file_url,
                    file_name: data.file_name,
                    file_type: data.file_type,
                };
            });

            setMessages(msgs);

            messagesLoaded = true;
            if (messagesLoaded && roomLoaded) setRoomLoading(false);
        });

        // Room
        const unsubRoom = onSnapshot(doc(db, "rooms", roomId), (snap) => {
            const data = snap.data();

            setRoomTitle(data?.title || "Чат");
            setRoomCreatorId(data?.created_by || "");
            setCurrentParticipants(data?.participants || []);

            roomLoaded = true;
            if (messagesLoaded && roomLoaded) setRoomLoading(false);
        });

        return () => {
            unsubMessages();
            unsubRoom();
        };
    }, [roomId, user]);

    // === Autoscroll to bottom ===
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // === Button "down" ===
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setShowScrollBtn(!entry.isIntersecting),
            { threshold: 0.1 }
        );

        if (messagesEndRef.current) {
            observer.observe(messagesEndRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        setGlobalLoading(authLoading || roomLoading);
    }, [authLoading, roomLoading]);


    if (!user || authLoading || roomLoading) {
        return null;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] bg-background w-2xl relative">
            <div className="border-b bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <Button variant="ghost"  onClick={() => router.push(`/rooms`)}>
                    ← {t("back")}
                </Button>
                <h1 className="text-2xl font-bold truncate max-w-md">{roomTitle}</h1>

                <RoomHeaderMenu
                    roomId={roomId}
                    creatorId={roomCreatorId}
                    currentParticipants={currentParticipants}
                    t={t}
                />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6">
                {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">
                        {t("noMessages")}
                    </p>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={msg.author_id === user.uid}
                            roomId={roomId}
                            t={t}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Button "down" */}
            {showScrollBtn && (
                <Button
                    size="icon"
                    variant="outline"
                    className="absolute bottom-24 right-1/2 rounded-full shadow-lg z-20"
                    onClick={scrollToBottom}
                >
                    <ArrowDown className="h-5 w-5" />
                </Button>
            )}

            {/* Input */}
            <div className="border-t bg-card p-4">
                <MessageInput
                    roomId={roomId}
                    userId={user.uid}
                    userName={userName}
                    userPhoto={userPhoto}
                    roomCreatorId={roomCreatorId}
                    t={t}
                />
            </div>
        </div>
    );
}