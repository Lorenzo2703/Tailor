"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { z } from "zod";
import { listingRules } from "@/lib/compliance";
import { listingContent } from "@/lib/content/listings";
import type { ListingFormState } from "@/lib/listings/state";
import { detectPhotoMime, requiresMicrochip } from "@/lib/listings/rules";
import { createClient } from "@/lib/supabase/server";
import {
    animalBasicsSchema,
    healthSchema,
    listingActionSchema,
    newListingSchema,
    photoMetaSchema,
    storySchema,
} from "@/lib/validation/listings";
import { checkRateLimit, rateLimitPolicies } from "@/server/rate-limit";
import { invalidatePublicListing } from "@/server/cache";
import { requireUser } from "@/server/queries/session";

const { errors } = listingContent;
const BUCKET = "listing-photos";
const uuid = z.uuid();

function fail(
    prev: ListingFormState,
    message: string,
    extra: Pick<ListingFormState, "fieldErrors" | "values" | "issues"> = {},
): ListingFormState {
    return { status: "error", message, attempt: prev.attempt + 1, ...extra };
}

function ok(prev: ListingFormState, message: string): ListingFormState {
    return { status: "success", message, attempt: prev.attempt + 1 };
}

function text(value: FormDataEntryValue | null, max = 2000): string {
    return typeof value === "string" ? value.slice(0, max) : "";
}

function databaseMessage(error: { code?: string; message?: string }): string {
    if (error.code === "42501") {
        return errors.forbidden;
    }
    if (error.code === "54000") {
        return errors.photoLimit;
    }
    if (error.code === "23505") {
        return errors.microchipDuplicate;
    }
    return errors.generic;
}

function formValues(formData: FormData, keys: string[]): Record<string, string> {
    return Object.fromEntries(keys.map((key) => [key, text(formData.get(key))]));
}

const basicsKeys = ["name", "species", "sex", "birthDate", "size", "breed", "city", "owner", "listingType"];

export async function createListingDraft(
    prev: ListingFormState,
    formData: FormData,
): Promise<ListingFormState> {
    const user = await requireUser("/my-animals/new");
    const values = formValues(formData, basicsKeys);

    const parsed = newListingSchema.safeParse({
        name: formData.get("name"),
        species: formData.get("species"),
        sex: formData.get("sex"),
        birthDate: formData.get("birthDate"),
        size: formData.get("size"),
        breed: formData.get("breed") ?? undefined,
        city: formData.get("city"),
        owner: formData.get("owner"),
        listingType: formData.get("listingType"),
    });
    if (!parsed.success) {
        return fail(prev, errors.generic, { fieldErrors: z.flattenError(parsed.error).fieldErrors, values });
    }
    const input = parsed.data;

    if (!(await checkRateLimit(rateLimitPolicies.listingCreateUser, user.id))) {
        return fail(prev, errors.rateLimited, { values });
    }

    const supabase = await createClient();
    const personal = input.owner === "personal";
    if (!personal && !uuid.safeParse(input.owner).success) {
        return fail(prev, errors.generic, { fieldErrors: { owner: [errors.owner] }, values });
    }

    // Private individuals can only give animals away; paid sales stay behind a feature flag.
    const listingType = personal ? "gift" : input.listingType;

    if (personal && user.profile?.role === "adopter") {
        const { error } = await supabase.rpc("switch_to_private_account");
        if (error) {
            return fail(prev, databaseMessage(error), { values });
        }
    }

    const { data: animal, error: animalError } = await supabase
        .from("animals")
        .insert({
            name: input.name,
            species: input.species,
            sex: input.sex,
            birth_date: input.birthDate,
            size: input.size,
            breed: input.breed || null,
            city: input.city,
            organization_id: personal ? null : input.owner,
            profile_id: personal ? user.id : null,
        })
        .select("id")
        .single();
    if (animalError || !animal) {
        return fail(prev, animalError ? databaseMessage(animalError) : errors.generic, { values });
    }

    const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({ animal_id: animal.id, type: listingType })
        .select("id")
        .single();
    if (listingError || !listing) {
        await supabase.from("animals").delete().eq("id", animal.id);
        return fail(prev, listingError ? databaseMessage(listingError) : errors.generic, { values });
    }

    redirect(`/my-animals/${listing.id}?step=2`);
}

