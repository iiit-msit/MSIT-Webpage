import React, { useState } from 'react';
import { XIcon, CheckCircleIcon, DownloadIcon, ExternalLinkIcon } from '../Icons';
import { StatusBadge } from './StatusBadge';
import { openDocumentInNewTab, getDocumentFromIndexedDB, generateOfficialPdfDataUrl } from '../../utils/documentStore';

export default function DocumentReviewModal({
  isOpen,
  onClose,
  document,
  applicantName,
  applicationId,
  onUpdateStatus
}) {
  const [actionType, setActionType] = useState(null); // 'Verified' | 'Rejected' | null
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !document) return null;

  const handleSave = async (statusToSet) => {
    if (statusToSet === 'Rejected' && !rejectionReason.trim()) {
      setError('A rejection comment / reason is required when rejecting a candidate document.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateStatus(document.id, statusToSet, rejectionReason.trim());
      onClose();
    } catch (err) {
      setError('Failed to update document review status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box doc-review-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3>Document Verification Review</h3>
            <span className="modal-sub">
              Candidate: <strong>{applicantName}</strong> ({applicationId})
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <XIcon size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Document metadata summary */}
          <div className="doc-preview-card">
            <div className="doc-info-row">
              <span className="doc-prop-label">Document Type:</span>
              <strong className="doc-prop-val">{document.doc_type}</strong>
            </div>
            <div className="doc-info-row">
              <span className="doc-prop-label">File Name:</span>
              <span className="doc-prop-val code-font">{document.file_name}</span>
            </div>
            <div className="doc-info-row">
              <span className="doc-prop-label">File Size:</span>
              <span className="doc-prop-val">{document.file_size || '1.5 MB'}</span>
            </div>
            <div className="doc-info-row">
              <span className="doc-prop-label">Current Status:</span>
              <StatusBadge status={document.status} type="document" />
            </div>

            {document.rejection_reason && (
              <div className="doc-prev-rejection">
                <strong>Current Rejection Note:</strong>
                <p>{document.rejection_reason}</p>
              </div>
            )}

            <div className="doc-action-bar">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  const targetUrl = document.file_url || document.fileUrl || document.dataUrl;
                  if (targetUrl && (targetUrl.startsWith('data:') || targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
                    openDocumentInNewTab(targetUrl, document.file_name);
                    return;
                  }
                  // Check IndexedDB
                  try {
                    const fromDb = await getDocumentFromIndexedDB(`file_${document.id}`);
                    if (fromDb && fromDb.dataUrl) {
                      openDocumentInNewTab(fromDb.dataUrl, document.file_name);
                      return;
                    }
                  } catch (e) {}

                  // Fallback to official PDF document
                  const pdfUrl = generateOfficialPdfDataUrl({
                    docType: document.doc_type || 'Candidate Document',
                    fileName: document.file_name || 'Document.pdf',
                    applicantName,
                    applicationId
                  });
                  openDocumentInNewTab(pdfUrl, document.file_name);
                }}
              >
                <ExternalLinkIcon size={16} />
                <span>Open / View Document</span>
              </button>
            </div>
          </div>

          {/* Review Decision form */}
          <div className="doc-decision-block">
            <h4>Update Verification Status</h4>
            <div className="doc-status-buttons">
              <button
                type="button"
                className={`btn btn-sm ${actionType === 'Verified' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setActionType('Verified');
                  setError('');
                }}
              >
                Mark as Accepted / Verified
              </button>
              <button
                type="button"
                className={`btn btn-sm ${actionType === 'Rejected' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => {
                  setActionType('Rejected');
                  setError('');
                }}
              >
                Mark as Rejected
              </button>
            </div>

            {actionType === 'Rejected' && (
              <div className="form-field-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="docRejectionReason">
                  Rejection Reason / Required Correction <span className="req">*</span>
                </label>
                <textarea
                  id="docRejectionReason"
                  rows={3}
                  className={`form-textarea-control ${error ? 'has-error' : ''}`}
                  placeholder="Explain why this document was rejected (e.g. Scan is illegible, missing official seal, incomplete semesters, etc.)..."
                  value={rejectionReason}
                  onChange={e => {
                    setRejectionReason(e.target.value);
                    if (error) setError('');
                  }}
                />
                {error && <span className="field-err-msg">{error}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Close
          </button>

          {actionType && (
            <button
              type="button"
              className={`btn ${actionType === 'Rejected' ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => handleSave(actionType)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : `Save as ${actionType}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
