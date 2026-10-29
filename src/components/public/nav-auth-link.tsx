"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { publicContent } from "@/lib/content/public";

export function NavAuthLink() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
        });

        // Listen for login / logout events
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // During SSR and initial load, render a clean link to /account
    if (isAuthenticated === null) {
        return <Link href="/account">{publicContent.nav.login}</Link>;
    }

    if (isAuthenticated) {
        return (
            <Link href="/account" className="font-medium text-emerald-700">
                {publicContent.nav.account}
            </Link>
        );
    }

    return <Link href="/login">{publicContent.nav.login}</Link>;
}
