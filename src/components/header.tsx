"use client";

import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuthContext } from "@/providers/auth-provider";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import  ProfileDrawer  from "@/components/profile-drawer";

export function Header() {
    const { user } = useAuthContext();
    const t = useTranslations("header");

    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
            <div className="container mx-auto flex justify-between items-center h-16 px-4">
                <h1 className="font-semibold text-lg">Topli Chat</h1>

                <div className="flex items-center gap-3">
                    <LanguageSwitcher />

                    {user && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
                        >
                            <Avatar
                                className="cursor-pointer border w-12 h-12"
                                onClick={() => setOpen(true)}
                            >
                                <AvatarImage src={user.photoURL || undefined} />
                                <AvatarFallback>
                                    {user.displayName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </motion.div>
                    )}
                </div>
            </div>

            <ProfileDrawer user={user} open={open} setOpen={setOpen} />
        </header>
    );
}
