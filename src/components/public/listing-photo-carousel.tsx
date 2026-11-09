"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { publicContent } from "@/lib/content/public";

const copy = publicContent.card.carousel;

export function ListingPhotoCarousel({
    photos,
    name,
    href,
    priority = false,
}: {
    photos: { id: string; alt_text: string }[];
    name: string;
    href: string;
    priority?: boolean;
}) {
    const [api, setApi] = useState<CarouselApi>();
    const [selected, setSelected] = useState(0);

    useEffect(() => {
        if (!api) return;
        const onSelect = () => setSelected(api.selectedScrollSnap());
        api.on("select", onSelect);
        api.on("reInit", onSelect);
        return () => {
            api.off("select", onSelect);
            api.off("reInit", onSelect);
        };
    }, [api]);

    if (photos.length === 0) {
        return <Link href={href} className="pub-card-media" aria-label={name} />;
    }

    return (
        <Carousel className="listing-photo-carousel" setApi={setApi} opts={{ loop: false }}
            aria-label={copy.label(name)} aria-roledescription={copy.role}>
            <CarouselContent>
                {photos.map((photo, index) => (
                    <CarouselItem key={photo.id} aria-label={copy.position(index + 1, photos.length)}
                        aria-roledescription={copy.slide}>
                        <Link href={href} className="pub-card-media" tabIndex={index === selected ? 0 : -1}>
                            <Image src={`/media/${photo.id}`} alt={photo.alt_text} fill
                                sizes="(min-width: 62rem) 18rem, (min-width: 40rem) 45vw, 92vw"
                                priority={priority && index === 0} />
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            {photos.length > 1 ? (
                <>
                    <CarouselPrevious aria-label={copy.previous} />
                    <CarouselNext aria-label={copy.next} />
                    <span className="listing-photo-count" aria-live="polite" aria-atomic="true">
                        {copy.position(selected + 1, photos.length)}
                    </span>
                </>
            ) : null}
        </Carousel>
    );
}
