import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon, ClockIcon, MailIcon, BuildingIcon } from '../Icons';

export default function NextStepsAndApplicationSection({ 
  data, 
  user, 
  application = null,
  applicationStatus = 'Not Started' 
}) {
  const navigate = useNavigate();

  const getButtonConfig = () => {
    switch (applicationStatus) {
      case 'Draft':
        return {
          label: 'Continue Application — Draft In Progress',
          action: () => navigate('/apply')
        };
      case 'Submitted':
      case 'Under Review':
      case 'Accepted':
      case 'Declined':
      case 'Rejected':
      case 'Interview Scheduled':
      case 'Shortlisted for Interview':
      case 'Scheduled for MSIT PGEE Exam':
      case 'MSIT PGEE Exam Required':
      case 'Awaiting MSIT PGEE Result':
        return {
          label: 'View Application — Submitted Details',
          action: () => navigate('/apply?mode=view')
        };
      case 'Additional Information Required':
        return {
          label: 'Update Application — Admissions Action Required',
          action: () => navigate('/apply?mode=edit')
        };
      case 'Not Started':
      default:
        return {
          label: 'Apply Now — Online Application Form',
          action: () => navigate('/apply')
        };
    }
  };

  const btnConfig = getButtonConfig();

  return (
    <section className="section next-steps-section" id="next-steps">
      <div className="container">
        <div className="next-steps-banner-card">
          <div className="steps-banner-top">
            <span className="kicker kicker-light">{data.kicker}</span>
            <h2>{data.heading}</h2>
            <p className="banner-subtext">{data.description}</p>
          </div>

          <div className="portal-action-box">
            <div className="portal-status-group">
              <span className="portal-badge-cohort">{data.cohort}</span>
              <div className="portal-live-indicator">
                <span className="live-dot" aria-hidden="true"></span>
                <strong>Status: {applicationStatus}</strong>
                {application?.application_id && (
                  <span style={{ marginLeft: '0.5rem', opacity: 0.9 }}>
                    (Ref: {application.application_id})
                  </span>
                )}
              </div>
            </div>

            <div className="portal-active-view">
              <p>
                {applicationStatus === 'Not Started' && 'Online applications for the upcoming cohort are now open.'}
                {applicationStatus === 'Draft' && 'You have an active saved draft. Pick up right where you left off.'}
                {applicationStatus === 'Submitted' && 'Your application has been received and is queued for admissions review.'}
                {applicationStatus === 'Under Review' && 'Your application and credentials are being reviewed by the admissions team.'}
                {['Interview Scheduled', 'Shortlisted for Interview'].includes(applicationStatus) && 'You are shortlisted for one-on-one discussion! Check your interview schedule above.'}
                {['Scheduled for MSIT PGEE Exam', 'MSIT PGEE Exam Required'].includes(applicationStatus) && 'You are scheduled for the MSIT PGEE examination. Review test schedule details above.'}
                {applicationStatus === 'Awaiting MSIT PGEE Result' && 'Your entrance exam is recorded. Evaluation outcome will be published shortly.'}
                {applicationStatus === 'Additional Information Required' && 'Admissions has requested updates. Please review the notes and resubmit.'}
                {applicationStatus === 'Accepted' && 'Congratulations on your admission offer! Access your submitted application below.'}
                {(applicationStatus === 'Rejected' || applicationStatus === 'Declined') && 'Admissions review completed for this intake.'}
              </p>
              <button
                type="button"
                onClick={btnConfig.action}
                className="btn btn-primary portal-cta-btn"
              >
                <span>{btnConfig.label}</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>

          {/* Actionable "What Should You Do Now?" Checklist */}
          <div className="applicant-prep-checklist-wrap">
            <h3>{data?.adviceHeader}</h3>
            <div className="prep-steps-grid">
              {(data?.steps || []).map((item) => (
                <div key={item.step} className="prep-step-card">
                  <span className="step-circle">{item.step}</span>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Official Admissions Support Card */}
          <div className="admissions-support-card">
            <div className="support-info">
              <h4>{data.supportBox.title}</h4>
              <p>{data.supportBox.text}</p>
            </div>
            <div className="support-contacts">
              <a href={`mailto:${data.supportBox.email}`} className="contact-chip">
                <MailIcon size={16} />
                <span>{data.supportBox.email}</span>
              </a>
              <span className="contact-chip phone-chip">
                <BuildingIcon size={16} />
                <span>{data.supportBox.phone}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
