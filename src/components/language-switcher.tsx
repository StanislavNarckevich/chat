"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import clsx from "clsx";
import {useSearchParams} from "next/navigation";

const languages = [
    { code: "ru", name: "Русский", flag: "ru" },
    { code: "en", name: "English", flag: "gb" },
    { code: "tr", name: "Türkçe", flag: "tr" },
];

export function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const searchParams = useSearchParams();

    const handleChange = (newLocale: string) => {
        const params = searchParams.toString();
        const pathWithQuery = params ? `${pathname}?${params}` : pathname;

        router.replace(pathWithQuery, { locale: newLocale });
    };

    return (
        <Select defaultValue={locale} onValueChange={handleChange}>
            <SelectTrigger className="w-[150px] bg-background border rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                    <SelectValue placeholder="Select language" />
                </div>
            </SelectTrigger>
            <SelectContent>
                {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                            <span className={clsx("fi", `fi-${lang.flag}`, "rounded-sm")} />
                            <span>{lang.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
