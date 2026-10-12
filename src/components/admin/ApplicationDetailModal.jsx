import React, { useState, useMemo, useEffect } from 'react';
import { 
  XIcon, 
  MailIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  DownloadIcon, 
  UserIcon, 
  GraduationCapIcon, 
  AwardIcon, 
  BookOpenIcon,
  UsersIcon,
  BriefcaseIcon,
  EditIcon,
  FileTextIcon
} from '../Icons';
import { StatusBadge, TestDataBadge } from './StatusBadge';
import ConfirmDecisionModal from './ConfirmDecisionModal';
import DocumentReviewModal from './DocumentReviewModal';
import CertificateModal from './CertificateModal';
import { 
  addApplicationNote, 
  getApplicationNotes, 
  getStatusHistory, 
  updateDocumentStatus, 
  updateApplicationStatus,
  updateApplicationDetails,
  updateApplicationRecord,
  enrichApplicationRecord,
  isApplicationInDocumentReview
} from '../../services/adminService';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function ApplicationDetailModal({
  isOpen,
  onClose,
  application,
  onApplicationUpdated
}) {
  const { adminUser } = useAdminAuth();

  // Active section tab in modal: 'details' | 'workflow' | 'documents' | 'notes' | 'history'
  const [activeSection, setActiveSection] = useState('details');

  // Certificate & Document Viewer Modal State
  const [viewingDocModal, setViewingDocModal] = useState({
    isOpen: false,
    initialDocType: 'btech'
  });

  // Local override state to instantly reflect decision changes in the modal UI
  const [localAppOverride, setLocalAppOverride] = useState(null);

  // Enriched application data guarantees no missing fields slip through
  const currentApp = useMemo(() => {
    const base = localAppOverride || application;
    return base ? enrichApplicationRecord(base) : null;
  }, [application, localAppOverride]);

  // Only clear local override when switching to a different application or when modal re-opens
  useEffect(() => {
    setLocalAppOverride(null);
  }, [application?.application_id, application?.id, isOpen]);

  const [decisionSuccessMsg, setDecisionSuccessMsg] = useState(null);

  // Notes state
  const [notes, setNotes] = useState(() => currentApp ? getApplicationNotes(currentApp.application_id) : []);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Status History state
  const [history, setHistory] = useState(() => currentApp ? getStatusHistory(currentApp.application_id) : []);

  // Decision Modal state
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState(null); // 'Accept' | 'Decline' | 'Review' | 'Pending'

  // Document Review Modal state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docReviewModalOpen, setDocReviewModalOpen] = useState(false);

  // Candidate Details Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  const [editForm, setEditForm] = useState(() => ({
    full_name: currentApp?.full_name || '',
    dob: currentApp?.dob || '',
    address: currentApp?.address || '',
    phone: currentApp?.phone || '',
    parent_relationship: currentApp?.parent_relationship || 'Father',
    parent_name: currentApp?.parent_name || '',
    alt_phone: currentApp?.alt_phone || '',
    class10_score: currentApp?.class10_score || '',
    class10_score_type: currentApp?.class10_score_type || 'Percentage',
    inter_pathway: currentApp?.inter_pathway || 'Class 12 / Intermediate',
    inter_score: currentApp?.inter_score || '',
    inter_score_type: currentApp?.inter_score_type || 'Percentage',
    ug_degree: currentApp?.ug_degree || 'B.Tech / B.E.',
    university: currentApp?.university || '',
    department: currentApp?.department || 'Computer Science & Engineering (CSE)',
    passing_year: currentApp?.passing_year || '2026',
    cgpa: currentApp?.cgpa || '',
    grading_scale: currentApp?.grading_scale || 'Percentage (out of 100%)'
  }));

  // Workflow evaluation state
  const [workflowGatDate, setWorkflowGatDate] = useState(application?.gat_exam_date || '');
  const [workflowGatLocation, setWorkflowGatLocation] = useState(application?.gat_location || 'IIITH Nilgiri');
  const [workflowGatScore, setWorkflowGatScore] = useState(application?.gat_score || '');
  const [workflowGatResult, setWorkflowGatResult] = useState(application?.gat_result || 'Pending');
  const [workflowGatStatus, setWorkflowGatStatus] = useState(application?.gat_status || 'Pending');

  const [workflowInterviewDate, setWorkflowInterviewDate] = useState(application?.interview_date || '');
  const [workflowInterviewTime, setWorkflowInterviewTime] = useState(application?.interview_time || '');
  const [workflowInterviewLocation, setWorkflowInterviewLocation] = useState(application?.interview_location || 'IIITH Nilgiri');
  const [workflowInterviewOutcome, setWorkflowInterviewOutcome] = useState(application?.interview_outcome || 'Pending');
  const [workflowInterviewStatus, setWorkflowInterviewStatus] = useState(application?.interview_status || 'Pending');

  const [workflowOnboardingDate, setWorkflowOnboardingDate] = useState(application?.onboarding_date || '');
  const [workflowOnboardingStatus, setWorkflowOnboardingStatus] = useState(application?.onboarding_status || 'Pending');
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [workflowSaveMessage, setWorkflowSaveMessage] = useState('');

  // Synchronize state whenever currentApp changes or modal opens
  useEffect(() => {
    if (currentApp) {
      setEditForm({
        full_name: currentApp.full_name || '',
        dob: currentApp.dob || '',
        address: currentApp.address || '',
        phone: currentApp.phone || '',
        parent_relationship: currentApp.parent_relationship || 'Father',
        parent_name: currentApp.parent_name || '',
        alt_phone: currentApp.alt_phone || '',
        class10_score: currentApp.class10_score || '',
        class10_score_type: currentApp.class10_score_type || 'Percentage',
        inter_pathway: currentApp.inter_pathway || 'Class 12 / Intermediate',
        inter_score: currentApp.inter_score || '',
        inter_score_type: currentApp.inter_score_type || 'Percentage',
        ug_degree: currentApp.ug_degree || 'B.Tech / B.E.',
        university: currentApp.university || '',
        department: currentApp.department || 'Computer Science & Engineering (CSE)',
        passing_year: currentApp.passing_year || '2026',
        cgpa: currentApp.cgpa || '',
        grading_scale: currentApp.grading_scale || 'Percentage (out of 100%)'
      });
      setWorkflowGatDate(currentApp.gat_exam_date || '');
      setWorkflowGatLocation(currentApp.gat_location || 'IIITH Nilgiri');
      setWorkflowGatScore(currentApp.gat_score || '');
      setWorkflowGatResult(currentApp.gat_result || 'Pending');
      setWorkflowGatStatus(currentApp.gat_status || 'Pending');
      setWorkflowInterviewDate(currentApp.interview_date || '');
      setWorkflowInterviewTime(currentApp.interview_time || '');
      setWorkflowInterviewLocation(currentApp.interview_location || 'IIITH Nilgiri');
      setWorkflowInterviewOutcome(currentApp.interview_outcome || 'Pending');
      setWorkflowInterviewStatus(currentApp.interview_status || 'Pending');
      setWorkflowOnboardingDate(currentApp.onboarding_date || '');
      setWorkflowOnboardingStatus(currentApp.onboarding_status || 'Pending');
      setNotes(getApplicationNotes(currentApp.application_id));
      setHistory(getStatusHistory(currentApp.application_id));
    }
  }, [currentApp, isOpen]);

  if (!isOpen || !application || !currentApp) return null;

  const adminEmail = adminUser?.email || 'admin@getskills.io';

  const handleSaveDetails = async (e) => {
    if (e) e.preventDefault();
    setIsSavingDetails(true);
    try {
      const res = await updateApplicationDetails(currentApp.application_id, editForm, adminEmail);
      if (res.updatedApp) {
        onApplicationUpdated(res.updatedApp);
      }
      setSaveSuccessMsg('Candidate details saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update candidate details:', err);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleSaveWorkflow = async (e) => {
    if (e) e.preventDefault();
    if (!currentApp) return;
    setIsSavingWorkflow(true);
    setWorkflowSaveMessage('');
    try {
      const patch = {
        gat_exam_date: workflowGatDate,
        gat_location: workflowGatLocation,
        gat_score: workflowGatScore,
        gat_result: workflowGatResult,
        gat_status: workflowGatStatus,
        interview_date: workflowInterviewDate,
        interview_time: workflowInterviewTime,
        interview_location: workflowInterviewLocation,
        interview_outcome: workflowInterviewOutcome,
        interview_status: workflowInterviewStatus,
        onboarding_date: workflowOnboardingDate,
        onboarding_status: workflowOnboardingStatus
      };

      const res = await updateApplicationRecord(currentApp.application_id, patch, adminEmail);
      if (res.updatedApp && onApplicationUpdated) {
        onApplicationUpdated(res.updatedApp);
      }
      setWorkflowSaveMessage('Admission workflow evaluation saved and synced successfully!');
      setTimeout(() => setWorkflowSaveMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save workflow:', err);
      setWorkflowSaveMessage('Failed to save workflow. Please try again.');
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  const formatDob = (dob) => {
    if (!dob || dob === 'N/A' || dob === '—') return 'N/A';
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        const [y, m, d] = dob.split('-').map(Number);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[m - 1]} ${d}, ${y} (${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y})`;
      }
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        return `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} (${dob})`;
      }
    } catch (e) {}
    return dob;
  };

  const handleOpenCertificate = (certType) => {
    setViewingDocModal({
      isOpen: true,
      initialDocType: certType || 'btech'
    });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsAddingNote(true);
    try {
      const added = await addApplicationNote(currentApp.application_id, newNoteText.trim(), adminEmail);
      setNotes(prev => [added, ...prev]);
      setNewNoteText('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleOpenDecision = (type) => {
    setDecisionType(type);
    setDecisionModalOpen(true);
  };

  const handleExecuteDecision = async (reason, extraPayload = {}) => {
    let targetStatus = extraPayload.status || 'Under Review';
    if (!extraPayload.status) {
      if (decisionType === 'Accept') targetStatus = 'Accepted';
      else if (decisionType === 'Decline') targetStatus = 'Declined';
      else if (decisionType === 'Interview') targetStatus = 'Interview Scheduled';
      else if (decisionType === 'PGEE') targetStatus = 'Scheduled for MSIT PGEE Exam';
      else if (decisionType === 'Pending' || decisionType === 'ActionRequired') targetStatus = 'Additional Information Required';
      else if (decisionType === 'Review') targetStatus = 'Under Review';
    }

    if (decisionType === 'Review' || targetStatus === 'Under Review') {
      extraPayload.in_document_review = true;
      extraPayload.moved_to_review = true;
      extraPayload.moved_to_review_at = new Date().toISOString();
    }

    const res = await updateApplicationStatus(currentApp.application_id, targetStatus, reason, adminEmail, currentApp, extraPayload);
    if (res.updatedApp) {
      setLocalAppOverride(res.updatedApp);
      if (onApplicationUpdated) {
        onApplicationUpdated(res.updatedApp);
      }
      setHistory(getStatusHistory(currentApp.application_id));
      if (decisionType === 'Review' || targetStatus === 'Under Review') {
        setDecisionSuccessMsg('Application successfully moved to Document Review queue!');
      } else {
        setDecisionSuccessMsg(`Application status successfully updated to "${targetStatus}"!`);
      }
      setTimeout(() => setDecisionSuccessMsg(null), 4000);
    }
  };

  const handleOpenDocReview = (doc) => {
    setSelectedDoc(doc);
    setDocReviewModalOpen(true);
  };

  const handleUpdateDocStatus = async (docId, newStatus, rejectionReason) => {
    const res = await updateDocumentStatus(currentApp.application_id, docId, newStatus, rejectionReason, adminEmail);
    if (res.updatedApp) {
      onApplicationUpdated(res.updatedApp);
    }
  };

  const docsList = currentApp.documents || [
    { id: 'doc_1', doc_type: 'Marksheets / Transcripts', file_name: 'Consolidated_Transcripts.pdf', status: 'Pending', file_size: '2.4 MB' },
    { id: 'doc_2', doc_type: 'Degree / Provisional Certificate', file_name: 'Degree_Certificate.pdf', status: 'Pending', file_size: '1.2 MB' },
    { id: 'doc_3', doc_type: 'Photo ID Proof', file_name: 'Government_Photo_ID.pdf', status: 'Pending', file_size: '800 KB' }
  ];

  return (
    <>
      <div className="admin-modal-backdrop" onClick={onClose}>
        <div className="admin-modal-box app-detail-modal" onClick={e => e.stopPropagation()}>
          
          {/* Modal Header */}
          <div className="detail-modal-header">
            <div className="detail-header-left">
              <div className="detail-title-row">
                <h2>{currentApp.full_name}</h2>
                {currentApp.isMock && <TestDataBadge />}
                <StatusBadge status={currentApp.status} type="application" />
                <StatusBadge status={currentApp.document_status} type="document" />
              </div>
              <div className="detail-meta-row">
                <span className="meta-item">
                  <strong>Application ID:</strong> <code>{currentApp.application_id}</code>
                </span>
                <span className="meta-sep">•</span>
                <span className="meta-item">
                  <MailIcon size={14} />
                  <a href={`mailto:${currentApp.email}`} className="email-link">{currentApp.email}</a>
                </span>
                <span className="meta-sep">•</span>
                <span className="meta-item">
                  <ClockIcon size={14} />
                  <span>Submitted: {new Date(currentApp.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
              </div>
            </div>

            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <XIcon size={22} />
            </button>
          </div>

          {/* Decision Success Message Banner */}
          {decisionSuccessMsg && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0.75rem 1.25rem 0'
            }}>
              <CheckCircleIcon size={18} />
              <span>{decisionSuccessMsg}</span>
            </div>
          )}

          {/* Smart Admissions Evaluation Advisory Banner */}
          {(() => {
            const hasGreScore = Boolean(currentApp.gre_score && currentApp.gre_score !== 'N/A' && currentApp.gre_score !== '—');
            const hasGateScore = Boolean(currentApp.gate_score && currentApp.gate_score !== 'N/A' && currentApp.gate_score !== '—');
            const examStatus = currentApp.entrance_exam_status || 'Neither';
            const hasEntranceScore = hasGreScore || hasGateScore || ['GRE', 'GATE', 'Both'].includes(examStatus);
            const docsVerified = currentApp.document_status === 'Verified' || currentApp.document_status === 'Partially Verified';
            const isInterviewReady = hasEntranceScore && docsVerified;
            const isPgeeCandidate = !hasEntranceScore;

            return (
              <>
                <div style={{
                  margin: '0.85rem 1.25rem 0',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  background: isInterviewReady ? '#eff6ff' : (isPgeeCandidate ? '#fffbeb' : '#f8fafc'),
                  border: `1px solid ${isInterviewReady ? '#bfdbfe' : (isPgeeCandidate ? '#fde68a' : '#e2e8f0')}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{isInterviewReady ? '🎙️' : (isPgeeCandidate ? '📝' : '🔍')}</span>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: isInterviewReady ? '#1e40af' : (isPgeeCandidate ? '#92400e' : '#334155'), display: 'block' }}>
                        {isInterviewReady && 'Recommended Action: Move to Interview Round'}
                        {isPgeeCandidate && 'Recommended Action: Assign MSIT PGEE Entrance Exam'}
                        {!isInterviewReady && !isPgeeCandidate && 'Admissions Status & Evaluation Queue'}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: isInterviewReady ? '#3b82f6' : (isPgeeCandidate ? '#b45309' : '#64748b') }}>
                        {isInterviewReady && `Candidate holds verified ${hasGateScore ? 'GATE' : (hasGreScore ? 'GRE' : 'entrance')} score and verified documents.`}
                        {isPgeeCandidate && 'Neither GRE nor GATE score submitted — candidate must qualify via MSIT PGEE entrance exam.'}
                        {!isInterviewReady && !isPgeeCandidate && 'Review candidate documents and academic records before scheduling evaluation.'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', background: '#fff', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      Entrance: {currentApp.entrance_exam_status || 'Neither'}
                    </span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: docsVerified ? '#047857' : '#b45309', background: docsVerified ? '#ecfdf5' : '#fffbeb', padding: '0.2rem 0.55rem', borderRadius: '4px', border: `1px solid ${docsVerified ? '#a7f3d0' : '#fde68a'}` }}>
                      Docs: {currentApp.document_status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Quick Decision Action Bar */}
                <div className="detail-decision-bar">
                  <div className="decision-bar-label">
                    <span>Decision Actions:</span>
                  </div>
                  <div className="decision-bar-btns" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    
                    {/* Move to Interview button (Recommended when GRE/GATE present and docs verified) */}
                    <button
                      type="button"
                      className={`btn btn-sm ${isInterviewReady ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleOpenDecision('Interview')}
                      style={
                        ['Interview Scheduled', 'Shortlisted for Interview'].includes(currentApp.status)
                          ? { background: '#2563eb', color: '#fff', borderColor: '#2563eb', fontWeight: '700' }
                          : (isInterviewReady ? { background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8', fontWeight: '700', boxShadow: '0 0 0 2px rgba(37,99,235,0.25)' } : {})
                      }
                    >
                      🎙️ {['Interview Scheduled', 'Shortlisted for Interview'].includes(currentApp.status) ? 'Interview Scheduled ✓' : (isInterviewReady ? 'Move to Interview (Recommended)' : 'Move to Interview')}
                    </button>

                    {/* Schedule MSIT PGEE Exam button (Recommended when neither GRE nor GATE present) */}
                    <button
                      type="button"
                      className={`btn btn-sm ${isPgeeCandidate ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleOpenDecision('PGEE')}
                      style={
                        ['Scheduled for MSIT PGEE Exam', 'MSIT PGEE Exam Required'].includes(currentApp.status)
                          ? { background: '#d97706', color: '#fff', borderColor: '#d97706', fontWeight: '700' }
                          : (isPgeeCandidate ? { background: '#d97706', color: '#fff', borderColor: '#d97706', fontWeight: '700', boxShadow: '0 0 0 2px rgba(217,119,6,0.25)' } : {})
                      }
                    >
                      📝 {['Scheduled for MSIT PGEE Exam', 'MSIT PGEE Exam Required'].includes(currentApp.status) ? 'PGEE Scheduled ✓' : (isPgeeCandidate ? 'Schedule PGEE Exam (Recommended)' : 'Schedule PGEE Exam')}
                    </button>

                    {/* Accept Application (Final Offer) */}
                    <button
                      type="button"
                      className="btn btn-sm btn-primary-accent"
                      onClick={() => handleOpenDecision('Accept')}
                      disabled={currentApp.status === 'Accepted'}
                      style={currentApp.status === 'Accepted' ? { background: '#10b981', color: '#fff', borderColor: '#10b981', opacity: 0.95 } : { background: '#059669', color: '#fff', borderColor: '#059669' }}
                    >
                      {currentApp.status === 'Accepted' ? '✓ Accepted (Offer Issued)' : 'Grant Final Offer'}
                    </button>

                    {/* Move to Review */}
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenDecision('Review')}
                      disabled={isApplicationInDocumentReview(currentApp)}
                      title={isApplicationInDocumentReview(currentApp) ? 'Application is already in Document Review queue' : 'Click to send this application to Document Review queue'}
                    >
                      {isApplicationInDocumentReview(currentApp) ? '✓ In Review' : 'Move to Review'}
                    </button>

                    {/* Request Updates */}
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenDecision('ActionRequired')}
                      disabled={currentApp.status === 'Additional Information Required'}
                      style={{ background: '#fff7ed', color: '#9a3412', borderColor: '#fed7aa', fontWeight: '600' }}
                    >
                      Request Updates
                    </button>

                    {/* Decline Application */}
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleOpenDecision('Decline')}
                      disabled={currentApp.status === 'Declined'}
                      style={currentApp.status === 'Declined' ? { background: '#ef4444', color: '#fff', borderColor: '#ef4444', opacity: 0.95 } : {}}
                    >
                      {currentApp.status === 'Declined' ? '✕ Declined' : 'Decline Application'}
                    </button>

                  </div>
                </div>
              </>
            );
          })()}

          {/* Nav Tabs within Modal */}
          <div className="detail-modal-tabs">
            <button
              type="button"
              className={`detail-tab-btn ${activeSection === 'details' ? 'active' : ''}`}
              onClick={() => setActiveSection('details')}
            >
              Candidate Profile & Academics
            </button>
            <button
              type="button"
              className={`detail-tab-btn ${activeSection === 'workflow' ? 'active' : ''}`}
              onClick={() => setActiveSection('workflow')}
            >
              Admission Workflow & Evaluation
            </button>
            <button
              type="button"
              className={`detail-tab-btn ${activeSection === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveSection('documents')}
            >
              Document Verification ({docsList.length})
            </button>
            <button
              type="button"
              className={`detail-tab-btn ${activeSection === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveSection('notes')}
            >
              Internal Notes ({notes.length})
            </button>
            <button
              type="button"
              className={`detail-tab-btn ${activeSection === 'history' ? 'active' : ''}`}
              onClick={() => setActiveSection('history')}
            >
              Audit History
            </button>
          </div>

          {/* Modal Body with Tab Views */}
          <div className="detail-modal-body">
            
            {/* TAB 1: DETAILS */}
            {activeSection === 'details' && (
              <div className="detail-tab-content">
                
                {/* Decision alert if already accepted/declined */}
                {currentApp.decision_reason && (
                  <div className={`decision-summary-card ${currentApp.status === 'Accepted' ? 'accepted' : 'declined'}`}>
                    <div className="summary-card-header">
                      <strong>Committee Decision ({currentApp.status}):</strong>
                      <span>By {currentApp.decided_by || 'Admissions Team'} on {currentApp.decided_at ? new Date(currentApp.decided_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <p className="summary-reason-text">
                      {currentApp.decision_reason
                        ?.replace(/faculty\s*(interview)?\s*round/gi, 'one on one discussion')
                        ?.replace(/faculty interview/gi, 'one on one discussion')
                        ?.replace(/one[- ]on[- ]one interview/gi, 'one on one discussion')}
                    </p>
                  </div>
                )}

                {/* Candidate Edit Toolbar */}
                <div className="candidate-edit-toolbar">
                  <div className="toolbar-title">
                    <UserIcon size={18} />
                    <span>Candidate Profile &amp; Verified Academics</span>
                    {saveSuccessMsg && (
                      <span className="badge badge-success" style={{ marginLeft: '0.75rem', fontSize: '0.75rem' }}>
                        <CheckCircleIcon size={13} /> {saveSuccessMsg}
                      </span>
                    )}
                  </div>
                  <div className="toolbar-actions">
                    {!isEditing ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setIsEditing(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}
                      >
                        <EditIcon size={14} />
                        <span>Edit Candidate Details</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setIsEditing(false)}
                          disabled={isSavingDetails}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary-accent"
                          onClick={handleSaveDetails}
                          disabled={isSavingDetails}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}
                        >
                          {isSavingDetails ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 1: Personal & Contact */}
                <div className="applicant-info-card">
                  <h4 className="info-card-title">
                    <UserIcon size={18} />
                    <span>1. Personal &amp; Contact Information</span>
                  </h4>
                  {isEditing ? (
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Full Name:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.full_name}
                          onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))}
                          placeholder="Candidate Full Name"
                        />
                      </div>
                      <div className="info-item">
                        <span className="label">Mail ID:</span>
                        <span className="value" style={{ paddingTop: '0.45rem' }}>{currentApp.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Mobile Phone:</span>
                        <input
                          type="tel"
                          className="edit-input"
                          value={editForm.phone}
                          onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                          placeholder="e.g. 9133258030"
                        />
                      </div>
                      <div className="info-item">
                        <span className="label">Date of Birth:</span>
                        <input
                          type="date"
                          className="edit-input"
                          value={editForm.dob}
                          onChange={e => setEditForm(p => ({ ...p, dob: e.target.value }))}
                        />
                      </div>
                      <div className="info-item full">
                        <span className="label">Residential Address:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.address}
                          onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                          placeholder="Street, Landmark, City, State, PIN"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Full Name:</span>
                        <strong className="value">{currentApp.full_name}</strong>
                      </div>
                      <div className="info-item">
                        <span className="label">Mail ID:</span>
                        <span className="value">{currentApp.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Mobile Phone:</span>
                        <span className="value">{currentApp.phone || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Date of Birth:</span>
                        <span className="value font-medium">{formatDob(currentApp.dob || currentApp.date_of_birth)}</span>
                      </div>
                      <div className="info-item full">
                        <span className="label">Residential Address:</span>
                        <span className="value">{currentApp.address || currentApp.residential_address || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Parent / Guardian Information */}
                <div className="applicant-info-card">
                  <h4 className="info-card-title">
                    <UsersIcon size={18} />
                    <span>2. Emergency Contact Number</span>
                  </h4>
                  {isEditing ? (
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Contact Name:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.parent_name}
                          onChange={e => setEditForm(p => ({ ...p, parent_name: e.target.value }))}
                          placeholder="Contact Name"
                        />
                      </div>
                      <div className="info-item">
                        <span className="label">Relationship:</span>
                        <select
                          className="edit-input"
                          value={editForm.parent_relationship}
                          onChange={e => setEditForm(p => ({ ...p, parent_relationship: e.target.value }))}
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="info-item">
                        <span className="label">Contact Number:</span>
                        <input
                          type="tel"
                          className="edit-input"
                          value={editForm.alt_phone}
                          onChange={e => setEditForm(p => ({ ...p, alt_phone: e.target.value }))}
                          placeholder="Contact Number"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Contact Name:</span>
                        <span className="value font-medium">{currentApp.parent_name || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Relationship:</span>
                        <span className="value font-medium">{currentApp.parent_relationship || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Contact Number:</span>
                        <span className="value font-medium">{currentApp.alt_phone || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Academic Qualifications */}
                <div className="applicant-info-card">
                  <h4 className="info-card-title">
                    <GraduationCapIcon size={18} />
                    <span>3. Academic Qualifications</span>
                  </h4>
                  {isEditing ? (
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Class 10 / SSC Score:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.class10_score}
                          onChange={e => setEditForm(p => ({ ...p, class10_score: e.target.value }))}
                          placeholder="e.g. 85% or 8.5 CGPA"
                        />
                      </div>
                      <div className="info-item">
                        <span className="label">Class 12 / Intermediate Score:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.inter_score}
                          onChange={e => setEditForm(p => ({ ...p, inter_score: e.target.value }))}
                          placeholder="e.g. 85% or 8.5 CGPA"
                        />
                      </div>
                      <div className="info-item">
                        <span className="label">Qualifying Degree:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.ug_degree}
                          onChange={e => setEditForm(p => ({ ...p, ug_degree: e.target.value }))}
                          placeholder="e.g. B.Tech / B.E."
                        />
                      </div>
                      <div className="info-item">
                        <span className="label">University / Institution:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.university}
                          onChange={e => setEditForm(p => ({ ...p, university: e.target.value }))}
                          placeholder="e.g. BTEC, CMR / Osmania University"
                        />
                      </div>
                      <div className="info-item">
                        <span className="label">Department / Branch:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.department}
                          onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                          placeholder="e.g. Computer Science & Engineering (CSE)"
                        />
                      </div>
                      <div className="info-item">
                        <span className="label">Graduation Year:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.passing_year}
                          onChange={e => setEditForm(p => ({ ...p, passing_year: e.target.value }))}
                          placeholder="e.g. 2026"
                        />
                      </div>
                      <div className="info-item">
                        <span className="label">Degree Aggregate Score:</span>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.cgpa}
                          onChange={e => setEditForm(p => ({ ...p, cgpa: e.target.value }))}
                          placeholder="e.g. 7.5 or 75%"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Class 10 / SSC:</span>
                        <div className="score-cert-row">
                          <span className="value font-medium">
                            {currentApp.class10_score
                              ? `${currentApp.class10_score} (${currentApp.class10_score_type || 'Percentage'})`
                              : 'N/A'}
                          </span>
                          <button
                            type="button"
                            className="acad-cert-btn"
                            title="View Class 10 / SSC Certificate"
                            onClick={() => handleOpenCertificate('10th')}
                          >
                            <FileTextIcon size={12} />
                            <span>View Certificate</span>
                          </button>
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="label">Class 12 / Intermediate:</span>
                        <div className="score-cert-row">
                          <span className="value font-medium">
                            {currentApp.inter_score
                              ? `${currentApp.inter_score} (${currentApp.inter_score_type || 'Percentage'}) [${currentApp.inter_pathway || 'Class 12'}]`
                              : 'N/A'}
                          </span>
                          <button
                            type="button"
                            className="acad-cert-btn"
                            title="View Class 12 / Intermediate Certificate"
                            onClick={() => handleOpenCertificate('12th')}
                          >
                            <FileTextIcon size={12} />
                            <span>View Certificate</span>
                          </button>
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="label">Qualifying Degree:</span>
                        <strong className="value">{currentApp.ug_degree || 'B.Tech / B.E.'}</strong>
                      </div>
                      <div className="info-item">
                        <span className="label">University / Institution:</span>
                        <span className="value font-medium">{currentApp.university || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Branch / Specialization:</span>
                        <span className="value">
                          {currentApp.branch || currentApp.department || 'N/A'}
                          {currentApp.specialization ? ` (${currentApp.specialization})` : ''}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Graduation Year:</span>
                        <span className="value">{currentApp.passing_year || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Degree Aggregate Score:</span>
                        <div className="score-cert-row">
                          <strong className="value text-primary">
                            {currentApp.cgpa || 'N/A'} {currentApp.grading_scale ? `(${currentApp.grading_scale})` : ''}
                          </strong>
                          <button
                            type="button"
                            className="acad-cert-btn"
                            title="View B.Tech Certificate"
                            onClick={() => handleOpenCertificate('btech')}
                          >
                            <FileTextIcon size={12} />
                            <span>View Certificate</span>
                          </button>
                        </div>
                      </div>
                      {currentApp.score_eligibility_note && (
                        <div className="info-item full" style={{ background: '#fffbeb', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #fde68a' }}>
                          <span className="label" style={{ color: '#92400e' }}>Eligibility Threshold Advisory:</span>
                          <span className="value" style={{ color: '#92400e', fontSize: '0.85rem' }}>{currentApp.score_eligibility_note}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 4: Work Experience */}
                <div className="applicant-info-card">
                  <h4 className="info-card-title">
                    <BriefcaseIcon size={18} />
                    <span>4. Work Experience</span>
                  </h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Experience Status:</span>
                      <strong className="value">{currentApp.has_experience === 'Yes' ? 'Experienced' : 'Fresher'}</strong>
                    </div>
                    {currentApp.has_experience === 'Yes' && (
                      <>
                        <div className="info-item">
                          <span className="label">Duration:</span>
                          <span className="value">{currentApp.experience_years || '0'} Years, {currentApp.experience_months || '0'} Months</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Company Name:</span>
                          <span className="value">{currentApp.company_name || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Job Title / Role:</span>
                          <span className="value">{currentApp.job_role || 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section 5: Statement of Purpose */}
                {(currentApp.statement_text || currentApp.purpose_to_join) && (
                  <div className="applicant-info-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 className="info-card-title" style={{ margin: 0 }}>
                        <BookOpenIcon size={18} />
                        <span>5. Statement of Purpose</span>
                      </h4>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0b2a6b', background: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {currentApp.statement_word_count || (currentApp.statement_text ? currentApp.statement_text.trim().split(/\s+/).length : 0)} / 300 words
                      </span>
                    </div>
                    <p className="sop-text" style={{ fontStyle: 'italic', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', margin: 0 }}>
                      "{currentApp.statement_text || currentApp.purpose_to_join}"
                    </p>
                  </div>
                )}

                {/* Section 6: Referral Source */}
                {currentApp.referral_source && (
                  <div className="applicant-info-card">
                    <h4 className="info-card-title">
                      <UsersIcon size={18} />
                      <span>6. How Candidate Heard About MSIT</span>
                    </h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Source:</span>
                        <strong className="value">{currentApp.referral_source}</strong>
                      </div>
                      {currentApp.referral_explanation && (
                        <div className="info-item">
                          <span className="label">Specification:</span>
                          <span className="value">{currentApp.referral_explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section 7: Entrance Examination Details & CV */}
                <div className="applicant-info-card">
                  <h4 className="info-card-title">
                    <AwardIcon size={18} />
                    <span>7. Entrance Examination Details &amp; CV</span>
                  </h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Entrance Exam Status:</span>
                      <strong className="value">{currentApp.entrance_exam_status || 'Neither'}</strong>
                    </div>
                    {currentApp.gre_score && (
                      <div className="info-item">
                        <span className="label">GRE Score (GR):</span>
                        <div className="score-cert-row">
                          <span className="value font-medium">{currentApp.gre_score} {currentApp.gre_year ? `(${currentApp.gre_year})` : ''}</span>
                          <button
                            type="button"
                            className="acad-cert-btn"
                            title="View GRE Scorecard"
                            onClick={() => handleOpenCertificate('gr')}
                          >
                            <FileTextIcon size={12} />
                            <span>View Certificate</span>
                          </button>
                        </div>
                      </div>
                    )}
                    {currentApp.gate_score && (
                      <div className="info-item">
                        <span className="label">GATE Score:</span>
                        <div className="score-cert-row">
                          <span className="value font-medium">{currentApp.gate_score} {currentApp.gate_year ? `(${currentApp.gate_year})` : ''}</span>
                          <button
                            type="button"
                            className="acad-cert-btn"
                            title="View GATE Scorecard"
                            onClick={() => handleOpenCertificate('gr')}
                          >
                            <FileTextIcon size={12} />
                            <span>View Certificate</span>
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="info-item full">
                      <span className="label">Curriculum Vitae (CV) / Resume:</span>
                      <span className="value">
                        {currentApp.cv_url ? (
                          <a
                            href={currentApp.cv_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}
                          >
                            <DownloadIcon size={14} />
                            <span>Download CV ({currentApp.cv_filename || 'Candidate_CV.pdf'})</span>
                          </a>
                        ) : (
                          currentApp.cv_filename || 'Uploaded with application'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: DOCUMENTS */}
            {activeSection === 'documents' && (
              <div className="detail-tab-content">
                <div className="doc-review-guidance">
                  <p>
                    Review each candidate document below. Admins can mark documents as <strong>Accepted / Verified</strong> or <strong>Rejected</strong> with a mandatory reason note.
                  </p>
                  <span className="doc-note-pill">
                    Note: Submitted documents are never permanently deleted as part of the review workflow.
                  </span>
                </div>

                <div className="docs-table-wrapper">
                  <table className="admin-table docs-table">
                    <thead>
                      <tr>
                        <th>Document Type</th>
                        <th>File Name</th>
                        <th>Size</th>
                        <th>Status</th>
                        <th>Rejection Comment</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docsList.map((doc) => (
                        <tr key={doc.id}>
                          <td><strong>{doc.doc_type}</strong></td>
                          <td className="code-font">{doc.file_name}</td>
                          <td>{doc.file_size || '1.2 MB'}</td>
                          <td>
                            <StatusBadge status={doc.status} type="document" />
                          </td>
                          <td className="rejection-col">
                            {doc.rejection_reason ? (
                              <span className="rejection-text">{doc.rejection_reason}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenDocReview(doc)}
                              >
                                Review / Update
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.25rem 0.65rem', fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', borderRadius: '4px' }}
                                onClick={() => handleOpenCertificate(doc.id || doc.doc_type || 'btech')}
                                title="View uploaded candidate document directly"
                              >
                                View File
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: WORKFLOW & EVALUATION */}
            {activeSection === 'workflow' && (
              <div className="detail-tab-content">
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#0f172a' }}>
                    Candidate Evaluation Pathway &amp; Progress
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                    Evaluation Mode: <strong>{currentApp.entrance_exam_status || 'Neither'}</strong>
                    {currentApp.gre_score ? ` · GRE Score: ${currentApp.gre_score}` : ''}
                    {currentApp.gate_score ? ` · GATE Score: ${currentApp.gate_score}` : ''}
                    {(currentApp.entrance_exam_status === 'GRE' || currentApp.entrance_exam_status === 'GATE' || currentApp.entrance_exam_status === 'Both')
                      ? ' — Qualifies via GATE/GRE Pathway (MSIT PGEE Exam Exempt)'
                      : ' — Qualifies via MSIT PGEE Examination Pathway'}
                  </p>
                </div>

                <form onSubmit={handleSaveWorkflow} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Section A: MSIT PGEE Examination */}
                  <div className="applicant-info-card">
                    <h4 className="info-card-title">
                      <span>1. MSIT PGEE Examination Evaluation (For Non-GATE/GRE Candidates)</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Examination Venue</label>
                        <div style={{ padding: '0.55rem 0.75rem', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', border: '1px solid #e2e8f0' }}>
                          IIITH Nilgiri
                        </div>
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>MSIT PGEE Exam Status</label>
                        <select 
                          className="form-control"
                          value={workflowGatStatus}
                          onChange={e => setWorkflowGatStatus(e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Exempt">Exempt (GATE/GRE)</option>
                        </select>
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>MSIT PGEE Exam Date</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="e.g. Dec 15, 2026"
                          value={workflowGatDate}
                          onChange={e => setWorkflowGatDate(e.target.value)}
                        />
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Examination Venue</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="e.g. IIITH Nilgiri"
                          value={workflowGatLocation}
                          onChange={e => setWorkflowGatLocation(e.target.value)}
                        />
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>MSIT PGEE Score</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="e.g. 82 / 100"
                          value={workflowGatScore}
                          onChange={e => setWorkflowGatScore(e.target.value)}
                        />
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>MSIT PGEE Result</label>
                        <select 
                          className="form-control"
                          value={workflowGatResult}
                          onChange={e => setWorkflowGatResult(e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Not Qualified">Not Qualified</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Technical Interview & Counselling */}
                  <div className="applicant-info-card">
                    <h4 className="info-card-title">
                      <span>2. Technical Interview &amp; Counselling Scheduling</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Interview Venue</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="e.g. IIITH Nilgiri"
                          value={workflowInterviewLocation}
                          onChange={e => setWorkflowInterviewLocation(e.target.value)}
                        />
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Interview Status</label>
                        <select 
                          className="form-control"
                          value={workflowInterviewStatus}
                          onChange={e => setWorkflowInterviewStatus(e.target.value)}
                        >
                          <option value="Pending">Pending Scheduling</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Interview Scheduled Date</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="e.g. Dec 22, 2026"
                          value={workflowInterviewDate}
                          onChange={e => setWorkflowInterviewDate(e.target.value)}
                        />
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Interview Scheduled Time</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="e.g. 10:30 AM IST"
                          value={workflowInterviewTime}
                          onChange={e => setWorkflowInterviewTime(e.target.value)}
                        />
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Interview Outcome</label>
                        <select 
                          className="form-control"
                          value={workflowInterviewOutcome}
                          onChange={e => setWorkflowInterviewOutcome(e.target.value)}
                        >
                          <option value="Pending">Pending Evaluation</option>
                          <option value="Cleared">Cleared / Recommended</option>
                          <option value="Not Cleared">Not Cleared</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section C: Final Decision & Onboarding */}
                  <div className="applicant-info-card">
                    <h4 className="info-card-title">
                      <span>3. Batch Onboarding Details</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Onboarding Status</label>
                        <select 
                          className="form-control"
                          value={workflowOnboardingStatus}
                          onChange={e => setWorkflowOnboardingStatus(e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed / Onboarded</option>
                        </select>
                      </div>

                      <div className="form-field-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Onboarding Date</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="e.g. January 2, 2027"
                          value={workflowOnboardingDate}
                          onChange={e => setWorkflowOnboardingDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {workflowSaveMessage && (
                    <div style={{ padding: '0.6rem 0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#065f46', fontSize: '0.85rem' }}>
                      {workflowSaveMessage}
                    </div>
                  )}

                  <div>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm"
                      disabled={isSavingWorkflow}
                    >
                      {isSavingWorkflow ? 'Saving Workflow...' : 'Save Workflow & Sync to Student'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: INTERNAL NOTES */}
            {activeSection === 'notes' && (
              <div className="detail-tab-content">
                <div className="internal-notes-banner">
                  <span className="private-badge">Internal Committee Only</span>
                  <p>Internal notes are only visible to authorized administrators and will never be shown to the candidate.</p>
                </div>

                {/* Add note form */}
                <form onSubmit={handleAddNote} className="add-note-form">
                  <div className="form-field-group">
                    <label htmlFor="newNote">Add Internal Admin Note</label>
                    <textarea
                      id="newNote"
                      rows={3}
                      className="form-textarea-control"
                      placeholder="Enter internal evaluation comments, phone screening notes, interview impressions..."
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                    />
                  </div>
                  <div className="note-submit-row">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={isAddingNote || !newNoteText.trim()}
                    >
                      {isAddingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </div>
                </form>

                {/* Notes Stream */}
                <div className="notes-stream">
                  {notes.length === 0 ? (
                    <div className="empty-notes-box">
                      <p>No internal notes recorded yet for this applicant.</p>
                    </div>
                  ) : (
                    notes.map(n => (
                      <div key={n.id} className="admin-note-item">
                        <div className="note-header">
                          <strong className="note-author">{n.admin_email}</strong>
                          <span className="note-time">
                            {new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="note-body">{n.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: AUDIT HISTORY */}
            {activeSection === 'history' && (
              <div className="detail-tab-content">
                <div className="history-timeline">
                  {history.length === 0 ? (
                    <div className="empty-history-box">
                      <p>No status changes recorded yet for this application.</p>
                    </div>
                  ) : (
                    history.map(item => (
                      <div key={item.id} className="timeline-entry">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-title-row">
                            <span className="timeline-status-change">
                              {item.previous_status ? (
                                <>
                                  <span className="prev-st">{item.previous_status}</span>
                                  <span className="arrow">→</span>
                                </>
                              ) : null}
                              <StatusBadge status={item.new_status} type="application" />
                            </span>
                            <span className="timeline-time">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="timeline-meta">
                            Updated by: <strong>{item.changed_by}</strong>
                          </p>
                          {item.reason && (
                            <p className="timeline-reason">
                              Reason / Note: {item.reason
                                ?.replace(/faculty\s*(interview)?\s*round/gi, 'one on one discussion')
                                ?.replace(/faculty interview/gi, 'one on one discussion')
                                ?.replace(/one[- ]on[- ]one interview/gi, 'one on one discussion')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="detail-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close Window
            </button>
          </div>

        </div>
      </div>

      {/* Decision Confirmation Modal */}
      <ConfirmDecisionModal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        onConfirm={handleExecuteDecision}
        decisionType={decisionType}
        applicantName={currentApp.full_name}
        applicationId={currentApp.application_id}
        applicationData={currentApp}
      />

      {/* Document Review Modal */}
      <DocumentReviewModal
        isOpen={docReviewModalOpen}
        onClose={() => setDocReviewModalOpen(false)}
        document={selectedDoc}
        applicantName={currentApp.full_name}
        applicationId={currentApp.application_id}
        onUpdateStatus={handleUpdateDocStatus}
      />

      {/* Certificate & Document Viewer Modal */}
      <CertificateModal
        isOpen={viewingDocModal.isOpen}
        onClose={() => setViewingDocModal({ isOpen: false, initialDocType: 'btech' })}
        application={currentApp}
        initialDocType={viewingDocModal.initialDocType}
      />
    </>
  );
}
