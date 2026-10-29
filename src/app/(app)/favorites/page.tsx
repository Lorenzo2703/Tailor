import type { Metadata } from "next";
import Link from "next/link";
import { getMyFavorites } from "@/server/queries/favorites";
import { requireUser } from "@/server/queries/session";
import { favoritesContent } from "@/lib/content/favorites";
import { FavoriteButton } from "@/components/app/favorite-button";
import { formatAge } from "@/lib/text";

export const metadata: Metadata = {
    title: `${favoritesContent.title} | Tailor`,
};

export const instant = false;

export default async function FavoritesPage() {
    await requireUser("/favorites");
    const favorites = await getMyFavorites();

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                    {favoritesContent.title}
                </h1>
                <p className="mt-2 text-sm text-neutral-600 sm:text-base">
                    {favoritesContent.subtitle}
                </p>
            </header>

            {favorites.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center">
                    <h2 className="text-lg font-semibold text-neutral-900">
                        {favoritesContent.empty.title}
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600">
                        {favoritesContent.empty.description}
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/animals"
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                        >
                            {favoritesContent.empty.action}
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {favorites.map(({ listingId, animal, photoUrl }) => (
                        <article
                            key={listingId}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs transition hover:shadow-md"
                        >
                            <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
                                {photoUrl ? (
                                    <img
                                        src={`/media/${listingId}`}
                                        alt={animal.name}
                                        className="h-full w-full object-cover transition group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                                        Nessuna foto
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 z-10">
                                    <FavoriteButton
                                        listingId={listingId}
                                        initialFavorited={true}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col p-4">
                                <div className="flex items-baseline justify-between gap-2">
                                    <h3 className="text-lg font-semibold text-neutral-900">
                                        <Link href={`/animals/${animal.id}`} className="hover:underline">
                                            {animal.name}
                                        </Link>
                                    </h3>
                                    <span className="text-xs text-neutral-500">
                                        {formatAge(animal.birth_date)}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-neutral-600">
                                    {animal.breed ?? (animal.species === "dog" ? "Cane" : "Gatto")} • {animal.city}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
