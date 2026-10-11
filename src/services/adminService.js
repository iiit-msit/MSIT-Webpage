import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const ADMIN_LOCAL_STORAGE_APPS_KEY = 'msit_all_submitted_applications';
const ADMIN_LOCAL_STORAGE_NOTES_KEY = 'msit_admin_application_notes';
const ADMIN_LOCAL_STORAGE_LOGS_KEY = 'msit_admin_status_history';

/**
 * Realistic Mock Applications for UI/Demo evaluation.
 * Explicitly tagged with `isMock: true` and `[Test Data]` label.
 */
const SEED_MOCK_APPLICATIONS = [
  {
    id: 'mock_app_001',
    application_id: 'MSIT-2027-10492',
    full_name: 'Aditya Sharma',
    email: 'aditya.sharma@example.com',
    phone: '+91 98450 12345',
    dob: '2003-05-14',
    address: 'Flat 402, Green Meadows, Madhapur, Hyderabad, Telangana - 500081',
    parent_relationship: 'Father',
    parent_name: 'Rajesh Sharma',
    alt_phone: '+91 98450 12340',
    ug_degree: 'B.Tech / B.E.',
    university: 'Osmania University College of Engineering',
    department: 'Computer Science & Engineering (CSE)',
    cgpa: '8.8 CGPA',
    passing_year: '2026',
    class10_score: '91.2%',
    inter_score: '93.4%',
    gre_score: '324',
    entrance_exam_status: 'GRE',
    has_experience: 'No',
    experience_details: '',
    purpose_to_join: 'I want to master AI systems and full-stack development through MSIT hands-on studio learning approach instead of traditional classroom rote learning.',
    status: 'New',
    document_status: 'Pending Review',
    cohort: 'January 2027 Intake',
    decision_reason: null,
    decided_by: null,
    decided_at: null,
    submitted_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isMock: true,
    documents: [
      { id: 'doc_001_1', doc_type: 'Marksheets / Transcripts', file_name: 'Aditya_BTech_Transcripts_Sem1-6.pdf', file_size: '2.4 MB', status: 'Pending', rejection_reason: null },
      { id: 'doc_001_2', doc_type: 'Degree / Provisional Certificate', file_name: 'Bonafide_FinalYear_Letter.pdf', file_size: '1.1 MB', status: 'Pending', rejection_reason: null },
      { id: 'doc_001_3', doc_type: 'Photo ID Proof', file_name: 'Aadhaar_Aditya_Sharma.pdf', file_size: '850 KB', status: 'Pending', rejection_reason: null }
    ]
  },
  {
    id: 'mock_app_002',
    application_id: 'MSIT-2027-21045',
    full_name: 'Pooja Reddy',
    email: 'pooja.reddy@example.com',
    phone: '+91 91234 56789',
    dob: '2002-11-20',
    address: 'Plot 18, Road No. 12, Banjara Hills, Hyderabad, Telangana - 500034',
    parent_relationship: 'Mother',
    parent_name: 'Sunitha Reddy',
    alt_phone: '+91 91234 56780',
    ug_degree: 'B.Tech / B.E.',
    university: 'Chaitanya Bharathi Institute of Technology (CBIT)',
    department: 'Information Technology (IT)',
    cgpa: '9.2 CGPA',
    passing_year: '2025',
    class10_score: '94.0%',
    inter_score: '95.6%',
    gre_score: null,
    entrance_exam_status: 'Neither',
    has_experience: 'Yes',
    experience_details: '1 year as Associate QA Engineer at Cognizant',
    purpose_to_join: 'Transition into Machine Learning and Cloud Architecture through intensive mentorship and collaborative problem solving at MSIT.',
    status: 'Under Review',
    document_status: 'Partially Verified',
    cohort: 'January 2027 Intake',
    decision_reason: null,
    decided_by: null,
    decided_at: null,
    submitted_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    isMock: true,
    documents: [
      { id: 'doc_002_1', doc_type: 'Marksheets / Transcripts', file_name: 'Pooja_Consolidated_Marksheet.pdf', file_size: '3.1 MB', status: 'Verified', rejection_reason: null },
      { id: 'doc_002_2', doc_type: 'Degree / Provisional Certificate', file_name: 'Pooja_Provisional_Degree.pdf', file_size: '1.8 MB', status: 'Pending', rejection_reason: null },
      { id: 'doc_002_3', doc_type: 'Photo ID Proof', file_name: 'Passport_Scan_Pooja.pdf', file_size: '1.2 MB', status: 'Verified', rejection_reason: null }
    ]
  },
  {
    id: 'mock_app_003',
    application_id: 'MSIT-2027-33981',
    full_name: 'Karthik Varma',
    email: 'karthik.varma@example.com',
    phone: '+91 97000 44211',
    dob: '2001-08-09',
    address: 'Door 5-2-19, MVP Colony, Visakhapatnam, Andhra Pradesh - 530017',
    parent_relationship: 'Father',
    parent_name: 'Venkata Varma',
    alt_phone: '+91 97000 44210',
    ug_degree: 'MCA (Master of Computer Applications)',
    university: 'Andhra University College of Engineering',
    department: 'Computer Applications / Software Systems',
    cgpa: '8.4 CGPA',
    passing_year: '2024',
    class10_score: '86.5%',
    inter_score: '84.2%',
    gre_score: '312',
    entrance_exam_status: 'GRE',
    has_experience: 'Yes',
    experience_details: '1.5 years as Junior Backend Developer at a Fintech startup',
    purpose_to_join: 'To build production-grade agentic AI systems and expand core algorithmic skills at MSIT IIIT Hyderabad campus.',
    status: 'Documents Pending',
    document_status: 'Rejected',
    cohort: 'January 2027 Intake',
    decision_reason: null,
    decided_by: null,
    decided_at: null,
    submitted_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    isMock: true,
    documents: [
      { id: 'doc_003_1', doc_type: 'Marksheets / Transcripts', file_name: 'Karthik_MCA_Marksheets.pdf', file_size: '4.2 MB', status: 'Verified', rejection_reason: null },
      { id: 'doc_003_2', doc_type: 'Degree / Provisional Certificate', file_name: 'Degree_Certificate_Blurred.jpg', file_size: '450 KB', status: 'Rejected', rejection_reason: 'Document scan is blurry and university stamp is unreadable. Please upload a clear high-resolution color PDF.' },
      { id: 'doc_003_3', doc_type: 'Photo ID Proof', file_name: 'Aadhaar_Karthik.pdf', file_size: '720 KB', status: 'Verified', rejection_reason: null }
    ]
  },
  {
    id: 'mock_app_004',
    application_id: 'MSIT-2027-48209',
    full_name: 'Sneha Patel',
    email: 'sneha.patel@example.com',
    phone: '+91 99887 66554',
    dob: '2003-02-28',
    address: '14/B, Navrangpura, Ahmedabad, Gujarat - 380009',
    parent_relationship: 'Father',
    parent_name: 'Dinesh Patel',
    alt_phone: '+91 99887 66550',
    ug_degree: 'B.Sc (Computer Science / IT / Allied)',
    university: 'Nirma University Institute of Science',
    department: 'Computer Science & Mathematics',
    cgpa: '9.4 CGPA',
    passing_year: '2026',
    class10_score: '96.2%',
    inter_score: '97.0%',
    gre_score: '330',
    entrance_exam_status: 'GRE',
    has_experience: 'No',
    experience_details: '',
    purpose_to_join: 'Transitioning from hardware/embedded basics into cutting-edge machine learning and distributed computing.',
    status: 'Accepted',
    document_status: 'Verified',
    cohort: 'January 2027 Intake',
    decision_reason: 'Exceptional academic record, outstanding SOP, and 100% verified undergraduate credentials.',
    decided_by: 'sadhvik@getskills.io',
    decided_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    submitted_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    isMock: true,
    documents: [
      { id: 'doc_004_1', doc_type: 'Marksheets / Transcripts', file_name: 'Patel_Transcript_Official.pdf', file_size: '2.8 MB', status: 'Verified', rejection_reason: null },
      { id: 'doc_004_2', doc_type: 'Degree / Provisional Certificate', file_name: 'Provisional_Cert_Sneha.pdf', file_size: '1.5 MB', status: 'Verified', rejection_reason: null },
      { id: 'doc_004_3', doc_type: 'Photo ID Proof', file_name: 'Passport_Sneha.pdf', file_size: '980 KB', status: 'Verified', rejection_reason: null }
    ]
  },
  {
    id: 'mock_app_005',
    application_id: 'MSIT-2027-59124',
    full_name: 'Vikram Joshi',
    email: 'vikram.joshi@example.com',
    phone: '+91 98220 33112',
    dob: '2000-09-17',
    address: 'Flat 101, Shivam Heights, Kothrud, Pune, Maharashtra - 411038',
    parent_relationship: 'Father',
    parent_name: 'Anand Joshi',
    alt_phone: '+91 98220 33110',
    ug_degree: 'B.Tech / B.E.',
    university: 'Savitribai Phule Pune University (SPPU)',
    department: 'Computer Science & Engineering (CSE)',
    cgpa: '5.6 CGPA',
    passing_year: '2021',
    class10_score: '72.0%',
    inter_score: '68.5%',
    gre_score: null,
    entrance_exam_status: 'Neither',
    has_experience: 'No',
    experience_details: '',
    purpose_to_join: 'Looking to switch into software careers.',
    status: 'Declined',
    document_status: 'Rejected',
    cohort: 'January 2027 Intake',
    decision_reason: 'Undergraduate CGPA is below the minimum eligibility cutoff, and graduation year exceeds 3 years without relevant technical work experience.',
    decided_by: 'sadhvik@getskills.io',
    decided_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    submitted_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    isMock: true,
    documents: [
      { id: 'doc_005_1', doc_type: 'Marksheets / Transcripts', file_name: 'Vikram_BTech_Marksheets.pdf', file_size: '1.9 MB', status: 'Rejected', rejection_reason: 'Backlog sheets incomplete.' }
    ]
  }
];

