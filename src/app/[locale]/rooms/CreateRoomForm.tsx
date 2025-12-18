"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/auth-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FaCopy } from "react-icons/fa";

type Props = {
    allUsers: { uid: string; name: string | null; maskedPhone: string | null }[];
    t: (key: string) => string;
};

export function CreateRoomForm({ allUsers, t }: Props) {
    const { user } = useAuthContext();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [participants, setParticipants] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const [inviteLinkEnabled, setInviteLinkEnabled] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) return toast.error(t("createForm.enterTitle"));

        setLoading(true);
        try {
            const idToken = await user?.getIdToken();
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title: title.trim(), description: description.trim(), participants }),
            });

            const roomData = await res.json();

            if (!res.ok) throw new Error(roomData.error ?? t("createForm.error"));

            toast.success(t("createForm.success"));
            setTitle("");
            setDescription("");
            setParticipants([]);

            if (inviteLinkEnabled) {
                if (!user) {
                    toast.error("Not authenticated");
                    return;
                }

                const inviteRes = await fetch("/api/invite/create", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ roomId: roomData.id }),
                });

                const inviteData = await inviteRes.json();
                if (!inviteRes.ok) {
                    toast.error(inviteData.error || "Failed to create invite");
                    return;
                }

                setInviteLink(inviteData.link);
                setInviteDialogOpen(true);
            }

        } catch (err: any) {
            toast.error(err.message || t("createForm.error"));
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteLink) return;
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(inviteLink);
                toast.success("Copy");
            } catch {
                toast.error("Cannot copy link");
            }
        }
    };

    const options = allUsers.map(u => ({
        value: u.uid,
        label: u.name || u.maskedPhone || "Без имени",
    }));

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow mb-8 space-y-4">
            <Input
                placeholder={t("createForm.titlePlaceholder")}
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={loading}
            />
            <Input
                placeholder={t("createForm.descriptionPlaceholder")}
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={loading}
            />
            <MultiSelect

                options={options}
                value={participants}
                onValueChange={setParticipants}
                placeholder={t("createForm.participantsPlaceholder")}
                disabled={loading}
            />

            {/* Invite checkbox */}
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="inviteLink"
                    checked={inviteLinkEnabled}
                    onCheckedChange={(checked) => setInviteLinkEnabled(checked === true)}
                    disabled={loading}
                />
                <label htmlFor="inviteLink" className="select-none">
                    {t("createForm.enableInviteLink")}
                </label>
            </div>

            <Button onClick={handleCreate} disabled={loading} className="w-full">
                {loading ? t("createForm.creating") : t("createForm.createButton")}
            </Button>

            {/* Dialog with invite */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("createForm.inviteLink")}</DialogTitle>
                    </DialogHeader>

                    <div className="mt-4">
                        <div className="flex items-center gap-2">
                            <Input readOnly value={inviteLink || ""} className="flex-1" />
                            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy link">
                                <FaCopy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
