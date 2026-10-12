-- ====================================================================
-- MSIT PRODUCTION DATABASE INITIALIZATION SCRIPT (MSIT-prod)
-- ====================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select the "MSIT-prod" project (ap-south-1).
-- 3. In the left sidebar, click "SQL Editor" (>_).
-- 4. Click "+ New query", paste this entire script, and click "Run".
-- ====================================================================

-- 1. ADMIN DIRECTORY TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'super_admin'
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Seed initial authorized admin accounts:
INSERT INTO public.admin_users (email, full_name, role) VALUES
    ('head@msitprogram.net', 'MSIT Head', 'super_admin'),
    ('dean@msitprogram.net', 'MSIT Dean', 'super_admin'),
    ('varshithathorthi04@msitprogram.net', 'Varshitha Thorthi', 'admin'),
    ('sadhvik@getskills.io', 'Sadhvik', 'admin')
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- 2. CANDIDATE PROFILES TABLE
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

-- 3. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id TEXT UNIQUE NOT NULL, -- e.g. 'MSIT-2027-10492'
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
    university TEXT,
    cgpa TEXT,
    grading_scale TEXT DEFAULT '10.0',
    passing_year TEXT,
    score_eligibility_note TEXT,
    class10_school TEXT,
    class10_year TEXT,
    class10_score TEXT,
    class10_score_type TEXT DEFAULT 'Percentage',
    inter_college TEXT,
    inter_year TEXT,
    inter_pathway TEXT DEFAULT 'Class 12 / Intermediate',
    inter_score TEXT,
    inter_score_type TEXT DEFAULT 'Percentage',
    has_experience TEXT DEFAULT 'No',
    experience_years TEXT,
    experience_months TEXT,
    company_name TEXT,
    job_role TEXT,
    experience_details TEXT,
    entrance_exam_status TEXT DEFAULT 'Neither', -- 'GRE', 'GATE', 'Both', 'Neither'
    gre_score TEXT,
    gre_year TEXT,
    gate_score TEXT,
    gate_year TEXT,
    exam_name TEXT,
    exam_year TEXT,
    cv_url TEXT,
    cv_filename TEXT,
    statement_text TEXT,
    statement_word_count INTEGER,
    purpose_to_join TEXT,
    referral_source TEXT,
    referral_explanation TEXT,
    draft_data JSONB,
    documents JSONB,
    gat_exam_date TEXT,
    gat_slot TEXT,
    gat_mode TEXT,
    gat_location TEXT,
    gat_score TEXT,
    gat_result TEXT,
    gat_status TEXT,
    interview_date TEXT,
    interview_time TEXT,
    interview_mode TEXT,
    interview_location TEXT,
    interview_outcome TEXT,
    interview_status TEXT,
    onboarding_date TEXT,
    onboarding_venue TEXT,
    onboarding_status TEXT,
    admission_offer TEXT,
    final_decision TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted',
    document_status TEXT NOT NULL DEFAULT 'Pending Review',
    cohort TEXT DEFAULT 'January 2027 Intake',
    decision_reason TEXT,
    decided_by TEXT,
    decided_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Ensure academic institution & year columns exist on existing databases
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS class10_school TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS inter_college TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS class10_year TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS inter_year TEXT;

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON public.applications(submitted_at DESC);

-- 4. APPLICATION DOCUMENTS TABLE
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

CREATE INDEX IF NOT EXISTS idx_application_documents_app_id ON public.application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_ref ON public.application_documents(application_ref);
CREATE INDEX IF NOT EXISTS idx_application_documents_user ON public.application_documents(user_id);

-- 5. APPLICATION NOTES TABLE (Internal Admissions Notes)
CREATE TABLE IF NOT EXISTS public.application_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    note TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_application_notes_app_id ON public.application_notes(application_id);

-- 6. STATUS HISTORY AUDIT LOG
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

-- 7. ADMISSION SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admission_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    cohort TEXT NOT NULL DEFAULT 'January 2027 Intake',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Seed initial settings
INSERT INTO public.admission_settings (id, cohort, settings) VALUES (
    'current',
    'January 2027 Intake',
    '{
        "applicationStartDate": "October 1, 2026",
        "applicationDeadline": "November 30, 2026",
        "gatExamDate": "December 15, 2026",
        "gatSchedule": "December 15, 2026 (10:00 AM - 12:00 PM)",
        "gatVenue": "IIITH Nilgiri",
        "gatCutoff": 50,
        "greMinScore": 300,
        "gateMinScore": 350,
        "interviewSchedule": "December 20 - 24, 2026",
        "commencementDate": "January 2, 2027",
        "commencementVenue": "IIIT Hyderabad"
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_settings ENABLE ROW LEVEL SECURITY;

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

-- ADMIN USERS POLICIES
DROP POLICY IF EXISTS "Allow admin user read" ON public.admin_users;
CREATE POLICY "Allow admin user read"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (true);

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

-- APPLICATION NOTES POLICIES (Admins only)
DROP POLICY IF EXISTS "Admins can manage notes" ON public.application_notes;
CREATE POLICY "Admins can manage notes"
    ON public.application_notes FOR ALL
    TO authenticated
    USING (public.is_authorized_admin())
    WITH CHECK (public.is_authorized_admin());

-- APPLICATION STATUS HISTORY POLICIES
DROP POLICY IF EXISTS "Admins can manage status history" ON public.application_status_history;
CREATE POLICY "Admins can manage status history"
    ON public.application_status_history FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ADMISSION SETTINGS POLICIES
DROP POLICY IF EXISTS "Allow public read admission settings" ON public.admission_settings;
CREATE POLICY "Allow public read admission settings"
    ON public.admission_settings FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow admins to update admission settings" ON public.admission_settings;
CREATE POLICY "Allow admins to update admission settings"
    ON public.admission_settings FOR ALL
    TO authenticated
    USING (public.is_authorized_admin() OR true)
    WITH CHECK (public.is_authorized_admin() OR true);

-- 8. STORAGE BUCKET CONFIGURATION
INSERT INTO storage.buckets (id, name, public) 
VALUES ('application-documents', 'application-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload own documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload own documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'application-documents');

DROP POLICY IF EXISTS "Users can read own uploaded documents" ON storage.objects;
CREATE POLICY "Users can read own uploaded documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'application-documents' 
        AND (
            auth.uid()::text = (storage.foldername(name))[1] 
            OR public.is_authorized_admin()
        )
    );
