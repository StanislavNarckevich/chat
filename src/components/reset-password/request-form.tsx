"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {useTranslations} from "next-intl";

export default function RequestForm({ email, setEmail, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations("reset_password")

    async function sendCode() {
        setError(null);
        setLoading(true);

        const res = await fetch("/api/auth/send-reset-code", {
            method: "POST",
            body: JSON.stringify({ email }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error);
            return;
        }

        onSuccess();
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">{t("resetPass")}</h1>

            <Input
                placeholder={t("enterEmail")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button className="w-full" onClick={sendCode} disabled={loading || !email}>
                {loading ? t("sending") : t("send_code")}
            </Button>
        </div>
    );
}
