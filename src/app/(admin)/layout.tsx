import type { Metadata } from "next";
import { PlainShell } from "@/components/auth/plain-shell";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/">) {
    return <PlainShell width="wide">{children}</PlainShell>;
}
