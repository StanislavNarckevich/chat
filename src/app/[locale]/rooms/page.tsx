// app/rooms/page.tsx или app/rooms/RoomsPage.tsx
"use client";

import {useEffect, useMemo, useState} from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/providers/auth-provider";
import { useGlobalLoader } from "@/providers/global-loader-provider";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

import { CreateRoomForm } from "./CreateRoomForm";
import { RoomList } from "./RoomList";
import { useRoomNotifications } from "@/hooks/useRoomNotifications";
import {useRequireAuth} from "@/hooks/useRequireAuth";

const INITIAL_PAGE_SIZE = 20;
const LOAD_MORE_STEP = 20;

export default function RoomsPage() {
    const t = useTranslations("rooms");
    const { user, role, loading: authLoading } = useAuthContext();
    const { setGlobalLoading } = useGlobalLoader();

    const [allRooms, setAllRooms] = useState<any[]>([]);
    const [displayedCount, setDisplayedCount] = useState(INITIAL_PAGE_SIZE);
    const [statusFilter, setStatusFilter] = useState("active");
    const [loading, setLoading] = useState(true);

    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [allUsers, setAllUsers] = useState<any[]>([]);

    useRoomNotifications();
    useRequireAuth()

    // === Listening to rooms in real time ===
    useEffect(() => {
        if (authLoading || !user) return;

        setLoading(true);
        setAllRooms([]);
        setDisplayedCount(INITIAL_PAGE_SIZE);

        let q = query(
            collection(db, "rooms"),
            where("status", "==", statusFilter),
            orderBy("created_at", "desc")
        );

        if (role !== "admin") {
            q = query(q, where("participants", "array-contains", user.uid));
        }

        const unsub = onSnapshot(q, (snapshot) => {
            const rooms = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllRooms(rooms);
            setLoading(false);
        }, (error) => {
            console.error("Error loading rooms:", error);
            toast.error(t("errorLoading"));
            setLoading(false);
        });

        return () => unsub();
    }, [user, role, authLoading, statusFilter, t]);

    // === Listening to public users (for the creation form) ===
    useEffect(() => {
        if (!user) return;

        const unsub = onSnapshot(
            query(collection(db, "users_public")),
            (snap) => {
                const names: Record<string, string> = {};
                const users = snap.docs
                    .map((d): any => {
                        const data = d.data();
                        const uid = d.id;
                        names[uid] = data.name || data.maskedPhone || t("unknown");
                        return { uid, ...data };
                    })
                    .filter((u) => u.uid !== user.uid && u.role !== "admin");

                setUserNames(names);
                setAllUsers(users);
            }
        );

        return () => unsub();
    }, [user, t]);

    // === Pagination ===
    const visibleRooms = useMemo(() => {
        return allRooms.slice(0, displayedCount);
    }, [allRooms, displayedCount]);
    const hasMore = displayedCount < allRooms.length;

    // GlobalLoading
    useEffect(() => {
        setGlobalLoading(authLoading);
    }, [authLoading, setGlobalLoading]);

    if (authLoading) return null;
    if (!user) return null;

    // === Handlers ===
    const handleArchive = async (roomId: string, currentStatus: string) => {
        try {
            await updateDoc(doc(db, "rooms", roomId), {
                status: currentStatus === "active" ? "inactive" : "active",
            });
            toast.success(t("list.statusUpdated"));
        } catch (err) {
            toast.error(t("list.error"));
        }
    };

    const handleDelete = async (roomId: string) => {
        try {
            await deleteDoc(doc(db, "rooms", roomId));
            toast.success(t("list.deleted"));
        } catch (err) {
            toast.error(t("list.error"));
        }
    };

    const canCreate = ["admin", "manager"].includes(role || "");

    const loadMore = () => {
        setDisplayedCount((prev) => prev + LOAD_MORE_STEP);
    };

    // Pre-calculated creator names (for maximum performance)
    const creatorNamesDict: Record<string, string> = {};
    allRooms.forEach((room) => {
        creatorNamesDict[room.created_by] = userNames[room.created_by] || t("unknown");
    });

    return (
        <div className="p-6 w-2xl max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">{t("title")}</h1>

            {canCreate && <CreateRoomForm allUsers={allUsers} t={t} />}

            <div className="max-w-xs mb-8">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">{t("filterByStatus.active")}</SelectItem>
                        <SelectItem value="inactive">{t("filterByStatus.archived")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-10 h-10 animate-spin" />
                </div>
            ) : (
                <>
                    <RoomList
                        rooms={visibleRooms}
                        creatorNames={creatorNamesDict}
                        currentUserId={user?.uid}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                        t={t}
                    />

                    {/*{allRooms.length === 0 && (*/}
                    {/*    <p className="text-center text-muted-foreground mt-16 text-lg">*/}
                    {/*        {statusFilter === "active" ? t("noActiveRooms") : t("noArchivedRooms")}*/}
                    {/*    </p>*/}
                    {/*)}*/}

                    {hasMore && (
                        <div className="flex justify-center mt-12">
                            <Button onClick={loadMore} variant="outline" size="lg">
                                {t("loadMore")}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}