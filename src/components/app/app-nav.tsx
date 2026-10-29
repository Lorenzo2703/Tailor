"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Compass, Heart, House, type LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  available: boolean;
};

const navItems: NavItem[] = [
  { href: "/animals", label: "Esplora", icon: Compass, available: true },
  { href: "/favorites", label: "Preferiti", icon: Heart, available: true },
  { href: "/account", label: "Account", icon: House, available: true },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-bottom-nav" aria-label="Navigazione principale">
      <div className="app-bottom-nav-inner">
        {navItems.map(({ href, label, icon: Icon, available }) => {
          const isActive =
            href === "/app"
              ? pathname === href
              : pathname.startsWith(href);
          const className = "app-nav-item";

          if (!available) {
            return (
              <span
                key={href}
                className={className}
                aria-disabled="true"
                title="Disponibile in una prossima schermata"
              >
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </span>
            );
          }

          return (
            <Link
              key={href}
              className={className}
              href={href}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}