export async function saveAnimalBasics(
    listingId: string,
    prev: ListingFormState,
    formData: FormData,
): Promise<ListingFormState> {
    if (!uuid.safeParse(listingId).success) {
        return fail(prev, errors.generic);
    }
    await requireUser(`/my-animals/${listingId}`);
    const values = formValues(formData, basicsKeys);

    const parsed = animalBasicsSchema.safeParse({
        name: formData.get("name"),
        species: formData.get("species"),
        sex: formData.get("sex"),
        birthDate: formData.get("birthDate"),
        size: formData.get("size"),
        breed: formData.get("breed") ?? undefined,
        city: formData.get("city"),
    });
    if (!parsed.success) {
        return fail(prev, errors.generic, { fieldErrors: z.flattenError(parsed.error).fieldErrors, values });
    }
    const input = parsed.data;

    const supabase = await createClient();
    const { data: listing } = await supabase.from("listings").select("animal_id").eq("id", listingId).maybeSingle();
    if (!listing) {
        return fail(prev, errors.forbidden);
    }

    const { error } = await supabase
        .from("animals")
        .update({
            name: input.name,
            species: input.species,
            sex: input.sex,
            birth_date: input.birthDate,
            size: input.size,
            breed: input.breed || null,
            city: input.city,
        })
        .eq("id", listing.animal_id);
    if (error) {
        return fail(prev, databaseMessage(error), { values });
    }

    await invalidatePublicListing(supabase, listingId);
    revalidatePath(`/my-animals/${listingId}`);
    return ok(prev, listingContent.saved);
}

export async function saveHealthStep(
    listingId: string,
    prev: ListingFormState,
    formData: FormData,
): Promise<ListingFormState> {
    if (!uuid.safeParse(listingId).success) {
        return fail(prev, errors.generic);
    }
    await requireUser(`/my-animals/${listingId}`);
    const values = formValues(formData, ["healthNotes", "origin", "microchip"]);

    const parsed = healthSchema.safeParse({
        vaccinated: formData.get("vaccinated") ?? undefined,
        sterilized: formData.get("sterilized") ?? undefined,
        healthNotes: formData.get("healthNotes") ?? undefined,
        origin: formData.get("origin"),
        microchip: formData.get("microchip") ?? undefined,
    });
    if (!parsed.success) {
        return fail(prev, errors.generic, { fieldErrors: z.flattenError(parsed.error).fieldErrors, values });
    }
    const input = parsed.data;

    const supabase = await createClient();
    const { data: listing } = await supabase.from("listings").select("animal_id").eq("id", listingId).maybeSingle();
    if (!listing) {
        return fail(prev, errors.forbidden);
    }
    const animalId = listing.animal_id;

    const { error: animalError } = await supabase.from("animals").update({ origin: input.origin }).eq("id", animalId);
    if (animalError) {
        return fail(prev, databaseMessage(animalError), { values });
    }

    const { error: healthError } = await supabase.from("animal_health").upsert(
        {
            animal_id: animalId,
            vaccinated: input.vaccinated,
            sterilized: input.sterilized,
            notes: input.healthNotes || null,
        },
        { onConflict: "animal_id" },
    );
    if (healthError) {
        return fail(prev, databaseMessage(healthError), { values });
    }

    const { error: chipError } = await supabase
        .from("animal_private")
        .upsert({ animal_id: animalId, microchip_number: input.microchip || null }, { onConflict: "animal_id" });
    if (chipError) {
        return fail(prev, databaseMessage(chipError), {
            fieldErrors: chipError.code === "23505" ? { microchip: [errors.microchipDuplicate] } : undefined,
            values,
        });
    }

    await invalidatePublicListing(supabase, listingId);
    revalidatePath(`/my-animals/${listingId}`);
    return ok(prev, listingContent.saved);
}

