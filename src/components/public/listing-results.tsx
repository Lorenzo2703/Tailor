import Link from "next/link";
import { ListingCard } from "@/components/public/listing-card";
import { publicContent } from "@/lib/content/public";
import { buildQueryString } from "@/lib/search-params";
import { PAGE_SIZE, type SearchFilters, searchPublicListings } from "@/server/queries/public";

export async function ListingResults({ filters, basePath }: { filters: SearchFilters; basePath: string }) {
    const { rows, total } = await searchPublicListings(filters);
    const copy = publicContent.list;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (rows.length === 0) {
        return (
            <div role="status">
                <p className="pub-lead" style={{ marginTop: 0 }}>
                    <strong>{copy.empty}</strong>
                </p>
                <p className="pub-lead">{copy.emptyHint}</p>
            </div>
        );
    }

    return (
        <>
            <p className="pub-meta" aria-live="polite">
                {copy.results(total)}
            </p>
            <ul className="pub-grid" style={{ marginTop: "1rem" }}>
                {rows.map((row, index) => (
                    <ListingCard key={row.listing_id} item={row} priority={index < 3} />
                ))}
            </ul>
            {pages > 1 ? (
                <nav className="pub-pagination" aria-label="Pagine dei risultati">
                    {filters.page > 1 ? (
                        <Link className="pub-link" href={`${basePath}${buildQueryString(filters, { page: filters.page - 1 })}`} rel="prev">
                            {copy.previous}
                        </Link>
                    ) : (
                        <span />
                    )}
                    <span>{copy.pageOf(filters.page, pages)}</span>
                    {filters.page < pages ? (
                        <Link className="pub-link" href={`${basePath}${buildQueryString(filters, { page: filters.page + 1 })}`} rel="next">
                            {copy.next}
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            ) : null}
        </>
    );
}
