"use client";

import { useTransition, useState } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/server/actions/favorites";

interface FavoriteButtonProps {
    listingId: string;
    initialFavorited?: boolean;
    className?: string;
}

export function FavoriteButton({ listingId, initialFavorited = false, className = "" }: FavoriteButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [favorited, setFavorited] = useState(initialFavorited);

    const handleToggle = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("listingId", listingId);
            const res = await toggleFavorite(formData);
            if (res && "isFavorited" in res && res.isFavorited !== undefined) {
                setFavorited(res.isFavorited);
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            aria-label={favorited ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
            className={`inline-flex items-center justify-center rounded-full p-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                favorited
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "bg-white/80 text-neutral-600 backdrop-blur-sm hover:bg-white hover:text-neutral-900"
            } ${className}`}
        >
            <Heart className={`h-5 w-5 ${favorited ? "fill-current" : ""}`} />
        </button>
    );
}
