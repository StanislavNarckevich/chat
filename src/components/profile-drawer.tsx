"use client";

import { useEffect, useState } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { signOut, updateProfile, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";


interface ProfileDrawerProps {
    user: User | null;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function ProfileDrawer({ user, open, setOpen }: ProfileDrawerProps) {
    const t = useTranslations("profile");
    const router = useRouter();
    const { profile } = useUserProfile(user, open);
    const [loading, setLoading] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const [form, setForm] = useState({
        name: "",
        position: "",
        company: "",
        language: "TR",
        notification: "email",
    });

    useEffect(() => {
        if (profile && open) {
            setForm({
                name: profile.name || "",
                position: profile.position || "",
                company: profile.company || "",
                language: profile.language || "TR",
                notification: profile.notification || "email",
            });
        }

        if (photoFile && open) {
            setPhotoFile(null);
        }
    }, [profile, open]);

    const handleLogout = async () => {
        await signOut(auth);
        setOpen(false);
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);

        // ---------- Upload avatar ----------
        let uploadedPhotoURL = user.photoURL || null;

        if (photoFile) {
            const formData = new FormData();
            formData.append("file", photoFile);
            formData.append("uid", user.uid);

            const res = await fetch("/api/auth/upload-avatar", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            uploadedPhotoURL = data.url;
        }

        // ---------- Update Firebase profile ----------
        await updateProfile(user, {
            displayName: form.name,
            photoURL: uploadedPhotoURL,
        });

        // ---------- Save to Firestore via API ----------
        await fetch("/api/auth/save-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                phone: user.phoneNumber,
                name: form.name,
                photoURL: uploadedPhotoURL,
                position: form.position,
                company: form.company,
                language: form.language,
                notification: form.notification,
                role: profile.role,
            }),
        });

        setLoading(false);
        setOpen(false);

        toast.success(t("saved"));
    };

    return (
        <Drawer open={open} onOpenChange={setOpen} direction="right">
            <DrawerContent className="w-80 ml-auto h-full p-4 flex flex-col gap-4">

                <DrawerHeader>
                    <DrawerTitle>{t("title")}</DrawerTitle>
                    <DrawerDescription>{t("description")}</DrawerDescription>
                </DrawerHeader>

                <div className="space-y-6 p-4 overflow-y-auto">

                    {/* Avatar upload */}
                    <div className="flex flex-col space-y-2">
                        <Label>{t("avatar")}</Label>

                        <div className="relative w-20 h-20">
                            <Avatar className="w-20 h-20">
                                <AvatarImage
                                    src={
                                        photoFile
                                            ? URL.createObjectURL(photoFile)
                                            : user?.photoURL || undefined
                                    }
                                />
                                <AvatarFallback>
                                    {form.name
                                        ? form.name
                                            .split(" ")
                                            .map((w) => w[0])
                                            .join("")
                                            .toUpperCase()
                                        : "?"}
                                </AvatarFallback>
                            </Avatar>

                            <label
                                htmlFor="avatarUpload"
                                className="absolute bottom-0 right-0 bg-black/60 p-1.5 rounded-full cursor-pointer hover:bg-black/80 transition"
                            >
                                <Camera className="w-4 h-4 text-white" />
                            </label>

                            <input
                                id="avatarUpload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setPhotoFile(e.target.files[0]);
                                    }
                                }}
                            />

                        </div>
                    </div>

                    {/* Name */}
                    <div className="flex flex-col space-y-2">
                        <Label>{t("name")}</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    {/* Position */}
                    <div className="flex flex-col space-y-2">
                        <Label>{t("position")}</Label>
                        <Input
                            value={form.position}
                            onChange={(e) => setForm({ ...form, position: e.target.value })}
                        />
                    </div>

                    {/* Company */}
                    <div className="flex flex-col space-y-2">
                        <Label>{t("company")}</Label>
                        <Input
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                        />
                    </div>

                    <div className="flex space-x-10">
                        {/* Language */}
                        <div className="flex flex-col space-y-2">
                            <Label>{t("language")}</Label>
                            <Select
                                value={form.language}
                                onValueChange={(v) =>
                                    setForm({ ...form, language: v })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("chooseLanguage")} />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="TR">TR</SelectItem>
                                        <SelectItem value="EN">EN</SelectItem>
                                        <SelectItem value="RU">RU</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notifications */}
                        <div className="flex flex-col space-y-2">
                            <Label>{t("notification")}</Label>
                            <Select
                                value={form.notification}
                                onValueChange={(v) =>
                                    setForm({ ...form, notification: v })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("chooseNotification")} />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="email">{t("email")}</SelectItem>
                                        <SelectItem value="sms">{t("sms")}</SelectItem>
                                        <SelectItem value="whatsapp">
                                            {t("whatsapp")}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col space-y-2">
                        <Label>{t("phone")}</Label>
                        <Input value={user?.phoneNumber || ""} disabled />
                    </div>

                    {/* Role */}
                    <div className="flex flex-col space-y-2">
                        <Label>{t("role")}</Label>
                        <Input value={profile?.role ?? ""} disabled />
                    </div>
                </div>

                <DrawerFooter className="mt-auto">
                    <Button
                        onClick={handleSave}
                        className="w-full"
                        disabled={loading}
                    >
                        {t("save")}
                    </Button>

                    <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="w-full mt-2"
                    >
                        {t("logout")}
                    </Button>
                </DrawerFooter>

            </DrawerContent>
        </Drawer>
    );
}