export async function saveStoryStep(
    listingId: string,
    prev: ListingFormState,
    formData: FormData,
): Promise<ListingFormState> {
    if (!uuid.safeParse(listingId).success) {
        return fail(prev, errors.generic);
    }
    await requireUser(`/my-animals/${listingId}`);
    const values = formValues(formData, ["story", "goodWithKids", "goodWithDogs", "goodWithCats", "apartmentOk"]);

    const parsed = storySchema.safeParse({
        goodWithKids: formData.get("goodWithKids") ?? undefined,
        goodWithDogs: formData.get("goodWithDogs") ?? undefined,
        goodWithCats: formData.get("goodWithCats") ?? undefined,
        apartmentOk: formData.get("apartmentOk") ?? undefined,
        story: formData.get("story"),
    });
    if (!parsed.success) {
        return fail(prev, errors.generic, { fieldErrors: z.flattenError(parsed.error).fieldErrors, values });
    }
    const input = parsed.data;

    const supabase = await createClient();
    const { data: listing } = await supabase.from("listings").select("animal_id").eq("id", listingId).maybeSingle();
    if (!listing) {
        return fail(prev, errors.forbidden);
    }

    const { error } = await supabase
        .from("animals")
        .update({
            story: input.story,
            good_with_kids: input.goodWithKids,
            good_with_dogs: input.goodWithDogs,
            good_with_cats: input.goodWithCats,
            apartment_ok: input.apartmentOk,
        })
        .eq("id", listing.animal_id);
    if (error) {
        return fail(prev, databaseMessage(error), { values });
    }

    await invalidatePublicListing(supabase, listingId);
    revalidatePath(`/my-animals/${listingId}`);
    return ok(prev, listingContent.saved);
}

