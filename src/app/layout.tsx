// src/app/layout.tsx
import {Toaster} from "@/components/ui/sonner";
import {AuthProvider} from "@/providers/auth-provider";
import {GlobalLoaderProvider} from "@/providers/global-loader-provider";
import "./globals.css";

type Props = {
    children: React.ReactNode;
};

export default function RootLayout({ children }: Props) {
    return (
        <html lang="en">
            <body>
            <GlobalLoaderProvider>
                <AuthProvider>{children}</AuthProvider>
                <Toaster position="top-right" richColors closeButton />
            </GlobalLoaderProvider>
            </body>
        </html>
    );
}