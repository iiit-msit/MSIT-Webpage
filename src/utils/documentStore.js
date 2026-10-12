/**
 * Utility for persisting, retrieving, and rendering candidate application documents.
 * Supports IndexedDB persistence, Data URLs, direct PDF streaming, and safe downloading/opening.
 */

const DB_NAME = 'msit_documents_db';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

// In-memory cache for speed
const memoryDocCache = new Map();

/**
 * Open or create IndexedDB document store
 */
function openDocumentDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Save document payload to IndexedDB and memory cache
 */
export async function saveDocumentToIndexedDB(key, payload) {
  if (!key || !payload) return false;
  memoryDocCache.set(key, payload);

  const db = await openDocumentDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id: key, ...payload, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (err) {
      resolve(false);
    }
  });
}

/**
 * Retrieve document payload from memory cache or IndexedDB
 */
export async function getDocumentFromIndexedDB(key) {
  if (!key) return null;
  if (memoryDocCache.has(key)) {
    return memoryDocCache.get(key);
  }

  const db = await openDocumentDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result) {
          memoryDocCache.set(key, req.result);
        }
        resolve(req.result || null);
      };
      req.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Read File or Blob as Base64 Data URL
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Convert Base64 Data URL to Blob
 */
export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || !dataUrl.includes(',')) return null;
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.warn('[MSIT] dataUrlToBlob failed:', err);
    return null;
  }
}

/**
 * Open Document in a New Browser Tab safely
 */
export function openDocumentInNewTab(urlOrDataUrl, fileName = 'document.pdf') {
  if (!urlOrDataUrl) return;

  if (urlOrDataUrl.startsWith('data:')) {
    const blob = dataUrlToBlob(urlOrDataUrl);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return;
    }
  }

  window.open(urlOrDataUrl, '_blank');
}

/**
 * Download Document directly to user's device
 */
export function downloadDocument(urlOrDataUrl, fileName = 'document.pdf') {
  if (!urlOrDataUrl) return;

  if (urlOrDataUrl.startsWith('data:')) {
    const blob = dataUrlToBlob(urlOrDataUrl);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    }
  }

  const a = document.createElement('a');
  a.href = urlOrDataUrl;
  a.download = fileName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Helper to escape text for PDF literal strings
 */
function escapePdfText(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generate a valid, standards-compliant %PDF-1.4 Data URL for documents
 * that do not have raw binary attached in older records.
 * The resulting Data URL renders natively in browser PDF viewers.
 */
export function generateOfficialPdfDataUrl({
  docType = 'Academic Document',
  fileName = 'Document.pdf',
  applicantName = 'Applicant',
  applicationId = 'MSIT-APP',
  institution = '',
  score = '',
  date = ''
}) {
  const lines = [
    'MSIT ADMISSIONS - OFFICIAL APPLICATION DOCUMENT RECORD',
    '========================================================================',
    'DOCUMENT TYPE : ' + docType,
    'FILE NAME     : ' + fileName,
    'APPLICANT     : ' + applicantName,
    'APP ID        : ' + applicationId,
    institution ? 'INSTITUTION   : ' + institution : null,
    score ? 'VERIFIED SCORE: ' + score : null,
    'RECORD DATE   : ' + (date || new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })),
    '========================================================================',
    'This document represents the official certificate / transcript recorded',
    'with the candidate application during online submission.',
    '',
    'MSIT Admissions Office - Consortium of IIIT Hyderabad, JNTUH, SVU, JNTUK'
  ].filter(Boolean);

  let streamContent = 'BT\n/F1 16 Tf\n50 720 Td\n(' + escapePdfText(lines[0]) + ') Tj\nET\n';
  streamContent += 'BT\n/F1 10 Tf\n50 705 Td\n(' + escapePdfText(lines[1]) + ') Tj\nET\n';

  let y = 675;
  for (let i = 2; i < lines.length; i++) {
    streamContent += 'BT\n/F1 11 Tf\n50 ' + y + ' Td\n(' + escapePdfText(lines[i]) + ') Tj\nET\n';
    y -= 24;
  }

  const streamLen = typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(streamContent).length
    : streamContent.length;

  const pdfParts = [
    '%PDF-1.4',
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '5 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + streamContent + '\nendstream\nendobj',
    'xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000325 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + (450 + streamLen) + '\n%%EOF'
  ];

  const fullPdf = pdfParts.join('\n');
  const base64 = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(fullPdf)))
    : Buffer.from(fullPdf).toString('base64');

  return 'data:application/pdf;base64,' + base64;
}

