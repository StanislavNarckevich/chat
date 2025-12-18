// components/auth/phone-login-form.tsx
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createRecaptcha, sendOtp, verifyOtp } from "@/lib/otp";
import { useRouter, useSearchParams } from "next/navigation";
import { saveUserToFirestore } from "@/lib/save-user-to-firestore";
import {applyInvite} from "@/lib/applyInvite";
import {useGlobalLoader} from "@/providers/global-loader-provider";

export function PhoneLoginForm({ setMode }: { setMode: (m: string) => void }) {
    const t = useTranslations("phone");
    const [recaptcha, setRecaptcha] = useState<any>(null);
    const [confirmResult, setConfirmResult] = useState<any>(null);
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [retryAfter, setRetryAfter] = useState(0);
    const [timer, setTimer] = useState(0);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { setGlobalLoading } = useGlobalLoader();

    const inviteId = searchParams.get("inviteId") || (typeof window !== "undefined" ? localStorage.getItem("inviteId") : null);

    useEffect(() => {
        if (!recaptcha) {
            setRecaptcha(createRecaptcha());
        }
    }, [recaptcha]);


    useEffect(() => {
        if (retryAfter <= 0) return;

        setTimer(retryAfter);

    }, [retryAfter]);


    useEffect(() => {
        if (timer <= 0) return;

        const interval = setInterval(() => {
            setTimer((t) => t - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone) return toast.error(t("enterPhone"));

        try {
            setLoading(true);

            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const data = await res.json();

            if (!data.allowed) {

                toast.error(`${t("retrySms")} ${data.retryAfter} ${t("sec")}`);
                setRetryAfter(data.retryAfter); // запускаем таймер
                return;
            }

            const confirmation = await sendOtp(phone, recaptcha);
            setConfirmResult(confirmation);
            toast.success(t("codeSent"));

            setRetryAfter(data.retryAfter);

        } catch (err: any) {
            toast.error(err.message || t("error"));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!confirmResult || !code) return toast.error(t("enterCode"));
        try {
            setLoading(true);
            const { user } = await verifyOtp(confirmResult, code, "client");
            await saveUserToFirestore(user);

            if (inviteId) {
                const roomId = await applyInvite(user, inviteId);
                if (roomId) {
                    toast.success(t("welcome"));
                    router.push(`/rooms/${roomId}`);
                    return;
                }
            }
            else {
                router.push("/rooms");
            }

        } catch (err: any) {
            toast.error(err.message || t("invalidCode"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setGlobalLoading(loading);
    }, [loading]);

    return (
        <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-3">
                <Button type="button" variant="ghost" className="mb-2" onClick={() => setMode("email")}>
                    ← {t("back")}
                </Button>
                <h1 className="text-2xl font-semibold text-center">{t("title")}</h1>

                {!confirmResult ? (
                    <>
                        <Input placeholder="+90 555 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? t("sending") : t("sendCode")}
                        </Button>
                        <div id="recaptcha-container" />
                    </>
                ) : (
                    <>
                        <Input
                            placeholder={t("enterCodePlaceholder")}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            autoFocus
                        />

                        <Button onClick={handleVerifyCode} className="w-full" disabled={loading}>
                            {loading ? t("verifying") : t("verify")}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={handleSendCode}
                            disabled={timer > 0 || loading}
                        >
                            {timer > 0 ? `${t("resendIn")} ${timer} ${t("sec")}` : t("resend")}
                        </Button>
                    </>
                )}
            </div>
        </form>
    );
}
