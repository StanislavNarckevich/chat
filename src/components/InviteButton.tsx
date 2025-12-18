// components/InviteButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/auth-provider";
import { FaCopy } from "react-icons/fa";
import {UserStar} from "lucide-react";
import {useTranslations} from "next-intl";

export function InviteButton({ roomId }: { roomId: string }) {
    const [loading, setLoading] = useState(false);
    const [link, setLink] = useState<string | null>(null);
    const { user } = useAuthContext();
    const t = useTranslations("chat")

    const handleCreate = async () => {
        if (!user) {
            toast.error("Not authenticated");
            return;
        }
        setLoading(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/invite/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ roomId }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Failed to create invite");
                return;
            }

            setLink(data.link);
            toast.success(t("inviteLinkCreated"));
        } catch (err: any) {
            toast.error(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!link) return;
        await navigator.clipboard.writeText(link);
        toast.success(t("copied"));
    };

    return (
        <div className="flex flex-col gap-2">

            <Button
                variant="ghost"
                className="justify-start"
                onClick={handleCreate}
                disabled={loading}
            >
                <UserStar className="mr-2 h-4 w-4" />
                {loading ? t("generating") : t("inviteNewUser")}
            </Button>

            {link && (
                <div className="flex items-center gap-2">
                    <Input readOnly value={link} />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        title="Copy link"
                    >
                        <FaCopy className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