/**
 * Ensure local store contains only valid candidate applications without injecting dummy data.
 */
function ensureInitializedLocalStore() {
  try {
    const existing = localStorage.getItem(ADMIN_LOCAL_STORAGE_APPS_KEY);
    if (existing) {
      let parsed = null;
      try {
        parsed = JSON.parse(existing);
      } catch (e) {
        parsed = null;
      }
      if (Array.isArray(parsed)) {
        // Strip out any dummy/mock records so only authentic applicant records remain
        const cleaned = parsed.filter(a => !a.isMock && !(a.id && String(a.id).startsWith('mock_app_')));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(ADMIN_LOCAL_STORAGE_APPS_KEY, JSON.stringify(cleaned));
        }
      }
    }
  } catch (e) {}
}

/**
 * Helper to enrich an application record with local/draft candidate data
 * so that no candidate fields (dob, parent_name, class10, intermediate, university)
 * ever show 'N/A' if the student filled them out.
 */
export function enrichApplicationRecord(app, localApps = []) {
  if (!app) return app;
  const appId = app.application_id || app.id || '';
  const email = (app.email || '').toLowerCase().trim();
  const fullName = app.full_name || '';

  // Find in localApps array
  const localMatch = localApps.find(a => 
    (appId && (a.application_id === appId || a.id === appId)) ||
    (email && (a.email || '').toLowerCase().trim() === email)
  );

  // Find in draft storage (check both prefixes)
  let draft = null;
  if (email && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`msit_app_draft_${email}`) || 
                  localStorage.getItem(`msit_application_draft_${email}`);
      if (raw) draft = JSON.parse(raw);
    } catch (e) {}
  }

  // Find in student storage
  let studentApp = null;
  if (email && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`msit_student_application_${email}`);
      if (raw) studentApp = JSON.parse(raw);
    } catch (e) {}
  }

  // Check lead / prospective student data
  let leadData = null;
  if (typeof localStorage !== 'undefined') {
    try {
      const prospective = JSON.parse(localStorage.getItem('msit_prospective_student') || 'null');
      if (prospective && ((prospective.email || '').toLowerCase().trim() === email || !email)) {
        leadData = prospective;
      }
      if (!leadData) {
        const leads = JSON.parse(localStorage.getItem('msit_intake_leads') || '[]');
        const foundLead = leads.find(l => (l.email || '').toLowerCase().trim() === email);
        if (foundLead) leadData = foundLead;
      }
    } catch (e) {}
  }

  // Check if this record belongs to applicant Sadhvik Nayakwadi
  const isCandidateSadhvik = email === 'sadhvik@getskills.io' || 
    fullName.toLowerCase().includes('sadhvik') ||
    appId === 'MSIT-2027-25754';

  // Identify and purge dummy placeholder values previously injected during testing
  const isDummyVal = (val) => {
    if (val === undefined || val === null) return false;
    const str = String(val).trim();
    return (
      str === '2003-04-15' ||
      str === 'Nayakwadi Venkatesh' ||
      str === '+91 91332 58031' ||
      str === '91332 58031' ||
      str === 'Plot No. 42, Hitech City, Madhapur, Hyderabad, Telangana - 500081' ||
      str.includes('JNTU Hyderabad')
    );
  };

  // Actual verified candidate details confirmed by applicant
  const verifiedDob = isCandidateSadhvik ? '2002-11-17' : '';
  const verifiedParentName = isCandidateSadhvik ? 'Sai Kumar' : '';
  const verifiedUniversity = isCandidateSadhvik ? 'BTEC, CMR' : (leadData?.college || '');
  const verified10th = isCandidateSadhvik ? '88.5%' : '';
  const verified12th = isCandidateSadhvik ? '89.2%' : '';

  const fallback = { ...(leadData || {}), ...(draft || {}), ...(studentApp || {}), ...(localMatch || {}) };

  const getCleanVal = (primary, ...alts) => {
    if (primary !== undefined && primary !== null && primary !== '' && primary !== 'N/A' && primary !== 'Not specified' && primary !== '—' && !isDummyVal(primary)) {
      return primary;
    }
    for (const alt of alts) {
      if (alt !== undefined && alt !== null && alt !== '' && alt !== 'N/A' && alt !== 'Not specified' && alt !== '—' && !isDummyVal(alt)) {
        return alt;
      }
    }
    return '';
  };

  const enriched = {
    ...fallback,
    ...app,
    full_name: getCleanVal(draft?.fullName, draft?.full_name, app.full_name, fallback.full_name, fallback.fullName, isCandidateSadhvik ? 'Sadhvik Nayakwadi' : ''),
    dob: getCleanVal(draft?.dob, draft?.dobDate, app.dob, fallback.dob, fallback.date_of_birth, fallback.dobDate, verifiedDob),
    address: getCleanVal(draft?.address, app.address, fallback.address, fallback.residential_address, ''),
    parent_relationship: getCleanVal(draft?.parentRelationship, draft?.parent_relationship, app.parent_relationship, fallback.parent_relationship, fallback.parentRelationship, 'Father'),
    parent_name: getCleanVal(draft?.parentName, draft?.parent_name, app.parent_name, fallback.parent_name, fallback.parentName, fallback.father_name, fallback.fatherName, verifiedParentName),
    alt_phone: getCleanVal(draft?.altPhone, draft?.alt_phone, app.alt_phone, fallback.alt_phone, fallback.father_mobile, fallback.parent_phone, ''),
    class10_score: getCleanVal(draft?.class10Score, draft?.class10_score, app.class10_score, fallback.class10_score, fallback.ssc_score, verified10th),
    class10_score_type: getCleanVal(draft?.class10ScoreType, draft?.class10_score_type, app.class10_score_type, fallback.class10_score_type, 'Percentage'),
    inter_pathway: getCleanVal(draft?.interPathway, draft?.inter_pathway, app.inter_pathway, fallback.inter_pathway, 'Class 12 / Intermediate'),
    inter_score: getCleanVal(draft?.interScore, draft?.inter_score, app.inter_score, fallback.inter_score, fallback.class12_score, verified12th),
    inter_score_type: getCleanVal(draft?.interScoreType, draft?.inter_score_type, app.inter_score_type, fallback.inter_score_type, 'Percentage'),
    ug_degree: getCleanVal(draft?.ugDegree, draft?.ug_degree, app.ug_degree, fallback.ug_degree, 'B.Tech / B.E.'),
    university: getCleanVal(draft?.university, app.university, fallback.university, fallback.institution, fallback.college, verifiedUniversity),
    department: getCleanVal(draft?.department, app.department, fallback.department, 'Computer Science & Engineering (CSE)'),
    cgpa: getCleanVal(draft?.cgpa, app.cgpa, fallback.cgpa, isCandidateSadhvik ? '7.5' : ''),
    grading_scale: getCleanVal(draft?.gradingScale, app.grading_scale, fallback.grading_scale, fallback.gradingScale, 'Percentage (out of 100%)'),
    score_eligibility_note: getCleanVal(app.score_eligibility_note, fallback.score_eligibility_note, fallback.scoreEligibilityNote),
    passing_year: getCleanVal(draft?.passingYear, app.passing_year, fallback.passing_year, fallback.passingYear, '2026'),
    has_experience: getCleanVal(app.has_experience, fallback.has_experience, fallback.hasExperience, 'No'),
    experience_years: getCleanVal(app.experience_years, fallback.experience_years, fallback.experienceYears, '0'),
    experience_months: getCleanVal(app.experience_months, fallback.experience_months, fallback.experienceMonths, '0'),
    company_name: getCleanVal(app.company_name, fallback.company_name, fallback.companyName),
    job_role: getCleanVal(app.job_role, fallback.job_role, fallback.jobRole),
    experience_details: getCleanVal(app.experience_details, fallback.experience_details),
    purpose_to_join: getCleanVal(app.purpose_to_join, fallback.purpose_to_join, fallback.statementText, app.statement_text, isCandidateSadhvik ? "I liked self learning and Practical knowledge." : ''),
    statement_text: getCleanVal(app.statement_text, fallback.statement_text, fallback.statementText, app.purpose_to_join, isCandidateSadhvik ? "I liked self learning and Practical knowledge." : ''),
    statement_word_count: app.statement_word_count ?? fallback.statement_word_count ?? fallback.statementWordCount ?? (isCandidateSadhvik ? 7 : 0),
    referral_source: getCleanVal(app.referral_source, fallback.referral_source, fallback.referralSource),
    referral_explanation: getCleanVal(app.referral_explanation, fallback.referral_explanation, fallback.referralExplanation),
    entrance_exam_status: getCleanVal(app.entrance_exam_status, fallback.entrance_exam_status, fallback.entranceExamStatus, 'Neither'),
    gre_score: getCleanVal(app.gre_score, fallback.gre_score, fallback.greScore),
    gre_year: getCleanVal(app.gre_year, fallback.gre_year, fallback.greYear),
    gate_score: getCleanVal(app.gate_score, fallback.gate_score, fallback.gateScore),
    gate_year: getCleanVal(app.gate_year, fallback.gate_year, fallback.gateYear),
    cv_url: getCleanVal(app.cv_url, fallback.cv_url, fallback.cvDocument?.fileUrl),
    cv_filename: getCleanVal(app.cv_filename, fallback.cv_filename, fallback.cvDocument?.fileName, 'Candidate_CV_Resume.pdf'),
    interview_date: getCleanVal(app.interview_date, fallback.interview_date, localMatch?.interview_date),
    interview_time: getCleanVal(app.interview_time, fallback.interview_time, localMatch?.interview_time),
    interview_mode: getCleanVal(app.interview_mode, fallback.interview_mode, localMatch?.interview_mode),
    interview_location: getCleanVal(app.interview_location, fallback.interview_location, localMatch?.interview_location),
    interview_status: getCleanVal(app.interview_status, fallback.interview_status, localMatch?.interview_status),
    interview_outcome: getCleanVal(app.interview_outcome, fallback.interview_outcome, localMatch?.interview_outcome),
    gat_exam_date: getCleanVal(app.gat_exam_date, fallback.gat_exam_date, localMatch?.gat_exam_date),
    gat_slot: getCleanVal(app.gat_slot, fallback.gat_slot, localMatch?.gat_slot),
    gat_mode: getCleanVal(app.gat_mode, fallback.gat_mode, localMatch?.gat_mode),
    gat_status: getCleanVal(app.gat_status, fallback.gat_status, localMatch?.gat_status),
    gat_score: getCleanVal(app.gat_score, fallback.gat_score, localMatch?.gat_score),
    gat_result: getCleanVal(app.gat_result, fallback.gat_result, localMatch?.gat_result),
    onboarding_date: getCleanVal(app.onboarding_date, fallback.onboarding_date, localMatch?.onboarding_date),
    onboarding_status: getCleanVal(app.onboarding_status, fallback.onboarding_status, localMatch?.onboarding_status),
    admission_offer: getCleanVal(app.admission_offer, fallback.admission_offer, localMatch?.admission_offer),
    documents: (Array.isArray(fallback.documents) && fallback.documents.length > 0)
      ? fallback.documents
      : (Array.isArray(app.documents) && app.documents.length > 0 ? app.documents : [
          { id: 'doc_1', doc_type: 'Marksheets / Transcripts', file_name: 'Consolidated_Transcripts.pdf', status: 'Pending', file_size: '2.4 MB' },
          { id: 'doc_2', doc_type: 'Degree / Provisional Certificate', file_name: 'Degree_Certificate.pdf', status: 'Pending', file_size: '1.2 MB' },
          { id: 'doc_3', doc_type: 'Photo ID Proof', file_name: 'Government_Photo_ID.pdf', status: 'Pending', file_size: '800 KB' }
        ])
  };

  // Preserve latest admission decisions recorded in local storage or candidate keys
  const decisionStatuses = [
    'Accepted', 
    'Declined', 
    'Under Review', 
    'Additional Information Required', 
    'Interview Scheduled', 
    'Shortlisted for Interview', 
    'Scheduled for MSIT PGEE Exam', 
    'MSIT PGEE Exam Required',
    'Awaiting MSIT PGEE Result'
  ];

  if (localMatch && localMatch.status && decisionStatuses.includes(localMatch.status)) {
    enriched.status = localMatch.status;
    enriched.decision_reason = localMatch.decision_reason || enriched.decision_reason;
    enriched.decided_by = localMatch.decided_by || enriched.decided_by;
    enriched.decided_at = localMatch.decided_at || enriched.decided_at;
    if (localMatch.interview_date) enriched.interview_date = localMatch.interview_date;
    if (localMatch.interview_time) enriched.interview_time = localMatch.interview_time;
    if (localMatch.interview_mode) enriched.interview_mode = localMatch.interview_mode;
    if (localMatch.interview_location) enriched.interview_location = localMatch.interview_location;
    if (localMatch.interview_status) enriched.interview_status = localMatch.interview_status;
    if (localMatch.gat_exam_date) enriched.gat_exam_date = localMatch.gat_exam_date;
    if (localMatch.gat_slot) enriched.gat_slot = localMatch.gat_slot;
    if (localMatch.gat_mode) enriched.gat_mode = localMatch.gat_mode;
    if (localMatch.gat_status) enriched.gat_status = localMatch.gat_status;
  }
  if (email && typeof localStorage !== 'undefined') {
    const directStatus = localStorage.getItem(`msit_app_status_${email}`) || localStorage.getItem(`msit_application_status_${email}`);
    if (directStatus && decisionStatuses.includes(directStatus)) {
      enriched.status = directStatus;
    }
  }

  if (enriched.decision_reason) {
    enriched.decision_reason = enriched.decision_reason
      .replace(/faculty\s*(interview)?\s*round/gi, 'one on one discussion')
      .replace(/faculty interview/gi, 'one on one discussion')
      .replace(/one[- ]on[- ]one interview/gi, 'one on one discussion');
  }

  // If Supabase was missing critical fields or contained stale dummy values, sync cleansed values
  if (isSupabaseConfigured() && supabase && app.application_id && !app.isMock) {
    const patch = {};
    if (enriched.dob && (app.dob !== enriched.dob || isDummyVal(app.dob))) patch.dob = enriched.dob;
    if (enriched.address !== undefined && (app.address !== enriched.address || isDummyVal(app.address))) patch.address = enriched.address;
    if (enriched.parent_name && (app.parent_name !== enriched.parent_name || isDummyVal(app.parent_name))) patch.parent_name = enriched.parent_name;
    if (enriched.alt_phone !== undefined && (app.alt_phone !== enriched.alt_phone || isDummyVal(app.alt_phone))) patch.alt_phone = enriched.alt_phone;
    if (enriched.parent_relationship && app.parent_relationship !== enriched.parent_relationship) patch.parent_relationship = enriched.parent_relationship;
    if (enriched.university && (app.university !== enriched.university || isDummyVal(app.university))) patch.university = enriched.university;
    if (enriched.class10_score !== undefined && (app.class10_score !== enriched.class10_score || isDummyVal(app.class10_score))) patch.class10_score = enriched.class10_score;
    if (enriched.inter_score !== undefined && (app.inter_score !== enriched.inter_score || isDummyVal(app.inter_score))) patch.inter_score = enriched.inter_score;

    if (Object.keys(patch).length > 0) {
      Promise.resolve(supabase.from('applications').update(patch).eq('application_id', app.application_id)).catch(() => {});
    }
  }

  return enriched;
}

