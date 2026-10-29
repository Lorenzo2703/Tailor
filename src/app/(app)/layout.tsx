import type { Metadata } from "next";
import { PlainShell } from "@/components/auth/plain-shell";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function AppAreaLayout({ children }: LayoutProps<"/">) {
    return <PlainShell width="medium">{children}</PlainShell>;
}