export async function uploadListingPhoto(
    listingId: string,
    prev: ListingFormState,
    formData: FormData,
): Promise<ListingFormState> {
    if (!uuid.safeParse(listingId).success) {
        return fail(prev, errors.generic);
    }
    const user = await requireUser(`/my-animals/${listingId}`);

    const meta = photoMetaSchema.safeParse({ altText: formData.get("altText") });
    if (!meta.success) {
        return fail(prev, errors.generic, { fieldErrors: z.flattenError(meta.error).fieldErrors });
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
        return fail(prev, errors.fileMissing, { fieldErrors: { file: [errors.fileMissing] } });
    }
    if (file.size > listingRules.maxPhotoInputBytes) {
        return fail(prev, errors.fileTooBig, { fieldErrors: { file: [errors.fileTooBig] } });
    }

    if (!(await checkRateLimit(rateLimitPolicies.listingPhotoUser, user.id))) {
        return fail(prev, errors.rateLimited);
    }

    const original = Buffer.from(await file.arrayBuffer());
    if (!detectPhotoMime(original)) {
        return fail(prev, errors.fileType, { fieldErrors: { file: [errors.fileType] } });
    }

    // Re-encoding to WebP drops EXIF/GPS metadata (sharp strips it by default) and rejects broken images.
    let body: Buffer;
    try {
        body = await sharp(original)
            .rotate()
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
    } catch {
        return fail(prev, errors.fileType, { fieldErrors: { file: [errors.fileType] } });
    }

    const supabase = await createClient();
    const { data: listing } = await supabase.from("listings").select("id").eq("id", listingId).maybeSingle();
    if (!listing) {
        return fail(prev, errors.forbidden);
    }

    const { data: last } = await supabase
        .from("listing_photos")
        .select("position")
        .eq("listing_id", listingId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

    const path = `${listingId}/${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, body, { contentType: "image/webp", upsert: false });
    if (uploadError) {
        return fail(prev, errors.forbidden);
    }

    const { error: insertError } = await supabase.from("listing_photos").insert({
        listing_id: listingId,
        storage_path: path,
        position: (last?.position ?? -1) + 1,
        alt_text: meta.data.altText,
    });
    if (insertError) {
        await supabase.storage.from(BUCKET).remove([path]);
        return fail(prev, databaseMessage(insertError));
    }

    await invalidatePublicListing(supabase, listingId);
    revalidatePath(`/my-animals/${listingId}`);
    return ok(prev, listingContent.photos.added);
}

export async function deleteListingPhoto(photoId: string): Promise<void> {
    if (!uuid.safeParse(photoId).success) {
        return;
    }
    await requireUser("/my-animals");
    const supabase = await createClient();

    const { data: photo } = await supabase
        .from("listing_photos")
        .select("storage_path, listing_id")
        .eq("id", photoId)
        .maybeSingle();
    if (!photo) {
        return;
    }

    const { error } = await supabase.from("listing_photos").delete().eq("id", photoId);
    if (!error) {
        await supabase.storage.from(BUCKET).remove([photo.storage_path]);
    }
    await invalidatePublicListing(supabase, photo.listing_id);
    revalidatePath(`/my-animals/${photo.listing_id}`);
}

export async function publishListing(
    listingId: string,
    prev: ListingFormState,
): Promise<ListingFormState> {
    if (!uuid.safeParse(listingId).success) {
        return fail(prev, errors.generic);
    }
    await requireUser(`/my-animals/${listingId}`);
    const supabase = await createClient();

    const { error } = await supabase.rpc("publish_listing", { p_listing_id: listingId });
    if (error) {
        const match = /compliance:([a-z_,]+)/.exec(error.message);
        if (match) {
            return fail(prev, listingContent.review.blocked, { issues: match[1].split(",") });
        }
        return fail(prev, databaseMessage(error));
    }

    await invalidatePublicListing(supabase, listingId);
    revalidatePath(`/my-animals/${listingId}`);
    revalidatePath("/my-animals");
    return ok(prev, listingContent.manage.done);
}

export async function manageListing(listingId: string, action: string): Promise<void> {
    const parsedAction = listingActionSchema.safeParse(action);
    if (!uuid.safeParse(listingId).success || !parsedAction.success) {
        return;
    }
    await requireUser(`/my-animals/${listingId}`);
    const supabase = await createClient();

    switch (parsedAction.data) {
        case "reserve":
            await supabase.from("listings").update({ status: "reserved" }).eq("id", listingId).eq("status", "published");
            break;
        case "reopen":
            await supabase.from("listings").update({ status: "published" }).eq("id", listingId).eq("status", "reserved");
            break;
        case "adopted":
            await supabase.from("listings").update({ status: "adopted" }).eq("id", listingId).in("status", ["published", "reserved"]);
            break;
        case "withdraw":
            await supabase.from("listings").update({ status: "expired" }).eq("id", listingId).in("status", ["published", "reserved"]);
            break;
        case "extend":
            await supabase.rpc("extend_listing", { p_listing_id: listingId });
            break;
        case "delete": {
            const { data: listing } = await supabase
                .from("listings")
                .select("animal_id, status")
                .eq("id", listingId)
                .maybeSingle();
            if (listing?.status === "draft") {
                const { data: photos } = await supabase.from("listing_photos").select("storage_path").eq("listing_id", listingId);
                const { error } = await supabase.from("animals").delete().eq("id", listing.animal_id);
                if (!error && photos?.length) {
                    await supabase.storage.from(BUCKET).remove(photos.map((photo) => photo.storage_path));
                }
                revalidatePath("/my-animals");
                redirect("/my-animals");
            }
            break;
        }
    }

    await invalidatePublicListing(supabase, listingId);
    revalidatePath(`/my-animals/${listingId}`);
    revalidatePath("/my-animals");
}

export { requiresMicrochip };
