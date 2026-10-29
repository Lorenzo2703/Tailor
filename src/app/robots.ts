import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
    const base = getSiteUrl();
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/account", "/my-animals", "/inquiries", "/animals/*/contact", "/organizations", "/admin", "/auth", "/login", "/signup"],
            },
        ],
        sitemap: `${base}/sitemap.xml`,
        host: base,
    };
}