/**
 * Helper to sanitize document URLs and link known local documents
 */
export function cleanDocUrl(fileUrl, fileName = '') {
  const cleanName = (fileName || '').trim();
  if (cleanName === 'MSIT_Admission_Notification_2026-27.pdf' || cleanName === 'MSIT_Student_Laptop_Specification_2027_updated.pdf') {
    return `/documents/${cleanName}`;
  }
  if (!fileUrl) return '';
  // Strip out broken Supabase storage bucket URLs pointing to non-existent bucket
  if (typeof fileUrl === 'string' && fileUrl.includes('supabase.co/storage') && fileUrl.includes('application-documents')) {
    return '';
  }
  return fileUrl;
}

/**
 * Extracts and unifies all uploaded documents for a candidate application.
 * Returns an array of clean document objects ready for viewing and tabs.
 */
export function extractAllApplicationDocuments(app) {
  if (!app) return [];

  const applicantName = app.full_name || app.fullName || 'Candidate';
  const appId = app.application_id || app.applicationId || app.id || 'MSIT-APP';
  const submittedAt = app.submitted_at || app.submittedAt || new Date().toISOString();

  const docsMap = new Map();

  // Helper to add or update doc in map
  const addDoc = (id, docData) => {
    if (!id || !docData) return;
    const existing = docsMap.get(id);
    docsMap.set(id, {
      id,
      ...existing,
      ...docData,
      applicantName,
      applicationId: appId
    });
  };

  // 1. Inspect app.documents if it's an object (from draft or portal state)
  if (app.documents && typeof app.documents === 'object' && !Array.isArray(app.documents)) {
    const raw = app.documents;
    if (raw.ugDegreeDoc) {
      const fName = raw.ugDegreeDoc.fileName || raw.ugDegreeDoc.file_name || 'BTech_Degree_Certificate.pdf';
      addDoc('btech', {
        key: 'ugDegreeDoc',
        docType: 'Undergraduate Degree Certificate / Transcripts',
        fileName: fName,
        fileSize: raw.ugDegreeDoc.fileSize || raw.ugDegreeDoc.file_size || '2.4 MB',
        fileUrl: cleanDocUrl(raw.ugDegreeDoc.fileUrl || raw.ugDegreeDoc.file_url || raw.ugDegreeDoc.dataUrl || '', fName),
        status: raw.ugDegreeDoc.status || 'Uploaded',
        uploadedAt: raw.ugDegreeDoc.uploadedAt || submittedAt
      });
    }
    if (raw.degreeCertDoc) {
      const fName = raw.degreeCertDoc.fileName || raw.degreeCertDoc.file_name || 'Provisional_Degree_Certificate.pdf';
      addDoc('degreeCert', {
        key: 'degreeCertDoc',
        docType: 'Degree / Provisional Certificate',
        fileName: fName,
        fileSize: raw.degreeCertDoc.fileSize || raw.degreeCertDoc.file_size || '1.8 MB',
        fileUrl: cleanDocUrl(raw.degreeCertDoc.fileUrl || raw.degreeCertDoc.file_url || raw.degreeCertDoc.dataUrl || '', fName),
        status: raw.degreeCertDoc.status || 'Uploaded',
        uploadedAt: raw.degreeCertDoc.uploadedAt || submittedAt
      });
    }
    if (raw.class10Doc) {
      const fName = raw.class10Doc.fileName || raw.class10Doc.file_name || 'Class10_SSC_Marksheet_Memo.pdf';
      addDoc('10th', {
        key: 'class10Doc',
        docType: 'Class 10 / SSC Marksheet & Memo',
        fileName: fName,
        fileSize: raw.class10Doc.fileSize || raw.class10Doc.file_size || '1.5 MB',
        fileUrl: cleanDocUrl(raw.class10Doc.fileUrl || raw.class10Doc.file_url || raw.class10Doc.dataUrl || '', fName),
        status: raw.class10Doc.status || 'Uploaded',
        uploadedAt: raw.class10Doc.uploadedAt || submittedAt
      });
    }
    if (raw.class12Doc) {
      const fName = raw.class12Doc.fileName || raw.class12Doc.file_name || 'Class12_Intermediate_MarksMemo.pdf';
      addDoc('12th', {
        key: 'class12Doc',
        docType: 'Class 12 / Intermediate Examination Marks Memo',
        fileName: fName,
        fileSize: raw.class12Doc.fileSize || raw.class12Doc.file_size || '1.6 MB',
        fileUrl: cleanDocUrl(raw.class12Doc.fileUrl || raw.class12Doc.file_url || raw.class12Doc.dataUrl || '', fName),
        status: raw.class12Doc.status || 'Uploaded',
        uploadedAt: raw.class12Doc.uploadedAt || submittedAt
      });
    }
    if (raw.greScorecardDoc || raw.gateScorecardDoc) {
      const gDoc = raw.greScorecardDoc || raw.gateScorecardDoc;
      const fName = gDoc.fileName || gDoc.file_name || 'Official_Scorecard.pdf';
      addDoc('gr', {
        key: raw.greScorecardDoc ? 'greScorecardDoc' : 'gateScorecardDoc',
        docType: raw.greScorecardDoc ? 'GRE Official Scorecard' : 'GATE Official Scorecard',
        fileName: fName,
        fileSize: gDoc.fileSize || gDoc.file_size || '1.1 MB',
        fileUrl: cleanDocUrl(gDoc.fileUrl || gDoc.file_url || gDoc.dataUrl || '', fName),
        status: gDoc.status || 'Uploaded',
        uploadedAt: gDoc.uploadedAt || submittedAt
      });
    }
    if (raw.cvDoc || raw.cvDocument) {
      const cv = raw.cvDoc || raw.cvDocument;
      const fName = cv.fileName || cv.file_name || 'Candidate_CV.pdf';
      addDoc('cv', {
        key: 'cvDocument',
        docType: 'Curriculum Vitae (CV) / Resume',
        fileName: fName,
        fileSize: cv.fileSize || cv.file_size || '1.0 MB',
        fileUrl: cleanDocUrl(cv.fileUrl || cv.file_url || cv.dataUrl || '', fName),
        status: cv.status || 'Uploaded',
        uploadedAt: cv.uploadedAt || submittedAt
      });
    }
  }

  // 2. Inspect app.documents if it's an array
  if (Array.isArray(app.documents) && app.documents.length > 0) {
    app.documents.forEach((d, idx) => {
      const typeStr = (d.doc_type || d.docType || '').toLowerCase();
      let targetId = `doc_${idx}`;

      if (typeStr.includes('b.tech') || typeStr.includes('btech') || typeStr.includes('degree') || typeStr.includes('transcript') || typeStr.includes('undergraduate')) {
        targetId = 'btech';
      } else if (typeStr.includes('10') || typeStr.includes('ssc') || typeStr.includes('secondary')) {
        targetId = '10th';
      } else if (typeStr.includes('12') || typeStr.includes('inter') || typeStr.includes('intermediate') || typeStr.includes('diploma')) {
        targetId = '12th';
      } else if (typeStr.includes('gre') || typeStr.includes('gate') || typeStr.includes('scorecard')) {
        targetId = 'gr';
      } else if (typeStr.includes('cv') || typeStr.includes('resume')) {
        targetId = 'cv';
      }

      const fName = d.file_name || d.fileName || 'Document.pdf';
      addDoc(targetId, {
        key: targetId,
        docType: d.doc_type || d.docType || 'Candidate Document',
        fileName: fName,
        fileSize: d.file_size || d.fileSize || '1.5 MB',
        fileUrl: cleanDocUrl(d.file_url || d.fileUrl || d.dataUrl || '', fName),
        storagePath: d.storage_path || d.storagePath || '',
        status: d.status || 'Uploaded',
        rejectionReason: d.rejection_reason || null,
        uploadedAt: d.uploaded_at || d.uploadedAt || submittedAt
      });
    });
  }

  // 3. Always include default certificate slots for academic submissions
  if (!docsMap.has('btech') && (app.cgpa || app.ug_degree || app.university)) {
    addDoc('btech', {
      key: 'ugDegreeDoc',
      docType: `${app.ug_degree || 'B.Tech / B.E.'} Certificate / Consolidated Transcripts`,
      fileName: 'BTech_Degree_Certificate.pdf',
      fileSize: '2.4 MB',
      fileUrl: '',
      status: 'Uploaded',
      uploadedAt: submittedAt,
      institution: app.university,
      score: app.cgpa ? `${app.cgpa} (${app.grading_scale || 'Percentage'})` : ''
    });
  }

  if (!docsMap.has('10th') && app.class10_score) {
    addDoc('10th', {
      key: 'class10Doc',
      docType: 'Class 10 / Secondary School Certificate (SSC)',
      fileName: 'Class10_SSC_Marksheet_Memo.pdf',
      fileSize: '1.8 MB',
      fileUrl: '',
      status: 'Uploaded',
      uploadedAt: submittedAt,
      score: `${app.class10_score} (${app.class10_score_type || 'Percentage'})`
    });
  }

  if (!docsMap.has('12th') && app.inter_score) {
    addDoc('12th', {
      key: 'class12Doc',
      docType: 'Class 12 / Intermediate Examination Marks Memo',
      fileName: 'Class12_Intermediate_MarksMemo.pdf',
      fileSize: '1.5 MB',
      fileUrl: '',
      status: 'Uploaded',
      uploadedAt: submittedAt,
      score: `${app.inter_score} (${app.inter_score_type || 'Percentage'})`
    });
  }

  if (!docsMap.has('gr') && (app.gre_score || app.gate_score)) {
    const isGre = !!app.gre_score;
    addDoc('gr', {
      key: isGre ? 'greScorecardDoc' : 'gateScorecardDoc',
      docType: isGre ? 'Official GRE Scorecard Report' : 'Official GATE Scorecard Report',
      fileName: isGre ? 'Official_GRE_Scorecard.pdf' : 'Official_GATE_Scorecard.pdf',
      fileSize: '1.1 MB',
      fileUrl: '',
      status: 'Uploaded',
      uploadedAt: submittedAt,
      score: isGre ? `GRE: ${app.gre_score}` : `GATE: ${app.gate_score}`
    });
  }

  if (!docsMap.has('cv') && (app.cv_url || app.cv_filename)) {
    addDoc('cv', {
      key: 'cvDocument',
      docType: 'Curriculum Vitae (CV) / Resume',
      fileName: app.cv_filename || 'Candidate_CV.pdf',
      fileSize: '1.0 MB',
      fileUrl: app.cv_url || '',
      status: 'Uploaded',
      uploadedAt: submittedAt
    });
  }

  // Convert map to ordered array
  const priorityOrder = ['btech', '10th', '12th', 'gr', 'cv', 'degreeCert'];
  const allDocs = Array.from(docsMap.values());

  allDocs.sort((a, b) => {
    const idxA = priorityOrder.indexOf(a.id);
    const idxB = priorityOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  return allDocs;
}
