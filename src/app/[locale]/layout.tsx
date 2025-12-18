// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Header } from "@/components/header";

export const metadata: Metadata = {
    title: "Topli Chat",
    description: "Internal communication platform",
};

interface Props {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;

    let messages;
    try {
        messages = (await import(`@/messages/${locale}.json`)).default;
    } catch {
        messages = (await import(`@/messages/en.json`)).default;
    }

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    {children}
                </main>
            </div>
        </NextIntlClientProvider>
    );
}
