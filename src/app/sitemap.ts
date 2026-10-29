import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { getSitemapEntries } from "@/server/queries/public";

// Only public, indexable URLs: no drafts, removed listings, authenticated pages or thin city pages.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = getSiteUrl();
    const { listings, organizations, adoptPages } = await getSitemapEntries();

    return [
        { url: `${base}/animals`, changeFrequency: "daily", priority: 0.9 },
        ...adoptPages.map((page) => ({ url: `${base}${page.path}`, changeFrequency: "daily" as const, priority: 0.7 })),
        ...listings.map((listing) => ({
            url: `${base}/animals/${listing.slug}`,
            lastModified: listing.publishedAt ?? undefined,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })),
        ...organizations.map((organization) => ({
            url: `${base}/shelters/${organization.slug}`,
            lastModified: organization.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.6,
        })),
    ];
}
