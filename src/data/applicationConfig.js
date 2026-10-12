/**
 * MSIT Prospective Student Application Form Configuration
 * Definitive field definitions, validation parameters, and options.
 */

export const APPLICATION_CONFIG = {
  isApplicationOpen: true,
  cohort: 'January 2027 Intake',
  standbyRoute: '/apply',
  portalTitle: 'MSIT Application Portal',
  supportEmail: 'admissions@msit.ac.in',
  supportPhone: '+91 40 6653 1000',
  statementMaxWords: 300,
  recommendedEligibilityThresholdPercentage: 68,
  recommendedEligibilityThresholdCgpa: 6.8
};

export const INITIAL_APPLICATION_STATE = {
  // Section 1: Personal & Contact Information
  fullName: '',
  email: '',
  phone: '',
  dob: '',
  address: '',

  // Section 2: Emergency Contact Number
  parentRelationship: '',
  parentName: '',
  altPhone: '', // Contact Number

  // Section 3: Academic Qualifications
  // 3A. Class 10 / SSC
  class10School: '',
  class10Year: '',
  class10Score: '',
  class10ScoreType: 'Percentage', // 'Percentage' | 'CGPA'

  // 3B. Class 12 / Intermediate
  interCollege: '',
  interYear: '',
  interPathway: 'Class 12 / Intermediate', // 'Class 12 / Intermediate' | 'Polytechnic / Diploma' | 'Other Recognized Higher Secondary'
  interScore: '',
  interScoreType: 'Percentage', // 'Percentage' | 'CGPA'

  // 3C. Qualifying Degree
  ugDegree: 'B.Tech / B.E.',
  university: '',
  branch: '',
  specialization: '',
  department: '',
  passingYear: '2026',
  gradingScale: 'Percentage (out of 100%)',
  cgpa: '',
  scoreEligibilityNote: '',

  // Section 4: Work Experience
  hasExperience: 'No', // 'No' (Fresher) | 'Yes' (Experienced)
  experienceYears: '0',
  experienceMonths: '0',
  companyName: '',
  jobRole: '',

  // Section 5: Statement of Purpose (Mandatory, max 300 words)
  statementText: '',
  statementWordCount: 0,

  // Section 6: How did you hear about MSIT?
  referralSource: '',
  referralExplanation: '',

  // Section 7: Entrance Examination Details
  entranceExamStatus: 'Neither', // 'Neither' | 'GRE' | 'GATE' | 'Both'
  greScore: '',
  greYear: '',
  gateScore: '',
  gateYear: '',

  // Uploaded Documents Metadata Map
  documents: {
    class10Doc: null,
    class12Doc: null,
    ugDegreeDoc: null,
    degreeCertDoc: null,
    additionalDegree16YearDoc: null,
    greScorecardDoc: null,
    gateScorecardDoc: null
  },

  // Mandatory CV
  cvDocument: null,

  // Meta status
  isSubmitted: false,
  applicationId: null,
  submittedAt: null,
  status: 'Not Started'
};

export const PARENT_RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Guardian',
  'Spouse',
  'Sibling',
  'Other'
];

export const INTER_PATHWAY_OPTIONS = [
  'Class 12 / Intermediate',
  'Polytechnic / Diploma',
  'Other Recognized Higher Secondary'
];

export const UG_DEGREE_OPTIONS = [
  'B.Tech / B.E.',
  'MCA (Master of Computer Applications)',
  'M.Sc (Computer Science / IT / Mathematics)',
  'B.Sc (Computer Science / IT / Allied)',
  'BCA (Bachelor of Computer Applications)',
  'B.S. in Engineering / Computing',
  'Other Accepted Bachelor’s / Master’s Degree'
];

export const DEPARTMENT_OPTIONS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Data Science / AI / ML',
  'Mechanical Engineering',
  'Civil Engineering',
  'Computer Applications / Software Systems',
  'Other Engineering / Computing Branch'
];

export const GRADING_SCALE_OPTIONS = [
  { value: 'Percentage (out of 100%)', label: 'Percentage (out of 100%)', max: 100, threshold: 68 },
  { value: '10-Point CGPA', label: '10-Point CGPA (out of 10.0)', max: 10.0, threshold: 6.8 },
  { value: '4-Point GPA', label: '4-Point GPA (out of 4.0)', max: 4.0, threshold: 2.72 }
];