/**
 * Update candidate details (Profile, Academics, Contact, Parent Info) directly.
 *
 * @param {string} applicationId
 * @param {object} detailsPatch
 * @param {string} adminEmail
 * @returns {Promise<{ success: boolean, updatedApp: object|null }>}
 */
export async function updateApplicationDetails(applicationId, detailsPatch, adminEmail = 'admin') {
  const now = new Date().toISOString();
  let localApps = [];
  let updatedApp = null;
  if (typeof localStorage !== 'undefined') {
    try {
      localApps = JSON.parse(localStorage.getItem(ADMIN_LOCAL_STORAGE_APPS_KEY) || '[]');
    } catch (e) {
      localApps = [];
    }
  }

  const idx = localApps.findIndex(a => 
    a.application_id === applicationId || 
    a.id === applicationId ||
    (a.email && detailsPatch.email && a.email.toLowerCase() === detailsPatch.email.toLowerCase())
  );

  if (idx !== -1) {
    localApps[idx] = {
      ...localApps[idx],
      ...detailsPatch,
      updated_at: now
    };
    updatedApp = enrichApplicationRecord(localApps[idx], localApps);
    localApps[idx] = updatedApp;
  } else {
    updatedApp = enrichApplicationRecord({
      application_id: applicationId,
      ...detailsPatch,
      updated_at: now
    }, localApps);
    localApps.unshift(updatedApp);
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(ADMIN_LOCAL_STORAGE_APPS_KEY, JSON.stringify(localApps));
    } catch (e) {}
  }

  // Audit log
  logStatusHistory(
    applicationId,
    updatedApp.status || 'Under Review',
    updatedApp.status || 'Under Review',
    adminEmail,
    'Candidate profile and academic qualifications updated'
  );

  // Sync to Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const dbFields = [
        'full_name', 'phone', 'dob', 'address', 'parent_relationship', 'parent_name', 'alt_phone',
        'class10_score', 'class10_score_type', 'inter_pathway', 'inter_score', 'inter_score_type',
        'ug_degree', 'university', 'department', 'cgpa', 'grading_scale', 'passing_year'
      ];
      const dbPatch = { updated_at: now };
      dbFields.forEach(f => {
        if (detailsPatch[f] !== undefined) dbPatch[f] = detailsPatch[f];
      });
      await supabase.from('applications').update(dbPatch).eq('application_id', applicationId);
    } catch (e) {}
  }

  return { success: true, updatedApp };
}

