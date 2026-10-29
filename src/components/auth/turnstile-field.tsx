"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

type TurnstileApi = {
    render: (container: HTMLElement, options: { sitekey: string; language: string; theme: string }) => string;
    reset: (widgetId: string) => void;
    remove: (widgetId: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

// Renders the Cloudflare widget; it injects the `cf-turnstile-response` input into the enclosing form.
export function TurnstileField({ resetKey }: { resetKey: number }) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const renderWidget = useCallback(() => {
        if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) {
            return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            language: "it",
            theme: "auto",
        });
    }, [siteKey]);

    useEffect(() => {
        renderWidget();
        return () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [renderWidget]);

    useEffect(() => {
        if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
        }
    }, [resetKey]);

    if (!siteKey) {
        return null;
    }

    return (
        <>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
                onReady={renderWidget}
            />
            <div ref={containerRef} className="auth-turnstile" />
        </>
    );
}
