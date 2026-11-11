import Link from "next/link";
import { publicContent } from "@/lib/content/public";
import { ListingPhotoCarousel } from "@/components/public/listing-photo-carousel";

export type ListingCardData = {
    slug: string | null;
    name: string | null;
    species: "dog" | "cat" | null;
    sex: "M" | "F" | null;
    birth_date: string | null;
    age: string | null;
    city: string | null;
    organization_name: string | null;
    listing_status: string | null;
    listing_type: "adoption" | "gift" | null;
    cover_photo_id: string | null;
    cover_photo_alt: string | null;
    photos: { id: string; alt_text: string }[];
    distance_km?: number | null;
};

export function ListingCard({
    item,
    priority = false,
    preview = false,
}: {
    item: ListingCardData;
    priority?: boolean;
    preview?: boolean;
}) {
    if ((!preview && !item.slug) || !item.name || !item.species) {
        return null;
    }
    const copy = publicContent;
    const href = item.slug ? `/animals/${item.slug}` : "/animals";
    const body = (
        <>
            <h3>{item.name}</h3>
            <p className="pub-meta">
                {copy.species[item.species]}
                {item.sex ? ` · ${copy.sexes[item.sex]}` : ""}
                {item.age ? ` · ${item.age}` : ""}
            </p>
            <p className="pub-meta">
                {item.city}
                {typeof item.distance_km === "number" ? ` · ${copy.list.distance(item.distance_km)}` : ""}
            </p>
            <p className="pub-meta">
                {item.organization_name ?? copy.card.privateOwner}
                {item.listing_type ? ` · ${copy.card[item.listing_type]}` : ""}
                {item.listing_status === "reserved" ? ` · ${copy.card.reserved}` : ""}
            </p>
        </>
    );

    return (
        <li>
            <article className={`pub-card${preview ? " pub-card-preview" : ""}`}>
                <ListingPhotoCarousel photos={item.photos} name={item.name} href={href} priority={priority} preview={preview} />
                {preview ? <div className="pub-card-body">{body}</div> : <Link className="pub-card-body" href={href}>{body}</Link>}
            </article>
        </li>
    );
}
