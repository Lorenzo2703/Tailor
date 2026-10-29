import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Esplora",
    template: "%s | Tailor",
  },
  description: "La demo Tailor, con dati e annunci inventati.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tailor",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#19221f" },
  ],
};

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return <AppShell>{children}</AppShell>;
}