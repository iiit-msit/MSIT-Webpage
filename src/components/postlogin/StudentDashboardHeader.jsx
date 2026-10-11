import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ArrowRightIcon, 
  SparklesIcon,
  DownloadIcon,
  XCircleIcon
} from '../Icons';
import { getStudentDisplayName } from '../../utils/userUtils';

export default function StudentDashboardHeader({ 
  user, 
  data, 
  application = null,
  applicationStatus = 'Not Started',
  admissionSettings = null,
  loadingSettings = false,
  onApply 
}) {
  const navigate = useNavigate();
  // Extract real student name cleanly
  const displayName = getStudentDisplayName(user);

  // Dynamic parameters from admin admission settings or fallback
  const commencementDate = admissionSettings?.commencementDate || data?.cohortBadge?.replace('Batch Commencement: ', '') || 'January 2, 2027';
  const commencementVenue = admissionSettings?.commencementVenue || 'IIIT Hyderabad';
  const appStart = admissionSettings?.applicationStartDate || 'October 1, 2026';
  const appDeadline = admissionSettings?.applicationDeadline || 'November 30, 2026';
  const appModes = admissionSettings?.admissionModes || 'GRE, GATE, or MSIT Exam';

  const getButtonLabel = () => {
    if (applicationStatus === 'Draft') return 'Continue Application';
    if (['Submitted', 'Under Review', 'Accepted', 'Rejected', 'Declined', 'Interview Scheduled', 'Shortlisted for Interview', 'Scheduled for MSIT PGEE Exam', 'MSIT PGEE Exam Required', 'Awaiting MSIT PGEE Result'].includes(applicationStatus)) return 'View Application';
    if (applicationStatus === 'Additional Information Required') return 'Update Application';
    return 'Apply Now (Jan 2027)';
  };

  const handleActionClick = () => {
    if (onApply) {
      onApply(applicationStatus);
    } else {
      navigate('/apply');
    }
  };

  // Status-dependent presentation mapping for the top-right blue card
  const statusConfigMap = {
    'Not Started': {
      badge: data?.statusBadge || 'Applications Open Now',
      badgeBg: undefined,
      badgeColor: undefined,
      badgeBorder: undefined,
      dotColor: '#10b981',
      title: `Next Cohort: ${commencementDate}`,
      description: `Applications for the ${commencementDate} intake are now live. Submit your details online to register for the upcoming cohort.`,
      noteIcon: <CheckCircleIcon size={16} />,
      noteBg: undefined,
      noteBorder: undefined,
      noteColor: undefined,
      noteText: 'Online application portal is now active',
      buttonLabel: 'Apply Now'
    },
    'Draft': {
      badge: 'Draft Saved',
      badgeBg: '#fffbeb',
      badgeColor: '#92400e',
      badgeBorder: '#fde68a',
      dotColor: '#f59e0b',
      title: 'Application in Progress',
      description: 'You have an active draft. Reopen your application to complete academic details and required uploads.',
      noteIcon: <ClockIcon size={16} />,
      noteBg: '#fffbeb',
      noteBorder: '#fde68a',
      noteColor: '#92400e',
      noteText: application?.updated_at 
        ? `Last saved: ${new Date(application.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
        : 'Application progress saved',
      buttonLabel: 'Continue Application'
    },
    'Submitted': {
      badge: 'Submitted',
      badgeBg: '#eff6ff',
      badgeColor: '#1e40af',
      badgeBorder: '#bfdbfe',
      dotColor: '#3b82f6',
      title: `Application Ref: ${application?.application_id || 'MSIT-2027'}`,
      description: `Submitted successfully on ${application?.submitted_at ? new Date(application.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}. Your details are recorded and queued for admissions review.`,
      noteIcon: <CheckCircleIcon size={16} />,
      noteBg: '#eff6ff',
      noteBorder: '#bfdbfe',
      noteColor: '#1e40af',
      noteText: 'Official application received & recorded',
      buttonLabel: 'View Application'
    },
    'Under Review': {
      badge: 'Under Review',
      badgeBg: '#faf5ff',
      badgeColor: '#6b21a8',
      badgeBorder: '#e9d5ff',
      dotColor: '#a855f7',
      title: `Application Ref: ${application?.application_id || 'MSIT-2027'}`,
      description: 'Your academic background, documents, and statement are being reviewed by the admissions committee.',
      noteIcon: <ClockIcon size={16} />,
      noteBg: '#faf5ff',
      noteBorder: '#e9d5ff',
      noteColor: '#6b21a8',
      noteText: 'Admissions committee review in progress',
      buttonLabel: 'View Application'
    },
    'Shortlisted for Interview': {
      badge: 'Interview Shortlisted 🎙️',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      badgeBorder: '#bfdbfe',
      dotColor: '#2563eb',
      title: 'Shortlisted for One-on-One Discussion',
      description: application?.interview_date 
        ? `Your interview has been scheduled for ${application.interview_date}${application.interview_time ? ` at ${application.interview_time}` : ''}. Please prepare for technical problem solving.`
        : 'You have been shortlisted for the one-on-one discussion round. Admissions team will notify you with the slot details shortly.',
      noteIcon: <ClockIcon size={16} />,
      noteBg: '#eff6ff',
      noteBorder: '#bfdbfe',
      noteColor: '#1d4ed8',
      noteText: application?.interview_date ? `Interview: ${application.interview_date}` : 'Interview scheduling underway',
      buttonLabel: 'View Application'
    },
    'Interview Scheduled': {
      badge: 'Interview Scheduled 🎙️',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      badgeBorder: '#bfdbfe',
      dotColor: '#2563eb',
      title: 'One-on-One Discussion Scheduled',
      description: application?.interview_date 
        ? `Your interview is confirmed for ${application.interview_date}${application.interview_time ? ` at ${application.interview_time}` : ''}${application?.interview_mode ? ` (${application.interview_mode})` : ''}. Review computer science and mathematical fundamentals.`
        : 'Your one-on-one discussion slot is being scheduled by the admissions committee.',
      noteIcon: <CalendarIcon size={16} />,
      noteBg: '#eff6ff',
      noteBorder: '#bfdbfe',
      noteColor: '#1d4ed8',
      noteText: application?.interview_date ? `Date: ${application.interview_date}${application.interview_time ? ` @ ${application.interview_time}` : ''}` : 'Interview slot confirmed',
      buttonLabel: 'View Application'
    },
    'Scheduled for MSIT PGEE Exam': {
      badge: 'MSIT PGEE Exam Scheduled 📝',
      badgeBg: '#fffbeb',
      badgeColor: '#b45309',
      badgeBorder: '#fde68a',
      dotColor: '#f59e0b',
      title: 'MSIT PGEE Entrance Exam Scheduled',
      description: `You are scheduled for the MSIT PGEE Exam on ${application?.gat_exam_date || admissionSettings?.gatExamDate || 'December 15, 2026'}${application?.gat_slot ? ` (${application.gat_slot})` : ''} at IIITH Nilgiri. Successful completion qualifies you for the one-on-one discussion.`,
      noteIcon: <ClockIcon size={16} />,
      noteBg: '#fffbeb',
      noteBorder: '#fde68a',
      noteColor: '#b45309',
      noteText: `Exam Date: ${application?.gat_exam_date || admissionSettings?.gatExamDate || 'December 15, 2026'}`,
      buttonLabel: 'View Application'
    },
    'MSIT PGEE Exam Required': {
      badge: 'MSIT PGEE Exam Required 📝',
      badgeBg: '#fffbeb',
      badgeColor: '#b45309',
      badgeBorder: '#fde68a',
      dotColor: '#f59e0b',
      title: 'MSIT PGEE Examination Required',
      description: `As no prior GRE/GATE score was submitted, you are required to take the MSIT PGEE Examination scheduled for ${application?.gat_exam_date || admissionSettings?.gatExamDate || 'December 15, 2026'}.`,
      noteIcon: <ClockIcon size={16} />,
      noteBg: '#fffbeb',
      noteBorder: '#fde68a',
      noteColor: '#b45309',
      noteText: 'Prepare for MSIT PGEE Entrance Test',
      buttonLabel: 'View Application'
    },
    'Awaiting MSIT PGEE Result': {
      badge: 'Awaiting PGEE Result ⏳',
      badgeBg: '#fffbeb',
      badgeColor: '#b45309',
      badgeBorder: '#fde68a',
      dotColor: '#f59e0b',
      title: 'MSIT PGEE Results Under Evaluation',
      description: 'Your MSIT PGEE entrance test has been recorded. Evaluation results will be published shortly.',
      noteIcon: <ClockIcon size={16} />,
      noteBg: '#fffbeb',
      noteBorder: '#fde68a',
      noteColor: '#b45309',
      noteText: 'Results evaluation in progress',
      buttonLabel: 'View Application'
    },
    'Additional Information Required': {
      badge: 'Action Required',
      badgeBg: '#fff7ed',
      badgeColor: '#9a3412',
      badgeBorder: '#ffedd5',
      dotColor: '#ea580c',
      title: 'Additional Information Requested',
      description: application?.decision_reason 
        ? `The admissions team requested updates: "${application.decision_reason}". Please update and resubmit your application.`
        : 'The admissions committee has requested document updates or clarifications.',
      noteIcon: <ClockIcon size={16} />,
      noteBg: '#fff7ed',
      noteBorder: '#fed7aa',
      noteColor: '#9a3412',
      noteText: 'Updates permitted by admissions team',
      buttonLabel: 'Update Application'
    },
    'Accepted': {
      badge: 'Accepted 🎉',
      badgeBg: '#ecfdf5',
      badgeColor: '#065f46',
      badgeBorder: '#a7f3d0',
      dotColor: '#10b981',
      title: 'Admission Offered 🎉',
      description: `Congratulations! You have received an admission offer for the MSIT ${commencementDate} cohort at IIIT Hyderabad.`,
      noteIcon: <CheckCircleIcon size={16} />,
      noteBg: '#ecfdf5',
      noteBorder: '#a7f3d0',
      noteColor: '#065f46',
      noteText: 'Formal admission decision recorded',
      buttonLabel: 'View Application'
    },
    'Declined': {
      badge: 'Application Declined',
      badgeBg: '#fef2f2',
      badgeColor: '#991b1b',
      badgeBorder: '#fecaca',
      dotColor: '#ef4444',
      title: 'Admissions Decision: Declined',
      description: application?.decision_reason 
        ? `Admissions committee remarks: "${application.decision_reason}". Thank you for your interest in MSIT.`
        : 'The admissions committee has reviewed your application and was unable to offer admission for this intake.',
      noteIcon: <XCircleIcon size={16} />,
      noteBg: '#fef2f2',
      noteBorder: '#fecaca',
      noteColor: '#991b1b',
      noteText: 'Evaluation finalized by admissions committee',
      buttonLabel: 'View Application'
    },
    'Rejected': {
      badge: 'Application Declined',
      badgeBg: '#fef2f2',
      badgeColor: '#991b1b',
      badgeBorder: '#fecaca',
      dotColor: '#ef4444',
      title: 'Admissions Decision: Declined',
      description: application?.decision_reason 
        ? `Admissions committee remarks: "${application.decision_reason}". Thank you for your interest in MSIT.`
        : 'The admissions committee has finalized review for this cohort. Thank you for applying to MSIT.',
      noteIcon: <XCircleIcon size={16} />,
      noteBg: '#fef2f2',
      noteBorder: '#fecaca',
      noteColor: '#991b1b',
      noteText: 'Evaluation completed for this intake',
      buttonLabel: 'View Application'
    }
  };

  const effectiveStatus = ((applicationStatus && applicationStatus !== 'Not Started') 
    ? applicationStatus 
    : (application?.status || 'Not Started')).trim();

  const currentStatusConfig = statusConfigMap[effectiveStatus] || statusConfigMap[applicationStatus] || statusConfigMap['Not Started'];

  // =========================================================================
  // FIVE-STEP ADMISSION WORKFLOW EVALUATION
  // =========================================================================

  // --- Step 4: One-on-One Discussion & Scheduling Prep ---
  const interviewDate = application?.interview_date || (admissionSettings?.interviewSchedule && admissionSettings.interviewSchedule !== 'TBD' ? admissionSettings.interviewSchedule : null);
  const interviewTime = application?.interview_time || '';
  const hasInterviewScheduled = Boolean(
    effectiveStatus === 'Interview Scheduled' ||
    effectiveStatus === 'Shortlisted for Interview' ||
    application?.status === 'Interview Scheduled' ||
    application?.status === 'Shortlisted for Interview' ||
    applicationStatus === 'Interview Scheduled' ||
    applicationStatus === 'Shortlisted for Interview' ||
    application?.interview_status === 'Scheduled' ||
    (interviewDate && interviewDate !== 'TBD' && interviewDate !== 'null')
  );

  // --- Step 3: Eligibility & PGEE Scheduling Prep ---
  const isPgeeScheduled = Boolean(
    effectiveStatus === 'Scheduled for MSIT PGEE Exam' ||
    effectiveStatus === 'MSIT PGEE Exam Required' ||
    effectiveStatus === 'Awaiting MSIT PGEE Result' ||
    application?.status === 'Scheduled for MSIT PGEE Exam' ||
    application?.status === 'MSIT PGEE Exam Required' ||
    application?.status === 'Awaiting MSIT PGEE Result' ||
    applicationStatus === 'Scheduled for MSIT PGEE Exam' ||
    applicationStatus === 'MSIT PGEE Exam Required' ||
    applicationStatus === 'Awaiting MSIT PGEE Result' ||
    application?.gat_status === 'Scheduled' ||
    (application?.gat_exam_date && application?.gat_exam_date !== 'TBD')
  );

  // --- Step 2: Application Review & Document Verification ---
  const rawDocs = application?.documents;
  let docs = [];
  if (Array.isArray(rawDocs)) {
    docs = rawDocs.filter(Boolean);
  } else if (typeof rawDocs === 'string') {
    try {
      const parsed = JSON.parse(rawDocs);
      if (Array.isArray(parsed)) {
        docs = parsed.filter(Boolean);
      } else if (parsed && typeof parsed === 'object') {
        docs = Object.values(parsed).filter(d => d && typeof d === 'object');
      }
    } catch (_) {
      docs = [];
    }
  } else if (rawDocs && typeof rawDocs === 'object') {
    docs = Object.values(rawDocs).filter(d => d && typeof d === 'object');
  }

  const rejectedDocs = docs.filter(d => d && (d.status === 'Rejected' || d.verificationStatus === 'Rejected'));
  const hasRejectedDoc = rejectedDocs.length > 0 || application?.document_status === 'Rejected';
  const allDocsVerified = docs.length > 0 && docs.every(d => d && (d.status === 'Verified' || d.verificationStatus === 'Verified'));

  const isDocVerified = Boolean(
    allDocsVerified || 
    application?.document_status === 'Verified' || 
    application?.document_status === 'Documents Verified' ||
    isPgeeScheduled ||
    hasInterviewScheduled ||
    [
      'Accepted', 
      'Interview Scheduled', 
      'Shortlisted for Interview',
      'Interview Completed', 
      'Scheduled for MSIT PGEE Exam', 
      'MSIT PGEE Exam Required', 
      'Awaiting MSIT PGEE Result', 
      'Onboarded', 
      'Enrolled'
    ].includes(effectiveStatus) ||
    [
      'Accepted', 
      'Interview Scheduled', 
      'Shortlisted for Interview',
      'Interview Completed', 
      'Scheduled for MSIT PGEE Exam', 
      'MSIT PGEE Exam Required', 
      'Awaiting MSIT PGEE Result', 
      'Onboarded', 
      'Enrolled'
    ].includes(application?.status)
  );

  // --- Step 1: Application Submission ---
  const submittedStatuses = [
    'Submitted', 
    'Under Review', 
    'Accepted', 
    'Declined', 
    'Rejected', 
    'Additional Information Required', 
    'Interview Scheduled', 
    'Shortlisted for Interview',
    'Interview Completed', 
    'Scheduled for MSIT PGEE Exam', 
    'MSIT PGEE Exam Required', 
    'Awaiting MSIT PGEE Result', 
    'Onboarded', 
    'Enrolled'
  ];
  const isAppSubmitted = Boolean(
    submittedStatuses.includes(effectiveStatus) ||
    submittedStatuses.includes(application?.status) ||
    submittedStatuses.includes(applicationStatus) ||
    isDocVerified ||
    isPgeeScheduled ||
    hasInterviewScheduled ||
    application?.submitted_at ||
    application?.isSubmitted
  );

  // --- Step 3: Pathway Calculations ---
  const greScoreNum = Number(application?.gre_score);
  const gateScoreNum = Number(application?.gate_score);
  const greMin = Number(admissionSettings?.greMinScore || 300);
  const gateMin = Number(admissionSettings?.gateMinScore || 350);

  const hasValidGre = Boolean(
    (application?.entrance_exam_status === 'GRE' || application?.entrance_exam_status === 'Both') &&
    application?.gre_score &&
    (!isNaN(greScoreNum) ? greScoreNum >= greMin : true)
  );

  const hasValidGate = Boolean(
    (application?.entrance_exam_status === 'GATE' || application?.entrance_exam_status === 'Both') &&
    application?.gate_score &&
    (!isNaN(gateScoreNum) ? gateScoreNum >= gateMin : true)
  );

  const isGateGrePathway = hasValidGre || hasValidGate;

  const isGatCompleted = Boolean(
    application?.gat_status === 'Completed' ||
    application?.gat_result === 'Qualified' ||
    application?.gat_score ||
    ['Interview Scheduled', 'Interview Completed', 'Accepted', 'Onboarded', 'Enrolled'].includes(application?.status)
  );
  const gatExamDate = application?.gat_exam_date || admissionSettings?.gatExamDate || admissionSettings?.gatSchedule || 'December 15, 2026';

  // --- Interview Outcomes ---
  const isInterviewPassed = Boolean(
    application?.interview_outcome === 'Cleared' ||
    application?.interview_outcome === 'Recommended' ||
    application?.interview_status === 'Completed' ||
    ['Interview Completed', 'Accepted', 'Onboarded', 'Enrolled'].includes(application?.status)
  );
  const isInterviewUnsuccessful = Boolean(
    application?.interview_outcome === 'Not Cleared' ||
    application?.interview_outcome === 'Declined'
  );

  // --- Step 5: Final Decisions ---
  const isSelected = Boolean(
    ['Accepted', 'Onboarded', 'Enrolled'].includes(effectiveStatus) ||
    ['Accepted', 'Onboarded', 'Enrolled'].includes(application?.status) ||
    ['Accepted', 'Onboarded', 'Enrolled'].includes(applicationStatus) ||
    application?.final_decision === 'Accepted' ||
    application?.admission_offer === 'Issued'
  );
  const isRejected = Boolean(
    ['Declined', 'Rejected'].includes(effectiveStatus) ||
    ['Declined', 'Rejected'].includes(application?.status) ||
    ['Declined', 'Rejected'].includes(applicationStatus) ||
    application?.final_decision === 'Rejected'
  );
  const isOnboarded = Boolean(
    ['Onboarded', 'Enrolled'].includes(effectiveStatus) ||
    ['Onboarded', 'Enrolled'].includes(application?.status) ||
    application?.onboarding_status === 'Completed'
  );
  const onboardingDate = application?.onboarding_date || admissionSettings?.commencementDate || 'January 2, 2027';
  const onboardingVenue = application?.onboarding_venue || admissionSettings?.commencementVenue || 'IIIT Hyderabad';

  // Specific stage at which rejection occurred
  const wasDeclinedAtPgee = Boolean(
    isRejected && (
      application?.gat_result === 'Not Qualified' || 
      (application?.gat_score && Number(application.gat_score) < Number(admissionSettings?.gatCutoff || 50))
    )
  );

  const wasDeclinedAtInterview = Boolean(
    isRejected && (
      isInterviewUnsuccessful ||
      application?.interview_status === 'Completed' ||
      application?.interview_date
    ) && !wasDeclinedAtPgee
  );

  const wasDeclinedAtReview = Boolean(
    isRejected && !wasDeclinedAtPgee && !wasDeclinedAtInterview
  );

  // Construct Dynamic 5-Step Admission Progress
  const admissionSteps = [
    // Step 1: Application Submission
    {
      id: "1",
      title: "Application Submission",
      done: isAppSubmitted,
      statusState: isAppSubmitted ? 'completed' : 'pending',
      badgeText: isAppSubmitted ? 'Completed' : 'Pending',
      metaText: isAppSubmitted 
        ? (application?.submitted_at ? `Submitted on ${new Date(application.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : `Ref: ${application?.application_id || 'Submitted'}`)
        : 'Online submission required'
    },

    // Step 2: Application Review & Document Verification
    {
      id: "2",
      title: (hasRejectedDoc && !wasDeclinedAtReview) ? "Document Verification" : "Application Review & Document Verification",
      done: !isRejected && (isAppSubmitted && isDocVerified),
      statusState: wasDeclinedAtReview
        ? 'rejected'
        : isRejected
          ? 'completed'
          : !isAppSubmitted 
            ? 'pending' 
            : hasRejectedDoc 
              ? 'rejected' 
              : isDocVerified 
                ? 'completed' 
                : 'review',
      badgeText: wasDeclinedAtReview
        ? 'Application Declined'
        : isRejected
          ? 'Documents Verified'
          : !isAppSubmitted
            ? 'Pending'
            : hasRejectedDoc
              ? 'Document Rejected'
              : isDocVerified
                ? 'Documents Verified'
                : 'Application Under Review',
      metaText: wasDeclinedAtReview
        ? (application?.decision_reason || 'Incomplete transcripts / Criteria not met')
        : isRejected
          ? 'All documents verified'
          : !isAppSubmitted
            ? 'Awaiting application submission'
            : hasRejectedDoc
              ? null
              : isDocVerified
                ? 'All documents verified'
                : 'Review in progress by admissions committee',
      rejectedDocInfo: hasRejectedDoc ? {
        name: rejectedDocs[0]?.doc_type || rejectedDocs[0]?.docType || rejectedDocs[0]?.name || rejectedDocs[0]?.fileName || 'Uploaded Document',
        reason: rejectedDocs[0]?.rejection_reason || rejectedDocs[0]?.rejectionReason || application?.decision_reason || 'Document does not meet institutional verification criteria.'
      } : null
    },

    // Step 3: Eligibility & Evaluation (GATE/GRE vs MSIT PGEE)
    {
      id: "3",
      title: isPgeeScheduled 
        ? "MSIT PGEE Examination Scheduled"
        : (isGateGrePathway ? "Eligibility & Evaluation" : "MSIT PGEE Examination Required"),
      done: !isRejected && (isGatCompleted || (isGateGrePathway && !isPgeeScheduled)),
      statusState: wasDeclinedAtReview
        ? 'disabled'
        : wasDeclinedAtPgee
          ? 'rejected'
          : isRejected
            ? (isGatCompleted || isGateGrePathway ? 'completed' : 'disabled')
            : isGatCompleted
              ? 'completed'
              : isPgeeScheduled
                ? 'review'
                : !isDocVerified
                  ? 'pending'
                  : isGateGrePathway
                    ? 'completed'
                    : 'warning',
      badgeText: wasDeclinedAtReview
        ? 'Process Concluded'
        : wasDeclinedAtPgee
          ? 'Not Qualified'
          : isRejected
            ? (isGatCompleted ? 'MSIT PGEE Cleared' : isGateGrePathway ? 'GATE/GRE Verified' : 'Process Concluded')
            : isGatCompleted
              ? 'MSIT PGEE Cleared'
              : isPgeeScheduled
                ? 'Exam Scheduled'
                : !isDocVerified
                  ? 'Pending'
                  : isGateGrePathway
                    ? 'Eligible for Interview'
                    : 'MSIT PGEE Exam Required',
      metaText: wasDeclinedAtReview
        ? 'Admissions evaluation concluded'
        : wasDeclinedAtPgee
          ? (application?.decision_reason || 'Cutoff score not met')
          : isRejected
            ? (isGatCompleted ? 'Entrance test cleared' : 'Admissions evaluation concluded')
            : isGatCompleted
              ? (application?.gat_score ? `MSIT PGEE Score: ${application.gat_score} · Qualified` : 'Result: Qualified')
              : isPgeeScheduled
                ? (gatExamDate ? `Exam Date: ${gatExamDate}${application?.gat_slot ? ` (${application.gat_slot})` : ''} · IIITH Nilgiri` : 'Exam scheduled at IIITH Nilgiri')
                : !isDocVerified
                  ? 'Awaiting document verification'
                  : isGateGrePathway
                    ? (interviewDate && interviewDate !== 'TBD' && interviewDate !== 'null'
                        ? `Scheduled: ${interviewDate}${interviewTime ? ` at ${interviewTime}` : ''}`
                        : `Qualified via ${hasValidGate ? 'GATE' : 'GRE'} score (MSIT PGEE exempt)`)
                    : (gatExamDate ? `Exam Date: ${gatExamDate}${application?.gat_slot ? ` (${application.gat_slot})` : ''} · IIITH Nilgiri` : 'Exam date to be announced')
    },

    // Step 4: One-on-One Discussion
    {
      id: "4",
      title: "One-on-One Discussion",
      done: !isRejected && isInterviewPassed,
      statusState: (wasDeclinedAtReview || wasDeclinedAtPgee)
        ? 'disabled'
        : wasDeclinedAtInterview
          ? 'rejected'
          : isRejected
            ? (isInterviewPassed ? 'completed' : 'disabled')
            : isInterviewPassed
              ? 'completed'
              : isInterviewUnsuccessful
                ? 'rejected'
                : hasInterviewScheduled
                  ? 'review'
                  : 'pending',
      badgeText: (wasDeclinedAtReview || wasDeclinedAtPgee)
        ? 'Process Concluded'
        : wasDeclinedAtInterview
          ? 'Not Cleared'
          : isRejected
            ? (isInterviewPassed ? 'Interview Cleared' : 'Process Concluded')
            : isInterviewPassed
              ? 'Interview Cleared'
              : isInterviewUnsuccessful
                ? 'Not Cleared'
                : hasInterviewScheduled
                  ? 'Interview Scheduled'
                  : isPgeeScheduled
                    ? 'Awaiting PGEE Result'
                    : 'Awaiting Scheduling',
      metaText: (wasDeclinedAtReview || wasDeclinedAtPgee)
        ? 'Admissions evaluation concluded'
        : wasDeclinedAtInterview
          ? (application?.decision_reason || 'Interview outcome not cleared')
          : isRejected
            ? (isInterviewPassed ? 'Interview cleared' : 'Admissions evaluation concluded')
            : isInterviewPassed
              ? 'Outcome: Recommended for Admission'
              : isInterviewUnsuccessful
                ? 'Interview outcome not cleared'
                : hasInterviewScheduled
                  ? `Interview Date: ${interviewDate && interviewDate !== 'null' ? interviewDate : 'Scheduled · Slot TBD'}${interviewTime ? ` at ${interviewTime}` : ''} (IIITH Nilgiri)`
                  : isPgeeScheduled
                    ? 'Qualify MSIT PGEE exam to advance to interview'
                    : (!isDocVerified || (!isGateGrePathway && !isGatCompleted))
                      ? (!isGateGrePathway ? 'Awaiting evaluation result' : 'Awaiting prior verification')
                      : (admissionSettings?.interviewInstructions || 'Interview schedule to be announced by admissions team')
    },

    // Step 5: Final Decision & Onboarding
    {
      id: "5",
      title: isSelected 
        ? "Selected — Onboarding Scheduled" 
        : isRejected 
          ? "Application Declined" 
          : "Final Decision & Onboarding",
      done: isSelected,
      statusState: isSelected 
        ? 'selected' 
        : isRejected 
          ? 'rejected' 
          : 'pending',
      badgeText: isSelected 
        ? (isOnboarded ? 'Onboarded' : 'Admission Offered')
        : isRejected 
          ? 'Declined' 
          : 'Pending Decision',
      metaText: isSelected 
        ? `Commencement: ${onboardingDate} (${onboardingVenue})`
        : isRejected 
          ? (application?.decision_reason ? `Reason: ${application.decision_reason}` : 'Admissions evaluation finalized')
          : 'Awaiting final selection outcome and onboarding confirmation'
    }
  ];

  return (
    <section className="student-dashboard-hero" id="overview">
      <div id="dashboard" style={{ position: 'absolute', top: 0 }} />
      <div className="container">
        {/* Top Identification & Welcome Row */}
        <div className="dashboard-welcome-card">
          <div className="welcome-main-info">
            <div className="student-badge-row">
              <span className="student-verified-pill">
                <CheckCircleIcon size={14} />
                <span>Verified Prospective Student</span>
              </span>
              <span className="student-email-pill">
                {user?.email || 'student@msit.ac.in'}
              </span>
              <span className="student-cohort-pill">
                <CalendarIcon size={14} />
                <span>Batch Commencement: {commencementDate}</span>
              </span>
            </div>

            <h1 className="welcome-student-title">
              Welcome, <span className="highlight-text">{displayName}</span>!
            </h1>
            <p className="welcome-student-desc">
              {data?.welcomeSubtitle || 'Explore official programme specifications, academic learning structure, admissions criteria, and application preparation for the upcoming cohort.'}
            </p>

            <div className="welcome-quick-ctas">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleActionClick}
              >
                <span>{getButtonLabel()}</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>

            {/* Admission Notification Item */}
            <div className="admission-notification-item">
              <div className="admission-notification-header">
                <span className="admission-notification-title">Admission Notification</span>
              </div>
              <a 
                href="/documents/MSIT_Admission_Notification_2026-27.pdf" 
                download="MSIT_Admission_Notification_2026-27.pdf"
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm admission-notification-download-btn"
              >
                <DownloadIcon size={15} />
                <span>Download</span>
              </a>
            </div>
          </div>

          {/* Current Application Status Box (Top-Right Blue Element Restored) */}
          <div className="application-status-card">
            <div className="status-card-header">
              <span className="status-kicker">APPLICATION STATUS</span>
              <span 
                className="status-beacon-pill" 
                style={currentStatusConfig.badgeBg ? { 
                  background: currentStatusConfig.badgeBg, 
                  color: currentStatusConfig.badgeColor, 
                  borderColor: currentStatusConfig.badgeBorder 
                } : undefined}
              >
                <span 
                  className="beacon-dot" 
                  style={{ background: currentStatusConfig.dotColor || '#10b981' }}
                />
                {currentStatusConfig.badge}
              </span>
            </div>

            <div className="status-card-body">
              <h3>{currentStatusConfig.title}</h3>
              <p>{currentStatusConfig.description}</p>
              <div 
                className="status-note-box" 
                style={currentStatusConfig.noteBg ? { 
                  background: currentStatusConfig.noteBg, 
                  borderColor: currentStatusConfig.noteBorder, 
                  color: currentStatusConfig.noteColor 
                } : undefined}
              >
                {currentStatusConfig.noteIcon}
                <span>{currentStatusConfig.noteText}</span>
              </div>
            </div>

            <div className="status-card-footer">
              <button 
                type="button" 
                className="btn btn-primary btn-sm full-width"
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={handleActionClick}
              >
                <span>{currentStatusConfig.buttonLabel}</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Actionable Admission Status Checklist Area */}
        <div className="decision-prep-area">
          <div className="decision-prep-header">
            <div className="prep-title-group">
              <SparklesIcon size={20} className="prep-icon" />
              <div>
                <h2>Admission Status</h2>
              </div>
            </div>
          </div>

          {loadingSettings ? (
            <div className="prep-checklist-grid five-steps-grid" aria-label="Loading admission status">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="prep-skeleton-card">
                  <div className="prep-skeleton-circle" />
                  <div className="prep-skeleton-lines">
                    <div className="prep-skeleton-bar-title" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="prep-checklist-grid five-steps-grid">
              {admissionSteps.map((item) => {
                let cardClass = 'prep-checklist-card';
                if (item.statusState === 'completed' || item.done) cardClass += ' is-done';
                else if (item.statusState === 'rejected') cardClass += ' is-rejected';
                else if (item.statusState === 'review') cardClass += ' is-review';
                else if (item.statusState === 'warning') cardClass += ' is-warning';
                else if (item.statusState === 'selected') cardClass += ' is-selected';
                else if (item.statusState === 'disabled') cardClass += ' is-disabled';

                return (
                  <div key={item.id} className={cardClass}>
                    <div className="checklist-num-wrap">
                      {item.statusState === 'completed' || item.done ? (
                        <span className="checklist-check-icon">✓</span>
                      ) : item.statusState === 'rejected' ? (
                        <span className="checklist-fail-icon">✕</span>
                      ) : item.statusState === 'warning' ? (
                        <span className="checklist-warn-icon">!</span>
                      ) : item.statusState === 'disabled' ? (
                        <span className="checklist-step-num" style={{ opacity: 0.6 }}>—</span>
                      ) : (
                        <span className="checklist-step-num">{item.id}</span>
                      )}
                    </div>
                    <div className="checklist-card-content">
                      <h4>{item.title}</h4>

                      {item.badgeText && (
                        <span className={`checklist-status-badge badge-${
                          item.statusState === 'completed' || item.done ? 'success' :
                          item.statusState === 'rejected' ? 'danger' :
                          item.statusState === 'review' ? 'review' :
                          item.statusState === 'warning' ? 'warning' :
                          item.statusState === 'disabled' ? 'disabled' : 'neutral'
                        }`}>
                          {item.badgeText}
                        </span>
                      )}

                      {item.metaText && (
                        <div className="checklist-status-meta">
                          <span>{item.metaText}</span>
                        </div>
                      )}

                      {item.rejectedDocInfo && (
                        <div className="checklist-rejection-box">
                          <div style={{ fontWeight: 600 }}>{item.rejectedDocInfo.name}</div>
                          <div style={{ marginTop: '0.2rem', color: '#9f1239' }}>
                            {item.rejectedDocInfo.reason}
                          </div>
                          <button 
                            type="button" 
                            className="checklist-reupload-btn"
                            onClick={() => navigate('/apply?mode=edit')}
                          >
                            <span>Resubmit Document</span>
                            <ArrowRightIcon size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

