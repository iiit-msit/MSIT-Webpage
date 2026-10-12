import React from 'react';
import { APPLICATION_CONFIG } from '../data/applicationConfig';

/**
 * PrintableApplicationDocument
 * 
 * High-precision, official admission application summary and acknowledgement slip.
 * Designed strictly for SINGLE-PAGE A4 output with zero spillover onto a second page.
 */
export default function PrintableApplicationDocument({ formData = {}, serverApp = null }) {
  const appId = formData.applicationId || serverApp?.application_id || serverApp?.id || 'MSIT-2027';
  const candidateName = formData.fullName || serverApp?.full_name || 'Candidate';
  const status = formData.status || serverApp?.status || 'Submitted';
  const cohort = APPLICATION_CONFIG.cohort || 'January 2027 Intake';
  
  // Format submission date
  const rawDate = formData.submittedAt || serverApp?.submitted_at || serverApp?.created_at || new Date().toISOString();
  let formattedSubmissionDate = 'Recently Submitted';
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      formattedSubmissionDate = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        Passed: 'numeric'
      });
    }
  } catch {
    formattedSubmissionDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Format print timestamp
  const printTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Compile uploaded credentials checklist (compact)
  const documentsList = [
    {
      title: 'Class 10 / SSC Marksheet',
      doc: formData.documents?.class10Doc,
      required: true
    },
    {
      title: 'Class 12 / Intermediate Memo',
      doc: formData.documents?.class12Doc,
      required: true
    },
    {
      title: 'Qualifying Degree Consolidated Memo',
      doc: formData.documents?.ugDegreeDoc,
      required: true
    },
    {
      title: 'Degree Certificate / Provisional',
      doc: formData.documents?.degreeCertDoc,
      required: false
    },
    ...(formData.documents?.additionalDegree16YearDoc ? [{
      title: '16-Year Education Proof',
      doc: formData.documents?.additionalDegree16YearDoc,
      required: true
    }] : []),
    {
      title: 'Curriculum Vitae (CV) / Resume',
      doc: formData.cvDocument || formData.documents?.cvDoc || (formData.cv_url ? { fileName: formData.cv_filename || 'Candidate_CV.pdf' } : null),
      required: true
    },
    ...(formData.entranceExamStatus === 'GRE' || formData.entranceExamStatus === 'Both' || formData.documents?.greScorecardDoc ? [{
      title: 'GRE Scorecard',
      doc: formData.documents?.greScorecardDoc,
      required: false
    }] : []),
    ...(formData.entranceExamStatus === 'GATE' || formData.entranceExamStatus === 'Both' || formData.documents?.gateScorecardDoc ? [{
      title: 'GATE Scorecard',
      doc: formData.documents?.gateScorecardDoc,
      required: false
    }] : [])
  ];

  return (
    <div className="official-print-document" aria-hidden="false">
      <div className="print-doc-single-page">
        {/* Institutional Letterhead */}
        <header className="print-doc-header">
          <div className="print-header-logo-col">
            <img 
              src="/assets/msit-logo.png" 
              alt="MSIT Logo" 
              className="print-header-logo" 
            />
          </div>
          <div className="print-header-center-col">
            <h1 className="print-institution-title">CONSORTIUM OF INSTITUTIONS OF HIGHER LEARNING (CIHL)</h1>
            <h2 className="print-programme-title">MASTER OF SCIENCE IN INFORMATION TECHNOLOGY (MSIT)</h2>
            <p className="print-campus-address">
              IIIT Hyderabad Campus, Gachibowli, Hyderabad - 500032, Telangana, India • Website: www.msitprogram.net
            </p>
          </div>
          <div className="print-header-badge-col">
            <div className="print-session-badge">
              <span className="badge-kicker">ADMISSION SESSION</span>
              <strong className="badge-cohort">{cohort}</strong>
              <span className="badge-center">IIIT HYDERABAD CAMPUS</span>
            </div>
          </div>
        </header>

        {/* Document Title Banner */}
        <div className="print-doc-title-bar">
          <span className="print-doc-main-heading">
            APPLICATION SUMMARY &amp; ADMISSION ACKNOWLEDGEMENT SLIP
          </span>
          <span className="print-doc-sub-heading">
            (Official Computer-Generated Candidate Record • 2026-27 Intake)
          </span>
        </div>

        {/* Application Identification & Status Summary Bar */}
        <div className="print-meta-grid">
          <div className="print-meta-cell">
            <span className="print-meta-label">APPLICATION REF NO:</span>
            <strong className="print-meta-value highlight-app-id">{appId}</strong>
          </div>
          <div className="print-meta-cell">
            <span className="print-meta-label">SUBMISSION DATE:</span>
            <strong className="print-meta-value">{formattedSubmissionDate}</strong>
          </div>
          <div className="print-meta-cell">
            <span className="print-meta-label">ADMISSIONS STATUS:</span>
            <strong className="print-meta-value status-badge-print">{status.toUpperCase()}</strong>
          </div>
          <div className="print-meta-cell">
            <span className="print-meta-label">PROGRAMME:</span>
            <strong className="print-meta-value">MSIT (2-Year Full-Time)</strong>
          </div>
        </div>

        {/* Section 1: Candidate Personal & Emergency Contact Information (Compact 2-Row Grid) */}
        <div className="print-section">
          <div className="print-section-heading">
            <span>1. PERSONAL &amp; EMERGENCY CONTACT INFORMATION</span>
          </div>
          <table className="print-data-table">
            <tbody>
              <tr>
                <td className="field-label" style={{ width: '18%' }}>Full Name</td>
                <td className="field-value" style={{ width: '32%' }}><strong>{candidateName}</strong></td>
                <td className="field-label" style={{ width: '18%' }}>Date of Birth</td>
                <td className="field-value" style={{ width: '32%' }}>{formData.dob || 'Not specified'}</td>
              </tr>
              <tr>
                <td className="field-label">Email Address</td>
                <td className="field-value">{formData.email || 'Not specified'}</td>
                <td className="field-label">Mobile Phone</td>
                <td className="field-value"><strong>{formData.phone || 'Not specified'}</strong></td>
              </tr>
              <tr>
                <td className="field-label">Residential Address</td>
                <td className="field-value">{formData.address || 'Not specified'}</td>
                <td className="field-label">Emergency Contact</td>
                <td className="field-value">
                  <strong>{formData.parentName || 'Not specified'}</strong>
                  {formData.parentRelationship ? ` (${formData.parentRelationship})` : ''}
                  {formData.altPhone ? ` • ${formData.altPhone}` : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Academic Qualifications & Eligibility */}
        <div className="print-section">
          <div className="print-section-heading">
            <span>2. ACADEMIC QUALIFICATIONS &amp; ELIGIBILITY</span>
          </div>
          <table className="print-data-table">
            <thead>
              <tr className="table-header-row">
                <th style={{ width: '22%' }}>Level / Exam</th>
                <th style={{ width: '28%' }}>Board / University</th>
                <th style={{ width: '35%' }}>Discipline / Stream</th>
                <th style={{ width: '13%', textAlign: 'center' }}>Passed Out Year</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Score / Aggregate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="field-name"><strong>Class 10 / Secondary (SSC)</strong></td>
                <td>{formData.class10School || serverApp?.class10_school || 'Recognized Board'}</td>
                <td>General Secondary Studies</td>
                <td className="text-center">{formData.class10Year || serverApp?.class10_year || '—'}</td>
                <td style={{ textAlign: 'right' }}><strong>{formData.class10Score ? `${formData.class10Score} (${formData.class10ScoreType || '%'})` : 'Recorded'}</strong></td>
              </tr>
              <tr>
                <td className="field-name"><strong>Class 12 / Higher Secondary</strong></td>
                <td>{formData.interCollege || serverApp?.inter_college || 'Intermediate Board / Technical'}</td>
                <td>{formData.interPathway || 'Class 12 / Intermediate'}</td>
                <td className="text-center">{formData.interYear || serverApp?.inter_year || '—'}</td>
                <td style={{ textAlign: 'right' }}><strong>{formData.interScore ? `${formData.interScore} (${formData.interScoreType || '%'})` : 'Recorded'}</strong></td>
              </tr>
              <tr>
                <td className="field-name"><strong>Qualifying Degree</strong></td>
                <td>{formData.university || 'Affiliated University'}</td>
                <td>
                  <strong>{formData.ugDegree || 'B.Tech / B.E.'}</strong>
                  {formData.branch ? ` - ${formData.branch}` : ''}
                  {formData.specialization ? ` (${formData.specialization})` : ''}
                </td>
                <td className="text-center"><strong>{formData.passingYear || '-'}</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formData.cgpa ? `${formData.cgpa} (${formData.gradingScale ? formData.gradingScale.split(' ')[0] : '%'})` : 'Recorded'}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3 & 4: Professional Experience & Entrance Examination (Combined Compact Table) */}
        <div className="print-section">
          <div className="print-section-heading">
            <span>3. WORK EXPERIENCE &amp; ENTRANCE EXAMINATION DETAILS</span>
          </div>
          <table className="print-data-table">
            <tbody>
              <tr>
                <td className="field-label" style={{ width: '18%' }}>Work Experience</td>
                <td className="field-value" style={{ width: '32%' }}>
                  <strong>{formData.hasExperience === 'Yes' ? 'Experienced' : 'Fresher'}</strong>
                  {formData.hasExperience === 'Yes' && (
                    <span> ({formData.experienceYears || '0'}y {formData.experienceMonths || '0'}m{formData.companyName ? ` • ${formData.companyName}` : ''})</span>
                  )}
                </td>
                <td className="field-label" style={{ width: '18%' }}>Entrance Channel</td>
                <td className="field-value" style={{ width: '32%' }}>
                  <strong>
                    {formData.entranceExamStatus === 'Neither' || !formData.entranceExamStatus 
                      ? 'MSIT PGEE Examination' 
                      : formData.entranceExamStatus}
                  </strong>
                  {formData.entranceExamStatus === 'GRE' && formData.greScore ? ` (Score: ${formData.greScore})` : ''}
                  {formData.entranceExamStatus === 'GATE' && formData.gateScore ? ` (Score: ${formData.gateScore})` : ''}
                  {formData.referralSource ? ` • Ref: ${formData.referralSource}` : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 5: Statement of Purpose (Compact 2-Line Excerpt) */}
        <div className="print-section">
          <div className="print-section-heading">
            <span>4. STATEMENT OF PURPOSE (APPLICANT SUBMISSION EXCERPT)</span>
          </div>
          <div className="print-sop-container">
            <p className="print-sop-text">
              {formData.statementText 
                ? `"${formData.statementText}"`
                : 'No statement of purpose text recorded.'}
            </p>
          </div>
        </div>

        {/* Section 6: Uploaded Academic Documents & Certificates Verification Checklist */}
        <div className="print-section">
          <div className="print-section-heading">
            <span>5. ACADEMIC CREDENTIALS &amp; CERTIFICATES VERIFICATION CHECKLIST</span>
          </div>
          <table className="print-data-table print-checklist-table">
            <thead>
              <tr className="table-header-row">
                <th style={{ width: '8%', textAlign: 'center' }}>#</th>
                <th style={{ width: '92%' }}>Document Description</th>
              </tr>
            </thead>
            <tbody>
              {documentsList.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td>
                    <strong>{item.title}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 7: Candidate Legal Declaration & Digital Signatures */}
        <div className="print-section declaration-section">
          <div className="print-section-heading">
            <span>6. CANDIDATE DECLARATION &amp; DIGITAL SIGNATURE</span>
          </div>
          <div className="print-declaration-text">
            I hereby certify and declare that all the information furnished by me in this application form and the accompanying academic certificates/documents are true, authentic, complete, and correct to the best of my knowledge and belief. I have reviewed the eligibility criteria prescribed by CIHL for MSIT admissions. In the event of any information or document being found false, fabricated, deficient, or inaccurate at any stage of admission or afterward, my admission shall stand cancelled immediately without any prior notice.
          </div>

          <div className="print-signature-grid">
            <div className="signature-box left-box">
              <div className="sig-meta-row">
                <span className="sig-label">Application Date:</span>
                <span className="sig-value"><strong>{formattedSubmissionDate}</strong></span>
              </div>
            </div>

            <div className="signature-box right-box">
              <div className="sig-meta-row">
                <span className="sig-label">Candidate Name:</span>
                <span className="sig-value"><strong>{candidateName.toUpperCase()}</strong></span>
              </div>
              <div className="sig-meta-row" style={{ marginTop: '2px' }}>
                <span className="sig-label">Applicant Signature:</span>
                <span className="sig-value" style={{ fontStyle: 'italic', color: '#0b2a6b', fontWeight: 'bold' }}>
                  [ Digitally Confirmed via Portal Submission ]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Verification & Contact Footer */}
        <footer className="print-official-footer-doc">
          <div className="footer-contact-bar">
            <span><strong>CIHL Admissions Desk:</strong> IIIT Hyderabad Campus, Gachibowli, Hyderabad - 500 032</span>
            <span><strong>Official Query Email:</strong> admissions@msitprogram.net</span>
          </div>
          <div className="footer-disclaimer-bar">
            <span>Official Computer-Generated Acknowledgment • Generated: {printTimestamp}</span>
            <span><strong>Application ID: {appId}</strong> • Strictly 1 Page Record</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
