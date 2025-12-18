"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type LoaderContextValue = {
    globalLoading: boolean;
    setGlobalLoading: (value: boolean) => void;
};

const LoaderContext = createContext<LoaderContextValue>({
    globalLoading: false,
    setGlobalLoading: () => {},
});

export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
    const [globalLoading, setGlobalLoading] = useState(false);

    return (
        <LoaderContext.Provider value={{ globalLoading, setGlobalLoading }}>
            {children}

            {globalLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
                    <div className="h-12 w-12 border-4 border-white/50 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </LoaderContext.Provider>
    );
}

export const useGlobalLoader = () => useContext(LoaderContext);
