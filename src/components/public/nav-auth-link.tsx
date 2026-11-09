"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
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

    const renderAccountLink = (href: string, label: string) => (
        <Link href={href} className="public-nav-account" aria-label={label} title={label}>
            <UserRound aria-hidden="true" />
        </Link>
    );

    // During SSR and initial load, render an accessible icon link to the account.
    if (isAuthenticated === null) {
        return renderAccountLink("/account", publicContent.nav.login);
    }

    if (isAuthenticated) {
        return renderAccountLink("/account", publicContent.nav.account);
    }

    return renderAccountLink("/login", publicContent.nav.login);
}
