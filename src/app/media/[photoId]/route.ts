import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";

const PUBLIC_CACHE = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
const PRIVATE_CACHE = "private, max-age=300";

function image(file: Blob, cacheControl: string) {
    return new Response(file, {
        headers: {
            "Content-Type": "image/webp",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": cacheControl,
        },
    });
}

// Photos of public listings are served from a cookie-less client so shared caches may keep them;
// anything else (drafts) needs the owner's session and is never cached by shared caches.
export async function GET(_request: Request, context: RouteContext<"/media/[photoId]">) {
    const { photoId } = await context.params;
    if (!z.uuid().safeParse(photoId).success) {
        return new Response("Not found", { status: 404 });
    }

    const anon = createAnonClient();
    const { data: publicPhoto } = await anon
        .from("listing_photos")
        .select("storage_path")
        .eq("id", photoId)
        .maybeSingle();
    if (publicPhoto) {
        const { data: file } = await anon.storage.from("listing-photos").download(publicPhoto.storage_path);
        if (file) {
            return image(file, PUBLIC_CACHE);
        }
    }

    const supabase = await createClient();
    const { data: photo } = await supabase
        .from("listing_photos")
        .select("storage_path")
        .eq("id", photoId)
        .maybeSingle();
    if (!photo) {
        return new Response("Not found", { status: 404 });
    }

    const { data: file } = await supabase.storage.from("listing-photos").download(photo.storage_path);
    if (!file) {
        return new Response("Not found", { status: 404 });
    }

    return image(file, PRIVATE_CACHE);
}
