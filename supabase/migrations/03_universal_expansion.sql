-- EventFlow AI - Universal Organizer & Flexible Registration Schema Migration

-- 1. Remove restrictive event_type check constraint so ANY event type is supported
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_type_check;

-- 2. Add audience_type and custom_questions to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'general';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- 3. Relax student-only constraints on participants table and add professional fields
ALTER TABLE public.participants ALTER COLUMN college DROP NOT NULL;
ALTER TABLE public.participants ALTER COLUMN branch DROP NOT NULL;
ALTER TABLE public.participants ALTER COLUMN year DROP NOT NULL;
ALTER TABLE public.participants ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS role TEXT;

-- 4. Add referral tracking and custom answers to registrations table
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS referral_source TEXT DEFAULT 'direct';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb;

-- Index for referral analytics
CREATE INDEX IF NOT EXISTS idx_registrations_referral ON public.registrations(referral_source);