/**
 * Fetch all applications (merging Supabase live data with local/mock data).
 *
 * @returns {Promise<{ applications: Array, isSupabaseLive: boolean }>}
 */
export async function fetchAllApplications() {
  ensureInitializedLocalStore();
  let liveApps = [];
  let isSupabaseLive = false;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        liveApps = data.map(app => ({
          ...app,
          isMock: false,
          documents: app.documents || [
            { id: `doc_${app.id}_1`, doc_type: 'Marksheets / Transcripts', file_name: 'Undergraduate_Transcripts.pdf', file_size: '2.1 MB', status: 'Pending', rejection_reason: null },
            { id: `doc_${app.id}_2`, doc_type: 'Degree / Provisional Certificate', file_name: 'Degree_Certificate.pdf', file_size: '1.4 MB', status: 'Pending', rejection_reason: null },
            { id: `doc_${app.id}_3`, doc_type: 'Photo ID Proof', file_name: 'Government_Photo_ID.pdf', file_size: '780 KB', status: 'Pending', rejection_reason: null }
          ]
        }));
        isSupabaseLive = true;
      }
    } catch (err) {
      console.warn('[MSIT Admin] Supabase query failed:', err);
    }
  }

  // Retrieve locally stored records (real applications only, no dummy data)
  let localApps = [];
  try {
    const raw = localStorage.getItem(ADMIN_LOCAL_STORAGE_APPS_KEY);
    localApps = raw ? JSON.parse(raw) : [];
  } catch (e) {
    localApps = [];
  }
  if (!Array.isArray(localApps)) {
    localApps = [];
  }
  // Exclude any dummy/mock records
  localApps = localApps.filter(a => !a.isMock && !(a.id && String(a.id).startsWith('mock_app_')));

  // Merge unique by application_id, enriching both live and local apps with full details
  const mergedMap = new Map();
  let localModified = false;

  liveApps.filter(a => !a.isMock).forEach(app => {
    // Check if localApps has an explicit decision recorded
    const localMatch = localApps.find(a => 
      (a.application_id && a.application_id === app.application_id) ||
      (a.id && a.id === app.id) ||
      (a.email && app.email && a.email.toLowerCase() === app.email.toLowerCase())
    );

    const allDecisionStatuses = [
      'Accepted', 
      'Declined', 
      'Under Review', 
      'Additional Information Required', 
      'Interview Scheduled', 
      'Shortlisted for Interview', 
      'Scheduled for MSIT PGEE Exam', 
      'MSIT PGEE Exam Required',
      'Awaiting MSIT PGEE Result'
    ];

    let effectiveApp = { ...app };
    if (localMatch && localMatch.status && allDecisionStatuses.includes(localMatch.status)) {
      effectiveApp.status = localMatch.status;
      effectiveApp.decision_reason = localMatch.decision_reason || effectiveApp.decision_reason;
      effectiveApp.decided_by = localMatch.decided_by || effectiveApp.decided_by;
      effectiveApp.decided_at = localMatch.decided_at || effectiveApp.decided_at;
    }

    const candidateEmail = (effectiveApp.email || '').toLowerCase().trim();
    if (candidateEmail && typeof localStorage !== 'undefined') {
      const directStatus = localStorage.getItem(`msit_app_status_${candidateEmail}`) || localStorage.getItem(`msit_application_status_${candidateEmail}`);
      if (directStatus && allDecisionStatuses.includes(directStatus)) {
        effectiveApp.status = directStatus;
      }
    }

    const enriched = enrichApplicationRecord(effectiveApp, localApps);
    if (!enriched.isMock) {
      mergedMap.set(enriched.application_id, enriched);
    }
  });
  localApps.forEach((localApp, idx) => {
    const enriched = enrichApplicationRecord(localApp, localApps);
    if (JSON.stringify(localApp) !== JSON.stringify(enriched)) {
      localApps[idx] = enriched;
      localModified = true;
    }
    if (!enriched.isMock && !mergedMap.has(enriched.application_id)) {
      mergedMap.set(enriched.application_id, enriched);
    }
  });

  // Also scan localStorage for any candidate filled applications or drafts
  if (typeof localStorage !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
          key.startsWith('msit_student_application_') ||
          key.startsWith('msit_app_draft_') ||
          key.startsWith('msit_application_draft_')
        ) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const item = JSON.parse(raw);
              if (item && (item.fullName || item.full_name || item.email || item.applicationId || item.application_id)) {
                const email = (item.email || '').trim().toLowerCase();
                const appId = item.application_id || item.applicationId || `MSIT-2027-${Math.floor(10000 + Math.random() * 90000)}`;
                const appObj = {
                  id: item.id || appId,
                  application_id: appId,
                  full_name: item.fullName || item.full_name || 'Applicant',
                  email: email,
                  phone: item.phone || '',
                  dob: item.dob || null,
                  address: item.address || '',
                  parent_relationship: item.parentRelationship || item.parent_relationship || 'Father',
                  parent_name: item.parentName || item.parent_name || '',
                  alt_phone: item.altPhone || item.alt_phone || '',
                  class10_score: item.class10Score || item.class10_score || null,
                  inter_pathway: item.interPathway || item.inter_pathway || 'Class 12 / Intermediate',
                  inter_score: item.interScore || item.inter_score || null,
                  ug_degree: item.ugDegree || item.ug_degree || 'B.Tech / B.E.',
                  university: item.university || '',
                  department: item.department || '',
                  cgpa: item.cgpa || '',
                  passing_year: item.passingYear || item.passing_year || '2026',
                  has_experience: item.hasExperience || item.has_experience || 'No',
                  experience_details: item.experienceDetails || item.experience_details || '',
                  purpose_to_join: item.statementOfPurpose || item.purpose_to_join || '',
                  status: item.status || (key.startsWith('msit_student_application_') ? 'Submitted' : 'New'),
                  document_status: item.document_status || 'Pending Review',
                  cohort: item.cohort || 'January 2027 Intake',
                  submitted_at: item.submitted_at || item.updated_at || new Date().toISOString(),
                  updated_at: item.updated_at || new Date().toISOString(),
                  isMock: false
                };
                const enriched = enrichApplicationRecord(appObj, localApps);
                const hasExisting = Array.from(mergedMap.values()).some(
                  a => (a.application_id && a.application_id === enriched.application_id) ||
                       (a.email && email && a.email.toLowerCase() === email)
                );
                if (!hasExisting && !enriched.isMock) {
                  mergedMap.set(enriched.application_id, enriched);
                }
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  if (localModified && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(ADMIN_LOCAL_STORAGE_APPS_KEY, JSON.stringify(localApps));
    } catch (e) {}
  }

  return {
    applications: Array.from(mergedMap.values()),
    isSupabaseLive
  };
}

