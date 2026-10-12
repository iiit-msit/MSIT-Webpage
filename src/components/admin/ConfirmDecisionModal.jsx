import React, { useState, useEffect } from 'react';
import { XIcon, CheckCircleIcon, ShieldCheckIcon } from '../Icons';

export default function ConfirmDecisionModal({
  isOpen,
  onClose,
  onConfirm,
  decisionType, // 'Accept' | 'Decline' | 'Review' | 'Pending' | 'ActionRequired' | 'Interview' | 'PGEE'
  applicantName,
  applicationId,
  applicationData = null
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interview state
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('10:30 AM IST');
  const [interviewMode, setInterviewMode] = useState('In-Person (IIITH Nilgiri)');
  const [interviewLocation, setInterviewLocation] = useState('IIITH Nilgiri');

  // PGEE Exam state
  const [gatDate, setGatDate] = useState('2026-12-15');
  const [gatSlot, setGatSlot] = useState('10:00 AM - 12:00 PM IST (Morning)');
  const [gatMode, setGatMode] = useState('In-Person (IIITH Nilgiri)');
  const [gatLocation, setGatLocation] = useState('IIITH Nilgiri');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setReason('');
      if (applicationData) {
        if (applicationData.interview_date) setInterviewDate(applicationData.interview_date);
        if (applicationData.interview_time) setInterviewTime(applicationData.interview_time);
        if (applicationData.interview_mode) setInterviewMode(applicationData.interview_mode);
        if (applicationData.interview_location) setInterviewLocation(applicationData.interview_location);

        if (applicationData.gat_exam_date) setGatDate(applicationData.gat_exam_date);
        if (applicationData.gat_slot) setGatSlot(applicationData.gat_slot);
        if (applicationData.gat_mode) setGatMode(applicationData.gat_mode);
        if (applicationData.gat_location) setGatLocation(applicationData.gat_location);
      }
    }
  }, [isOpen, applicationData, decisionType]);

  if (!isOpen) return null;

  const isDecline = decisionType === 'Decline';
  const isAccept = decisionType === 'Accept';
  const isActionRequired = decisionType === 'ActionRequired' || decisionType === 'Pending';
  const isInterview = decisionType === 'Interview';
  const isPgee = decisionType === 'PGEE';
  const isReview = decisionType === 'Review';

  const handleConfirm = async () => {
    let finalReason = reason.trim();
    const extraPayload = {};

    if (isDecline) {
      if (!finalReason) {
        setError('Please specify a mandatory reason for declining this application.');
        return;
      }
      extraPayload.status = 'Declined';
    } else if (isActionRequired) {
      if (!finalReason) {
        setError('Please specify the instructions/documents needed from the candidate.');
        return;
      }
      extraPayload.status = 'Additional Information Required';
    } else if (isInterview) {
      if (!interviewDate) {
        setError('Please select an interview date.');
        return;
      }
      const trimmedInterviewLoc = (interviewLocation || '').trim() || 'IIITH Nilgiri';
      if (!finalReason) {
        finalReason = `Shortlisted for in-person one on one discussion on ${interviewDate} at ${interviewTime} at ${trimmedInterviewLoc}.`;
      }
      extraPayload.status = 'Interview Scheduled';
      extraPayload.interview_date = interviewDate;
      extraPayload.interview_time = interviewTime;
      extraPayload.interview_mode = interviewMode || 'In-Person (IIITH Nilgiri)';
      extraPayload.interview_location = trimmedInterviewLoc;
      extraPayload.interview_status = 'Scheduled';
    } else if (isPgee) {
      if (!gatDate) {
        setError('Please specify the MSIT PGEE exam date.');
        return;
      }
      const trimmedGatLoc = (gatLocation || '').trim() || 'IIITH Nilgiri';
      if (!finalReason) {
        finalReason = `Scheduled for MSIT PGEE Entrance Examination on ${gatDate} (${gatSlot}) at ${trimmedGatLoc}.`;
      }
      extraPayload.status = 'Scheduled for MSIT PGEE Exam';
      extraPayload.gat_exam_date = gatDate;
      extraPayload.gat_slot = gatSlot;
      extraPayload.gat_mode = gatMode || 'In-Person (IIITH Nilgiri)';
      extraPayload.gat_location = trimmedGatLoc;
      extraPayload.gat_status = 'Scheduled';
    } else if (isAccept) {
      if (!finalReason) {
        finalReason = 'Offer of Admission approved by Admissions Committee';
      }
      extraPayload.status = 'Accepted';
      extraPayload.admission_offer = 'Issued';
    } else if (isReview) {
      if (!finalReason) {
        finalReason = 'Moved to Document Review queue by Admissions Committee';
      }
      extraPayload.status = 'Under Review';
      extraPayload.in_document_review = true;
      extraPayload.moved_to_review = true;
      extraPayload.moved_to_review_at = new Date().toISOString();
    } else {
      if (!finalReason) {
        finalReason = 'Status moved to Under Review';
      }
      extraPayload.status = 'Under Review';
      extraPayload.in_document_review = true;
      extraPayload.moved_to_review = true;
      extraPayload.moved_to_review_at = new Date().toISOString();
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(finalReason, extraPayload);
      setReason('');
      setError('');
      onClose();
    } catch (err) {
      console.error('Failed to confirm decision:', err);
      setError('Failed to update application decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div 
        className="admin-modal-box confirm-decision-modal" 
        style={{ maxWidth: (isInterview || isPgee) ? '580px' : '520px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3 className={isDecline ? 'text-danger' : isAccept ? 'text-success' : isActionRequired ? 'text-warning' : (isInterview ? 'text-primary' : '')}>
              {isInterview && '🎙️ Move to Interview Round'}
              {isPgee && '📝 Schedule MSIT PGEE Exam'}
              {isAccept && 'Accept Application (Admission Offer)'}
              {isDecline && 'Decline Application'}
              {isReview && '📋 Move Application to Document Review'}
              {isActionRequired && 'Request Additional Information / Documents'}
            </h3>
            <span className="modal-sub">
              Candidate: <strong>{applicantName}</strong> ({applicationId})
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <XIcon size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Pathway A: INTERVIEW */}
          {isInterview && (
            <>
              <div className="decision-notice-box" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem' }}>
                  Candidate Qualified for One-on-One Discussion
                </p>
                <span style={{ fontSize: '0.82rem', color: '#3b82f6', display: 'block', marginTop: '0.25rem' }}>
                  Applicant holds verified entrance scores and documents. Set the interview date and time below for their in-person one on one discussion at IIITH Nilgiri.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-field-group">
                  <label htmlFor="interviewDateInput" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    Interview Date <span className="req">*</span>
                  </label>
                  <input
                    id="interviewDateInput"
                    type="date"
                    className="form-control"
                    value={interviewDate}
                    onChange={e => {
                      setInterviewDate(e.target.value);
                      if (error) setError('');
                    }}
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="interviewTimeSelect" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    Interview Time Slot <span className="req">*</span>
                  </label>
                  <select
                    id="interviewTimeSelect"
                    className="form-control"
                    value={interviewTime}
                    onChange={e => setInterviewTime(e.target.value)}
                  >
                    <option value="10:00 AM IST">10:00 AM IST</option>
                    <option value="10:30 AM IST">10:30 AM IST</option>
                    <option value="11:30 AM IST">11:30 AM IST</option>
                    <option value="02:00 PM IST">02:00 PM IST</option>
                    <option value="03:00 PM IST">03:00 PM IST</option>
                    <option value="04:00 PM IST">04:00 PM IST</option>
                    <option value="05:00 PM IST">05:00 PM IST</option>
                  </select>
                </div>
              </div>

              <div className="form-field-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label htmlFor="interviewLocationInput" style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                    Interview Venue <span className="req">*</span>
                  </label>
                  <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.74rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    🏛️ Discussion Center
                  </span>
                </div>
                <input
                  id="interviewLocationInput"
                  type="text"
                  className="form-control"
                  placeholder="e.g. IIITH Nilgiri"
                  value={interviewLocation}
                  onChange={e => {
                    setInterviewLocation(e.target.value);
                    if (error) setError('');
                  }}
                />
              </div>
            </>
          )}

          {/* Pathway B: PGEE ENTRANCE EXAM */}
          {isPgee && (
            <>
              <div className="decision-notice-box" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem' }}>
                  Assign MSIT Postgraduate Entrance Examination (PGEE)
                </p>
                <span style={{ fontSize: '0.82rem', color: '#b45309', display: 'block', marginTop: '0.25rem' }}>
                  Candidate does not have a GRE or GATE score on file. Assign them to sit for the MSIT PGEE entrance test to qualify for interview.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-field-group">
                  <label htmlFor="gatDateInput" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    PGEE Exam Date <span className="req">*</span>
                  </label>
                  <input
                    id="gatDateInput"
                    type="date"
                    className="form-control"
                    value={gatDate}
                    onChange={e => {
                      setGatDate(e.target.value);
                      if (error) setError('');
                    }}
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="gatSlotSelect" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    Examination Slot <span className="req">*</span>
                  </label>
                  <select
                    id="gatSlotSelect"
                    className="form-control"
                    value={gatSlot}
                    onChange={e => setGatSlot(e.target.value)}
                  >
                    <option value="10:00 AM - 12:00 PM IST (Morning)">10:00 AM - 12:00 PM IST (Morning)</option>
                    <option value="02:00 PM - 04:00 PM IST (Afternoon)">02:00 PM - 04:00 PM IST (Afternoon)</option>
                  </select>
                </div>
              </div>

              <div className="form-field-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label htmlFor="gatLocationInput" style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                    Examination Venue <span className="req">*</span>
                  </label>
                  <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.74rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    🏛️ Exam Center
                  </span>
                </div>
                <input
                  id="gatLocationInput"
                  type="text"
                  className="form-control"
                  placeholder="e.g. IIITH Nilgiri"
                  value={gatLocation}
                  onChange={e => {
                    setGatLocation(e.target.value);
                    if (error) setError('');
                  }}
                />
              </div>
            </>
          )}

          {isAccept && (
            <div className="decision-notice-box notice-success">
              <p>
                Are you sure you want to mark this application as <strong>Accepted</strong>?
              </p>
              <span className="notice-clarification">
                Official offer of admission will be reflected immediately on the candidate portal.
              </span>
            </div>
          )}

          {isDecline && (
            <div className="decision-notice-box notice-danger">
              <p>
                Declining an application requires documenting an official reason for the admissions committee audit log.
              </p>
            </div>
          )}

          {isActionRequired && (
            <div className="decision-notice-box notice-warning" style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#9a3412', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                This status notifies the candidate on their dashboard and enables the <strong>Update Application</strong> button so they can upload revised documents or provide missing information.
              </p>
            </div>
          )}

          {isReview && (
            <div className="decision-notice-box" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#5b21b6', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem' }}>
                Move Candidate to Document Review Queue
              </p>
              <span style={{ fontSize: '0.82rem', color: '#6d28d9', display: 'block', marginTop: '0.25rem' }}>
                This candidate's application will now enter the <strong>Documents Review</strong> queue where transcripts, degree certificates, and identification proof can be inspected and verified.
              </span>
            </div>
          )}

          {(!isAccept && !isDecline && !isActionRequired && !isInterview && !isPgee && !isReview) && (
            <p className="modal-description-text">
              Update status for this candidate to <strong>Under Review</strong>.
            </p>
          )}

          {/* Reason / Comment text area */}
          <div className="form-field-group">
            <label htmlFor="decisionReason">
              {isDecline ? (
                <>Official Decline Reason <span className="req">*</span></>
              ) : isActionRequired ? (
                <>Instructions / Requested Information for Candidate <span className="req">*</span></>
              ) : isInterview ? (
                <>Interview Instructions / Discussion Topics for Candidate (Optional)</>
              ) : isPgee ? (
                <>PGEE Exam Syllabus &amp; Instructions for Candidate (Optional)</>
              ) : (
                <>Internal Note / Committee Remark (Optional)</>
              )}
            </label>
            <textarea
              id="decisionReason"
              rows={3}
              className={`form-textarea-control ${error ? 'has-error' : ''}`}
              placeholder={
                isDecline
                  ? 'Specify why this application is being declined (e.g. Ineligible CGPA, Incomplete transcripts, etc.)...'
                  : isActionRequired
                  ? 'e.g. Please upload a clearer scan of Class 10 marksheet or provide updated degree certificate...'
                  : isInterview
                  ? 'e.g. Technical interaction covering programming logic, data structures, and computational thinking...'
                  : isPgee
                  ? 'e.g. Computer-based test covering Quantitative Aptitude, Logical Reasoning, and Basic Programming...'
                  : 'Add any optional admissions committee comments...'
              }
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (error) setError('');
              }}
            />
            {error && <span className="field-err-msg">{error}</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${
              isDecline 
                ? 'btn-danger' 
                : isActionRequired 
                ? 'btn-primary-accent' 
                : isInterview
                ? 'btn-primary'
                : isPgee
                ? 'btn-primary-accent'
                : 'btn-primary'
            }`}
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={
              isPgee ? { background: '#d97706', borderColor: '#d97706', color: '#fff' } :
              isInterview ? { background: '#1d4ed8', borderColor: '#1d4ed8', color: '#fff' } : {}
            }
          >
            {isSubmitting 
              ? 'Updating...' 
              : isActionRequired 
              ? 'Request Updates' 
              : isInterview
              ? 'Confirm & Schedule Interview'
              : isPgee
              ? 'Confirm & Schedule PGEE Exam'
              : isReview
              ? 'Confirm Move to Review'
              : `Confirm ${decisionType}`}
          </button>
        </div>
      </div>
    </div>
  );
}
