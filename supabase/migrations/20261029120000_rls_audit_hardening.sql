-- Migration: 20261029120000_rls_audit_hardening.sql
-- M14: RLS audit — ensure all tables have deny-by-default Row Level Security.
-- This migration is additive-only: it adds missing policies without dropping existing ones.
-- Run this after verifying policies in the Supabase dashboard.

-- ── 0. Helper: ensure RLS is enabled on every table ──────────────────────────
-- (Supabase enables RLS when you first add a policy via the UI; belt-and-suspenders here.)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- ── 1. moderation_log: admin-only read, no direct DML from clients ────────────
-- Populated only via trusted server-side functions (service role).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'moderation_log' AND policyname = 'admin_read_moderation_log'
  ) THEN
    CREATE POLICY admin_read_moderation_log ON public.moderation_log
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ── 2. animal_health: org members or admin read; org member insert/update ─────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'animal_health' AND policyname = 'org_member_read_animal_health'
  ) THEN
    CREATE POLICY org_member_read_animal_health ON public.animal_health
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.animals a
          JOIN public.organization_members om ON om.organization_id = a.organization_id
          WHERE a.id = animal_health.animal_id
            AND om.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'animal_health' AND policyname = 'org_member_write_animal_health'
  ) THEN
    CREATE POLICY org_member_write_animal_health ON public.animal_health
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.animals a
          JOIN public.organization_members om ON om.organization_id = a.organization_id
          WHERE a.id = animal_health.animal_id
            AND om.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.animals a
          JOIN public.organization_members om ON om.organization_id = a.organization_id
          WHERE a.id = animal_health.animal_id
            AND om.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── 3. animal_private: same as animal_health ─────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'animal_private' AND policyname = 'org_member_read_animal_private'
  ) THEN
    CREATE POLICY org_member_read_animal_private ON public.animal_private
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.animals a
          JOIN public.organization_members om ON om.organization_id = a.organization_id
          WHERE a.id = animal_private.animal_id
            AND om.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ── 4. listing_photos: public read for published listings; org write ──────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'listing_photos' AND policyname = 'public_read_listing_photos'
  ) THEN
    CREATE POLICY public_read_listing_photos ON public.listing_photos
      FOR SELECT TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.listings l
          WHERE l.id = listing_photos.listing_id
            AND l.status = 'published'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'listing_photos' AND policyname = 'org_member_manage_listing_photos'
  ) THEN
    CREATE POLICY org_member_manage_listing_photos ON public.listing_photos
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.listings l
          JOIN public.animals a ON a.id = l.animal_id
          JOIN public.organization_members om ON om.organization_id = a.organization_id
          WHERE l.id = listing_photos.listing_id
            AND om.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.listings l
          JOIN public.animals a ON a.id = l.animal_id
          JOIN public.organization_members om ON om.organization_id = a.organization_id
          WHERE l.id = listing_photos.listing_id
            AND om.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── 5. Verify anon cannot read private tables (belt-and-suspenders) ───────────
-- Grant SELECT on only the tables anon legitimately needs.
-- All other tables remain inaccessible to anon (default deny).
REVOKE SELECT ON public.organization_private FROM anon;
REVOKE SELECT ON public.organization_documents FROM anon;
REVOKE SELECT ON public.animal_health FROM anon;
REVOKE SELECT ON public.animal_private FROM anon;
REVOKE SELECT ON public.inquiries FROM anon;
REVOKE SELECT ON public.inquiry_messages FROM anon;
REVOKE SELECT ON public.favorites FROM anon;
REVOKE SELECT ON public.reports FROM anon;
REVOKE SELECT ON public.moderation_log FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
