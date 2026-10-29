"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { favoriteToggleSchema, deleteAccountSchema } from "@/lib/validation/favorites";
import { favoritesContent } from "@/lib/content/favorites";

export async function toggleFavorite(formData: FormData) {
    const rawListingId = formData.get("listingId");
    const parsed = favoriteToggleSchema.safeParse({ listingId: rawListingId });

    if (!parsed.success) {
        return { error: favoritesContent.errors.invalidListing };
    }

    const { listingId } = parsed.data;
    const supabase = await createClient();
    const { data: userRes, error: authError } = await supabase.auth.getUser();

    if (authError || !userRes.user) {
        return { error: favoritesContent.errors.unauthenticated };
    }

    const userId = userRes.user.id;

    // Check if already in favorites
    const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("profile_id", userId)
        .eq("listing_id", listingId)
        .maybeSingle();

    if (existing) {
        const { error: delError } = await supabase
            .from("favorites")
            .delete()
            .eq("profile_id", userId)
            .eq("listing_id", listingId);

        if (delError) {
            return { error: favoritesContent.errors.generic };
        }

        revalidatePath("/favorites");
        revalidatePath(`/animals`);
        return { isFavorited: false };
    } else {
        const { error: insError } = await supabase
            .from("favorites")
            .insert({ profile_id: userId, listing_id: listingId });

        if (insError) {
            return { error: favoritesContent.errors.generic };
        }

        revalidatePath("/favorites");
        revalidatePath(`/animals`);
        return { isFavorited: true };
    }
}

export async function exportUserData() {
    const supabase = await createClient();
    const { data: userRes, error: authError } = await supabase.auth.getUser();

    if (authError || !userRes.user) {
        return { error: favoritesContent.errors.unauthenticated };
    }

    const { data, error } = await supabase.rpc("export_user_data", {
        user_id: userRes.user.id,
    });

    if (error) {
        return { error: favoritesContent.errors.generic };
    }

    return { data };
}

export async function deleteAccount(formData: FormData) {
    const rawConf = formData.get("confirmation");
    const parsed = deleteAccountSchema.safeParse({ confirmation: rawConf });

    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? favoritesContent.errors.generic };
    }

    const supabase = await createClient();
    const { data: userRes, error: authError } = await supabase.auth.getUser();

    if (authError || !userRes.user) {
        return { error: favoritesContent.errors.unauthenticated };
    }

    const userId = userRes.user.id;

    // Delete user using Admin client (auth.admin.deleteUser triggers on delete cascade on profiles)
    const admin = createAdminClient();
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
        return { error: favoritesContent.errors.generic };
    }

    await supabase.auth.signOut();
    return { success: true };
}
