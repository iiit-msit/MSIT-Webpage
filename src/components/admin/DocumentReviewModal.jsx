
import React, { useState } from 'react';
import { XIcon, CheckCircleIcon, DownloadIcon, ExternalLinkIcon } from '../Icons';
import { StatusBadge } from './StatusBadge';
import { openDocumentInNewTab, getDocumentFromIndexedDB, dataUrlToBlob } from '../../utils/documentStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function DocumentReviewModal({
  isOpen,
  onClose,
  document,
  applicantName,
  applicationId,
  application,
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
                  let targetUrl = document.file_url || document.fileUrl || document.dataUrl;
                  const storagePath = document.storage_path || document.storagePath;

                  if (storagePath && isSupabaseConfigured() && supabase) {
                    try {
                      const { data: fileBlob } = await supabase.storage
                        .from('application-documents')
                        .download(storagePath);
                      if (fileBlob) {
                        openDocumentInNewTab(URL.createObjectURL(fileBlob), document.file_name);
                        return;
                      }
                      const { data: signedData } = await supabase.storage
                        .from('application-documents')
                        .createSignedUrl(storagePath, 3600);
                      if (signedData?.signedUrl) {
                        openDocumentInNewTab(signedData.signedUrl, document.file_name);
                        return;
                      }
                    } catch (e) {}
                  }

                  if (targetUrl && (targetUrl.startsWith('data:') || targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('/'))) {
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

                  // Discover files from Supabase Storage by listing applicant's storage folders
                  if (isSupabaseConfigured() && supabase) {
                    try {
                      const candidateUserIds = new Set();
                      if (application?.user_id) candidateUserIds.add(application.user_id);
                      if (application?.userId) candidateUserIds.add(application.userId);

                      if (candidateUserIds.size === 0) {
                        const { data: rootItems } = await supabase.storage
                          .from('application-documents')
                          .list('', { limit: 100 });
                        if (Array.isArray(rootItems)) {
                          rootItems.forEach(r => {
                            if (r.name && !r.name.includes('.')) candidateUserIds.add(r.name);
                          });
                        }
                      }

                      let allFiles = [];
                      for (const uid of Array.from(candidateUserIds)) {
                        const { data: subItems } = await supabase.storage
                          .from('application-documents')
                          .list(uid, { limit: 200 });

                        const foldersToCheck = new Set([`${uid}/new`]);
                        if (application?.application_id) foldersToCheck.add(`${uid}/${application.application_id}`);

                        if (subItems && subItems.length > 0) {
                          for (const item of subItems) {
                            const isFolder = !item.name.includes('.') || !item.id || item.id === null;
                            if (!isFolder) {
                              allFiles.push({ path: `${uid}/${item.name}`, name: item.name });
                            } else if (item.name && item.name !== '.emptyFolderPlaceholder') {
                              foldersToCheck.add(`${uid}/${item.name}`);
                            }
                          }
                        }

                        for (const subPath of Array.from(foldersToCheck)) {
                          const { data: files } = await supabase.storage
                            .from('application-documents')
                            .list(subPath, { limit: 200 });
                          if (files) {
                            files.forEach(f => {
                              if (f.name && f.name.includes('.') && f.name !== '.emptyFolderPlaceholder') {
                                allFiles.push({ path: `${subPath}/${f.name}`, name: f.name });
                              }
                            });
                          }
                        }
                      }

                      const docTypeStr = (document.doc_type || document.docType || '').toLowerCase();
                      const matched = allFiles.find(f => {
                        const fn = f.name.toLowerCase();
                        if ((docTypeStr.includes('transcript') || docTypeStr.includes('marksheet') || docTypeStr.includes('b.tech') || docTypeStr.includes('qualifying')) &&
                            (fn.includes('degree_marksheet') || fn.includes('consolidated') || fn.includes('transcript') || fn.includes('btech') || fn.includes('degree_certificate') || fn.includes('provisional'))) return true;
                        if ((docTypeStr.includes('class 10') || docTypeStr.includes('ssc') || docTypeStr.includes('secondary')) && (fn.includes('class_10') || fn.includes('ssc') || fn.includes('10th'))) return true;
                        if ((docTypeStr.includes('class 12') || docTypeStr.includes('inter') || docTypeStr.includes('diploma')) && (fn.includes('intermediate') || fn.includes('class_12') || fn.includes('12th'))) return true;
                        if ((docTypeStr.includes('degree') && (docTypeStr.includes('cert') || docTypeStr.includes('provisional'))) && (fn.includes('degree_certificate') || fn.includes('provisional') || fn.includes('degree_marksheet'))) return true;
                        if ((docTypeStr.includes('cv') || docTypeStr.includes('resume')) && (fn.includes('curriculum_vitae') || fn.includes('cv') || fn.includes('resume'))) return true;
                        if ((docTypeStr.includes('gre') || docTypeStr.includes('gate')) && (fn.includes('gre') || fn.includes('gate') || fn.includes('scorecard'))) return true;
                        return false;
                      });

                      if (matched) {
                        const { data: fileBlob } = await supabase.storage
                          .from('application-documents')
                          .download(matched.path);
                        if (fileBlob && fileBlob.size > 0) {
                          openDocumentInNewTab(URL.createObjectURL(fileBlob), document.file_name);
                          return;
                        }
                        const { data: signedData } = await supabase.storage
                          .from('application-documents')
                          .createSignedUrl(matched.path, 3600);
                        if (signedData?.signedUrl) {
                          openDocumentInNewTab(signedData.signedUrl, document.file_name);
                          return;
                        }
                        const { data: pubData } = supabase.storage
                          .from('application-documents')
                          .getPublicUrl(matched.path);
                        if (pubData?.publicUrl) {
                          openDocumentInNewTab(pubData.publicUrl, document.file_name);
                          return;
                        }
                      }
                    } catch (e) {
                      console.warn('[MSIT] Storage file discovery warning:', e);
                    }
                  }

                  alert('Original document file is not available in database storage.');
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
