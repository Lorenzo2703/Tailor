"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { legalContent } from "@/lib/content/legal";

export function CookieConsentBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("tailor_cookie_consent");
        if (!consent) {
            setVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("tailor_cookie_consent", "accepted");
        setVisible(false);
    };

    if (!visible) return null;

    const { cookie } = legalContent;

    return (
        <aside
            aria-label="Informativa Cookie"
            className="fixed bottom-0 inset-x-0 z-50 border-t border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:p-5"
        >
            <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <p className="text-xs text-neutral-600 sm:text-sm">
                    {cookie.bannerText}{" "}
                    <Link href="/privacy" className="font-medium text-emerald-700 underline hover:text-emerald-800">
                        {cookie.privacyLink}
                    </Link>
                </p>
                <button
                    type="button"
                    onClick={handleAccept}
                    className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                    {cookie.acceptButton}
                </button>
            </div>
        </aside>
    );
}
