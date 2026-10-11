import React from 'react';
import { AwardIcon, BuildingIcon, CpuIcon, ShieldCheckIcon, DownloadIcon } from '../Icons';

export default function AcademicSummaryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-dialog modal-dialog-lg" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="summaryModalTitle"
      >
        <div className="modal-header">
          <div className="modal-header-branding">
            <span className="kicker">Official Factsheet Summary</span>
            <h3 id="summaryModalTitle">MSIT — Master of Science in Information Technology</h3>
            <span className="modal-subtitle">Consortium of Institutions of Higher Learning · IIIT Hyderabad Anchor</span>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body printable-summary-body">
          <div className="summary-quadrant-grid">
            <div className="summary-card">
              <div className="summary-card-head">
                <AwardIcon size={18} />
                <h4>1. Programme Credentials</h4>
              </div>
              <ul className="summary-list compact">
                <li><strong>Degree:</strong> Master of Science in Information Technology (MSIT).</li>
                <li><strong>Awarding Body:</strong> IIIT Hyderabad.</li>
                <li><strong>Founding Legacy:</strong> Conceived in 2001 by Turing Award Laureate Prof. Raj Reddy.</li>
              </ul>
            </div>

            <div className="summary-card">
              <div className="summary-card-head">
                <BuildingIcon size={18} />
                <h4>2. Academic Model</h4>
              </div>
              <ul className="summary-list compact">
                <li><strong>Programme:</strong> 4 Semesters (Full-Time On-Campus).</li>
                <li><strong>Degree Awarded:</strong> Awarded by IIIT Hyderabad.</li>
                <li><strong>Pedagogy Anchor:</strong> Centre for Educational Technology & Learning Sciences (CETLS).</li>
              </ul>
            </div>

            <div className="summary-card">
              <div className="summary-card-head">
                <CpuIcon size={18} />
                <h4>3. Technical Focus</h4>
              </div>
              <ul className="summary-list compact">
                <li><strong>AI & Machine Learning:</strong> Contemporary AI tools, LLMs & applied modeling.</li>
                <li><strong>Systems & Computing:</strong> Algorithms, data structures, and computer systems.</li>
                <li><strong>Practicum:</strong> Half-time research co-op, venture-building & industry co-op.</li>
              </ul>
            </div>

            <div className="summary-card">
              <div className="summary-card-head">
                <ShieldCheckIcon size={18} />
                <h4>4. Practicum & Admissions</h4>
              </div>
              <ul className="summary-list compact">
                <li><strong>Tuition Fee:</strong> INR 1,50,000 per semester.</li>
                <li><strong>Eligibility:</strong> Graduates with 16 years of formal education (CS, AI & Math).</li>
                <li><strong>Commencement:</strong> 2 January 2027.</li>
                <li><strong>Admission Modes:</strong> GRE, GATE, or MSIT Entrance Exam.</li>
                <li><strong>Interview & Selection:</strong> One-on-one discussion & final selection.</li>
              </ul>
            </div>
          </div>

          <div className="summary-official-footer">
            <div>
              <strong>Admissions Office:</strong> MSIT Division, IIIT Hyderabad Campus, Gachibowli, Hyderabad - 500 032
            </div>
            <div className="text-right">
              <strong>Email:</strong> query@msit.ac.in | <strong>Web:</strong> www.msit.ac.in
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => window.print()}
          >
            <DownloadIcon size={16} />
            <span>Print Factsheet</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
