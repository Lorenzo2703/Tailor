-- Migration: 20261029120000_rls_audit_hardening.sql
-- M14: RLS audit — ensure all tables have deny-by-default Row Level Security.
-- This migration is additive-only: it adds missing policies without dropping existing valid ones.

-- ── 0. Helper: ensure RLS is enabled on every table ──────────────────────────
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

-- ── 2. Belt-and-suspenders: anon cannot read strictly private tables ──────────
-- Note: animal_health and listing_photos are intentionally readable by anon for published listings.
REVOKE SELECT ON public.organization_private FROM anon;
REVOKE SELECT ON public.organization_documents FROM anon;
REVOKE SELECT ON public.animal_private FROM anon;
REVOKE SELECT ON public.inquiries FROM anon;
REVOKE SELECT ON public.inquiry_messages FROM anon;
REVOKE SELECT ON public.favorites FROM anon;
REVOKE SELECT ON public.reports FROM anon;
REVOKE SELECT ON public.moderation_log FROM anon;
REVOKE SELECT ON public.profiles FROM anon;

-- Ensure public view can read public health facts
GRANT SELECT ON public.animal_health TO anon, authenticated;
