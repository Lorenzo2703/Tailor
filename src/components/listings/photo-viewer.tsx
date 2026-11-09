"use client";

import { useMemo, useState, type ReactNode } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { listingContent } from "@/lib/content/listings";

type Photo = { id: string; alt_text: string };

const copy = listingContent.photos.viewer;
const plugins = [Zoom];

export function PhotoViewer({
    photos,
    initialIndex,
    children,
}: {
    photos: Photo[];
    initialIndex: number;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const slides = useMemo(() => photos.map((photo) => ({
        src: `/media/${photo.id}`,
        alt: photo.alt_text,
    })), [photos]);

    return (
        <>
            <button
                type="button"
                className="photo-open"
                aria-label={copy.open(photos[initialIndex].alt_text)}
                aria-haspopup="dialog"
                onClick={() => setOpen(true)}
            >
                {children}
            </button>
            <Lightbox
                open={open}
                close={() => setOpen(false)}
                index={initialIndex}
                slides={slides}
                plugins={plugins}
                className="animal-lightbox"
                zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true }}
                carousel={{ finite: photos.length === 1 }}
                labels={{
                    Lightbox: copy.title,
                    Close: copy.close,
                    Previous: copy.previous,
                    Next: copy.next,
                    "Zoom in": copy.zoomIn,
                    "Zoom out": copy.zoomOut,
                    Slide: copy.slide,
                    Carousel: copy.gallery,
                    "Photo gallery": copy.gallery,
                    "{index} of {total}": copy.positionTemplate,
                }}
            />
        </>
    );
}
