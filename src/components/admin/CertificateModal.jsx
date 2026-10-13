import React, { useState, useEffect, useMemo } from 'react';
import { 
  XIcon, 
  DownloadIcon, 
  ExternalLinkIcon, 
  CheckCircleIcon, 
  AwardIcon, 
  FileTextIcon, 
  GraduationCapIcon, 
  BriefcaseIcon,
  EyeIcon,
  RefreshCwIcon
} from '../Icons';
import { StatusBadge } from './StatusBadge';
import { 
  extractAllApplicationDocuments, 
  getDocumentFromIndexedDB, 
  openDocumentInNewTab, 
  downloadDocument,
  dataUrlToBlob
} from '../../utils/documentStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

/**
 * Direct Document & Certificate Viewer Modal.
 * Replaces synthetic pre-built UI templates with direct viewing of candidate uploaded documents
 * (PDFs rendered natively in iframe viewer, images displayed directly, with tabs for all uploaded files).
 */
export default function CertificateModal({
  isOpen,
  onClose,
  application = null,
  initialDocType = 'btech',
  certificate = null
}) {
  // Normalize candidate application object
  const activeApp = useMemo(() => {
    if (application) return application;
    if (certificate) {
      return {
        full_name: certificate.applicantName || 'Candidate',
        application_id: certificate.applicationId || 'MSIT-APP',
        ug_degree: certificate.title,
        cgpa: certificate.score,
        university: certificate.institution,
        department: certificate.department,
        documents: certificate.documents || [
          {
            id: certificate.type || 'btech',
            doc_type: certificate.title || 'Qualifying Degree Certificate',
            file_name: certificate.fileName || 'BTech_Degree_Certificate.pdf',
            file_url: certificate.fileUrl || '',
            status: 'Verified'
          }
        ]
      };
    }
    return null;
  }, [application, certificate]);

  // Extract all attached documents for this candidate
  const allDocs = useMemo(() => {
    if (!activeApp) return [];
    return extractAllApplicationDocuments(activeApp);
  }, [activeApp]);

  // Determine active document ID
  const [selectedDocId, setSelectedDocId] = useState(() => {
    if (initialDocType) return initialDocType;
    if (certificate?.type) return certificate.type;
    return 'btech';
  });

  // Keep selectedDocId synchronized when modal opens or initialDocType changes
  useEffect(() => {
    if (!isOpen) return;
    const requested = initialDocType || certificate?.type || 'btech';
    // Match requested by id or key
    const match = allDocs.find(d => 
      d.id === requested || 
      d.key === requested || 
      (d.docType && d.docType.toLowerCase().includes(requested.toLowerCase()))
    );
    if (match) {
      setSelectedDocId(match.id);
    } else if (allDocs.length > 0) {
      setSelectedDocId(allDocs[0].id);
    }
  }, [isOpen, initialDocType, certificate, allDocs]);

  // Currently active document
  const activeDoc = useMemo(() => {
    if (!allDocs || allDocs.length === 0) return null;
    return allDocs.find(d => d.id === selectedDocId) || allDocs[0];
  }, [allDocs, selectedDocId]);

  // Asynchronously resolve file URL (checks dataUrl, Supabase Storage, IndexedDB, local files)
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  useEffect(() => {
    if (!isOpen || !activeDoc) {
      setResolvedUrl('');
      return;
    }

    let isCancelled = false;
    let localBlobUrl = null;
    setIsLoadingFile(true);

    async function resolveFileUrl() {
      const cleanFileName = (activeDoc.fileName || '').trim();

      // 1. Check if file is available in /documents/ (e.g. MSIT_Admission_Notification_2026-27.pdf)
      if (cleanFileName === 'MSIT_Admission_Notification_2026-27.pdf' || cleanFileName === 'MSIT_Student_Laptop_Specification_2027_updated.pdf') {
        if (!isCancelled) {
          setResolvedUrl(`/documents/${cleanFileName}`);
          setIsLoadingFile(false);
        }
        return;
      }

      // 2. Direct valid Data URL -> convert to Blob URL for clean browser PDF rendering
      let rawUrl = activeDoc.fileUrl || activeDoc.file_url || activeDoc.dataUrl;
      if (rawUrl && rawUrl.startsWith('data:')) {
        const blob = dataUrlToBlob(rawUrl);
        if (blob) {
          localBlobUrl = URL.createObjectURL(blob);
          if (!isCancelled) {
            setResolvedUrl(localBlobUrl);
            setIsLoadingFile(false);
          }
          return;
        }
      }

      // 3. Local path (e.g. /documents/...)
      if (rawUrl && (rawUrl.startsWith('/') || rawUrl.startsWith('./'))) {
        if (!isCancelled) {
          setResolvedUrl(rawUrl);
          setIsLoadingFile(false);
        }
        return;
      }

      // 4. Identify Supabase Storage path from document or rawUrl
      let storagePath = activeDoc.storagePath || activeDoc.storage_path || '';
      if (!storagePath && typeof rawUrl === 'string' && rawUrl.includes('/application-documents/')) {
        const afterBucket = rawUrl.split('/application-documents/')[1];
        if (afterBucket) {
          storagePath = decodeURIComponent(afterBucket.split('?')[0]);
        }
      }

      // If storagePath / rawUrl is missing, lookup in Supabase application_documents table
      if (!storagePath && !rawUrl && isSupabaseConfigured() && supabase && activeApp) {
        try {
          const appId = activeApp.application_id || activeApp.id;
          const { data: dbDocs, error: dbErr } = await supabase
            .from('application_documents')
            .select('*')
            .or(`application_id.eq.${activeApp.id},application_ref.eq.${appId}`);

          if (!dbErr && Array.isArray(dbDocs) && dbDocs.length > 0) {
            const match = dbDocs.find(d => 
              (d.file_name && activeDoc.fileName && d.file_name.toLowerCase() === activeDoc.fileName.toLowerCase()) ||
              (d.doc_type && activeDoc.docType && d.doc_type.toLowerCase().includes(activeDoc.docType.toLowerCase())) ||
              (d.id && activeDoc.id && String(d.id) === String(activeDoc.id))
            ) || dbDocs[0];

            if (match) {
              if (match.storage_path) storagePath = match.storage_path;
              if (match.file_url) rawUrl = match.file_url;
            }
          }
        } catch (e) {
          console.warn('[MSIT] Supabase document lookup warning:', e);
        }
      }

      // 5. Download original file directly from Supabase Storage using active authenticated session
      if (storagePath && isSupabaseConfigured() && supabase) {
        try {
          // Attempt authenticated Blob download
          const { data: fileBlob, error: dlErr } = await supabase.storage
            .from('application-documents')
            .download(storagePath);

          if (!dlErr && fileBlob) {
            localBlobUrl = URL.createObjectURL(fileBlob);
            if (!isCancelled) {
              setResolvedUrl(localBlobUrl);
              setIsLoadingFile(false);
            }
            return;
          }

          // Fallback: Generate authenticated signed URL from Supabase Storage
          const { data: signedData, error: signErr } = await supabase.storage
            .from('application-documents')
            .createSignedUrl(storagePath, 3600);

          if (!signErr && signedData?.signedUrl) {
            if (!isCancelled) {
              setResolvedUrl(signedData.signedUrl);
              setIsLoadingFile(false);
            }
            return;
          }
        } catch (stErr) {
          console.warn('[MSIT] Supabase Storage download exception:', stErr);
        }
      }

      // 6. Direct HTTP/HTTPS URL
      if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
        // If it's a Supabase storage URL, also try downloading via storage API
        if (rawUrl.includes('/application-documents/') && isSupabaseConfigured() && supabase) {
          const parts = rawUrl.split('/application-documents/');
          if (parts[1]) {
            const extractedPath = decodeURIComponent(parts[1].split('?')[0]);
            try {
              const { data: fileBlob } = await supabase.storage
                .from('application-documents')
                .download(extractedPath);
              if (fileBlob) {
                localBlobUrl = URL.createObjectURL(fileBlob);
                if (!isCancelled) {
                  setResolvedUrl(localBlobUrl);
                  setIsLoadingFile(false);
                }
                return;
              }
              const { data: signedData } = await supabase.storage
                .from('application-documents')
                .createSignedUrl(extractedPath, 3600);
              if (signedData?.signedUrl) {
                if (!isCancelled) {
                  setResolvedUrl(signedData.signedUrl);
                  setIsLoadingFile(false);
                }
                return;
              }
            } catch (e) {}
          }
        }

        if (!isCancelled) {
          setResolvedUrl(rawUrl);
          setIsLoadingFile(false);
        }
        return;
      }

      // 7. Query IndexedDB for candidate file by id, docKey, or fileName
      try {
        const appId = activeApp?.application_id || activeApp?.id || 'app';
        const docKey = activeDoc.key || activeDoc.id;
        const candidates = [
          `file_${activeDoc.id}`,
          `doc_${appId}_${docKey}`,
          `doc_${appId}_${activeDoc.id}`,
          `doc_${appId}_${cleanFileName}`,
          `file_${cleanFileName}`,
          `doc_${appId}_${(activeDoc.docType || '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
        ];

        for (const k of candidates) {
          const fromDb = await getDocumentFromIndexedDB(k);
          if (fromDb && fromDb.dataUrl) {
            const blob = dataUrlToBlob(fromDb.dataUrl);
            if (blob) {
              localBlobUrl = URL.createObjectURL(blob);
              if (!isCancelled) {
                setResolvedUrl(localBlobUrl);
                setIsLoadingFile(false);
              }
              return;
            }
          }
        }
      } catch (e) {
        console.warn('[MSIT] IndexedDB document lookup warning:', e);
      }

      // 8. Discover files from Supabase Storage bucket by listing applicant's user_id folder
      if (isSupabaseConfigured() && supabase && activeApp?.user_id) {
        try {
          const userId = activeApp.user_id;
          // List subfolders/files under this user's storage folder
          const { data: subItems } = await supabase.storage
            .from('application-documents')
            .list(userId, { limit: 200 });

          if (subItems && subItems.length > 0) {
            let allStorageFiles = [];
            for (const item of subItems) {
              if (item.metadata && item.name) {
                // Direct file under userId/
                allStorageFiles.push({ path: `${userId}/${item.name}`, name: item.name });
              } else if (item.name) {
                // Subfolder – list its contents
                const { data: files } = await supabase.storage
                  .from('application-documents')
                  .list(`${userId}/${item.name}`, { limit: 200 });
                if (files) {
                  files.forEach(f => {
                    if (f.name) {
                      allStorageFiles.push({ path: `${userId}/${item.name}/${f.name}`, name: f.name });
                    }
                  });
                }
              }
            }

            // Match storage file to the requested document type
            const docId = (activeDoc.id || '').toLowerCase();
            const docTypeStr = (activeDoc.docType || activeDoc.doc_type || '').toLowerCase();
            const matchedFile = allStorageFiles.find(f => {
              const fn = f.name.toLowerCase();
              // Match by doc ID / type keywords
              if ((docId === 'btech' || docTypeStr.includes('transcript') || docTypeStr.includes('marksheet') || docTypeStr.includes('b.tech') || docTypeStr.includes('b.e.')) &&
                  (fn.includes('degree_marksheet') || fn.includes('consolidated') || fn.includes('transcript') || fn.includes('btech') || fn.includes('b_tech')))
                return true;
              if ((docId === '10th' || docTypeStr.includes('class 10') || docTypeStr.includes('ssc') || docTypeStr.includes('secondary')) &&
                  (fn.includes('class_10') || fn.includes('ssc') || fn.includes('10th')))
                return true;
              if ((docId === '12th' || docTypeStr.includes('class 12') || docTypeStr.includes('inter') || docTypeStr.includes('diploma')) &&
                  (fn.includes('intermediate') || fn.includes('class_12') || fn.includes('12th')))
                return true;
              if ((docId === 'degreecert' || docTypeStr.includes('degree') && (docTypeStr.includes('cert') || docTypeStr.includes('provisional'))) &&
                  (fn.includes('degree_certificate') || fn.includes('provisional')))
                return true;
              if ((docId === 'cv' || docTypeStr.includes('cv') || docTypeStr.includes('resume') || docTypeStr.includes('curriculum')) &&
                  (fn.includes('curriculum_vitae') || fn.includes('cv') || fn.includes('resume')))
                return true;
              if ((docId === 'gr' || docTypeStr.includes('gre') || docTypeStr.includes('gate') || docTypeStr.includes('scorecard')) &&
                  (fn.includes('gre') || fn.includes('gate') || fn.includes('scorecard')))
                return true;
              if ((docId === '16year' || docTypeStr.includes('16')) &&
                  (fn.includes('16_year') || fn.includes('16year')))
                return true;
              return false;
            });

            if (matchedFile) {
              console.log(`[MSIT] Storage discovery: matched "${matchedFile.name}" for doc type "${activeDoc.docType}"`);
              const { data: fileBlob, error: dlErr } = await supabase.storage
                .from('application-documents')
                .download(matchedFile.path);
              if (!dlErr && fileBlob) {
                localBlobUrl = URL.createObjectURL(fileBlob);
                if (!isCancelled) {
                  setResolvedUrl(localBlobUrl);
                  setIsLoadingFile(false);
                }
                return;
              }
              // Try signed URL as fallback
              const { data: signedData } = await supabase.storage
                .from('application-documents')
                .createSignedUrl(matchedFile.path, 3600);
              if (signedData?.signedUrl) {
                if (!isCancelled) {
                  setResolvedUrl(signedData.signedUrl);
                  setIsLoadingFile(false);
                }
                return;
              }
            }
          }
        } catch (e) {
          console.warn('[MSIT] Storage file discovery warning:', e);
        }
      }

      // 9. No file available in DB or storage - DO NOT generate fake text certificates!
      if (!isCancelled) {
        setResolvedUrl('');
        setIsLoadingFile(false);
      }
    }

    resolveFileUrl();

    return () => {
      isCancelled = true;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [isOpen, activeDoc, activeApp]);


  if (!isOpen || !activeApp) return null;

  const applicantName = activeApp.full_name || activeApp.fullName || 'Candidate';
  const applicationId = activeApp.application_id || activeApp.id || 'MSIT-APP';
  const fileName = activeDoc?.fileName || 'Document.pdf';
  const isImage = (fileName.match(/\.(jpeg|jpg|png|webp|gif)$/i) || (resolvedUrl && resolvedUrl.startsWith('data:image/')));

  const handleOpenExternal = () => {
    if (resolvedUrl) {
      openDocumentInNewTab(resolvedUrl, fileName);
    }
  };

  const handleDownload = () => {
    if (resolvedUrl) {
      downloadDocument(resolvedUrl, fileName);
    }
  };

  // Helper icon for document category tabs
  const getDocIcon = (docId) => {
    if (docId === 'btech' || docId === 'degreeCert') return <GraduationCapIcon size={16} />;
    if (docId === 'gr') return <AwardIcon size={16} />;
    if (docId === 'cv') return <BriefcaseIcon size={16} />;
    return <FileTextIcon size={16} />;
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="admin-modal-box cert-viewer-modal" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '960px', 
          width: '94%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '1.1rem 1.5rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div className="modal-title-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ 
                background: '#eff6ff', 
                color: '#1d4ed8', 
                padding: '0.35rem', 
                borderRadius: '8px', 
                display: 'inline-flex' 
              }}>
                <EyeIcon size={20} />
              </span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>
                {activeDoc?.docType || 'Application Document Viewer'}
              </h3>
            </div>
            <span className="modal-sub" style={{ marginTop: '0.25rem', display: 'block', fontSize: '0.82rem', color: '#64748b' }}>
              Candidate: <strong style={{ color: '#0f172a' }}>{applicantName}</strong> • Application ID: <strong style={{ color: '#1d4ed8' }}>{applicationId}</strong>
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Close Viewer">
            <XIcon size={20} />
          </button>
        </div>

        {/* Top All-Documents Switcher Bar */}
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          alignItems: 'center'
        }}>
          <span style={{ 
            fontSize: '0.74rem', 
            fontWeight: 700, 
            color: '#64748b', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginRight: '0.25rem',
            whiteSpace: 'nowrap'
          }}>
            Uploaded Files ({allDocs.length}):
          </span>

          {allDocs.map((doc) => {
            const isSelected = doc.id === activeDoc?.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedDocId(doc.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 600 : 500,
                  border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  background: isSelected ? '#ffffff' : '#f1f5f9',
                  color: isSelected ? '#1d4ed8' : '#334155',
                  boxShadow: isSelected ? '0 2px 4px rgba(37,99,235,0.12)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {getDocIcon(doc.id)}
                <span>{doc.docType.split('(')[0].trim()}</span>
                {doc.status && (
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '10px',
                    background: doc.status === 'Verified' ? '#dcfce7' : '#fef3c7',
                    color: doc.status === 'Verified' ? '#166534' : '#92400e',
                    fontWeight: 600
                  }}>
                    {doc.status}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body: Active Document Action Bar + Direct File Canvas */}
        <div className="modal-body" style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Active Document Details & Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  FILE RECORD
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '4px',
                  background: isImage ? '#fdf2f8' : '#eff6ff',
                  color: isImage ? '#be185d' : '#1d4ed8'
                }}>
                  {isImage ? 'IMAGE' : 'PDF DOCUMENT'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{fileName}</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>• {activeDoc?.fileSize || '1.5 MB'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleOpenExternal}
                disabled={isLoadingFile || !resolvedUrl}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                title="Open uploaded file directly in a new browser tab"
              >
                <ExternalLinkIcon size={15} />
                <span>Open in New Tab</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleDownload}
                disabled={isLoadingFile || !resolvedUrl}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                title="Download original file to your device"
              >
                <DownloadIcon size={15} />
                <span>Download File</span>
              </button>
            </div>
          </div>

          {/* Document Content Canvas (Direct PDF / Image View) */}
          <div style={{
            flex: 1,
            minHeight: '480px',
            background: '#334155',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {isLoadingFile ? (
              <div style={{ textAlign: 'center', color: '#ffffff', padding: '3rem' }}>
                <RefreshCwIcon size={32} className="spinning" />
                <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Loading candidate document...</p>
              </div>
            ) : isImage ? (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                background: '#1e293b'
              }}>
                <img
                  src={resolvedUrl}
                  alt={fileName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '560px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                  }}
                />
              </div>
            ) : resolvedUrl ? (
              <object
                data={resolvedUrl}
                type="application/pdf"
                style={{
                  width: '100%',
                  height: '560px',
                  border: 'none',
                  background: '#525659'
                }}
              >
                <iframe
                  src={resolvedUrl}
                  title={fileName}
                  style={{
                    width: '100%',
                    height: '560px',
                    border: 'none',
                    background: '#525659'
                  }}
                />
              </object>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3.5rem 1.5rem' }}>
                <FileTextIcon size={44} />
                <h4 style={{ color: '#f1f5f9', marginTop: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                  Original Document Not Available
                </h4>
                <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', maxWidth: '420px', margin: '0.4rem auto 0', lineHeight: 1.5 }}>
                  The candidate document <strong>{fileName}</strong> was not found in the database records or storage.
                </p>
              </div>
            )}
          </div>

          {/* Footer Close Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Viewing uploaded credential for <strong>{activeDoc?.docType}</strong>
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ padding: '0.45rem 1.25rem', fontWeight: 600 }}
            >
              Close Window
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