export const PASSING_YEAR_OPTIONS = [
  '2027 (Appearing Final Year)',
  '2026',
  '2025',
  '2024',
  '2023',
  '2022 or earlier'
];

export const REFERRAL_SOURCE_OPTIONS = [
  'Relatives',
  'Friends',
  'Instagram',
  'LinkedIn',
  'Other'
];

export const ENTRANCE_EXAM_OPTIONS = [
  'Neither',
  'GRE',
  'GATE',
  'Both'
];

export const EXAM_YEAR_OPTIONS = [
  '2026',
  '2025',
  '2024',
  '2023',
  '2022 or earlier'
];

export const WORK_EXP_YEAR_OPTIONS = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8+'
];

export const WORK_EXP_MONTH_OPTIONS = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'
];

/**
 * Checks whether the qualifying degree requires 16-year education proof
 * e.g., MCA candidates or non-4-year degree graduates.
 */
export function requires16YearProof(ugDegree) {
  if (!ugDegree) return false;
  const d = ugDegree.toLowerCase();
  return d.includes('mca') || d.includes('m.sc') || d.includes('bca') || d.includes('b.sc');
}

export const DOCUMENT_DEFINITIONS = {
  class10Doc: {
    key: 'class10Doc',
    title: 'Class 10 / SSC Marksheet or Memo',
    required: true,
    acceptedFormats: 'PDF, JPG, PNG (Max 10 MB)',
    helper: 'Upload your Class 10 / SSC or equivalent secondary school marksheet / pass certificate.'
  },
  class12Doc: {
    key: 'class12Doc',
    title: 'Intermediate / Class 12 / Diploma Marksheet or Memo',
    required: true,
    acceptedFormats: 'PDF, JPG, PNG (Max 10 MB)',
    helper: 'Upload your Higher Secondary / Intermediate / Diploma consolidated marks memo.'
  },
  ugDegreeDoc: {
    key: 'ugDegreeDoc',
    title: 'Degree Marksheet / Consolidated Marks Memo',
    required: true,
    acceptedFormats: 'PDF, JPG, PNG (Max 10 MB)',
    helper: 'Upload your semester-wise or consolidated undergraduate marks memo.'
  },
  degreeCertDoc: {
    key: 'degreeCertDoc',
    title: 'Degree Certificate / Provisional Certificate',
    required: false,
    acceptedFormats: 'PDF, JPG, PNG (Max 10 MB)',
    helper: 'Upload your provisional certificate or convocation degree certificate (optional if currently appearing in final year).'
  },
  additionalDegree16YearDoc: {
    key: 'additionalDegree16YearDoc',
    title: 'Additional Qualifying Degree / 16-Year Education Proof',
    required: false, // dynamically enforced if requires16YearProof(ugDegree)
    acceptedFormats: 'PDF, JPG, PNG (Max 10 MB)',
    helper: 'Required for MCA or non-4-year degree holders to verify 16 years of formal education (e.g., prior degree marksheets or certificate).'
  },
  greScorecardDoc: {
    key: 'greScorecardDoc',
    title: 'GRE Scorecard',
    required: false, // dynamically enforced if GRE is selected
    acceptedFormats: 'PDF, JPG, PNG (Max 10 MB)',
    helper: 'Upload your official or downloaded ETS GRE score report.'
  },
  gateScorecardDoc: {
    key: 'gateScorecardDoc',
    title: 'GATE Scorecard',
    required: false, // dynamically enforced if GATE is selected
    acceptedFormats: 'PDF, JPG, PNG (Max 10 MB)',
    helper: 'Upload your official GATE scorecard.'
  },
  cvDocument: {
    key: 'cvDocument',
    title: 'Curriculum Vitae (CV) / Resume',
    required: true,
    acceptedFormats: 'PDF, DOC, DOCX (Max 5 MB)',
    helper: 'Upload your updated resume detailing education, technical projects, and skills.'
  }
};

export const ACADEMIC_DOC_DEFINITIONS = [
  DOCUMENT_DEFINITIONS.class10Doc,
  DOCUMENT_DEFINITIONS.class12Doc,
  DOCUMENT_DEFINITIONS.ugDegreeDoc,
  DOCUMENT_DEFINITIONS.degreeCertDoc
];

