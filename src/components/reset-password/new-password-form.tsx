"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {useTranslations} from "next-intl";

export default function NewPasswordForm({ email, token, onSuccess }: any) {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const t = useTranslations("reset_password")

    async function save() {
        setError(null);

        if (password.length < 6) {
            setError(t("minPassLength"));
            return;
        }
        if (password !== confirm) {
            setError(t("notEqualPass"));
            return;
        }

        setLoading(true);

        const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ email, token, newPassword: password }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error);
            return;
        }

        setSuccess(true);
        setTimeout(onSuccess, 1200);
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">{t("newPass")}</h1>

            <Input
                type="password"
                placeholder={t("enterNewPass")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <Input
                type="password"
                placeholder={t("repeatPass")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
            />

            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-500 text-sm">{t("passUpdated")}</div>}

            <Button className="w-full" onClick={save} disabled={loading}>
                {loading ? t("saving") : t("savePass")}
            </Button>
        </div>
    );
}
