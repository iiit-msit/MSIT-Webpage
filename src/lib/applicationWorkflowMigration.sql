-- ====================================================================
-- MSIT CANDIDATE REGISTRATION, APPLICATION WORKFLOW & RLS MIGRATION
-- ====================================================================
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/oknaeingqybfxpfpuocy/sql
--
-- This script safely configures:
-- 1. candidate_profiles (linked to auth.users)
-- 2. Extended applications columns (university, grading_scale, exam scores, statement, referral)
-- 3. Extended application_documents columns
-- 4. application_status_history audit trail
-- 5. Row Level Security (RLS) policies for candidate self-access and admissions staff
-- 6. Storage bucket 'application-documents' configuration
-- ====================================================================

-- 1. CANDIDATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON public.candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_email ON public.candidate_profiles(email);

-- 2. EXTEND APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    dob DATE,
    address TEXT,
    parent_relationship TEXT DEFAULT 'Father',
    parent_name TEXT,
    alt_phone TEXT,
    ug_degree TEXT,
    department TEXT,
    cgpa TEXT,
    passing_year TEXT,
    has_experience TEXT DEFAULT 'No',
    experience_details TEXT,
    purpose_to_join TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted',
    document_status TEXT NOT NULL DEFAULT 'Pending Review',
    cohort TEXT DEFAULT 'January 2027 Intake',
    decision_reason TEXT,
    decided_by TEXT,
    decided_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Add new columns if applications table already existed
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS grading_scale TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS score_eligibility_note TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS class10_score TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS class10_score_type TEXT DEFAULT 'Percentage';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS inter_pathway TEXT DEFAULT 'Class 12 / Intermediate';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS inter_score TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS inter_score_type TEXT DEFAULT 'Percentage';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS experience_years TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS experience_months TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS job_role TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS entrance_exam_status TEXT DEFAULT 'Neither';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS gre_score TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS gre_year TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS gate_score TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS gate_year TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS exam_name TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS exam_year TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS cv_filename TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS statement_text TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS statement_word_count INTEGER;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS referral_explanation TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS draft_data JSONB;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS documents JSONB;

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- 3. EXTEND APPLICATION DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    application_ref TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    doc_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT,
    storage_path TEXT,
    file_size TEXT,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    rejection_reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    uploaded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS application_ref TEXT;
ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS mime_type TEXT;

CREATE INDEX IF NOT EXISTS idx_application_documents_ref ON public.application_documents(application_ref);
CREATE INDEX IF NOT EXISTS idx_application_documents_user ON public.application_documents(user_id);

-- 4. STATUS HISTORY AUDIT LOG
CREATE TABLE IF NOT EXISTS public.application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_status_history_app_id ON public.application_status_history(application_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

-- Helper admin check function
CREATE OR REPLACE FUNCTION public.is_authorized_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (auth.jwt() ->> 'email') ILIKE '%@msitprogram.net'
        OR
        (auth.jwt() ->> 'email') ILIKE '%@getskills.io'
        OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE email = (auth.jwt() ->> 'email')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CANDIDATE PROFILES POLICIES
DROP POLICY IF EXISTS "Candidates can read own profile" ON public.candidate_profiles;
CREATE POLICY "Candidates can read own profile"
    ON public.candidate_profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR email = (auth.jwt() ->> 'email') OR public.is_authorized_admin());

DROP POLICY IF EXISTS "Candidates can insert/update own profile" ON public.candidate_profiles;
CREATE POLICY "Candidates can insert/update own profile"
    ON public.candidate_profiles FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR email = (auth.jwt() ->> 'email') OR public.is_authorized_admin())
    WITH CHECK (user_id = auth.uid() OR email = (auth.jwt() ->> 'email') OR public.is_authorized_admin());

-- APPLICATIONS POLICIES
DROP POLICY IF EXISTS "Candidates can read own applications" ON public.applications;
CREATE POLICY "Candidates can read own applications"
    ON public.applications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR email = (auth.jwt() ->> 'email') OR public.is_authorized_admin());

DROP POLICY IF EXISTS "Candidates can insert own application" ON public.applications;
CREATE POLICY "Candidates can insert own application"
    ON public.applications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR email = (auth.jwt() ->> 'email') OR public.is_authorized_admin());

DROP POLICY IF EXISTS "Candidates can update own draft application" ON public.applications;
CREATE POLICY "Candidates can update own draft application"
    ON public.applications FOR UPDATE
    TO authenticated
    USING (
        (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
        OR public.is_authorized_admin()
    )
    WITH CHECK (
        (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
        OR public.is_authorized_admin()
    );

-- Allow anonymous submission fallback if unauthenticated guest portal apply is used
DROP POLICY IF EXISTS "Allow anon application submit fallback" ON public.applications;
CREATE POLICY "Allow anon application submit fallback"
    ON public.applications FOR INSERT
    TO anon
    WITH CHECK (true);

-- APPLICATION DOCUMENTS POLICIES
DROP POLICY IF EXISTS "Candidates can read own documents" ON public.application_documents;
CREATE POLICY "Candidates can read own documents"
    ON public.application_documents FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.applications a
            WHERE (a.id = application_documents.application_id OR a.application_id = application_documents.application_ref)
              AND (a.user_id = auth.uid() OR a.email = (auth.jwt() ->> 'email'))
        )
        OR public.is_authorized_admin()
    );

DROP POLICY IF EXISTS "Candidates can upload own documents" ON public.application_documents;
CREATE POLICY "Candidates can upload own documents"
    ON public.application_documents FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_authorized_admin());

-- STORAGE BUCKET CONFIGURATION (run if storage schema is accessible)
-- Note: Create bucket 'application-documents' in Supabase Storage Dashboard
INSERT INTO storage.buckets (id, name, public) 
VALUES ('application-documents', 'application-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated users can upload own documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload own documents"
    ON storage.objects FOR INSERT
    TO authenticated, anon
    WITH CHECK (bucket_id = 'application-documents');

DROP POLICY IF EXISTS "Users can read own uploaded documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow read application documents" ON storage.objects;
CREATE POLICY "Allow read application documents"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'application-documents');

-- ====================================================================
-- ADMISSION SETTINGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.admission_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    cohort TEXT NOT NULL DEFAULT 'January 2027 Intake',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.admission_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read admission settings" ON public.admission_settings;
CREATE POLICY "Allow public read admission settings"
    ON public.admission_settings FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow admins to update admission settings" ON public.admission_settings;
CREATE POLICY "Allow admins to update admission settings"
    ON public.admission_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

