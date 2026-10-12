import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRightIcon, UserIcon } from '../components/Icons';

// Centralized post-login data source
import msitData from '../data/msitData.json';

// Modular Post-Login Dashboard Components
import DashboardSubNav from '../components/postlogin/DashboardSubNav';
import StudentDashboardHeader from '../components/postlogin/StudentDashboardHeader';
import ProgrammeOverviewSection from '../components/postlogin/ProgrammeOverviewSection';
import ExplorePracticum from '../components/explore/ExplorePracticum';
import FeesAndFinancialSupportSection from '../components/postlogin/FeesAndFinancialSupportSection';
import DocumentsAndFAQSection from '../components/postlogin/DocumentsAndFAQSection';
import AcademicSummaryModal from '../components/postlogin/AcademicSummaryModal';
import Footer from '../components/Footer';
import { getStudentDisplayName } from '../utils/userUtils';
import { isAuthorizedAdminEmail } from '../context/AdminAuthContext';

import { getUserApplication, getAdmissionSettings } from '../services/applicationService';
export default function ProgrammePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Resolved student display name
  const displayName = getStudentDisplayName(user);
  const isAdmin = user?.email && isAuthorizedAdminEmail(user.email);

  // Application state
  const [application, setApplication] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState('Not Started');
  const [loadingApp, setLoadingApp] = useState(true);

  // Dynamic Admin Admission Settings State
  const [admissionSettings, setAdmissionSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const settings = await getAdmissionSettings();
        if (isMounted && settings) {
          setAdmissionSettings(settings);
        }
      } catch (err) {
        console.warn('[MSIT] Admission settings fetch error:', err);
      } finally {
        if (isMounted) setLoadingSettings(false);
      }

      if (!user) {
        if (isMounted) setLoadingApp(false);
        return;
      }

      try {
        const { application: app, status } = await getUserApplication(user);
        if (isMounted) {
          setApplication(app);
          setApplicationStatus(status || 'Not Started');
        }
      } catch (err) {
        console.warn('[MSIT] Application fetch error:', err);
      } finally {
        if (isMounted) setLoadingApp(false);
      }
    }
    loadData();

    // Live update listener for instant sync when admin saves settings in any tab
    const handleSettingsUpdate = (e) => {
      if (e.detail && isMounted) {
        setAdmissionSettings(e.detail);
      }
    };
    window.addEventListener('msit:admission-settings-updated', handleSettingsUpdate);

    // Live update listener for applicant updates made by admin
    const handleAppStatusUpdate = (e) => {
      if (e.detail && isMounted && user?.email && (e.detail.email || '').toLowerCase() === user.email.toLowerCase()) {
        setApplication(e.detail);
        setApplicationStatus(e.detail.status || 'Submitted');
      }
    };
    window.addEventListener('msit:application-status-updated', handleAppStatusUpdate);

    const handleStudentStatusUpdate = (e) => {
      if (e.detail && isMounted && user?.email && (e.detail.email || '').toLowerCase() === user.email.toLowerCase()) {
        if (e.detail.app) setApplication(e.detail.app);
        if (e.detail.status) setApplicationStatus(e.detail.status);
      }
    };
    window.addEventListener('msit:student-status-changed', handleStudentStatusUpdate);

    // Cross-tab sync via storage events
    const handleStorageChange = (e) => {
      if (e.key === 'msit_all_submitted_applications' && isMounted && user?.email) {
        try {
          const apps = JSON.parse(e.newValue || '[]');
          const myApp = apps.find(a => (a.email || '').toLowerCase() === user.email.toLowerCase());
          if (myApp) {
            setApplication(myApp);
            setApplicationStatus(myApp.status || 'Submitted');
          }
        } catch (_) {}
      } else if (e.key && e.key.startsWith('msit_app_status_') && isMounted && user?.email) {
        const keyEmail = e.key.replace('msit_app_status_', '').toLowerCase();
        if (keyEmail === user.email.toLowerCase() && e.newValue) {
          setApplicationStatus(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => { 
      isMounted = false; 
      window.removeEventListener('msit:admission-settings-updated', handleSettingsUpdate);
      window.removeEventListener('msit:application-status-updated', handleAppStatusUpdate);
      window.removeEventListener('msit:student-status-changed', handleStudentStatusUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  // Handle hash anchor scrolling when arriving with an anchor hash
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const anchorId = window.location.hash.replace('#', '');
      if (anchorId) {
        const timer = setTimeout(() => {
          const target = document.getElementById(anchorId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // If user arrived with intent to login to admin, auto-redirect to admin dashboard
  React.useEffect(() => {
    const authIntent = localStorage.getItem('msit_auth_intent') || sessionStorage.getItem('msit_auth_intent');
    if (authIntent === 'admin' && isAdmin) {
      localStorage.removeItem('msit_auth_intent');
      sessionStorage.removeItem('msit_auth_intent');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  // Factsheet modal state
  const [showFactsheetModal, setShowFactsheetModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    navigate('/');
  };

  return (
    <div className="programme-page-root student-decision-dashboard">
      {/* ============================================================
          TOP STICKY NAVIGATION GROUP (Header + Subnav pinned together)
          ============================================================ */}
      <div className="programme-sticky-nav-shell">
        <header className="programme-header">
          <div className="programme-header-container">
            <a href="#dashboard" className="programme-brand" aria-label="MSIT Dashboard">
              <img
                src="/assets/msit-logo.png"
                alt="MSIT Logo"
                className="brand-logo"
                style={{ objectFit: 'contain' }}
                width="38"
                height="38"
              />
              <div className="gateway-brand-text">
                <span className="gateway-brand-title">MSIT</span>
                <span className="gateway-brand-subtitle">Master of Science in Information Technology</span>
              </div>
            </a>

            <div className="programme-header-actions">
              {user && (
                <div className="header-student-profile-chip" title={`Authenticated as ${displayName} (${user.email})`}>
                  <span className="student-avatar-initial" aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="programme-user-email">{displayName}</span>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary programme-apply-btn"
                onClick={() => {
                  if (['Submitted', 'Under Review', 'Accepted', 'Declined', 'Rejected'].includes(applicationStatus)) {
                    navigate('/apply?mode=view');
                  } else if (applicationStatus === 'Additional Information Required') {
                    navigate('/apply?mode=edit');
                  } else {
                    navigate('/apply');
                  }
                }}
              >
                <span>
                  {applicationStatus === 'Draft' && 'Continue Application'}
                  {['Submitted', 'Under Review', 'Accepted', 'Declined', 'Rejected'].includes(applicationStatus) && 'View Application'}
                  {applicationStatus === 'Additional Information Required' && 'Update Application'}
                  {applicationStatus === 'Not Started' && 'Apply Now'}
                </span>
                <ArrowRightIcon size={16} />
              </button>

              <button
                type="button"
                className="programme-signout-btn"
                onClick={handleSignOut}
                aria-label="Sign out of student account"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* POST-LOGIN STICKY SUB-NAVIGATION */}
        <DashboardSubNav />
      </div>

      {/* ============================================================
          1. STUDENT DASHBOARD / WELCOME & ACTION HUB
          ============================================================ */}
      <StudentDashboardHeader 
        user={user} 
        data={msitData.dashboard} 
        application={application}
        applicationStatus={applicationStatus}
        admissionSettings={admissionSettings}
        loadingSettings={loadingSettings}
        onApply={(status) => {
          if (['Submitted', 'Under Review', 'Accepted', 'Declined', 'Rejected'].includes(status)) {
            navigate('/apply?mode=view');
          } else if (status === 'Additional Information Required') {
            navigate('/apply?mode=edit');
          } else {
            navigate('/apply');
          }
        }} 
      />

      {/* ============================================================
          2. PROGRAMME OVERVIEW (Specifications & Academic Anchor)
          ============================================================ */}
      <ProgrammeOverviewSection data={msitData.overview} />

      {/* ============================================================
          REAL-WORLD PRACTICUM & PROJECTS
          ============================================================ */}
      <ExplorePracticum />

      {/* ============================================================
          3. FEES & FINANCIAL SUPPORT
          ============================================================ */}
      <FeesAndFinancialSupportSection data={msitData.fees} />

      {/* ============================================================
          4. DOCUMENTS & FAQ
          ============================================================ */}
      <DocumentsAndFAQSection 
        documentsData={msitData.documents} 
        faqData={msitData.faq} 
        onOpenSummaryModal={() => setShowFactsheetModal(true)}
      />

      {/* ============================================================

          OFFICIAL FOOTER
          ============================================================ */}
      <Footer data={msitData.footer} />

      {/* ============================================================
          FACTSHEET MODAL
          ============================================================ */}
      <AcademicSummaryModal 
        isOpen={showFactsheetModal} 
        onClose={() => setShowFactsheetModal(false)} 
      />
    </div>
  );
}