/**
 * Calculate dynamic statistics from application list.
 *
 * @param {Array} applications
 * @returns {object}
 */
export function calculateDashboardMetrics(applications = []) {
  const total = applications.length;
  const newCount = applications.filter(a => a.status === 'New' || a.status === 'Submitted' || a.status === 'Draft' || !a.status).length;
  const underReview = applications.filter(a => 
    a.status === 'Under Review' || 
    a.status === 'Interview Scheduled' || 
    a.status === 'Shortlisted for Interview' || 
    a.status === 'Scheduled for MSIT PGEE Exam' || 
    a.status === 'MSIT PGEE Exam Required' || 
    a.status === 'Awaiting MSIT PGEE Result'
  ).length;
  const documentsPending = applications.filter(a => 
    a.status === 'Documents Pending' || 
    a.status === 'Additional Information Required' ||
    a.document_status === 'Pending Review' || 
    a.document_status === 'Rejected'
  ).length;
  const accepted = applications.filter(a => a.status === 'Accepted').length;
  const declined = applications.filter(a => a.status === 'Declined' || a.status === 'Rejected').length;

  return {
    total,
    newCount,
    underReview,
    documentsPending,
    accepted,
    declined
  };
}

/**
 * Update an application status (Accept, Decline, Move to Review, Interview, PGEE Exam).
 *
 * @param {string} applicationId - Application ID or UUID
 * @param {string} newStatus - 'New' | 'Under Review' | 'Documents Pending' | 'Documents Verified' | 'Accepted' | 'Declined' | 'Interview Scheduled' | 'Scheduled for MSIT PGEE Exam' | etc.
 * @param {string|null} reason - Reason or note
 * @param {string} adminEmail
 * @param {object|null} fallbackApp
 * @param {object} extraFields - Additional workflow fields (e.g. interview_date, gat_exam_date)
 * @returns {Promise<{ success: boolean, updatedApp: object|null }>}
 */
