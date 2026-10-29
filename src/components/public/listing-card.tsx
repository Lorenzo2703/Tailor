import Image from "next/image";
import Link from "next/link";
import { publicContent } from "@/lib/content/public";

type CardData = {
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
    distance_km?: number | null;
};

export function ListingCard({ item, priority = false }: { item: CardData; priority?: boolean }) {
    if (!item.slug || !item.name || !item.species) {
        return null;
    }
    const copy = publicContent;

    return (
        <li>
            <Link className="pub-card" href={`/animals/${item.slug}`}>
                <div className="pub-card-media">
                    {item.cover_photo_id ? (
                        <Image
                            src={`/media/${item.cover_photo_id}`}
                            alt={item.cover_photo_alt ?? `${copy.detail.photosLabel} ${item.name}`}
                            fill
                            sizes="(min-width: 62rem) 18rem, (min-width: 40rem) 45vw, 92vw"
                            priority={priority}
                        />
                    ) : null}
                </div>
                <div className="pub-card-body">
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
                </div>
            </Link>
        </li>
    );
}
