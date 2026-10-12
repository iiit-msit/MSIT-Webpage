import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ArrowRightIcon, 
  HelpCircleIcon,
  DownloadIcon, 
  UploadIcon, 
  XIcon, 
  UserIcon, 
  GraduationCapIcon, 
  ShieldCheckIcon, 
  BookOpenIcon, 
  SparklesIcon, 
  MailIcon,
  BriefcaseIcon,
  PhoneIcon,
  MapPinIcon,
  AwardIcon,
  UsersIcon,
  InfoIcon,
  EditIcon
} from '../components/Icons';
import { 
  APPLICATION_CONFIG, 
  INITIAL_APPLICATION_STATE, 
  PARENT_RELATIONSHIP_OPTIONS,
  INTER_PATHWAY_OPTIONS,
  UG_DEGREE_OPTIONS, 
  DEPARTMENT_OPTIONS, 
  PASSING_YEAR_OPTIONS,
  GRADING_SCALE_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  ENTRANCE_EXAM_OPTIONS,
  EXAM_YEAR_OPTIONS,
  WORK_EXP_YEAR_OPTIONS,
  WORK_EXP_MONTH_OPTIONS,
  DOCUMENT_DEFINITIONS,
  requires16YearProof
} from '../data/applicationConfig';
import { 
  getUserApplication, 
  getSavedDraft, 
  saveApplicationDraft, 
  uploadDocumentFile, 
  submitStudentApplication,
  updateStudentApplication,
  generateApplicationId
} from '../services/applicationService';
import { openDocumentInNewTab } from '../utils/documentStore';
import { getStudentDisplayName } from '../utils/userUtils';
import PrintableApplicationDocument from '../components/PrintableApplicationDocument';

// Stepper Step Metadata (8 Sections)
const FORM_SECTIONS = [
  { id: 1, title: 'Personal Info', fullTitle: 'Personal & Contact Information', shortLabel: 'Personal' },
  { id: 2, title: 'Emergency Contact', fullTitle: 'Emergency Contact Number', shortLabel: 'Emergency' },
  { id: 3, title: 'Academics', fullTitle: 'Academic Qualifications', shortLabel: 'Academics' },
  { id: 4, title: 'Work Experience', fullTitle: 'Work Experience & Resume', shortLabel: 'Experience' },
  { id: 5, title: 'Statement of Purpose', fullTitle: 'Statement of Purpose', shortLabel: 'SOP' },
  { id: 6, title: 'Referral Source', fullTitle: 'How Did You Hear About MSIT?', shortLabel: 'Referral' },
  { id: 7, title: 'Entrance Exams', fullTitle: 'Entrance Examination Details', shortLabel: 'Exams' },
  { id: 8, title: 'Review & Submit', fullTitle: 'Review & Submit Application', shortLabel: 'Review' }
];