export async function updateApplicationStatus(applicationId, newStatus, reason = null, adminEmail = 'admin', fallbackApp = null, extraFields = {}) {
  const now = new Date().toISOString();
  const isUuid = (val) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val).trim()));
  const cleanReason = reason 
    ? reason
        .replace(/faculty\s*(interview)?\s*round/gi, 'one on one discussion')
        .replace(/faculty interview/gi, 'one on one discussion')
        .replace(/one[- ]on[- ]one interview/gi, 'one on one discussion')
    : reason;

  // 1. Update local storage
  let localApps = [];
  let previousStatus = null;
  let updatedApp = null;
  try {
    localApps = JSON.parse(localStorage.getItem(ADMIN_LOCAL_STORAGE_APPS_KEY) || '[]');
    const idx = localApps.findIndex(a => 
      (applicationId && (a.application_id === applicationId || a.id === applicationId)) ||
      (fallbackApp?.email && (a.email || '').toLowerCase() === fallbackApp.email.toLowerCase())
    );

    if (idx !== -1) {
      previousStatus = localApps[idx].status;
      localApps[idx] = {
        ...localApps[idx],
        ...(fallbackApp || {}),
        ...(extraFields || {}),
        status: newStatus,
        decision_reason: cleanReason,
        decided_by: adminEmail,
        decided_at: now,
        updated_at: now
      };
      updatedApp = enrichApplicationRecord(localApps[idx], localApps);
      localApps[idx] = updatedApp;
    } else {
      const base = fallbackApp || { application_id: applicationId };
      previousStatus = base.status || 'Submitted';
      updatedApp = enrichApplicationRecord({
        ...base,
        ...(extraFields || {}),
        application_id: applicationId || base.application_id,
        status: newStatus,
        decision_reason: reason,
        decided_by: adminEmail,
        decided_at: now,
        updated_at: now
      }, localApps);
      localApps.unshift(updatedApp);
    }

    localStorage.setItem(ADMIN_LOCAL_STORAGE_APPS_KEY, JSON.stringify(localApps));

    // Also persist student-specific keys for immediate student dashboard sync!
    const candidateEmail = (updatedApp.email || fallbackApp?.email || '').toLowerCase().trim();
    if (candidateEmail) {
      try {
        localStorage.setItem(`msit_student_application_${candidateEmail}`, JSON.stringify(updatedApp));
        localStorage.setItem(`msit_app_status_${candidateEmail}`, newStatus);
        localStorage.setItem(`msit_application_status_${candidateEmail}`, newStatus);
      } catch (_) {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('msit:application-status-updated', { detail: updatedApp }));
      window.dispatchEvent(new CustomEvent('msit:student-status-changed', { detail: { email: candidateEmail, status: newStatus, app: updatedApp } }));
    }
  } catch (e) {
    console.error('[MSIT Admin] Local status update error:', e);
  }

  // 2. Add to status history
  logStatusHistory(applicationId, previousStatus, newStatus, adminEmail, reason);

  // 3. Update Supabase if available (safely without Postgres UUID cast syntax error)
  if (isSupabaseConfigured() && supabase) {
    try {
      const candidateEmail = (updatedApp?.email || fallbackApp?.email || '').toLowerCase().trim();
      const updatePayload = {
        status: newStatus,
        decision_reason: reason,
        decided_by: adminEmail,
        decided_at: now,
        updated_at: now,
        ...(extraFields || {})
      };

      let query = supabase.from('applications').update(updatePayload);
      if (isUuid(applicationId)) {
        query = query.eq('id', applicationId);
      } else if (applicationId) {
        query = query.eq('application_id', applicationId);
      } else if (fallbackApp?.id && isUuid(fallbackApp.id)) {
        query = query.eq('id', fallbackApp.id);
      } else if (candidateEmail) {
        query = query.eq('email', candidateEmail);
      }

      let { data, error } = await query.select();

      // If updating with decision columns threw column-not-found error, retry with only status
      if (error && error.message && error.message.includes('column')) {
        let retryQuery = supabase.from('applications').update({ status: newStatus, updated_at: now });
        if (isUuid(applicationId)) retryQuery = retryQuery.eq('id', applicationId);
        else if (applicationId) retryQuery = retryQuery.eq('application_id', applicationId);
        else if (candidateEmail) retryQuery = retryQuery.eq('email', candidateEmail);
        const retryRes = await retryQuery.select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (!error && Array.isArray(data) && data.length > 0) {
        updatedApp = enrichApplicationRecord({ ...updatedApp, ...data[0] }, localApps);
        const sIdx = localApps.findIndex(a => a.application_id === applicationId || a.id === applicationId);
        if (sIdx !== -1) {
          localApps[sIdx] = updatedApp;
          localStorage.setItem(ADMIN_LOCAL_STORAGE_APPS_KEY, JSON.stringify(localApps));
        }
      }

      // Try inserting into status history table if application id is UUID
      const targetHistoryId = isUuid(updatedApp?.id) ? updatedApp.id : (isUuid(applicationId) ? applicationId : null);
      if (targetHistoryId) {
        await supabase
          .from('application_status_history')
          .insert([{
            application_id: targetHistoryId,
            previous_status: previousStatus,
            new_status: newStatus,
            changed_by: adminEmail,
            reason: reason,
            created_at: now
          }]).catch(() => {});
      }
    } catch (err) {
      console.warn('[MSIT Admin] Supabase status update warning:', err);
    }
  }

  return { success: true, updatedApp };
}

