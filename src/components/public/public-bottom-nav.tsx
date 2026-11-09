"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MessageCircle, UserRound, type LucideIcon } from "lucide-react";

const items: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/animals", label: "Home", icon: House },
    { href: "/inquiries", label: "Chat", icon: MessageCircle },
    { href: "/account", label: "Profilo", icon: UserRound },
];

export function PublicBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="public-bottom-nav" aria-label="Navigazione mobile">
            {items.map(({ href, label, icon: Icon }) => {
                const isActive = href === "/animals"
                    ? pathname === "/" || pathname.startsWith(href)
                    : pathname === href || pathname.startsWith(`${href}/`);

                return (
                    <Link
                        key={href}
                        href={href}
                        className="public-bottom-nav-item"
                        aria-current={isActive ? "page" : undefined}
                    >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}