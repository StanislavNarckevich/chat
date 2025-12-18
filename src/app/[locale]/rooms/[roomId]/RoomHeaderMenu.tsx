// app/rooms/[roomId]/RoomHeaderMenu.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/providers/auth-provider";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Users, UserPlus, UserMinus, MoreVertical } from "lucide-react";
import {InviteButton} from "@/components/InviteButton";
import {Separator} from "@/components/ui/separator";

type Props = {
    roomId: string;
    creatorId: string;
    currentParticipants: string[];
    t: (key: string) => string;
};

export function RoomHeaderMenu({ roomId, creatorId, currentParticipants, t }: Props) {
    const { user, role } = useAuthContext();
    const isOwnerOrManager = user?.uid === creatorId || role === "admin" || role === "manager";

    const [menuOpen, setMenuOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);

    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);

    // All users
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "users_public"), (snap) => {
            setAllUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
        });
        return unsub;
    }, []);

    // Room members
    useEffect(() => {
        setParticipants([]);

        if (currentParticipants.length === 0) return;

        const unsubs = currentParticipants.map((uid) =>
            onSnapshot(doc(db, "users_public", uid), (snap) => {
                const data = snap.data();
                if (data) {
                    setParticipants((prev) => {
                        const filtered = prev.filter((p) => p.uid !== uid);
                        return [...filtered, { uid, ...data }];
                    });
                }
            })
        );

        return () => unsubs.forEach((u) => u());
    }, [currentParticipants]);

    const addParticipant = async (uid: string) => {
        await updateDoc(doc(db, "rooms", roomId), {
            participants: arrayUnion(uid),
        });
        setAddOpen(false);
    };

    const removeParticipant = async (uid: string) => {
        if (!isOwnerOrManager) return;
        await updateDoc(doc(db, "rooms", roomId), {
            participants: arrayRemove(uid),
        });
        setRemoveOpen(false);
    };

    return (
        <>
            {/* Chat menu */}
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                    <div className="grid gap-1">
                        <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                                setViewOpen(true);
                                setMenuOpen(false);
                            }}
                        >
                            <Users className="mr-2 h-4 w-4" />
                            {t("members")} ({participants.length})
                        </Button>

                        {isOwnerOrManager && (
                            <>
                                <Button
                                    variant="ghost"
                                    className="justify-start"
                                    onClick={() => {
                                        setAddOpen(true);
                                        setMenuOpen(false);
                                    }}
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {t("addMember")}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="justify-start"
                                    onClick={() => {
                                        setRemoveOpen(true);
                                        setMenuOpen(false);
                                    }}
                                >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    {t("removeMember")}
                                </Button>
                                <Separator />

                                <InviteButton roomId={roomId} />
                            </>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Modal: View users */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("members")}</DialogTitle>
                        <DialogDescription>{participants.length} {t("peopleInRoom")}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-96 overflow-y-auto py-4">
                        {participants.map((p) => (
                            <div key={p.uid} className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={p.photoURL} />
                                    <AvatarFallback>{p.name?.[0].toUpperCase() || "?"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{p.name || p.maskedPhone}</p>
                                </div>
                                {p.uid === creatorId && <Badge variant="secondary">{t("owner")}</Badge>}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Add user */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("addMember")}</DialogTitle>
                    </DialogHeader>
                    <Command filter={(value, search) => {
                        const user = allUsers.find(u => u.uid === value);
                        if (!user) return 0;

                        const label = (user.name || user.maskedPhone || "").toLowerCase();
                        search = search.toLowerCase();

                        return label.includes(search) ? 1 : 0;
                    }}>
                        <CommandInput placeholder={t("searchUsers")} />
                        <CommandList>
                            <CommandEmpty>Ничего не найдено</CommandEmpty>
                            <CommandGroup>
                                {allUsers
                                    .filter((u) => !currentParticipants.includes(u.uid))
                                    .map((u) => (
                                        <CommandItem
                                            key={u.uid}
                                            onSelect={() => addParticipant(u.uid)}
                                            value={u.uid}
                                        >
                                            <Avatar className="h-8 w-8 mr-3">
                                                <AvatarImage src={u.photoURL} />
                                                <AvatarFallback>{u.name?.[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span>{u.name || u.maskedPhone}</span>
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>

            {/*Modal: Delete user */}
            <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("removeMember")}</DialogTitle>
                        <DialogDescription>{t("chooseUserDelete")}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-96 overflow-y-auto py-4">
                        {participants
                            .filter((p) => p.uid !== creatorId)
                            .map((p) => (
                                <div key={p.uid} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={p.photoURL} />
                                            <AvatarFallback>{p.name?.[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{p.name || p.maskedPhone}</span>
                                    </div>
                                    <Button size="sm" variant="destructive" onClick={() => removeParticipant(p.uid)}>
                                        Удалить
                                    </Button>
                                </div>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}