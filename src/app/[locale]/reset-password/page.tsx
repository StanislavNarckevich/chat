"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RequestForm from "@/components/reset-password/request-form";
import VerifyForm from "@/components/reset-password/verify-form";
import NewPasswordForm from "@/components/reset-password/new-password-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {IoMdArrowRoundBack} from "react-icons/io";

export default function ResetPasswordPage() {
    const [step, setStep] = useState<"email" | "verify" | "new">("email");
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");

    const router = useRouter();

    function goBack() {
        if (step === "email") {
            router.push("/login"); // Выход на страницу логина
        } else if (step === "verify") {
            setStep("email");
        } else if (step === "new") {
            setStep("verify");
        }
    }

    return (
        <div className="flex items-center justify-center w-full bg-gray-50 dark:bg-black">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 relative overflow-hidden">

                <Button variant="secondary" className="mb-3 -ml-2 cursor-pointer" onClick={goBack} >
                    <IoMdArrowRoundBack />
                </Button>

                <AnimatePresence mode="wait">
                    {step === "email" && (
                        <motion.div
                            key="email"
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -40, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <RequestForm
                                email={email}
                                setEmail={setEmail}
                                onSuccess={() => setStep("verify")}
                            />
                        </motion.div>
                    )}

                    {step === "verify" && (
                        <motion.div
                            key="verify"
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -40, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <VerifyForm
                                email={email}
                                setToken={setToken}
                                onSuccess={() => setStep("new")}
                            />
                        </motion.div>
                    )}

                    {step === "new" && (
                        <motion.div
                            key="new"
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -40, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <NewPasswordForm
                                email={email}
                                token={token}
                                onSuccess={() => router.push("/login")}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