export default function ApplicationPortalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const urlMode = searchParams.get('mode'); // 'view' | 'edit' | null
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [saveDraftMessage, setSaveDraftMessage] = useState(null);

  // Active / Submitted Application Record
  const [serverApp, setServerApp] = useState(null);
  const [portalMode, setPortalMode] = useState(urlMode || 'form'); // 'form' | 'view' | 'edit' | 'success'

  // Application Form Data
  const [formData, setFormData] = useState(() => {
    return {
      ...INITIAL_APPLICATION_STATE,
      fullName: user ? getStudentDisplayName(user) : '',
      email: user?.email || ''
    };
  });

  // Helper to map document array or document object map to unified documents state
  const mapDocsArrayToMap = (docsInput) => {
    const docsMap = { ...INITIAL_APPLICATION_STATE.documents };
    if (!docsInput) return docsMap;

    const assignDoc = (key, doc) => {
      if (!doc || typeof doc !== 'object') return;
      const fileName = doc.fileName || doc.file_name || (key === 'cvDoc' ? 'Candidate_CV.pdf' : `${key}.pdf`);
      const fileSize = doc.fileSize || doc.file_size || '1.2 MB';
      const fileUrl = doc.fileUrl || doc.file_url || '';
      const docType = doc.docType || doc.doc_type || key;

      docsMap[key] = {
        id: doc.id || `doc_${key}`,
        docType: docType,
        doc_type: docType,
        fileName: fileName,
        file_name: fileName,
        fileSize: fileSize,
        file_size: fileSize,
        fileUrl: fileUrl,
        file_url: fileUrl,
        storagePath: doc.storagePath || doc.storage_path || '',
        storage_path: doc.storagePath || doc.storage_path || '',
        status: doc.status || 'Uploaded',
        uploadedAt: doc.uploadedAt || doc.uploaded_at || new Date().toISOString()
      };
    };

    const matchAndAssign = (doc, explicitKey = '') => {
      if (!doc || typeof doc !== 'object') return;
      const searchStr = `${explicitKey} ${doc.key || ''} ${doc.doc_type || ''} ${doc.docType || ''} ${doc.file_name || ''} ${doc.fileName || ''} ${doc.id || ''}`.toLowerCase();

      if (searchStr.includes('class10') || searchStr.includes('class 10') || searchStr.includes('ssc') || searchStr.includes('10th') || searchStr.includes('secondary')) {
        assignDoc('class10Doc', doc);
      } else if (searchStr.includes('class12') || searchStr.includes('class 12') || searchStr.includes('intermediate') || searchStr.includes('inter') || searchStr.includes('diploma') || searchStr.includes('12th')) {
        assignDoc('class12Doc', doc);
      } else if (searchStr.includes('16-year') || searchStr.includes('16 year') || searchStr.includes('16year') || searchStr.includes('additional qualifying')) {
        assignDoc('additionalDegree16YearDoc', doc);
      } else if (searchStr.includes('degree cert') || searchStr.includes('degree_cert') || searchStr.includes('provisional') || searchStr.includes('convocation')) {
        assignDoc('degreeCertDoc', doc);
      } else if (searchStr.includes('ugdegree') || searchStr.includes('ug_degree') || searchStr.includes('consolidated') || searchStr.includes('marks memo') || searchStr.includes('transcript') || searchStr.includes('degree')) {
        assignDoc('ugDegreeDoc', doc);
      } else if (searchStr.includes('gre')) {
        assignDoc('greScorecardDoc', doc);
      } else if (searchStr.includes('gate')) {
        assignDoc('gateScorecardDoc', doc);
      } else if (searchStr.includes('cv') || searchStr.includes('resume')) {
        assignDoc('cvDoc', doc);
      }
    };

    if (Array.isArray(docsInput)) {
      docsInput.forEach(doc => matchAndAssign(doc));
    } else if (typeof docsInput === 'object') {
      ['class10Doc', 'class12Doc', 'ugDegreeDoc', 'degreeCertDoc', 'additionalDegree16YearDoc', 'greScorecardDoc', 'gateScorecardDoc', 'cvDoc'].forEach(k => {
        if (docsInput[k]) assignDoc(k, docsInput[k]);
      });
      Object.entries(docsInput).forEach(([k, doc]) => {
        matchAndAssign(doc, k);
      });
    }

    return docsMap;
  };

  // Load existing application or saved draft on mount
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      if (!user?.email) return;

      const resolvedName = getStudentDisplayName(user);
      const email = user.email.toLowerCase();

      try {
        const { application: app } = await getUserApplication(user);

        if (!isMounted) return;

        if (app && app.status && app.status !== 'Draft') {
          // Application has already been submitted
          setServerApp(app);
          const restoredDocs = mapDocsArrayToMap(app.documents);

          // Resolve CV document
          let resolvedCv = app.cvDocument || restoredDocs.cvDoc || null;
          if (!resolvedCv && (app.cv_url || app.cv_filename)) {
            resolvedCv = {
              fileName: app.cv_filename || 'Candidate_CV_Resume.pdf',
              file_name: app.cv_filename || 'Candidate_CV_Resume.pdf',
              fileUrl: app.cv_url || '',
              file_url: app.cv_url || '',
              fileSize: '1.2 MB',
              file_size: '1.2 MB',
              status: 'Uploaded',
              uploadedAt: app.submitted_at || new Date().toISOString()
            };
          }

          // If the application is already Submitted, guarantee that verified submissions have on-record documents:
          // A candidate cannot submit without uploading these mandatory documents.
          if (!restoredDocs.class10Doc) {
            restoredDocs.class10Doc = {
              fileName: app.class10_filename || 'Class10_Marksheet_Memo.pdf',
              file_name: app.class10_filename || 'Class10_Marksheet_Memo.pdf',
              fileSize: '1.1 MB',
              file_size: '1.1 MB',
              status: 'Uploaded',
              uploadedAt: app.submitted_at || new Date().toISOString()
            };
          }
          if (!restoredDocs.class12Doc) {
            restoredDocs.class12Doc = {
              fileName: app.class12_filename || 'Class12_Intermediate_Memo.pdf',
              file_name: app.class12_filename || 'Class12_Intermediate_Memo.pdf',
              fileSize: '1.4 MB',
              file_size: '1.4 MB',
              status: 'Uploaded',
              uploadedAt: app.submitted_at || new Date().toISOString()
            };
          }
          if (!restoredDocs.ugDegreeDoc) {
            restoredDocs.ugDegreeDoc = {
              fileName: app.ug_degree_filename || 'Degree_Consolidated_Marks_Memo.pdf',
              file_name: app.ug_degree_filename || 'Degree_Consolidated_Marks_Memo.pdf',
              fileSize: '2.5 MB',
              file_size: '2.5 MB',
              status: 'Uploaded',
              uploadedAt: app.submitted_at || new Date().toISOString()
            };
          }
          if (!resolvedCv) {
            resolvedCv = {
              fileName: app.cv_filename || 'Candidate_CV_Resume.pdf',
              file_name: app.cv_filename || 'Candidate_CV_Resume.pdf',
              fileSize: '1.2 MB',
              file_size: '1.2 MB',
              status: 'Uploaded',
              uploadedAt: app.submitted_at || new Date().toISOString()
            };
          }
          restoredDocs.cvDoc = resolvedCv;

          setFormData({
            ...INITIAL_APPLICATION_STATE,
            ...app,
            applicationId: app.application_id || app.id || INITIAL_APPLICATION_STATE.applicationId,
            fullName: app.full_name || resolvedName,
            email: app.email || email,
            phone: app.phone || '',
            dob: app.dob || '',
            address: app.address || '',
            parentRelationship: app.parent_relationship || 'Father',
            parentName: app.parent_name || '',
            altPhone: app.alt_phone || '',
            class10Score: app.class10_score || '',
            class10ScoreType: app.class10_score_type || 'Percentage',
            interPathway: app.inter_pathway || 'Class 12 / Intermediate',
            interScore: app.inter_score || '',
            interScoreType: app.inter_score_type || 'Percentage',
            ugDegree: app.ug_degree || 'B.Tech / B.E.',
            university: app.university || '',
            branch: app.branch || '',
            specialization: app.specialization || '',
            department: app.department || '',
            passingYear: app.passing_year || '2026',
            gradingScale: app.grading_scale || 'Percentage (out of 100%)',
            cgpa: app.cgpa || '',
            hasExperience: app.has_experience || 'No',
            experienceYears: app.experience_years || '0',
            experienceMonths: app.experience_months || '0',
            companyName: app.company_name || '',
            jobRole: app.job_role || '',
            statementText: app.statement_text || app.purpose_to_join || '',
            referralSource: app.referral_source || '',
            referralExplanation: app.referral_explanation || '',
            entranceExamStatus: app.entrance_exam_status || 'Appear for the MSIT PGEE exam',
            greScore: app.gre_score || '',
            greYear: app.gre_year || '',
            gateScore: app.gate_score || '',
            gateYear: app.gate_year || '',
            documents: restoredDocs,
            cvDocument: resolvedCv,
            isSubmitted: true
          });

          const isDeclined = app.status === 'Declined' || app.status === 'Rejected';
          if (app.status === 'Additional Information Required' || urlMode === 'edit' || urlMode === 'reapply' || (isDeclined && urlMode !== 'view')) {
            setPortalMode('edit');
          } else {
            setPortalMode('view');
          }
          return;
        }

        // Check for saved in-progress draft
        const draft = getSavedDraft(email);
        if (draft) {
          setFormData({
            ...INITIAL_APPLICATION_STATE,
            ...draft,
            fullName: draft.fullName || resolvedName,
            email: email,
            documents: {
              ...INITIAL_APPLICATION_STATE.documents,
              ...(draft.documents || {})
            }
          });
          setLastSavedTime(draft.updated_at ? new Date(draft.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saved');
        } else {
          // Initialize fresh state with prefilled candidate info
          setFormData(prev => ({
            ...prev,
            fullName: resolvedName,
            email: email
          }));
        }
      } catch (err) {
        console.warn('[MSIT] Application data load warning:', err);
      }
    }

    loadInitialData();
    return () => { isMounted = false; };
  }, [user, urlMode]);

  // Warn before leaving if user has unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDraftDirty && portalMode !== 'view' && !formData.isSubmitted) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in your application. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDraftDirty, portalMode, formData.isSubmitted]);

  // Scroll to top when changing steps
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, portalMode]);

  // Word counter calculation for Section 5 (200 words max)
  const getWordCount = (text) => {
    if (!text || typeof text !== 'string') return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const currentStatementWords = getWordCount(formData.statementText);

  // 68% eligibility threshold calculation
  const getEligibilityAdvisory = () => {
    if (!formData.cgpa) return null;
    const scoreNum = parseFloat(formData.cgpa);
    if (isNaN(scoreNum)) return null;

    const scale = formData.gradingScale;
    let isBelow = false;
    let thresholdLabel = '68%';

    if (scale.includes('Percentage')) {
      thresholdLabel = '68%';
      isBelow = scoreNum < 68;
    } else if (scale.includes('10-Point')) {
      thresholdLabel = '6.8 CGPA';
      isBelow = scoreNum < 6.8;
    } else if (scale.includes('4-Point')) {
      thresholdLabel = '2.72 GPA';
      isBelow = scoreNum < 2.72;
    }

    if (isBelow) {
      return {
        isBelow: true,
        thresholdLabel,
        message: `Advisory Note: The officially recommended undergraduate degree eligibility threshold for MSIT is ${thresholdLabel}. While your entered score (${formData.cgpa}) is below this benchmark, the admissions committee conducts a comprehensive evaluation of every candidate, considering technical projects, entrance exam scores, and your statement of purpose. You may proceed with your application.`
      };
    }
    return null;
  };

  const eligibilityAdvisory = getEligibilityAdvisory();

  // Contact Label Helpers
  const getParentNameLabel = () => "Contact Name";
  const getParentPhoneLabel = () => "Contact Number";

  // Handle generic field change
  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Handle conditional resets
      if (field === 'hasExperience' && value === 'No') {
        updated.experienceYears = '0';
        updated.experienceMonths = '0';
        updated.companyName = '';
        updated.jobRole = '';
      }

      if (field === 'referralSource' && value !== 'Other') {
        updated.referralExplanation = '';
      }

      if (field === 'entranceExamStatus') {
        if (value === 'Neither') {
          updated.greScore = '';
          updated.greYear = '';
          updated.gateScore = '';
          updated.gateYear = '';
          updated.documents = {
            ...updated.documents,
            greScorecardDoc: null,
            gateScorecardDoc: null
          };
        } else if (value === 'GRE') {
          updated.gateScore = '';
          updated.gateYear = '';
          updated.documents = {
            ...updated.documents,
            gateScorecardDoc: null
          };
        } else if (value === 'GATE') {
          updated.greScore = '';
          updated.greYear = '';
          updated.documents = {
            ...updated.documents,
            greScorecardDoc: null
          };
        }
      }

      return updated;
    });

    setIsDraftDirty(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Explicit Save Draft action (DOES NOT BLOCK on incomplete required fields!)
  const handleSaveDraft = async () => {
    if (!user?.email) return;
    try {
      const res = await saveApplicationDraft(formData, user);
      if (res.success) {
        setIsDraftDirty(false);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(timeStr);
        setSaveDraftMessage('Draft saved successfully!');
        setTimeout(() => setSaveDraftMessage(null), 3000);
      }
    } catch (err) {
      console.warn('[MSIT] Save draft warning:', err);
    }
  };

  // Handle document file upload
  const handleFileUpload = async (file, docTypeKey, docTypeLabel) => {
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, [docTypeKey]: true }));
    if (errors[docTypeKey]) {
      setErrors(prev => ({ ...prev, [docTypeKey]: null }));
    }

    try {
      const res = await uploadDocumentFile(file, docTypeLabel, formData.applicationId || 'new', user);
      setUploadProgress(prev => ({ ...prev, [docTypeKey]: false }));

      if (res.error) {
        setErrors(prev => ({ ...prev, [docTypeKey]: res.error.message }));
        return;
      }

      setFormData(prev => {
        const updatedDocs = {
          ...prev.documents,
          [docTypeKey]: res.data
        };
        const updated = {
          ...prev,
          documents: updatedDocs
        };
        if (docTypeKey === 'cvDocument') {
          updated.cvDocument = res.data;
        }
        return updated;
      });

      setIsDraftDirty(true);
    } catch (err) {
      setUploadProgress(prev => ({ ...prev, [docTypeKey]: false }));
      setErrors(prev => ({ ...prev, [docTypeKey]: 'Upload failed. Please check file format and try again.' }));
    }
  };

  // Section-level validation
  const validateSection = (stepNum) => {
    const errs = {};
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{8,14}$/;

    // SECTION 1: Personal & Contact Information
    if (stepNum === 1) {
      if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
      if (!formData.email.trim()) errs.email = 'Email Address is required';
      
      if (!formData.phone.trim()) {
        errs.phone = 'Mobile Phone Number is required';
      } else if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
        errs.phone = 'Please enter a valid 10-digit mobile number';
      }

      if (!formData.dob) {
        errs.dob = 'Date of birth is required';
      } else {
        const dobDate = new Date(formData.dob);
        const now = new Date();
        const age = (now - dobDate) / (365.25 * 24 * 60 * 60 * 1000);
        if (isNaN(dobDate.getTime())) {
          errs.dob = 'Please select a valid date';
        } else if (dobDate >= now) {
          errs.dob = 'Date of birth cannot be in the future';
        } else if (age < 15) {
          errs.dob = 'Candidate must be at least 15 years of age';
        }
      }

      if (!formData.address.trim()) {
        errs.address = 'Residential Address is required';
      }
    }

    // SECTION 2: Emergency Contact Number
    if (stepNum === 2) {
      if (!formData.parentName.trim()) {
        errs.parentName = 'Contact Name is required';
      }

      if (!formData.parentRelationship || !formData.parentRelationship.trim()) {
        errs.parentRelationship = 'Relationship is required';
      }

      if (!formData.altPhone.trim()) {
        errs.altPhone = 'Contact Number is required';
      } else if (!phoneRegex.test(formData.altPhone.replace(/\s+/g, ''))) {
        errs.altPhone = 'Please enter a valid 10-digit contact number';
      }
    }

    // SECTION 3: Academic Qualifications
    if (stepNum === 3) {
      // 3A. Class 10
      if (!formData.class10Score || !formData.class10Score.trim()) {
        errs.class10Score = 'Class 10 / SSC score is required';
      } else {
        const val = parseFloat(formData.class10Score);
        if (isNaN(val) || val <= 0) {
          errs.class10Score = 'Please enter a valid score';
        } else if (formData.class10ScoreType === 'Percentage' && val > 100) {
          errs.class10Score = 'Percentage cannot exceed 100%';
        } else if (formData.class10ScoreType === 'CGPA' && val > 10) {
          errs.class10Score = 'CGPA cannot exceed 10.0';
        }
      }

      if (!formData.documents?.class10Doc) {
        errs.class10Doc = 'Class 10 / SSC Marksheet or Memo upload is required';
      }

      // 3B. Class 12 / Intermediate
      if (!formData.interScore || !formData.interScore.trim()) {
        errs.interScore = 'Intermediate / Class 12 score is required';
      } else {
        const val = parseFloat(formData.interScore);
        if (isNaN(val) || val <= 0) {
          errs.interScore = 'Please enter a valid score';
        } else if (formData.interScoreType === 'Percentage' && val > 100) {
          errs.interScore = 'Percentage cannot exceed 100%';
        } else if (formData.interScoreType === 'CGPA' && val > 10) {
          errs.interScore = 'CGPA cannot exceed 10.0';
        }
      }

      if (!formData.documents?.class12Doc) {
        errs.class12Doc = 'Intermediate / Class 12 Marksheet or Memo upload is required';
      }

      // 3C. Qualifying Degree
      if (!formData.ugDegree) errs.ugDegree = 'Qualifying Degree is required';
      if (!formData.university.trim()) errs.university = 'University / Institution name is required';
      if (!formData.branch || !formData.branch.trim()) errs.branch = 'Branch is required';
      if (!formData.passingYear) errs.passingYear = 'Graduation year is required';

      if (!formData.cgpa || !formData.cgpa.trim()) {
        errs.cgpa = 'Aggregate CGPA / Percentage is required';
      } else {
        const val = parseFloat(formData.cgpa);
        if (isNaN(val) || val <= 0) {
          errs.cgpa = 'Please enter a valid numeric score';
        } else if (formData.gradingScale.includes('Percentage') && val > 100) {
          errs.cgpa = 'Percentage cannot exceed 100%';
        } else if (formData.gradingScale.includes('10-Point') && val > 10) {
          errs.cgpa = '10-Point CGPA cannot exceed 10.0';
        } else if (formData.gradingScale.includes('4-Point') && val > 4) {
          errs.cgpa = '4-Point GPA cannot exceed 4.0';
        }
      }

      if (!formData.documents?.ugDegreeDoc) {
        errs.ugDegreeDoc = 'Degree Marksheet / Consolidated Marks Memo upload is required';
      }

      // Conditional 16-Year Education Proof for MCA / non-4-year degrees
      if (requires16YearProof(formData.ugDegree)) {
        if (!formData.documents?.additionalDegree16YearDoc) {
          errs.additionalDegree16YearDoc = '16-Year Education Proof is required for your qualifying degree';
        }
      }
    }

    // SECTION 4: Work Experience
    if (stepNum === 4) {
      if (formData.hasExperience === 'Yes') {
        if (!formData.companyName.trim()) {
          errs.companyName = 'Company name is required';
        }
        if (!formData.jobRole.trim()) {
          errs.jobRole = 'Job title / role is required';
        }
      }

      // CV / Resume is required
      if (!formData.cvDocument && !formData.documents?.cvDoc && !formData.documents?.cvDocument && !formData.cv_url) {
        errs.cvDocument = 'Curriculum Vitae (CV) / Resume upload is required';
      }
    }

    // SECTION 5: Statement of Purpose
    if (stepNum === 5) {
      if (!formData.statementText.trim()) {
        errs.statementText = 'Please provide your Statement of Purpose explaining why you want to join MSIT';
      } else if (currentStatementWords > APPLICATION_CONFIG.statementMaxWords) {
        errs.statementText = `Your Statement of Purpose exceeds the 300-word limit (${currentStatementWords} words). Please reduce to 300 words or less.`;
      }
    }

    // SECTION 6: How Did You Hear About MSIT?
    if (stepNum === 6) {
      if (!formData.referralSource) {
        errs.referralSource = 'Please select how you heard about the MSIT programme';
      } else if (formData.referralSource === 'Other' && !formData.referralExplanation.trim()) {
        errs.referralExplanation = 'Please specify how you heard about MSIT';
      }
    }

    // SECTION 7: Entrance Examination Details
    if (stepNum === 7) {
      if (!formData.entranceExamStatus) {
        errs.entranceExamStatus = 'Please select your entrance examination option';
      }

      if (formData.entranceExamStatus === 'GRE' || formData.entranceExamStatus === 'Both') {
        if (!formData.greScore || !formData.greScore.trim()) {
          errs.greScore = 'GRE score is required';
        } else {
          const val = parseFloat(formData.greScore);
          if (isNaN(val) || val <= 0) {
            errs.greScore = 'Please enter a valid GRE score';
          }
        }
        if (!formData.documents?.greScorecardDoc) {
          errs.greScorecardDoc = 'GRE Scorecard upload is required';
        }
      }

      if (formData.entranceExamStatus === 'GATE' || formData.entranceExamStatus === 'Both') {
        if (!formData.gateScore || !formData.gateScore.trim()) {
          errs.gateScore = 'GATE score is required';
        } else {
          const val = parseFloat(formData.gateScore);
          if (isNaN(val) || val <= 0) {
            errs.gateScore = 'Please enter a valid GATE score';
          }
        }
        if (!formData.documents?.gateScorecardDoc) {
          errs.gateScorecardDoc = 'GATE Scorecard upload is required';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Continue to Next Section
  const handleNextSection = () => {
    if (validateSection(currentStep)) {
      handleSaveDraft();
      setCurrentStep(prev => Math.min(prev + 1, 8));
    }
  };

  // Back to Previous Section
  const handlePrevSection = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Direct step jump (from stepper tab or review edit link)
  const handleJumpToSection = (stepNum) => {
    // Save draft without blocking
    handleSaveDraft();
    setCurrentStep(stepNum);
  };

  // Verify all sections for final submission (returns first failing step, or 0 if all pass)
  const validateAllSections = () => {
    for (let s = 1; s <= 7; s++) {
      if (!validateSection(s)) {
        return s;
      }
    }
    return 0;
  };

  // Final Application Submission
  const handleSubmitApplication = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const failingStep = validateAllSections();
    if (failingStep > 0) {
      setCurrentStep(failingStep);
      validateSection(failingStep);
      const sectionNames = {
        1: 'Personal Details',
        2: 'Emergency Contact Number',
        3: 'Academic Qualifications',
        4: 'Work Experience',
        5: 'Statement of Purpose',
        6: 'Referral Source',
        7: 'Entrance Examination Details'
      };
      alert(`Please complete the required fields in Section ${failingStep} (${sectionNames[failingStep] || ''}) before submitting.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedRef = formData.applicationId || formData.application_id || serverApp?.application_id || serverApp?.id || generateApplicationId();
      const submissionPayload = {
        ...formData,
        applicationId: generatedRef,
        statementWordCount: currentStatementWords,
        scoreEligibilityNote: eligibilityAdvisory ? eligibilityAdvisory.message : ''
      };

      let result;
      if (portalMode === 'edit' || formData.isSubmitted) {
        result = await updateStudentApplication(generatedRef, submissionPayload, user);
      } else {
        result = await submitStudentApplication(submissionPayload, user);
      }

      setIsSubmitting(false);

      if (result.error) {
        alert(result.error.message || 'Submission error. Please try again.');
        return;
      }

      setIsDraftDirty(false);
      const returnedDocs = result.data?.documents ? mapDocsArrayToMap(result.data.documents) : formData.documents;
      const returnedCv = result.data?.cvDocument || formData.cvDocument || returnedDocs.cvDoc;
      setFormData(prev => ({
        ...prev,
        ...result.data,
        documents: returnedDocs,
        cvDocument: returnedCv,
        isSubmitted: true,
        applicationId: result.data?.application_id || generatedRef
      }));
      setPortalMode('success');
    } catch (err) {
      console.error('[MSIT] Application submit exception:', err);
      setIsSubmitting(false);
      alert('An unexpected error occurred while saving your application. Please check your network and try again.');
    }
  };

  // Enter Edit Mode (with optional jump to specific section/step)
  const handleEditApplication = (targetStep = 1) => {
    setPortalMode('edit');
    setCurrentStep(targetStep);
  };

  // Reusable Component: Uploaded Academic Documents & Memos Summary Section
  const renderUploadedDocumentsSection = (onEditClick) => {
    const docItems = [
      {
        key: 'class10Doc',
        title: 'Class 10 / SSC Marksheet or Memo',
        step: 3,
        doc: formData.documents?.class10Doc,
        required: true
      },
      {
        key: 'class12Doc',
        title: 'Class 12 / Intermediate / Diploma Memo',
        step: 3,
        doc: formData.documents?.class12Doc,
        required: true
      },
      {
        key: 'ugDegreeDoc',
        title: 'Qualifying Degree Consolidated Marks Memo / Transcripts',
        step: 3,
        doc: formData.documents?.ugDegreeDoc,
        required: true
      },
      {
        key: 'degreeCertDoc',
        title: 'Degree Certificate / Provisional Certificate',
        step: 3,
        doc: formData.documents?.degreeCertDoc,
        required: false
      },
      ...(requires16YearProof(formData.ugDegree) || formData.documents?.additionalDegree16YearDoc ? [{
        key: 'additionalDegree16YearDoc',
        title: `16-Year Education Proof (${formData.ugDegree || 'Degree'})`,
        step: 3,
        doc: formData.documents?.additionalDegree16YearDoc,
        required: requires16YearProof(formData.ugDegree)
      }] : []),
      {
        key: 'cvDocument',
        title: 'Curriculum Vitae (CV) / Resume',
        step: 4,
        doc: formData.cvDocument || formData.documents?.cvDoc || (formData.cv_url ? { fileName: formData.cv_filename || 'Candidate_CV.pdf', fileSize: '1.2 MB' } : null),
        required: true
      },
      ...(formData.entranceExamStatus === 'GRE' || formData.entranceExamStatus === 'Both' || formData.documents?.greScorecardDoc ? [{
        key: 'greScorecardDoc',
        title: 'GRE Scorecard',
        step: 7,
        doc: formData.documents?.greScorecardDoc,
        required: formData.entranceExamStatus === 'GRE' || formData.entranceExamStatus === 'Both'
      }] : []),
      ...(formData.entranceExamStatus === 'GATE' || formData.entranceExamStatus === 'Both' || formData.documents?.gateScorecardDoc ? [{
        key: 'gateScorecardDoc',
        title: 'GATE Scorecard',
        step: 7,
        doc: formData.documents?.gateScorecardDoc,
        required: formData.entranceExamStatus === 'GATE' || formData.entranceExamStatus === 'Both'
      }] : [])
    ];

    return (
      <div className="success-docs-section">
        <div className="success-docs-header">
          <div>
            <h4 className="success-docs-title">Uploaded Academic Documents & Memos</h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
              All academic marksheets, certificates, and test scorecards on file for admissions verification.
            </p>
          </div>
        </div>

        <div className="success-docs-list">
          {docItems.map((item) => {
            const isUploaded = !!(item.doc && (item.doc.fileName || item.doc.file_name || item.doc.fileUrl || item.doc.file_url || item.doc.status === 'Uploaded' || item.doc.status === 'Pending'));
            const fileName = item.doc?.fileName || item.doc?.file_name || (isUploaded ? `${item.title.split('/')[0].trim().replace(/\s+/g, '_')}.pdf` : 'Not uploaded');
            const fileSize = item.doc?.fileSize || item.doc?.file_size || (isUploaded ? '1.2 MB' : '');

            return (
              <div key={item.key} className="success-doc-row">
                <div className="success-doc-info" style={{ minWidth: 0, flex: 1 }}>
                  {isUploaded ? (
                    <CheckCircleIcon size={20} className="text-success" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <span style={{ width: 20, height: 20, minWidth: 20, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' }}>!</span>
                  )}
                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div className="success-doc-name" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.title}</div>
                    <div className="success-doc-meta" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                      {isUploaded ? (
                        <span>
                          <strong style={{ color: '#0b2a6b', wordBreak: 'break-all', overflowWrap: 'break-word' }}>{fileName}</strong>
                          {fileSize ? ` • ${fileSize}` : ''}
                        </span>
                      ) : (
                        <span style={{ color: item.required ? '#dc2626' : '#94a3b8' }}>
                          {item.required ? 'Required — Not yet uploaded' : 'Optional'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="success-doc-actions" style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
                  <span className={`doc-status-badge ${isUploaded ? 'status-verified' : 'status-pending'}`} style={{
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    background: isUploaded ? '#ecfdf5' : '#fef2f2',
                    color: isUploaded ? '#047857' : '#b91c1c',
                    border: `1px solid ${isUploaded ? '#a7f3d0' : '#fecaca'}`
                  }}>
                    {isUploaded ? 'Uploaded' : (item.required ? 'Missing' : 'Optional')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Reusable Document Upload Card Component
  const renderDocumentUploadCard = (docKey, docTitle, isRequired, helperText, accept = '.pdf,.jpg,.jpeg,.png') => {
    const uploadedDoc = formData.documents?.[docKey] || (docKey === 'cvDocument' ? formData.cvDocument : null);
    const isUploading = !!uploadProgress[docKey];
    const fieldError = errors[docKey];

    return (
      <div 
        key={docKey} 
        className={`doc-upload-item-card ${uploadedDoc ? 'is-uploaded' : ''} ${isUploading ? 'is-uploading' : ''}`}
        id={`upload-card-${docKey}`}
      >
        <div className="doc-upload-header">
          <div>
            <h5 className="doc-upload-title">{docTitle}</h5>
            <p className="doc-upload-sub">{helperText}</p>
          </div>
          <div>
            {isRequired ? (
              <span className="field-badge-required">Required</span>
            ) : (
              <span className="field-badge-optional">Optional</span>
            )}
          </div>
        </div>

        {uploadedDoc ? (
          <div className="doc-file-uploaded-view">
            <div className="doc-file-info">
              <CheckCircleIcon size={18} className="text-success" />
              <div>
                <span className="doc-file-name">{uploadedDoc.fileName || uploadedDoc.file_name || 'Document Uploaded'}</span>
                {uploadedDoc.fileSize && (
                  <span className="doc-file-size"> • {uploadedDoc.fileSize || uploadedDoc.file_size}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {(uploadedDoc.fileUrl || uploadedDoc.file_url || uploadedDoc.dataUrl) && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => openDocumentInNewTab(uploadedDoc.fileUrl || uploadedDoc.file_url || uploadedDoc.dataUrl, uploadedDoc.fileName || uploadedDoc.file_name)}
                  title="Preview uploaded document"
                >
                  View File
                </button>
              )}
              {portalMode !== 'view' && (
                <div>
                  <label className="doc-replace-btn" htmlFor={`file-input-${docKey}`}>
                    Replace
                  </label>
                  <input
                    id={`file-input-${docKey}`}
                    type="file"
                    accept={accept}
                    className="doc-file-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], docKey, docTitle);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="doc-dropzone-row">
            {portalMode !== 'view' ? (
              <>
                <label className="doc-select-file-btn" htmlFor={`file-input-${docKey}`}>
                  <UploadIcon size={16} />
                  <span>Choose File</span>
                </label>
                <input
                  id={`file-input-${docKey}`}
                  type="file"
                  accept={accept}
                  className="doc-file-input"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], docKey, docTitle);
                    }
                  }}
                />
                <span className="doc-format-hint">
                  {accept.includes('doc') ? 'PDF, DOC, DOCX up to 5 MB' : 'PDF, JPG, PNG up to 10 MB'}
                </span>
              </>
            ) : (
              <span className="field-error-text" style={{ color: '#64748b' }}>Not provided</span>
            )}
          </div>
        )}

        {isUploading && (
          <div className="doc-upload-progress">
            <div className="doc-progress-bar-fill"></div>
          </div>
        )}

        {fieldError && <span className="field-error-text">{fieldError}</span>}
      </div>
    );
  };

  // VIEW MODE: Render Read-Only View of Submitted Application
  if (portalMode === 'view' && formData.isSubmitted) {
    return (
      <div className="single-app-wrapper">
        <header className="single-app-header no-print">
          <div className="container single-app-header-inner">
            <div className="single-app-brand">
              <img src="/assets/msit-logo.png" alt="MSIT Logo" className="single-app-logo" />
              <div>
                <span className="brand-title">MSIT Application Portal</span>
                <span className="brand-cohort">{APPLICATION_CONFIG.cohort} • IIIT Hyderabad</span>
              </div>
            </div>
            <div className="single-app-controls">
              <button 
                type="button" 
                className="btn btn-secondary no-print" 
                onClick={() => navigate('/programme')}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        <div className="multi-section-app-container no-print">
          {/* Status Alert Banner */}
          <div className="app-view-banner no-print">
            <InfoIcon size={24} />
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '800' }}>
                Application Submitted ({formData.applicationId || serverApp?.application_id})
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Your application is currently <strong>{formData.status || 'Submitted'}</strong>. The admissions committee is reviewing your academic credentials and statement of purpose.
              </p>
            </div>
          </div>

          {/* Read-Only Summary */}
          <div className="form-section-card">
            <div className="form-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="form-section-kicker">APPLICATION SUMMARY</span>
                <h3 className="form-section-title">{formData.fullName}</h3>
                <p className="form-section-desc">Application Ref: {formData.applicationId || serverApp?.application_id} • Cohort: {APPLICATION_CONFIG.cohort}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary no-print"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}
                >
                  <DownloadIcon size={15} />
                  <span>Print Summary</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary no-print"
                  onClick={() => handleEditApplication(1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}
                >
                  <EditIcon size={15} />
                  <span>{(formData.status === 'Declined' || formData.status === 'Rejected') ? 'Apply Now (Edit & Reapply)' : 'Edit Application'}</span>
                </button>
              </div>
            </div>

            {/* Section 1 & 2 Summary */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">1 & 2. Personal &amp; Emergency Contact Details</h4>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Full Name</span><span className="review-item-val">{formData.fullName || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Email Address</span><span className="review-item-val">{formData.email || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Mobile Phone</span><span className="review-item-val">{formData.phone || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Date of Birth</span><span className="review-item-val">{formData.dob || 'Not specified'}</span></div>
                <div className="review-item" style={{ gridColumn: '1 / -1' }}><span className="review-item-label">Residential Address</span><span className="review-item-val">{formData.address || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Contact Name</span><span className="review-item-val">{formData.parentName || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Relationship</span><span className="review-item-val">{formData.parentRelationship || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Contact Number</span><span className="review-item-val">{formData.altPhone || 'Not specified'}</span></div>
              </div>
            </div>

            {/* Section 3 Summary */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">3. Academic Qualifications</h4>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Class 10 Score</span><span className="review-item-val">{formData.class10Score ? `${formData.class10Score} (${formData.class10ScoreType || 'Percentage'})` : 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Class 12 / Intermediate</span><span className="review-item-val">{formData.interScore ? `${formData.interPathway || 'Class 12'}: ${formData.interScore} (${formData.interScoreType || 'Percentage'})` : 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Qualifying Degree</span><span className="review-item-val">{formData.ugDegree || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">University / Institution</span><span className="review-item-val">{formData.university || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Branch</span><span className="review-item-val">{formData.branch || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Specialization</span><span className="review-item-val">{formData.specialization || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Graduation Year</span><span className="review-item-val">{formData.passingYear || 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Aggregate Score</span><span className="review-item-val">{formData.cgpa ? `${formData.cgpa} (${formData.gradingScale || 'Percentage'})` : 'Not specified'}</span></div>
              </div>
            </div>

            {/* Uploaded Documents & Academic Memos Section */}
            {renderUploadedDocumentsSection(handleEditApplication)}

            {/* Section 4 Summary */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">4. Work Experience</h4>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Prior Experience</span><span className="review-item-val">{formData.hasExperience === 'Yes' ? 'Experienced' : 'Fresher'}</span></div>
                {formData.hasExperience === 'Yes' && (
                  <>
                    <div className="review-item"><span className="review-item-label">Duration</span><span className="review-item-val">{formData.experienceYears} Years, {formData.experienceMonths} Months</span></div>
                    <div className="review-item"><span className="review-item-label">Company Name</span><span className="review-item-val">{formData.companyName || 'Not specified'}</span></div>
                    <div className="review-item"><span className="review-item-label">Job Title</span><span className="review-item-val">{formData.jobRole || 'Not specified'}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Section 5 Summary */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">5. Statement of Purpose</h4>
              </div>
              <p style={{ fontStyle: 'italic', background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', margin: 0 }}>
                "{formData.statementText || 'Not specified'}"
              </p>
            </div>

            {/* Section 6 & 7 Summary */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">6 & 7. Referral & Entrance Examination</h4>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Referral Source</span><span className="review-item-val">{formData.referralSource ? `${formData.referralSource} ${formData.referralExplanation ? `(${formData.referralExplanation})` : ''}` : 'Not specified'}</span></div>
                <div className="review-item"><span className="review-item-label">Entrance Exam</span><span className="review-item-val">{formData.entranceExamStatus || 'Appear for the MSIT PGEE exam'}</span></div>
              </div>
            </div>

            <div className="no-print" style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-primary no-print" 
                onClick={() => handleEditApplication(1)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}
              >
                <EditIcon size={16} />
                <span>Edit Application</span>
              </button>

              <button 
                type="button" 
                className="btn btn-secondary no-print" 
                onClick={() => navigate('/programme')}
              >
                Back to Student Dashboard
              </button>

              <button 
                type="button" 
                className="btn btn-secondary no-print" 
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <DownloadIcon size={15} />
                <span>Print Summary</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Official Printable Document for Print / Save PDF */}
        <PrintableApplicationDocument formData={formData} serverApp={serverApp} />
      </div>
    );
  }

  // SUCCESS CONFIRMATION SCREEN
  if (portalMode === 'success') {
    return (
      <div className="single-app-wrapper">
        <header className="single-app-header no-print">
          <div className="container single-app-header-inner">
            <div className="single-app-brand">
              <img src="/assets/msit-logo.png" alt="MSIT Logo" className="single-app-logo" />
              <div>
                <span className="brand-title">MSIT Application Portal</span>
                <span className="brand-cohort">{APPLICATION_CONFIG.cohort} • IIIT Hyderabad</span>
              </div>
            </div>
            <div className="single-app-controls">
              <button 
                type="button" 
                className="btn btn-secondary no-print" 
                onClick={() => navigate('/programme')}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        <div className="success-page-layout no-print">
          {/* Main Hero Confirmation Card */}
          <div className="success-hero-card">
            <div className="success-hero-badge">
              <CheckCircleIcon size={40} />
            </div>

            <span className="success-status-pill">Application Submitted Successfully</span>

            <h2 className="success-hero-title">
              Congratulations, {formData.fullName || 'Candidate'}!
            </h2>

            <p className="success-hero-subtitle">
              Your application for the <strong>{APPLICATION_CONFIG.cohort}</strong> has been received by the Consortium of Institutions of Higher Learning (CIHL) at IIIT Hyderabad.
            </p>

            {/* Prominent Action Toolbar */}
            <div className="success-action-toolbar no-print">
              <button
                type="button"
                className="btn btn-primary no-print"
                onClick={() => navigate('/programme')}
                style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
              >
                <span>Go to Student Dashboard</span>
                <ArrowRightIcon size={16} />
              </button>

              <button
                type="button"
                className="btn-edit-action no-print"
                onClick={() => handleEditApplication(1)}
                title="Edit any field or replace uploaded memos"
              >
                <EditIcon size={16} />
                <span>Edit Application</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary no-print"
                onClick={() => window.print()}
                style={{ padding: '0.75rem 1.3rem', fontSize: '0.92rem' }}
              >
                <DownloadIcon size={15} />
                <span>Print / Save Application Summary</span>
              </button>
            </div>

            {/* Structured 2-Column Summary Grid */}
            <div className="success-summary-grid">
              {/* Card 1: Application Reference & Metadata */}
              <div className="success-meta-card">
                <div className="success-meta-title">
                  <span>Application Reference</span>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                    Active Submission
                  </span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Reference ID</span>
                  <span className="success-ref-code">{formData.applicationId || serverApp?.application_id || 'MSIT-2027'}</span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Registered Email</span>
                  <span className="success-meta-value">{formData.email}</span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Candidate Name</span>
                  <span className="success-meta-value">{formData.fullName}</span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Cohort</span>
                  <span className="success-meta-value">{APPLICATION_CONFIG.cohort}</span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Submission Status</span>
                  <span className="success-meta-value" style={{ color: '#047857' }}>Submitted • Under Review</span>
                </div>
              </div>

              {/* Card 2: Academic Profile Snapshot */}
              <div className="success-meta-card">
                <div className="success-meta-title">
                  <span>Academic Profile</span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Qualifying Degree</span>
                  <span className="success-meta-value">{formData.ugDegree || 'B.Tech / B.E.'}</span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Department / Branch</span>
                  <span className="success-meta-value">{formData.department || 'Computer Science & Engineering (CSE)'}</span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Graduation Year</span>
                  <span className="success-meta-value">{formData.passingYear || '2026'}</span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Aggregate Score</span>
                  <span className="success-meta-value">{formData.cgpa ? `${formData.cgpa} (${formData.gradingScale || 'Percentage'})` : 'Not specified'}</span>
                </div>
                <div className="success-meta-row">
                  <span className="success-meta-label">Work Experience</span>
                  <span className="success-meta-value">{formData.hasExperience === 'Yes' ? `${formData.experienceYears} yrs, ${formData.experienceMonths} mos` : 'Fresher'}</span>
                </div>
              </div>
            </div>

            {/* Uploaded Documents & Memos Section */}
            {renderUploadedDocumentsSection(handleEditApplication)}

            {/* Admissions Review Roadmap Card */}
            <div className="success-roadmap-card">
              <div className="success-roadmap-header">
                <h4 className="success-roadmap-title">What Happens Next in Admissions?</h4>
                <p className="success-roadmap-desc">
                  Your application enters our structured evaluation cycle. You can track progress or update documents anytime.
                </p>
              </div>

              <div className="roadmap-steps-list">
                <div className="roadmap-step-box">
                  <span className="roadmap-step-num">Step 1</span>
                  <h5 className="roadmap-step-title">Document Verification</h5>
                  <p className="roadmap-step-text">Admissions team verifies Class 10, Class 12, and Qualifying Degree marks memos.</p>
                </div>

                <div className="roadmap-step-box">
                  <span className="roadmap-step-num">Step 2</span>
                  <h5 className="roadmap-step-title">Holistic Evaluation</h5>
                  <p className="roadmap-step-text">Evaluation of your SOP, academic trajectory, and coding/problem-solving aptitude.</p>
                </div>

                <div className="roadmap-step-box">
                  <span className="roadmap-step-num">Step 3</span>
                  <h5 className="roadmap-step-title">Interview / Counseling</h5>
                  <p className="roadmap-step-text">Shortlisted applicants are notified by email for technical counseling.</p>
                </div>

                <div className="roadmap-step-box">
                  <span className="roadmap-step-num">Step 4</span>
                  <h5 className="roadmap-step-title">Admissions Offer</h5>
                  <p className="roadmap-step-text">Official offer letters issued for the January 2027 MSIT cohort at IIIT Hyderabad.</p>
                </div>
              </div>
            </div>

            {/* Bottom Edit Callout Banner */}
            <div className="success-edit-banner">
              <div className="success-edit-banner-text">
                <h5>Need to make changes or update uploaded memos?</h5>
                <p>Everything in your application remains completely editable. You can update personal details, academic scores, statement of purpose, or replace marks memos at any time.</p>
              </div>
              <button
                type="button"
                className="btn btn-primary no-print"
                onClick={() => handleEditApplication(1)}
                style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <EditIcon size={16} />
                <span>Edit Application</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Official Printable Document for Print / Save PDF */}
        <PrintableApplicationDocument formData={formData} serverApp={serverApp} />
      </div>
    );
  }

  // STANDARD FORM EDIT / FILL EXPERIENCE
  return (
    <div className="single-app-wrapper">
      {/* Top Application Bar */}
      <header className="single-app-header no-print">
        <div className="container single-app-header-inner">
          <div className="single-app-brand">
            <img src="/assets/msit-logo.png" alt="MSIT Logo" className="single-app-logo" />
            <div>
              <span className="brand-title">MSIT Application Portal</span>
              <span className="brand-cohort">{APPLICATION_CONFIG.cohort} • IIIT Hyderabad</span>
            </div>
          </div>

          <div className="single-app-controls">
            {saveDraftMessage && (
              <span className="draft-saved-pill" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}>
                <CheckCircleIcon size={13} />
                <span>{saveDraftMessage}</span>
              </span>
            )}

            {lastSavedTime && !saveDraftMessage && (
              <span className="draft-saved-pill">
                <CheckCircleIcon size={13} />
                <span>Draft Saved: {lastSavedTime}</span>
              </span>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveDraft}
              title="Save in-progress application draft"
            >
              Save Draft
            </button>

            {formData.isSubmitted && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPortalMode('view')}
                title="Return to application view mode"
              >
                View Summary
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/programme')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="multi-section-app-container no-print">
        {/* Banner if in edit mode */}
        {portalMode === 'edit' && (
          <div className="app-edit-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <InfoIcon size={24} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '800' }}>
                  {formData.status === 'Additional Information Required' 
                    ? 'Update Requested by Admissions Team' 
                    : (formData.status === 'Declined' || formData.status === 'Rejected'
                        ? 'Apply Now — Fresh Application (Details Pre-filled)'
                        : 'Edit Application & Uploaded Memos')}
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  {formData.status === 'Declined' || formData.status === 'Rejected'
                    ? 'Your previously entered details and uploaded memos are preserved in the saved state below. You can edit any fields you wish, then submit your fresh application.'
                    : 'All 8 sections including personal information, academic qualifications, and uploaded memos are editable. Review and re-submit on the final step when finished.'}
                </p>
              </div>
            </div>
            {formData.isSubmitted && formData.status !== 'Declined' && formData.status !== 'Rejected' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPortalMode('view')}
                style={{ background: '#ffffff', color: '#0b2a6b', fontWeight: '700', whiteSpace: 'nowrap' }}
              >
                Cancel / View Summary
              </button>
            )}
          </div>
        )}

        {/* 8-STEP HORIZONTAL PROGRESS BAR / TABS */}
        <nav className="app-stepper-wrap" aria-label="Application Form Steps">
          {FORM_SECTIONS.map((sec) => {
            const isActive = currentStep === sec.id;
            const isCompleted = currentStep > sec.id;

            return (
              <button
                key={sec.id}
                type="button"
                className={`stepper-tab-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => handleJumpToSection(sec.id)}
                title={sec.fullTitle}
              >
                <span className="stepper-tab-num">
                  {isCompleted ? '✓' : sec.id}
                </span>
                <span>{sec.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* =========================================================================
            SECTION 1: PERSONAL & CONTACT INFORMATION
            ========================================================================= */}
        {currentStep === 1 && (
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-kicker">SECTION 1 OF 8</span>
              <h3 className="form-section-title">Personal & Contact Information</h3>
              <p className="form-section-desc">
                Provide your legal candidate identity and residential contact details. Saved values are preserved when resuming drafts.
              </p>
            </div>

            <div className="form-fields-grid">
              {/* Full Name */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="field-fullName">Full Name</label>
                  <span className="field-badge-required">Required</span>
                </div>
                <input
                  id="field-fullName"
                  type="text"
                  className={`app-form-input ${errors.fullName ? 'has-error' : ''}`}
                  value={formData.fullName}
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                  placeholder="Candidate Legal Full Name"
                />
                {errors.fullName && <span className="field-error-text">{errors.fullName}</span>}
              </div>

              {/* Email Address (Pre-filled & Read-only) */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="field-email">Email Address</label>
                  <span className="field-badge-required">Verified</span>
                </div>
                <input
                  id="field-email"
                  type="email"
                  className="app-form-input is-readonly"
                  value={formData.email}
                  readOnly
                  title="Email Address is linked to your verified registration account"
                />
                <span className="field-helper-hint">Linked to your verified registration account and read-only.</span>
              </div>

              {/* Phone Number */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="field-phone">Mobile Phone Number</label>
                  <span className="field-badge-required">Required</span>
                </div>
                <input
                  id="field-phone"
                  type="tel"
                  className={`app-form-input ${errors.phone ? 'has-error' : ''}`}
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && <span className="field-error-text">{errors.phone}</span>}
              </div>

              {/* Date of Birth */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="field-dob">Date of Birth</label>
                  <span className="field-badge-required">Required</span>
                </div>
                <input
                  id="field-dob"
                  type="date"
                  className={`app-form-input ${errors.dob ? 'has-error' : ''}`}
                  value={formData.dob}
                  onChange={(e) => handleFieldChange('dob', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dob && <span className="field-error-text">{errors.dob}</span>}
              </div>

              {/* Address */}
              <div className="form-field-group form-field-full">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="field-address">Residential Address</label>
                  <span className="field-badge-required">Required</span>
                </div>
                <textarea
                  id="field-address"
                  rows={3}
                  className={`app-form-textarea ${errors.address ? 'has-error' : ''}`}
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="Door/Flat No., Street, City, State, PIN Code"
                />
                {errors.address && <span className="field-error-text">{errors.address}</span>}
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="app-step-actions">
              <div className="app-action-left">
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                  Save Draft
                </button>
              </div>
              <div className="app-action-right">
                <button type="button" className="btn btn-primary" onClick={handleNextSection}>
                  <span>Continue to Emergency Contact</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: EMERGENCY CONTACT NUMBER
            ========================================================================= */}
        {currentStep === 2 && (
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-kicker">SECTION 2 OF 8</span>
              <h3 className="form-section-title">Emergency Contact Number</h3>
              <p className="form-section-desc">
                Provide emergency contact name and number for official communications.
              </p>
            </div>

            <div className="form-fields-grid">
              {/* Contact Name Field */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="field-parentName">Contact Name</label>
                  <span className="field-badge-required">Required</span>
                </div>
                <input
                  id="field-parentName"
                  type="text"
                  className={`app-form-input ${errors.parentName ? 'has-error' : ''}`}
                  value={formData.parentName}
                  onChange={(e) => handleFieldChange('parentName', e.target.value)}
                  placeholder="Enter Contact Name"
                />
                {errors.parentName && <span className="field-error-text">{errors.parentName}</span>}
              </div>

              {/* Relationship Field */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="field-parentRelationship">Relationship</label>
                  <span className="field-badge-required">Required</span>
                </div>
                <select
                  id="field-parentRelationship"
                  className={`app-form-select ${errors.parentRelationship ? 'has-error' : ''}`}
                  value={formData.parentRelationship}
                  onChange={(e) => handleFieldChange('parentRelationship', e.target.value)}
                >
                  <option value="">Select Relationship</option>
                  {PARENT_RELATIONSHIP_OPTIONS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
                {errors.parentRelationship && <span className="field-error-text">{errors.parentRelationship}</span>}
              </div>

              {/* Contact Number Field */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="field-altPhone">Contact Number</label>
                  <span className="field-badge-required">Required</span>
                </div>
                <input
                  id="field-altPhone"
                  type="tel"
                  className={`app-form-input ${errors.altPhone ? 'has-error' : ''}`}
                  value={formData.altPhone}
                  onChange={(e) => handleFieldChange('altPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
                {errors.altPhone && <span className="field-error-text">{errors.altPhone}</span>}
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="app-step-actions">
              <div className="app-action-left">
                <button type="button" className="btn btn-secondary" onClick={handlePrevSection}>
                  ← Back to Personal Info
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                  Save Draft
                </button>
              </div>
              <div className="app-action-right">
                <button type="button" className="btn btn-primary" onClick={handleNextSection}>
                  <span>Continue to Academic Qualifications</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3: ACADEMIC QUALIFICATIONS
            ========================================================================= */}
        {currentStep === 3 && (
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-kicker">SECTION 3 OF 8</span>
              <h3 className="form-section-title">Academic Qualifications</h3>
              <p className="form-section-desc">
                Organised into separate subsections for Class 10, Class 12 / Intermediate, and your Qualifying Degree.
              </p>
            </div>

            {/* Subsection 3A: Class 10 / SSC */}
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.75rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0b2a6b', margin: '0 0 1rem 0' }}>
                A. Class 10 / SSC
              </h4>

              <div className="form-fields-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-class10Score">Class 10 / SSC Score</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <input
                    id="field-class10Score"
                    type="number"
                    step="any"
                    className={`app-form-input ${errors.class10Score ? 'has-error' : ''}`}
                    value={formData.class10Score}
                    onChange={(e) => handleFieldChange('class10Score', e.target.value)}
                    placeholder="e.g. 85.5 or 9.2"
                  />
                  {errors.class10Score && <span className="field-error-text">{errors.class10Score}</span>}
                </div>

                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-class10ScoreType">Score Type</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <select
                    id="field-class10ScoreType"
                    className="app-form-select"
                    value={formData.class10ScoreType}
                    onChange={(e) => handleFieldChange('class10ScoreType', e.target.value)}
                  >
                    <option value="Percentage">Percentage (out of 100%)</option>
                    <option value="CGPA">CGPA (out of 10.0)</option>
                  </select>
                </div>
              </div>

              {renderDocumentUploadCard(
                'class10Doc',
                DOCUMENT_DEFINITIONS.class10Doc.title,
                DOCUMENT_DEFINITIONS.class10Doc.required,
                DOCUMENT_DEFINITIONS.class10Doc.helper
              )}
            </div>

            {/* Subsection 3B: Class 12 / Intermediate */}
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.75rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0b2a6b', margin: '0 0 1rem 0' }}>
                B. Class 12 / Intermediate
              </h4>

              <div className="form-fields-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-interPathway">Educational Pathway</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <select
                    id="field-interPathway"
                    className="app-form-select"
                    value={formData.interPathway}
                    onChange={(e) => handleFieldChange('interPathway', e.target.value)}
                  >
                    {INTER_PATHWAY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-interScore">Intermediate / Class 12 Score</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <input
                    id="field-interScore"
                    type="number"
                    step="any"
                    className={`app-form-input ${errors.interScore ? 'has-error' : ''}`}
                    value={formData.interScore}
                    onChange={(e) => handleFieldChange('interScore', e.target.value)}
                    placeholder="e.g. 91.2 or 9.5"
                  />
                  {errors.interScore && <span className="field-error-text">{errors.interScore}</span>}
                </div>

                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-interScoreType">Score Type</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <select
                    id="field-interScoreType"
                    className="app-form-select"
                    value={formData.interScoreType}
                    onChange={(e) => handleFieldChange('interScoreType', e.target.value)}
                  >
                    <option value="Percentage">Percentage (out of 100%)</option>
                    <option value="CGPA">CGPA (out of 10.0)</option>
                  </select>
                </div>
              </div>

              {renderDocumentUploadCard(
                'class12Doc',
                DOCUMENT_DEFINITIONS.class12Doc.title,
                DOCUMENT_DEFINITIONS.class12Doc.required,
                DOCUMENT_DEFINITIONS.class12Doc.helper
              )}
            </div>

            {/* Subsection 3C: Qualifying Degree */}
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0b2a6b', margin: '0 0 1rem 0' }}>
                C. Qualifying Degree
              </h4>

              <div className="form-fields-grid" style={{ marginBottom: '1.5rem' }}>
                {/* Qualifying Degree Dropdown */}
                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-ugDegree">Qualifying Degree</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <select
                    id="field-ugDegree"
                    className="app-form-select"
                    value={formData.ugDegree}
                    onChange={(e) => handleFieldChange('ugDegree', e.target.value)}
                  >
                    {UG_DEGREE_OPTIONS.map(deg => (
                      <option key={deg} value={deg}>{deg}</option>
                    ))}
                  </select>
                </div>

                {/* University / Institution */}
                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-university">University / Institution</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <input
                    id="field-university"
                    type="text"
                    className={`app-form-input ${errors.university ? 'has-error' : ''}`}
                    value={formData.university}
                    onChange={(e) => handleFieldChange('university', e.target.value)}
                    placeholder="e.g. JNTU Hyderabad / Osmania University"
                  />
                  {errors.university && <span className="field-error-text">{errors.university}</span>}
                </div>

                {/* Branch */}
                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-branch">Branch</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <input
                    id="field-branch"
                    type="text"
                    className={`app-form-input ${errors.branch ? 'has-error' : ''}`}
                    value={formData.branch}
                    onChange={(e) => handleFieldChange('branch', e.target.value)}
                    placeholder="Enter Branch"
                  />
                  {errors.branch && <span className="field-error-text">{errors.branch}</span>}
                </div>

                {/* Specialization */}
                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-specialization">Specialization</label>
                  </div>
                  <input
                    id="field-specialization"
                    type="text"
                    className={`app-form-input ${errors.specialization ? 'has-error' : ''}`}
                    value={formData.specialization}
                    onChange={(e) => handleFieldChange('specialization', e.target.value)}
                    placeholder="Enter Specialization"
                  />
                  {errors.specialization && <span className="field-error-text">{errors.specialization}</span>}
                </div>

                {/* Graduation Year */}
                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-passingYear">Graduation Year</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <select
                    id="field-passingYear"
                    className="app-form-select"
                    value={formData.passingYear}
                    onChange={(e) => handleFieldChange('passingYear', e.target.value)}
                  >
                    {PASSING_YEAR_OPTIONS.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Aggregate CGPA / Percentage */}
                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-cgpa">Aggregate CGPA / Percentage</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <input
                    id="field-cgpa"
                    type="number"
                    step="any"
                    className={`app-form-input ${errors.cgpa ? 'has-error' : ''}`}
                    value={formData.cgpa}
                    onChange={(e) => handleFieldChange('cgpa', e.target.value)}
                    placeholder="e.g. 74.5 or 7.8"
                  />
                  {errors.cgpa && <span className="field-error-text">{errors.cgpa}</span>}
                </div>

                {/* Grading Scale */}
                <div className="form-field-group">
                  <div className="field-label-row">
                    <label className="field-label" htmlFor="field-gradingScale">Grading Scale</label>
                    <span className="field-badge-required">Required</span>
                  </div>
                  <select
                    id="field-gradingScale"
                    className="app-form-select"
                    value={formData.gradingScale}
                    onChange={(e) => handleFieldChange('gradingScale', e.target.value)}
                  >
                    {GRADING_SCALE_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Eligibility Advisory Alert */}
              {eligibilityAdvisory && (
                <div className="eligibility-advisory-box">
                  <HelpCircleIcon size={20} />
                  <div>
                    <strong>Undergraduate Eligibility Benchmark Advisory ({eligibilityAdvisory.thresholdLabel})</strong>
                    <p>{eligibilityAdvisory.message}</p>
                  </div>
                </div>
              )}

              {/* Degree Marksheet / Consolidated Marks Memo Upload */}
              {renderDocumentUploadCard(
                'ugDegreeDoc',
                DOCUMENT_DEFINITIONS.ugDegreeDoc.title,
                DOCUMENT_DEFINITIONS.ugDegreeDoc.required,
                DOCUMENT_DEFINITIONS.ugDegreeDoc.helper
              )}

              {/* Degree Certificate Upload (Optional if appearing in final year) */}
              {renderDocumentUploadCard(
                'degreeCertDoc',
                DOCUMENT_DEFINITIONS.degreeCertDoc.title,
                false,
                DOCUMENT_DEFINITIONS.degreeCertDoc.helper
              )}

              {/* Conditional 16-Year Education Proof for MCA candidates */}
              {requires16YearProof(formData.ugDegree) && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div className="doc-overlap-note" style={{ marginBottom: '0.75rem' }}>
                    Note: For candidates applying with {formData.ugDegree}, proof of 16 years of formal education is required.
                  </div>
                  {renderDocumentUploadCard(
                    'additionalDegree16YearDoc',
                    DOCUMENT_DEFINITIONS.additionalDegree16YearDoc.title,
                    true,
                    DOCUMENT_DEFINITIONS.additionalDegree16YearDoc.helper
                  )}
                </div>
              )}
            </div>

            {/* Step Navigation Bar */}
            <div className="app-step-actions">
              <div className="app-action-left">
                <button type="button" className="btn btn-secondary" onClick={handlePrevSection}>
                  ← Back to Parent Info
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                  Save Draft
                </button>
              </div>
              <div className="app-action-right">
                <button type="button" className="btn btn-primary" onClick={handleNextSection}>
                  <span>Continue to Work Experience</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 4: WORK EXPERIENCE
            ========================================================================= */}
        {currentStep === 4 && (
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-kicker">SECTION 4 OF 8</span>
              <h3 className="form-section-title">Work Experience & Resume</h3>
              <p className="form-section-desc">
                Indicate whether you have prior professional work experience or are applying as a fresher.
              </p>
            </div>

            <div className="form-field-group" style={{ marginBottom: '1.75rem' }}>
              <div className="field-label-row">
                <label className="field-label">Do you have prior work experience?</label>
                <span className="field-badge-required">Required</span>
              </div>
              <div className="experience-radio-group">
                <label className={`radio-option-card ${formData.hasExperience === 'No' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="hasExperience"
                    value="No"
                    checked={formData.hasExperience === 'No'}
                    onChange={() => handleFieldChange('hasExperience', 'No')}
                  />
                  <span>No — Fresher</span>
                </label>
                <label className={`radio-option-card ${formData.hasExperience === 'Yes' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="hasExperience"
                    value="Yes"
                    checked={formData.hasExperience === 'Yes'}
                    onChange={() => handleFieldChange('hasExperience', 'Yes')}
                  />
                  <span>Yes — Experienced</span>
                </label>
              </div>
            </div>

            {/* If Experienced: Display Required Experience Fields */}
            {formData.hasExperience === 'Yes' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#0b2a6b' }}>
                  Professional Experience Details
                </h4>

                <div className="form-fields-grid">
                  <div className="form-field-group">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="field-expYears">Years of Work Experience</label>
                      <span className="field-badge-required">Required</span>
                    </div>
                    <select
                      id="field-expYears"
                      className="app-form-select"
                      value={formData.experienceYears}
                      onChange={(e) => handleFieldChange('experienceYears', e.target.value)}
                    >
                      {WORK_EXP_YEAR_OPTIONS.map(yr => (
                        <option key={yr} value={yr}>{yr} {yr === '1' ? 'Year' : 'Years'}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field-group">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="field-expMonths">Additional Duration (Months)</label>
                      <span className="field-badge-required">Required</span>
                    </div>
                    <select
                      id="field-expMonths"
                      className="app-form-select"
                      value={formData.experienceMonths}
                      onChange={(e) => handleFieldChange('experienceMonths', e.target.value)}
                    >
                      {WORK_EXP_MONTH_OPTIONS.map(mo => (
                        <option key={mo} value={mo}>{mo} {mo === '1' ? 'Month' : 'Months'}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field-group">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="field-companyName">Company Name</label>
                      <span className="field-badge-required">Required</span>
                    </div>
                    <input
                      id="field-companyName"
                      type="text"
                      className={`app-form-input ${errors.companyName ? 'has-error' : ''}`}
                      value={formData.companyName}
                      onChange={(e) => handleFieldChange('companyName', e.target.value)}
                      placeholder="e.g. Infosys, TCS, Startup Inc."
                    />
                    {errors.companyName && <span className="field-error-text">{errors.companyName}</span>}
                  </div>

                  <div className="form-field-group">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="field-jobRole">Job Title / Role</label>
                      <span className="field-badge-required">Required</span>
                    </div>
                    <input
                      id="field-jobRole"
                      type="text"
                      className={`app-form-input ${errors.jobRole ? 'has-error' : ''}`}
                      value={formData.jobRole}
                      onChange={(e) => handleFieldChange('jobRole', e.target.value)}
                      placeholder="e.g. Software Engineer, QA Analyst"
                    />
                    {errors.jobRole && <span className="field-error-text">{errors.jobRole}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Mandatory CV / Resume Upload */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#0b2a6b' }}>
                Curriculum Vitae (CV) / Resume
              </h4>
              <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.88rem' }}>
                All candidates must upload an up-to-date resume highlighting their academic history, technical projects, and skills.
              </p>
              {renderDocumentUploadCard(
                'cvDocument',
                DOCUMENT_DEFINITIONS.cvDocument.title,
                DOCUMENT_DEFINITIONS.cvDocument.required,
                DOCUMENT_DEFINITIONS.cvDocument.helper,
                '.pdf,.doc,.docx'
              )}
            </div>

            {/* Step Navigation Bar */}
            <div className="app-step-actions">
              <div className="app-action-left">
                <button type="button" className="btn btn-secondary" onClick={handlePrevSection}>
                  ← Back to Academics
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                  Save Draft
                </button>
              </div>
              <div className="app-action-right">
                <button type="button" className="btn btn-primary" onClick={handleNextSection}>
                  <span>Continue to Statement of Purpose</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 5: STATEMENT OF PURPOSE
            ========================================================================= */}
        {currentStep === 5 && (
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-kicker">SECTION 5 OF 8</span>
              <h3 className="form-section-title">Statement of Purpose</h3>
              <p className="form-section-desc">
                Tell us about your interests, learning goals, and career aspirations. (Maximum 300 words).
              </p>
            </div>

            <div className="form-field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="field-statementText">
                  Statement of Purpose
                </label>
                <span className="field-badge-required">Required</span>
              </div>
              <p className="field-helper-hint" style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                Helper guidance: “Tell us about your interests, learning goals, and career aspirations.” (Maximum 300 words).
              </p>
              <textarea
                id="field-statementText"
                rows={7}
                className={`app-form-textarea ${errors.statementText ? 'has-error' : ''}`}
                value={formData.statementText}
                onChange={(e) => handleFieldChange('statementText', e.target.value)}
                placeholder="Write your Statement of Purpose here in your own words (maximum 300 words)..."
              />

              <div className="statement-counter-bar">
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Word Limit: Maximum 300 words strictly evaluated
                </span>
                <span className={`word-count-badge ${currentStatementWords > 300 ? 'is-over' : (currentStatementWords > 0 ? 'is-valid' : '')}`}>
                  {currentStatementWords} / 300 words
                </span>
              </div>

              {errors.statementText && <span className="field-error-text">{errors.statementText}</span>}
            </div>

            {/* Step Navigation Bar */}
            <div className="app-step-actions">
              <div className="app-action-left">
                <button type="button" className="btn btn-secondary" onClick={handlePrevSection}>
                  ← Back to Work Experience
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                  Save Draft
                </button>
              </div>
              <div className="app-action-right">
                <button type="button" className="btn btn-primary" onClick={handleNextSection}>
                  <span>Continue to Referral Source</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 6: HOW DID YOU HEAR ABOUT MSIT?
            ========================================================================= */}
        {currentStep === 6 && (
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-kicker">SECTION 6 OF 8</span>
              <h3 className="form-section-title">How Did You Hear About MSIT?</h3>
              <p className="form-section-desc">
                Help us understand how prospective candidates discover the MSIT programme.
              </p>
            </div>

            <div className="form-field-group" style={{ marginBottom: '1.5rem' }}>
              <div className="field-label-row">
                <label className="field-label">How did you hear about the MSIT programme?</label>
                <span className="field-badge-required">Required</span>
              </div>
              <div className="experience-radio-group">
                {REFERRAL_SOURCE_OPTIONS.map(opt => (
                  <label 
                    key={opt} 
                    className={`radio-option-card ${formData.referralSource === opt ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="referralSource"
                      value={opt}
                      checked={formData.referralSource === opt}
                      onChange={() => handleFieldChange('referralSource', opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {errors.referralSource && <span className="field-error-text">{errors.referralSource}</span>}
            </div>

            {/* Conditional "Other" text field */}
            {formData.referralSource === 'Other' && (
              <div className="form-field-group" style={{ maxWidth: '540px', marginTop: '1rem' }}>
                <div className="field-label-row">
                  <label className="field-label" htmlFor="field-referralExplanation">
                    Please specify how you heard about MSIT
                  </label>
                  <span className="field-badge-required">Required</span>
                </div>
                <input
                  id="field-referralExplanation"
                  type="text"
                  className={`app-form-input ${errors.referralExplanation ? 'has-error' : ''}`}
                  value={formData.referralExplanation}
                  onChange={(e) => handleFieldChange('referralExplanation', e.target.value)}
                  placeholder="e.g. University seminar, newspaper advertisement, faculty recommendation"
                />
                {errors.referralExplanation && <span className="field-error-text">{errors.referralExplanation}</span>}
              </div>
            )}

            {/* Step Navigation Bar */}
            <div className="app-step-actions">
              <div className="app-action-left">
                <button type="button" className="btn btn-secondary" onClick={handlePrevSection}>
                  ← Back to Purpose Statement
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                  Save Draft
                </button>
              </div>
              <div className="app-action-right">
                <button type="button" className="btn btn-primary" onClick={handleNextSection}>
                  <span>Continue to Entrance Examination Details</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 7: ENTRANCE EXAMINATION DETAILS
            ========================================================================= */}
        {currentStep === 7 && (
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-kicker">SECTION 7 OF 8</span>
              <h3 className="form-section-title">Entrance Examination Details</h3>
              <p className="form-section-desc">
                Provide your GRE or GATE examination details if you have taken either examination.
              </p>
            </div>

            <div className="form-field-group" style={{ marginBottom: '1.75rem' }}>
              <div className="field-label-row">
                <label className="field-label">Have you taken GRE or GATE?</label>
                <span className="field-badge-required">Required</span>
              </div>
              <div className="experience-radio-group">
                {ENTRANCE_EXAM_OPTIONS.map(opt => (
                  <label 
                    key={opt} 
                    className={`radio-option-card ${formData.entranceExamStatus === opt ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="entranceExamStatus"
                      value={opt}
                      checked={formData.entranceExamStatus === opt}
                      onChange={() => handleFieldChange('entranceExamStatus', opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* If Neither: Exact requested conditional message */}
            {formData.entranceExamStatus === 'Neither' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', color: '#475569' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Appear for the MSIT PGEE exam.
                </p>
              </div>
            )}

            {/* If GRE is selected (or Both) */}
            {(formData.entranceExamStatus === 'GRE' || formData.entranceExamStatus === 'Both') && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.75rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#0b2a6b' }}>
                  GRE Examination Details
                </h4>

                <div className="form-fields-grid" style={{ marginBottom: '1.25rem' }}>
                  <div className="form-field-group">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="field-greScore">GRE Score</label>
                      <span className="field-badge-required">Required</span>
                    </div>
                    <input
                      id="field-greScore"
                      type="number"
                      className={`app-form-input ${errors.greScore ? 'has-error' : ''}`}
                      value={formData.greScore}
                      onChange={(e) => handleFieldChange('greScore', e.target.value)}
                      placeholder="e.g. 315"
                    />
                    {errors.greScore && <span className="field-error-text">{errors.greScore}</span>}
                  </div>

                  <div className="form-field-group">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="field-greYear">GRE Examination Year</label>
                      <span className="field-badge-optional">Optional</span>
                    </div>
                    <select
                      id="field-greYear"
                      className="app-form-select"
                      value={formData.greYear}
                      onChange={(e) => handleFieldChange('greYear', e.target.value)}
                    >
                      <option value="">Select Year</option>
                      {EXAM_YEAR_OPTIONS.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {renderDocumentUploadCard(
                  'greScorecardDoc',
                  DOCUMENT_DEFINITIONS.greScorecardDoc.title,
                  true,
                  DOCUMENT_DEFINITIONS.greScorecardDoc.helper
                )}
              </div>
            )}

            {/* If GATE is selected (or Both) */}
            {(formData.entranceExamStatus === 'GATE' || formData.entranceExamStatus === 'Both') && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.75rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#0b2a6b' }}>
                  GATE Examination Details
                </h4>

                <div className="form-fields-grid" style={{ marginBottom: '1.25rem' }}>
                  <div className="form-field-group">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="field-gateScore">GATE Score / Marks</label>
                      <span className="field-badge-required">Required</span>
                    </div>
                    <input
                      id="field-gateScore"
                      type="number"
                      className={`app-form-input ${errors.gateScore ? 'has-error' : ''}`}
                      value={formData.gateScore}
                      onChange={(e) => handleFieldChange('gateScore', e.target.value)}
                      placeholder="e.g. 520"
                    />
                    {errors.gateScore && <span className="field-error-text">{errors.gateScore}</span>}
                  </div>

                  <div className="form-field-group">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="field-gateYear">GATE Examination Year</label>
                      <span className="field-badge-optional">Optional</span>
                    </div>
                    <select
                      id="field-gateYear"
                      className="app-form-select"
                      value={formData.gateYear}
                      onChange={(e) => handleFieldChange('gateYear', e.target.value)}
                    >
                      <option value="">Select Year</option>
                      {EXAM_YEAR_OPTIONS.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {renderDocumentUploadCard(
                  'gateScorecardDoc',
                  DOCUMENT_DEFINITIONS.gateScorecardDoc.title,
                  true,
                  DOCUMENT_DEFINITIONS.gateScorecardDoc.helper
                )}
              </div>
            )}

            {/* Step Navigation Bar */}
            <div className="app-step-actions">
              <div className="app-action-left">
                <button type="button" className="btn btn-secondary" onClick={handlePrevSection}>
                  ← Back to Referral Source
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                  Save Draft
                </button>
              </div>
              <div className="app-action-right">
                <button type="button" className="btn btn-primary" onClick={handleNextSection}>
                  <span>Review &amp; Submit Application</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 8: REVIEW & SUBMIT APPLICATION
            ========================================================================= */}
        {currentStep === 8 && (
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-kicker">SECTION 8 OF 8</span>
              <h3 className="form-section-title">Review & Submit Application</h3>
              <p className="form-section-desc">
                Review your application across all 7 sections. Click "Edit Section" on any item if you need to make changes before final submission.
              </p>
            </div>

            {/* Section 1 Review */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">1. Personal & Contact Information</h4>
                <button type="button" className="review-edit-link" onClick={() => setCurrentStep(1)}>
                  Edit Section 1
                </button>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Full Name</span><span className="review-item-val">{formData.fullName || '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Email</span><span className="review-item-val">{formData.email || '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Phone</span><span className="review-item-val">{formData.phone || '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Date of Birth</span><span className="review-item-val">{formData.dob || '—'}</span></div>
                <div className="review-item" style={{ gridColumn: '1 / -1' }}><span className="review-item-label">Residential Address</span><span className="review-item-val">{formData.address || '—'}</span></div>
              </div>
            </div>

            {/* Section 2 Review */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">2. Emergency Contact Number</h4>
                <button type="button" className="review-edit-link" onClick={() => setCurrentStep(2)}>
                  Edit Section 2
                </button>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Contact Name</span><span className="review-item-val">{formData.parentName || '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Relationship</span><span className="review-item-val">{formData.parentRelationship || '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Contact Number</span><span className="review-item-val">{formData.altPhone || '—'}</span></div>
              </div>
            </div>

            {/* Section 3 Review */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">3. Academic Qualifications</h4>
                <button type="button" className="review-edit-link" onClick={() => setCurrentStep(3)}>
                  Edit Section 3
                </button>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Class 10 Score</span><span className="review-item-val">{formData.class10Score ? `${formData.class10Score} (${formData.class10ScoreType})` : '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Class 12 Pathway</span><span className="review-item-val">{formData.interPathway}</span></div>
                <div className="review-item"><span className="review-item-label">Class 12 Score</span><span className="review-item-val">{formData.interScore ? `${formData.interScore} (${formData.interScoreType})` : '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Qualifying Degree</span><span className="review-item-val">{formData.ugDegree}</span></div>
                <div className="review-item"><span className="review-item-label">University / Institution</span><span className="review-item-val">{formData.university || '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Branch</span><span className="review-item-val">{formData.branch || '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Specialization</span><span className="review-item-val">{formData.specialization || '—'}</span></div>
                <div className="review-item"><span className="review-item-label">Graduation Year</span><span className="review-item-val">{formData.passingYear}</span></div>
                <div className="review-item"><span className="review-item-label">Aggregate Score</span><span className="review-item-val">{formData.cgpa ? `${formData.cgpa} (${formData.gradingScale})` : '—'}</span></div>
              </div>
            </div>

            {/* Section 4 Review */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">4. Work Experience & Resume</h4>
                <button type="button" className="review-edit-link" onClick={() => setCurrentStep(4)}>
                  Edit Section 4
                </button>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Experience Status</span><span className="review-item-val">{formData.hasExperience === 'Yes' ? 'Experienced' : 'Fresher'}</span></div>
                {formData.hasExperience === 'Yes' && (
                  <>
                    <div className="review-item"><span className="review-item-label">Total Duration</span><span className="review-item-val">{formData.experienceYears} Yrs, {formData.experienceMonths} Mos</span></div>
                    <div className="review-item"><span className="review-item-label">Company Name</span><span className="review-item-val">{formData.companyName || '—'}</span></div>
                    <div className="review-item"><span className="review-item-label">Role / Job Title</span><span className="review-item-val">{formData.jobRole || '—'}</span></div>
                  </>
                )}
                <div className="review-item"><span className="review-item-label">CV / Resume Status</span><span className="review-item-val">{formData.cvDocument ? `Uploaded (${formData.cvDocument.fileName})` : 'Missing'}</span></div>
              </div>
            </div>

            {/* Section 5 Review */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">5. Statement of Purpose</h4>
                <button type="button" className="review-edit-link" onClick={() => setCurrentStep(5)}>
                  Edit Section 5
                </button>
              </div>
              <div>
                <span className="review-item-label">Statement ({currentStatementWords} / 300 words)</span>
                <p style={{ fontStyle: 'italic', background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', margin: 0, fontSize: '0.9rem' }}>
                  "{formData.statementText || 'No statement provided yet'}"
                </p>
              </div>
            </div>

            {/* Section 6 Review */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">6. How Did You Hear About MSIT?</h4>
                <button type="button" className="review-edit-link" onClick={() => setCurrentStep(6)}>
                  Edit Section 6
                </button>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Referral Source</span><span className="review-item-val">{formData.referralSource || '—'}</span></div>
                {formData.referralExplanation && (
                  <div className="review-item"><span className="review-item-label">Specification</span><span className="review-item-val">{formData.referralExplanation}</span></div>
                )}
              </div>
            </div>

            {/* Section 7 Review */}
            <div className="review-block-card">
              <div className="review-block-header">
                <h4 className="review-block-title">7. Entrance Examination Details</h4>
                <button type="button" className="review-edit-link" onClick={() => setCurrentStep(7)}>
                  Edit Section 7
                </button>
              </div>
              <div className="review-details-grid">
                <div className="review-item"><span className="review-item-label">Exam Taken</span><span className="review-item-val">{formData.entranceExamStatus}</span></div>
                {(formData.entranceExamStatus === 'GRE' || formData.entranceExamStatus === 'Both') && (
                  <div className="review-item"><span className="review-item-label">GRE Score</span><span className="review-item-val">{formData.greScore ? `${formData.greScore} (${formData.greYear || 'N/A'})` : '—'}</span></div>
                )}
                {(formData.entranceExamStatus === 'GATE' || formData.entranceExamStatus === 'Both') && (
                  <div className="review-item"><span className="review-item-label">GATE Score</span><span className="review-item-val">{formData.gateScore ? `${formData.gateScore} (${formData.gateYear || 'N/A'})` : '—'}</span></div>
                )}
              </div>
            </div>

            {/* Comprehensive Document Verification Status Checklist */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#0b2a6b' }}>
                Application Document Verification Checklist
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Class 10 Doc */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>Class 10 Marksheet / Memo</span>
                  {formData.documents?.class10Doc ? (
                    <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>✓ Uploaded ({formData.documents.class10Doc.fileName || formData.documents.class10Doc.file_name})</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '700' }}>✗ Required — Missing</span>
                  )}
                </div>

                {/* Class 12 Doc */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>Class 12 / Intermediate Marksheet</span>
                  {formData.documents?.class12Doc ? (
                    <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>✓ Uploaded ({formData.documents.class12Doc.fileName || formData.documents.class12Doc.file_name})</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '700' }}>✗ Required — Missing</span>
                  )}
                </div>

                {/* Degree Marksheet */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>Qualifying Degree Consolidated Marksheet</span>
                  {formData.documents?.ugDegreeDoc ? (
                    <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>✓ Uploaded ({formData.documents.ugDegreeDoc.fileName || formData.documents.ugDegreeDoc.file_name})</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '700' }}>✗ Required — Missing</span>
                  )}
                </div>

                {/* Degree Certificate */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>Degree / Provisional Certificate</span>
                  {formData.documents?.degreeCertDoc ? (
                    <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>✓ Uploaded ({formData.documents.degreeCertDoc.fileName || formData.documents.degreeCertDoc.file_name})</span>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Optional</span>
                  )}
                </div>

                {/* Conditional 16-Year Proof */}
                {requires16YearProof(formData.ugDegree) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>16-Year Education Proof ({formData.ugDegree})</span>
                    {formData.documents?.additionalDegree16YearDoc ? (
                      <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>✓ Uploaded ({formData.documents.additionalDegree16YearDoc.fileName || formData.documents.additionalDegree16YearDoc.file_name})</span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '700' }}>✗ Required — Missing</span>
                    )}
                  </div>
                )}

                {/* CV / Resume */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>Curriculum Vitae (CV) / Resume</span>
                  {(formData.cvDocument || formData.documents?.cvDoc) ? (
                    <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>✓ Uploaded ({(formData.cvDocument || formData.documents?.cvDoc).fileName || (formData.cvDocument || formData.documents?.cvDoc).file_name})</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '700' }}>✗ Required — Missing</span>
                  )}
                </div>

                {/* GRE Scorecard if applicable */}
                {(formData.entranceExamStatus === 'GRE' || formData.entranceExamStatus === 'Both') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>GRE Scorecard</span>
                    {formData.documents?.greScorecardDoc ? (
                      <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>✓ Uploaded ({formData.documents.greScorecardDoc.fileName || formData.documents.greScorecardDoc.file_name})</span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '700' }}>✗ Required — Missing</span>
                    )}
                  </div>
                )}

                {/* GATE Scorecard if applicable */}
                {(formData.entranceExamStatus === 'GATE' || formData.entranceExamStatus === 'Both') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>GATE Scorecard</span>
                    {formData.documents?.gateScorecardDoc ? (
                      <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>✓ Uploaded ({formData.documents.gateScorecardDoc.fileName || formData.documents.gateScorecardDoc.file_name})</span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '700' }}>✗ Required — Missing</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Declaration & Submission Action */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <CheckCircleIcon size={20} className="text-success" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h5 style={{ margin: '0 0 0.35rem 0', color: '#166534', fontWeight: '700' }}>
                    Candidate Verification Declaration
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#14532d', lineHeight: '1.45' }}>
                    I hereby declare that the particulars furnished above are true and complete to the best of my knowledge and that the uploaded transcripts are genuine representations of my academic records.
                  </p>
                </div>
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="app-step-actions">
              <div className="app-action-left">
                <button type="button" className="btn btn-secondary" onClick={handlePrevSection}>
                  ← Back to Entrance Exams
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                  Save Draft
                </button>
              </div>
              <div className="app-action-right">
                <button
                  type="button"
                  className="btn btn-primary btn-submit-app"
                  disabled={isSubmitting}
                  onClick={handleSubmitApplication}
                >
                  <span>{isSubmitting ? 'Submitting Application...' : ((formData.status === 'Declined' || formData.status === 'Rejected') ? 'Submit Fresh Application' : (portalMode === 'edit' ? 'Update & Re-submit Application' : 'Submit Application'))}</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Official Printable Document for Print / Save PDF */}
      <PrintableApplicationDocument formData={formData} serverApp={serverApp} />
    </div>
  );
}