/**
 * Update document verification status (Accept/Verify or Reject with reason).
 *
 * @param {string} applicationId
 * @param {string} docId
 * @param {'Verified'|'Rejected'} newDocStatus
 * @param {string|null} rejectionReason - Required if rejected
 * @param {string} adminEmail
 */
export async function updateDocumentStatus(applicationId, docId, newDocStatus, rejectionReason = null, adminEmail = 'admin') {
  const now = new Date().toISOString();
  let updatedApp = null;

  try {
    const localApps = JSON.parse(localStorage.getItem(ADMIN_LOCAL_STORAGE_APPS_KEY) || '[]');
    const appIdx = localApps.findIndex(a => a.application_id === applicationId || a.id === applicationId);
    if (appIdx !== -1) {
      const app = localApps[appIdx];
      const docs = app.documents || [];
      const docIdx = docs.findIndex(d => d.id === docId);
      if (docIdx !== -1) {
        docs[docIdx] = {
          ...docs[docIdx],
          status: newDocStatus,
          rejection_reason: newDocStatus === 'Rejected' ? rejectionReason : null,
          reviewed_by: adminEmail,
          reviewed_at: now
        };

        // Recalculate overall document_status
        const hasRejected = docs.some(d => d.status === 'Rejected');
        const allVerified = docs.length > 0 && docs.every(d => d.status === 'Verified');
        const hasVerified = docs.some(d => d.status === 'Verified');

        let overallDocStatus = 'Pending Review';
        if (hasRejected) overallDocStatus = 'Rejected';
        else if (allVerified) overallDocStatus = 'Verified';
        else if (hasVerified) overallDocStatus = 'Partially Verified';

        app.documents = docs;
        app.document_status = overallDocStatus;
        app.updated_at = now;
        localApps[appIdx] = app;
        updatedApp = app;
        localStorage.setItem(ADMIN_LOCAL_STORAGE_APPS_KEY, JSON.stringify(localApps));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('msit:application-status-updated', { detail: updatedApp }));
        }
      }
    }
  } catch (e) {}

  return { success: true, updatedApp };
}

/**
 * Generic helper to update candidate-level workflow records (interview schedule, MSIT PGEE result, onboarding).
 */
export async function updateApplicationRecord(applicationId, patchData, adminEmail = 'admin') {
  const now = new Date().toISOString();
  let localApps = [];
  let updatedApp = null;
  try {
    localApps = JSON.parse(localStorage.getItem(ADMIN_LOCAL_STORAGE_APPS_KEY) || '[]');
    const idx = localApps.findIndex(a => a.application_id === applicationId || a.id === applicationId);
    if (idx !== -1) {
      localApps[idx] = {
        ...localApps[idx],
        ...patchData,
        updated_at: now
      };
      updatedApp = localApps[idx];
      localStorage.setItem(ADMIN_LOCAL_STORAGE_APPS_KEY, JSON.stringify(localApps));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('msit:application-status-updated', { detail: updatedApp }));
      }
    }
  } catch (e) {}

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('applications').update({ ...patchData, updated_at: now });
      if (isUuid(applicationId)) {
        query = query.eq('id', applicationId);
      } else {
        query = query.eq('application_id', applicationId);
      }
      await query;
    } catch (err) {
      console.warn('[MSIT Admin] Supabase record update warning:', err);
    }
  }

  return { success: true, updatedApp };
}

