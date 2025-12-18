"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {useTranslations} from "next-intl";

export default function VerifyForm({ email, setToken, onSuccess }: any) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations("reset_password")

    async function verify() {
        setError(null);
        setLoading(true);

        const res = await fetch("/api/auth/verify-reset-code", {
            method: "POST",
            body: JSON.stringify({ email, code }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error);
            return;
        }

        setToken(data.token);
        onSuccess();
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">{t("enterCode")}</h1>

            <Input
                placeholder={t("enterCodePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
            />

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button className="w-full" onClick={verify} disabled={loading || code.length !== 6}>
                {loading ? t("checking") : t("continue")}
            </Button>
        </div>
    );
}