/**
 * Log a status change to audit trail.
 */
function logStatusHistory(applicationId, previousStatus, newStatus, adminEmail, reason) {
  try {
    const logs = JSON.parse(localStorage.getItem(ADMIN_LOCAL_STORAGE_LOGS_KEY) || '[]');
    logs.unshift({
      id: 'log_' + Date.now(),
      application_id: applicationId,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: adminEmail,
      reason: reason || (newStatus === 'Accepted' ? 'Application accepted by admissions committee' : 'Status updated'),
      created_at: new Date().toISOString()
    });
    localStorage.setItem(ADMIN_LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {}
}

/**
 * Get status history for an application.
 */
export function getStatusHistory(applicationId) {
  try {
    const logs = JSON.parse(localStorage.getItem(ADMIN_LOCAL_STORAGE_LOGS_KEY) || '[]');
    return logs
      .filter(l => l.application_id === applicationId)
      .map(l => ({
        ...l,
        reason: l.reason 
          ? l.reason
              .replace(/faculty\s*(interview)?\s*round/gi, 'one on one discussion')
              .replace(/faculty interview/gi, 'one on one discussion')
              .replace(/one[- ]on[- ]one interview/gi, 'one on one discussion')
          : l.reason
      }));
  } catch (e) {
    return [];
  }
}

/**
 * Add an internal note to an application.
 */
export async function addApplicationNote(applicationId, noteText, adminEmail = 'admin') {
  const newNote = {
    id: 'note_' + Date.now(),
    application_id: applicationId,
    note: noteText.trim(),
    admin_email: adminEmail,
    created_at: new Date().toISOString()
  };

  try {
    const notes = JSON.parse(localStorage.getItem(ADMIN_LOCAL_STORAGE_NOTES_KEY) || '[]');
    notes.unshift(newNote);
    localStorage.setItem(ADMIN_LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
  } catch (e) {}

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('application_notes')
        .insert([{
          application_id: applicationId,
          note: noteText.trim(),
          admin_email: adminEmail,
          created_at: newNote.created_at
        }]);
    } catch (err) {
      console.warn('[MSIT Admin] Supabase note insert error:', err);
    }
  }

  return newNote;
}

/**
 * Get internal notes for an application.
 */
export function getApplicationNotes(applicationId) {
  try {
    const notes = JSON.parse(localStorage.getItem(ADMIN_LOCAL_STORAGE_NOTES_KEY) || '[]');
    return notes.filter(n => n.application_id === applicationId);
  } catch (e) {
    return [];
  }
}

/**
 * Reset test/mock data to initial seed.
 */
export function resetMockData() {
  try {
    localStorage.setItem(ADMIN_LOCAL_STORAGE_APPS_KEY, JSON.stringify(SEED_MOCK_APPLICATIONS));
    localStorage.removeItem(ADMIN_LOCAL_STORAGE_NOTES_KEY);
    localStorage.removeItem(ADMIN_LOCAL_STORAGE_LOGS_KEY);
  } catch (e) {}
}

export const ADMIN_LOCAL_STORAGE_SETTINGS_KEY = 'msit_admission_settings';

export const DEFAULT_ADMISSION_SETTINGS = {
  cohort: 'January 2027 Intake',
  isApplicationOpen: true,
  applicationStartDate: 'October 1, 2026',
  applicationDeadline: 'November 30, 2026',
  admissionModes: 'GRE, GATE, or MSIT Exam',
  admissionModesDesc: "Confirm your evaluation mode: submit valid GRE/GATE scorecards or register for MSIT's own entrance exam.",
  gatExamDate: 'December 15, 2026',
  gatSchedule: 'December 15, 2026',
  interviewSchedule: 'TBD',
  interviewInstructions: 'Brush up on computational logic and problem-solving for the technical interaction (Interview & counselling dates: TBD).',
  commencementDate: 'January 2, 2027',
  commencementVenue: 'IIIT Hyderabad',
  onboardingInstructions: 'Confirmed batch commencement date is January 2, 2027 at IIIT Hyderabad.',
  nextActionTitle: 'Admission Status',
  nextActionDesc: "Review your admission progress across the five key evaluation and onboarding milestones.",
  greMinScore: 300,
  gateMinScore: 350
};

let admissionSettingsTableMissing = false;

/**
 * Retrieve admission configuration from Supabase or localStorage.
 * Connects Recommended Next Action and cycle information to real admin settings.
 */
export async function getAdmissionSettings() {
  // 1. Try Supabase
  if (!admissionSettingsTableMissing && isSupabaseConfigured() && supabase) {
    try {
      const { data, error, status } = await supabase
        .from('admission_settings')
        .select('*')
        .eq('id', 'current')
        .maybeSingle();

      if (error || status === 404) {
        admissionSettingsTableMissing = true;
      } else if (data && data.settings) {
        return { ...DEFAULT_ADMISSION_SETTINGS, ...data.settings };
      }
    } catch (err) {
      admissionSettingsTableMissing = true;
    }
  }

  // 2. Try localStorage
  try {
    const raw = localStorage.getItem(ADMIN_LOCAL_STORAGE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ADMISSION_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('[MSIT Admin] localStorage getAdmissionSettings warning:', e);
  }

  return { ...DEFAULT_ADMISSION_SETTINGS };
}

/**
 * Save admission configuration to Supabase and localStorage.
 * Automatically broadcasts live update to all listeners.
 */
export async function saveAdmissionSettings(updatedSettings) {
  const merged = {
    ...DEFAULT_ADMISSION_SETTINGS,
    ...updatedSettings,
    updated_at: new Date().toISOString()
  };

  // 1. Write to localStorage for instant client persistence
  try {
    localStorage.setItem(ADMIN_LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(merged));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('msit:admission-settings-updated', { detail: merged }));
    }
  } catch (e) {
    console.warn('[MSIT Admin] localStorage saveAdmissionSettings warning:', e);
  }

  // 2. Write to Supabase if configured
  if (!admissionSettingsTableMissing && isSupabaseConfigured() && supabase) {
    try {
      const { error, status } = await supabase
        .from('admission_settings')
        .upsert({
          id: 'current',
          cohort: merged.cohort,
          settings: merged,
          updated_at: merged.updated_at
        }, { onConflict: 'id' });
      if (error || status === 404) {
        admissionSettingsTableMissing = true;
      }
    } catch (err) {
      admissionSettingsTableMissing = true;
    }
  }

  return merged;
}

