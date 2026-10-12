import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminTopNav from '../../components/admin/AdminTopNav';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { StatusBadge, TestDataBadge } from '../../components/admin/StatusBadge';
import ApplicationDetailModal from '../../components/admin/ApplicationDetailModal';
import CertificateModal from '../../components/admin/CertificateModal';
import { 
  fetchAllApplications, 
  calculateDashboardMetrics, 
  isApplicationInDocumentReview,
  resetMockData,
  getAdmissionSettings,
  saveAdmissionSettings,
  DEFAULT_ADMISSION_SETTINGS
} from '../../services/adminService';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  BuildingIcon, 
  UsersIcon, 
  BookOpenIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ArrowRightIcon, 
  AwardIcon, 
  DownloadIcon, 
  TerminalIcon, 
  ShieldCheckIcon,
  HelpCircleIcon,
  RefreshCwIcon,
  CopyIcon,
  SparklesIcon,
  FileTextIcon
} from '../../components/Icons';

export default function AdminDashboardPage({ activeTab: initialTab = 'overview' }) {
  const navigate = useNavigate();
  const { adminSignOut, isDevAdmin, testAccountEmail } = useAdminAuth();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Selected application for detail modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Certificate Viewer Modal State
  // Certificate & Document Viewer Modal State
  const [viewingDocModal, setViewingDocModal] = useState({
    isOpen: false,
    application: null,
    initialDocType: 'btech'
  });

  const handleOpenCertificate = (app, certType) => {
    setViewingDocModal({
      isOpen: true,
      application: app,
      initialDocType: certType || 'btech'
    });
  };

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [docFilter, setDocFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Copy ID feedback state
  const [copiedAppId, setCopiedAppId] = useState(null);
  const handleCopyAppId = (e, id) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
      setCopiedAppId(id);
      setTimeout(() => setCopiedAppId(null), 2000);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'AP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Copy SQL state
  const [sqlCopied, setSqlCopied] = useState(false);

  // Admission Process Settings State
  const [admissionSettings, setAdmissionSettings] = useState(DEFAULT_ADMISSION_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Load applications & settings
  const loadApplications = async () => {
    setLoading(true);
    try {
      const [res, settings] = await Promise.all([
        fetchAllApplications(),
        getAdmissionSettings()
      ]);
      setApplications(res.applications);
      setIsSupabaseLive(res.isSupabaseLive);
      if (settings) {
        setAdmissionSettings(settings);
      }
    } catch (err) {
      console.error('Failed to load applications or settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();

    const handleRealtimeStatusSync = (e) => {
      if (e.detail) {
        const updated = e.detail;
        setApplications(prev => {
          const idx = prev.findIndex(a => 
            (a.application_id && a.application_id === updated.application_id) ||
            (a.id && a.id === updated.id) ||
            (a.email && updated.email && a.email.toLowerCase() === updated.email.toLowerCase())
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...updated };
            return next;
          } else {
            return [updated, ...prev];
          }
        });
      }
    };
    window.addEventListener('msit:application-status-updated', handleRealtimeStatusSync);
    return () => window.removeEventListener('msit:application-status-updated', handleRealtimeStatusSync);
  }, []);

  // Calculate Metrics dynamically
  const metrics = useMemo(() => calculateDashboardMetrics(applications), [applications]);

  // Document Verification Queue Applications (Only applications explicitly moved to review)
  const documentQueueApplications = useMemo(() => {
    return applications
      .filter(isApplicationInDocumentReview)
      .filter((app) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (app.full_name || '').toLowerCase().includes(q);
        const matchesEmail = (app.email || '').toLowerCase().includes(q);
        const matchesId = (app.application_id || '').toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesId;
      });
  }, [applications, searchQuery]);

  // Filtered and Sorted Applications (Everything visible as applications)
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = (app.full_name || '').toLowerCase().includes(q);
          const matchesEmail = (app.email || '').toLowerCase().includes(q);
          const matchesId = (app.application_id || '').toLowerCase().includes(q);
          if (!matchesName && !matchesEmail && !matchesId) return false;
        }

        // Application status filter
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'New') {
            if (app.status !== 'New' && app.status !== 'Submitted' && app.status !== 'Draft' && Boolean(app.status)) return false;
          } else if (app.status !== statusFilter) {
            return false;
          }
        }

        // Document status filter
        if (docFilter !== 'ALL') {
          if (app.document_status !== docFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.submitted_at) - new Date(a.submitted_at);
        }
        if (sortBy === 'oldest') {
          return new Date(a.submitted_at) - new Date(b.submitted_at);
        }
        if (sortBy === 'name') {
          return (a.full_name || '').localeCompare(b.full_name || '');
        }
        if (sortBy === 'cgpa') {
          const cgpaA = parseFloat(a.cgpa) || 0;
          const cgpaB = parseFloat(b.cgpa) || 0;
          return cgpaB - cgpaA;
        }
        return 0;
      });
  }, [applications, searchQuery, statusFilter, docFilter, sortBy]);

  const handleOpenDetail = (app) => {
    setSelectedApp(app);
    setDetailModalOpen(true);
  };

  const handleApplicationUpdated = (updatedApp) => {
    setApplications(prev => prev.map(a => 
      ((a.application_id && a.application_id === updatedApp.application_id) ||
       (a.id && a.id === updatedApp.id) ||
       (a.email && updatedApp.email && a.email.toLowerCase() === updatedApp.email.toLowerCase()))
        ? updatedApp 
        : a
    ));
    setSelectedApp(updatedApp);
  };

  const handleCardClick = (status) => {
    setStatusFilter(status);
    setActiveTab('applications');
  };

  const handleCopySql = () => {
    const sqlContent = `-- Run this in Supabase SQL Editor\nCREATE TABLE IF NOT EXISTS public.admin_users (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,\n    email TEXT UNIQUE NOT NULL,\n    full_name TEXT,\n    role TEXT NOT NULL DEFAULT 'admin',\n    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS public.applications (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    application_id TEXT UNIQUE NOT NULL,\n    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,\n    email TEXT NOT NULL,\n    full_name TEXT NOT NULL,\n    phone TEXT,\n    dob DATE,\n    address TEXT,\n    parent_relationship TEXT DEFAULT 'Father',\n    parent_name TEXT,\n    alt_phone TEXT,\n    ug_degree TEXT,\n    department TEXT,\n    cgpa TEXT,\n    passing_year TEXT,\n    has_experience TEXT DEFAULT 'No',\n    experience_details TEXT,\n    purpose_to_join TEXT,\n    status TEXT NOT NULL DEFAULT 'New',\n    document_status TEXT NOT NULL DEFAULT 'Pending Review',\n    cohort TEXT DEFAULT 'January 2027 Intake',\n    decision_reason TEXT,\n    decided_by TEXT,\n    decided_at TIMESTAMPTZ,\n    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,\n    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL\n);`;
    navigator.clipboard.writeText(sqlContent);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo/test applications back to initial sample state?')) {
      resetMockData();
      loadApplications();
    }
  };

  return (
    <div className="admin-layout">
      {/* Left Navigation Sidebar (Starts from the very top of the screen: top 0, 100vh) */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        metrics={metrics}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={adminSignOut}
      />

      {/* Main Content & Top Header Wrap */}
      <div className="admin-main-wrap">
        {/* Sticky Top Navigation Bar (Starts from top: 0 to the right of sidebar) */}
        <AdminTopNav
          isSupabaseLive={isSupabaseLive}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        {/* Main Content Area */}
        <main className="admin-main-content">

          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW / DASHBOARD                               */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="admin-tab-pane">
              
              {/* Executive Hero Command Banner */}
              <div className="admin-hero-banner">
                <div className="hero-banner-glow-effect" />
                <div className="banner-content-wrap">
                  <div className="banner-text">
                    <div className="banner-badge-group">
                      <span className="banner-kicker-pill">
                        <span className="live-pulsing-dot" />
                        ADMISSIONS COMMAND CONSOLE
                      </span>
                      <span className="banner-cohort-pill">Active Cohort: January 2027</span>
                    </div>
                    <h2>Admissions Overview & Application Metrics</h2>
                    <p>
                      Track candidate submissions, review documents, and manage admissions decisions for the <strong>January 2027 Intake</strong>.
                    </p>
                    <div className="banner-quick-stats">
                      <div className="quick-stat-item">
                        <span className="quick-stat-val">{metrics.total}</span>
                        <span className="quick-stat-lbl">Total Candidates</span>
                      </div>
                      <div className="quick-stat-divider" />
                      <div className="quick-stat-item">
                        <span className="quick-stat-val highlight-amber">{metrics.newCount}</span>
                        <span className="quick-stat-lbl">Action Required</span>
                      </div>
                      <div className="quick-stat-divider" />
                      <div className="quick-stat-item">
                        <span className="quick-stat-val highlight-purple">{metrics.documentsPending}</span>
                        <span className="quick-stat-lbl">Docs in Queue</span>
                      </div>
                      <div className="quick-stat-divider" />
                      <div className="quick-stat-item">
                        <span className="quick-stat-val highlight-green">{metrics.total > 0 ? `${Math.round((metrics.accepted / metrics.total) * 100)}%` : '0%'}</span>
                        <span className="quick-stat-lbl">Acceptance Rate</span>
                      </div>
                    </div>
                  </div>
                  <div className="banner-actions">
                    <button
                      type="button"
                      className="btn btn-hero-primary"
                      onClick={() => {
                        setStatusFilter('New');
                        setActiveTab('applications');
                      }}
                    >
                      <ClockIcon size={16} />
                      <span>Review New Submissions</span>
                      <span className="hero-action-badge">{metrics.newCount}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-hero-secondary"
                      onClick={loadApplications}
                      title="Sync latest application data from Supabase"
                    >
                      <RefreshCwIcon size={16} className={loading ? 'spin-animation' : ''} />
                      <span>Refresh Data</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 6 Core Metric Cards in Balanced Responsive Grid */}
              <div className="admin-metrics-grid">
                
                {/* 1. Total Applications */}
                <div 
                  className="metric-card card-primary clickable"
                  onClick={() => handleCardClick('ALL')}
                  title="Click to view all applications"
                >
                  <div className="metric-header">
                    <span className="metric-label">Total Applications</span>
                    <span className="metric-icon-wrap primary">
                      <UsersIcon size={18} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <strong className="metric-value">{metrics.total}</strong>
                    <span className="metric-pill primary">100% Pipeline</span>
                  </div>
                  <span className="metric-sub">Total candidate submissions</span>
                  <div className="metric-bottom-bar primary" />
                </div>

                {/* 2. New Submissions */}
                <div 
                  className="metric-card card-info clickable"
                  onClick={() => handleCardClick('New')}
                  title="Click to filter New applications"
                >
                  <div className="metric-header">
                    <span className="metric-label">New Submissions</span>
                    <span className="metric-icon-wrap info">
                      <ClockIcon size={18} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <strong className="metric-value text-info">{metrics.newCount}</strong>
                    <span className="metric-pill info">{metrics.total > 0 ? Math.round((metrics.newCount / metrics.total) * 100) : 0}% of total</span>
                  </div>
                  <span className="metric-sub">Awaiting initial evaluation</span>
                  <div className="metric-bottom-bar info" />
                </div>

                {/* 3. Under Review */}
                <div 
                  className="metric-card card-warning clickable"
                  onClick={() => handleCardClick('Under Review')}
                  title="Click to filter applications Under Review"
                >
                  <div className="metric-header">
                    <span className="metric-label">Under Review</span>
                    <span className="metric-icon-wrap warning">
                      <BookOpenIcon size={18} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <strong className="metric-value text-warning">{metrics.underReview}</strong>
                    <span className="metric-pill warning">{metrics.total > 0 ? Math.round((metrics.underReview / metrics.total) * 100) : 0}% active</span>
                  </div>
                  <span className="metric-sub">Active committee review</span>
                  <div className="metric-bottom-bar warning" />
                </div>

                {/* 4. Document Review */}
                <div 
                  className="metric-card card-purple clickable"
                  onClick={() => {
                    setActiveTab('documents');
                  }}
                  title="Click to view Document Verification Queue"
                >
                  <div className="metric-header">
                    <span className="metric-label">Document Review</span>
                    <span className="metric-icon-wrap purple">
                      <BookOpenIcon size={18} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <strong className="metric-value text-purple">{metrics.documentsPending}</strong>
                    <span className="metric-pill purple">{metrics.total > 0 ? Math.round((metrics.documentsPending / metrics.total) * 100) : 0}% queue</span>
                  </div>
                  <span className="metric-sub">Applications moved to review</span>
                  <div className="metric-bottom-bar purple" />
                </div>

                {/* 5. Accepted */}
                <div 
                  className="metric-card card-success clickable"
                  onClick={() => handleCardClick('Accepted')}
                  title="Click to filter Accepted applications"
                >
                  <div className="metric-header">
                    <span className="metric-label">Accepted</span>
                    <span className="metric-icon-wrap success">
                      <CheckCircleIcon size={18} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <strong className="metric-value text-success">{metrics.accepted}</strong>
                    <span className="metric-pill success">{metrics.total > 0 ? Math.round((metrics.accepted / metrics.total) * 100) : 0}% confirmed</span>
                  </div>
                  <span className="metric-sub">Offers confirmed by committee</span>
                  <div className="metric-bottom-bar success" />
                </div>

                {/* 6. Declined */}
                <div 
                  className="metric-card card-danger clickable"
                  onClick={() => handleCardClick('Declined')}
                  title="Click to filter Declined applications"
                >
                  <div className="metric-header">
                    <span className="metric-label">Declined</span>
                    <span className="metric-icon-wrap danger">
                      <ShieldCheckIcon size={18} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <strong className="metric-value text-danger">{metrics.declined}</strong>
                    <span className="metric-pill danger">{metrics.total > 0 ? Math.round((metrics.declined / metrics.total) * 100) : 0}% archived</span>
                  </div>
                  <span className="metric-sub">With rejection decisions</span>
                  <div className="metric-bottom-bar danger" />
                </div>

              </div>

              {/* Quick Jump & Candidate Submissions Overview */}
              <div className="overview-subsections-grid">
                
                {/* Recent Submissions */}
                <div className="admin-content-card">
                  <div className="content-card-header">
                    <div className="card-header-title-wrap">
                      <h3>Recent Candidate Submissions</h3>
                      <span className="live-indicator-pill">Live Pipeline</span>
                    </div>
                    <button
                      type="button"
                      className="link-action-btn"
                      onClick={() => setActiveTab('applications')}
                    >
                      <span>View All ({applications.length})</span>
                      <ArrowRightIcon size={14} />
                    </button>
                  </div>

                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Applicant</th>
                          <th>Application Ref</th>
                          <th>UG Degree / Score</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.slice(0, 5).map(app => (
                          <tr key={app.id} className="admin-table-row">
                            <td>
                              <div className="applicant-cell">
                                <div className="applicant-avatar-circle" title={app.full_name}>
                                  {getInitials(app.full_name)}
                                </div>
                                <div className="applicant-info">
                                  <strong className="applicant-name">{app.full_name}</strong>
                                  <span className="cell-sub">{app.email}</span>
                                  {app.isMock && <TestDataBadge />}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="app-id-pill-wrap">
                                <code className="app-id-code">{app.application_id}</code>
                                <button
                                  type="button"
                                  className="copy-id-btn"
                                  onClick={(e) => handleCopyAppId(e, app.application_id)}
                                  title="Copy Application ID"
                                >
                                  {copiedAppId === app.application_id ? '✓' : <CopyIcon size={12} />}
                                </button>
                              </div>
                            </td>
                            <td>
                              <div className="academic-cell-wrap">
                                <span className="degree-text">{app.ug_degree || 'B.Tech / B.E.'}</span>
                                <span className="cgpa-badge">Score: <strong>{app.cgpa || 'N/A'}</strong></span>
                              </div>
                            </td>
                            <td>
                              <StatusBadge status={app.status} type="application" />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-table-review"
                                onClick={() => handleOpenDetail(app)}
                              >
                                <span>Review</span>
                                <ArrowRightIcon size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Intake Status & Governance Card */}
                <div className="admin-content-card side-summary-card">
                  <div className="content-card-header">
                    <div className="card-header-title-wrap">
                      <h3>Admissions Governance</h3>
                    </div>
                    <span className="cohort-mini-tag">Jan 2027</span>
                  </div>
                  
                  <div className="cycle-info-list">
                    <div className="cycle-info-item">
                      <span className="info-label">Active Cohort:</span>
                      <strong>January 2027 Intake</strong>
                    </div>
                    <div className="cycle-info-item">
                      <span className="info-label">Portal Status:</span>
                      <span className="status-live-chip">
                        <span className="live-dot" />
                        Applications Active
                      </span>
                    </div>
                    <div className="cycle-info-item vertical">
                      <div className="info-label-row">
                        <span className="info-label">Admissions Acceptance Rate:</span>
                        <strong className="text-primary font-bold">
                          {metrics.total > 0 ? `${Math.round((metrics.accepted / metrics.total) * 100)}%` : '0%'}
                        </strong>
                      </div>
                      <div className="progress-track-wrapper">
                        <div 
                          className="progress-fill-bar" 
                          style={{ width: `${metrics.total > 0 ? Math.min(100, Math.round((metrics.accepted / metrics.total) * 100)) : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="cycle-info-item">
                      <span className="info-label">Database Connection:</span>
                      <span className="db-connected-tag">
                        {isSupabaseLive ? '● Supabase PostgreSQL (Live)' : '○ Local Storage Fallback'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Step Workflow Pipeline */}
                  <div className="workflow-pipeline-box">
                    <span className="pipeline-title">ADMISSIONS EVALUATION PIPELINE</span>
                    <div className="pipeline-flow">
                      <div className="flow-step">
                        <span className="step-num step-1">1</span>
                        <span className="step-text">New</span>
                      </div>
                      <span className="flow-arrow">›</span>
                      <div className="flow-step">
                        <span className="step-num step-2">2</span>
                        <span className="step-text">Review</span>
                      </div>
                      <span className="flow-arrow">›</span>
                      <div className="flow-step">
                        <span className="step-num step-3">3</span>
                        <span className="step-text">Docs</span>
                      </div>
                      <span className="flow-arrow">›</span>
                      <div className="flow-step">
                        <span className="step-num step-4">4</span>
                        <span className="step-text">Verified</span>
                      </div>
                      <span className="flow-arrow">›</span>
                      <div className="flow-step">
                        <span className="step-num step-5">5</span>
                        <span className="step-text">Offer</span>
                      </div>
                    </div>
                    <p className="pipeline-note">
                      All candidate applications follow MSIT's structured evaluation protocol with mandatory document verification and academic committee approval.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: APPLICATIONS (TABLE, SEARCH & FILTERS)             */}
          {/* ========================================================= */}
          {activeTab === 'applications' && (
            <div className="admin-tab-pane">
              
              <div className="pane-header-row">
                <div>
                  <h2>Application Management</h2>
                  <p className="pane-sub">
                    Filter, search, review, and update statuses of all submitted candidate applications.
                  </p>
                </div>
                <div className="pane-header-actions">
                  <span className="count-pill">{filteredApplications.length} of {applications.length} Applications</span>
                </div>
              </div>

              {/* Search & Filter Controls Bar */}
              <div className="filter-controls-card">
                
                {/* Search Input */}
                <div className="search-bar-group">
                  <input
                    type="text"
                    className="form-input-control search-input"
                    placeholder="Search by candidate name, email, or Application ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="filters-row">
                  
                  {/* Status filter */}
                  <div className="filter-item">
                    <label htmlFor="statusFilterSelect">Application Status:</label>
                    <select
                      id="statusFilterSelect"
                      className="form-select-control"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="New">New</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Scheduled for MSIT PGEE Exam">Scheduled for MSIT PGEE Exam</option>
                      <option value="Documents Pending">Documents Pending</option>
                      <option value="Documents Verified">Documents Verified</option>
                      <option value="Additional Information Required">Action Required</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  {/* Document filter */}
                  <div className="filter-item">
                    <label htmlFor="docFilterSelect">Document Status:</label>
                    <select
                      id="docFilterSelect"
                      className="form-select-control"
                      value={docFilter}
                      onChange={e => setDocFilter(e.target.value)}
                    >
                      <option value="ALL">All Document States</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Partially Verified">Partially Verified</option>
                      <option value="Verified">Verified</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="filter-item">
                    <label htmlFor="sortBySelect">Sort By:</label>
                    <select
                      id="sortBySelect"
                      className="form-select-control"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                    >
                      <option value="newest">Submission Date (Newest First)</option>
                      <option value="oldest">Submission Date (Oldest First)</option>
                      <option value="cgpa">CGPA (Highest First)</option>
                      <option value="name">Applicant Name (A-Z)</option>
                    </select>
                  </div>

                  {/* Reset Filters */}
                  {(searchQuery || statusFilter !== 'ALL' || docFilter !== 'ALL') && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm reset-filter-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                        setDocFilter('ALL');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}

                </div>
              </div>

              {/* Applications Data Table */}
              <div className="admin-content-card table-card">
                {filteredApplications.length === 0 ? (
                  <div className="empty-state-box">
                    <UsersIcon size={44} />
                    <h3>No Applications Match Your Filters</h3>
                    <p>Try clearing your search query or adjusting your status and document filters.</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                        setDocFilter('ALL');
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Applicant Name & Email</th>
                          <th>Application ID</th>
                          <th>Application Date</th>
                          <th title="Qualifying Degree (16-Year Education) Score & Certificate">DEG</th>
                          <th title="Class 10 / SSC Score & Certificate">10</th>
                          <th title="Class 12 / Intermediate Score & Certificate">12</th>
                          <th title="GRE / Entrance Exam Score">GR</th>
                          <th>Application Status</th>
                          <th>Document Status</th>
                          <th>Last Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map(app => (
                          <tr key={app.id}>
                            <td>
                              <div className="applicant-cell">
                                <strong className="applicant-name">{app.full_name}</strong>
                                <span className="cell-sub">{app.email}</span>
                                {app.isMock && <TestDataBadge />}
                              </div>
                            </td>
                            <td>
                              <code className="app-id-tag">{app.application_id}</code>
                            </td>
                            <td>
                              <span className="date-main">
                                {new Date(app.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="cell-sub">
                                {new Date(app.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>

                            {/* BTX Column */}
                            <td className="acad-col-cell">
                              <div className="acad-col-content">
                                <strong className="acad-col-score">{app.cgpa || 'NA'}</strong>
                                <button
                                  type="button"
                                  className="acad-cert-btn"
                                  title="View BTX Certificate"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCertificate(app, 'btech');
                                  }}
                                >
                                  <FileTextIcon size={12} />
                                  <span>View Certificate</span>
                                </button>
                              </div>
                            </td>

                            {/* 10 Column */}
                            <td className="acad-col-cell">
                              <div className="acad-col-content">
                                <strong className={`acad-col-score ${!app.class10_score ? 'acad-score-na' : ''}`}>
                                  {app.class10_score || 'NA'}
                                </strong>
                                <button
                                  type="button"
                                  className="acad-cert-btn"
                                  title="View 10th Certificate"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCertificate(app, '10th');
                                  }}
                                >
                                  <FileTextIcon size={12} />
                                  <span>View Certificate</span>
                                </button>
                              </div>
                            </td>

                            {/* 12 Column */}
                            <td className="acad-col-cell">
                              <div className="acad-col-content">
                                <strong className={`acad-col-score ${!app.inter_score ? 'acad-score-na' : ''}`}>
                                  {app.inter_score || 'NA'}
                                </strong>
                                <button
                                  type="button"
                                  className="acad-cert-btn"
                                  title="View 12th Certificate"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCertificate(app, '12th');
                                  }}
                                >
                                  <FileTextIcon size={12} />
                                  <span>View Certificate</span>
                                </button>
                              </div>
                            </td>

                            {/* GR Column */}
                            <td className="acad-col-cell">
                              <div className="acad-col-content">
                                {(app.gre_score || app.gate_score) ? (
                                  <>
                                    <strong className="acad-col-score acad-score-highlight">
                                      {app.gre_score || app.gate_score}
                                    </strong>
                                    <button
                                      type="button"
                                      className="acad-cert-btn"
                                      title="View GR Official Scorecard"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenCertificate(app, 'gr');
                                      }}
                                    >
                                      <FileTextIcon size={12} />
                                      <span>View Certificate</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="acad-col-score acad-score-na">NA</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <StatusBadge status={app.status} type="application" />
                            </td>
                            <td>
                              <StatusBadge status={app.document_status} type="document" />
                            </td>
                            <td>
                              <span className="cell-sub">
                                {new Date(app.updated_at || app.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenDetail(app)}
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: DOCUMENTS REVIEW QUEUE                             */}
          {/* ========================================================= */}
          {activeTab === 'documents' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2>Document Verification Queue</h2>
                  <p className="pane-sub">
                    Direct access to verify undergraduate transcripts, degree certificates, and identification proof.
                  </p>
                </div>
              </div>

              <div className="admin-content-card">
                <div className="doc-queue-banner">
                  <p>
                    Candidates requiring document verification: <strong>{documentQueueApplications.length}</strong>.
                    Click "Inspect & Verify" on any candidate to review their individual uploaded files.
                  </p>
                </div>

                {documentQueueApplications.length === 0 ? (
                  <div className="admin-empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
                    <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: 600 }}>
                      No Applications in Document Review
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
                      Only applications that are clicked on <strong>“Move to Review”</strong> go to document review. All other submissions remain visible as applications only in the <strong>Applications</strong> tab.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setActiveTab('applications')}
                    >
                      View All Applications
                    </button>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Candidate Name</th>
                          <th>Application ID</th>
                          <th>Degree / Department</th>
                          <th>Document Verification State</th>
                          <th>Documents Attached</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documentQueueApplications.map(app => {
                          const rawDocs = app.documents;
                          const docs = Array.isArray(rawDocs)
                            ? rawDocs.filter(Boolean)
                            : (rawDocs && typeof rawDocs === 'object')
                              ? Object.values(rawDocs).filter(d => d && typeof d === 'object')
                              : [];
                          const verifiedCount = docs.filter(d => d && d.status === 'Verified').length;
                          return (
                            <tr key={app.id}>
                              <td>
                                <div className="applicant-cell">
                                  <strong>{app.full_name}</strong>
                                  <span className="cell-sub">{app.email}</span>
                                  {app.isMock && <TestDataBadge />}
                                </div>
                              </td>
                              <td><code>{app.application_id}</code></td>
                              <td>
                                <span>{app.ug_degree}</span>
                                <span className="cell-sub">{app.department}</span>
                              </td>
                              <td>
                                <StatusBadge status={app.document_status} type="document" />
                              </td>
                              <td>
                                <span className="doc-count-pill">
                                  {verifiedCount} / {docs.length} Verified
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleOpenDetail(app)}
                                >
                                  Inspect & Verify
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: REPORTS / ANALYTICS                                */}
          {/* ========================================================= */}
          {activeTab === 'reports' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2>Admissions Analytics & Demographics</h2>
                  <p className="pane-sub">
                    High-level aggregate statistics across applicants for the January 2027 Cohort.
                  </p>
                </div>
              </div>

              <div className="analytics-grid">
                
                {/* 1. Degree & Branch distribution */}
                <div className="admin-content-card">
                  <div className="card-header-with-badge">
                    <h3>Qualifying Degree & Discipline Breakdown</h3>
                    <span className="status-badge status-badge-success">
                      <span className="status-badge-dot"></span>
                      16 Years Formal Education
                    </span>
                  </div>

                  {/* Mandatory Degree Gate Highlight */}
                  <div className="degree-eligibility-highlight">
                    <div className="degree-eligibility-top">
                      <span className="degree-pill-tag">
                        <span>🎯</span> 16 Years Formal Education Gate
                      </span>
                      <span className="degree-pill-stat">
                        {applications.length > 0 ? `${applications.length} of ${applications.length} (100%)` : '0 (0%)'}
                      </span>
                    </div>
                    <div className="progress-track" style={{ height: '6px' }}>
                      <div className="progress-fill success" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="analytics-subheading">Qualifying Degree / Education Domain Breakdown</div>
                  <div className="stat-bars-list" style={{ marginTop: '0.25rem' }}>
                    {[
                      {
                        id: 'btech',
                        label: 'B.Tech / B.E.',
                        color: 'primary',
                        match: a => {
                          const deg = (a.ug_degree || a.ugDegree || '').toLowerCase();
                          const dept = (a.department || '').toLowerCase();
                          if (/mca|m\.?sc|b\.?sc|bca|b\.?s\b/i.test(deg)) return false;
                          return /b\.?tech|b\.?e\b/i.test(deg) || (!deg && !/mca|m\.?sc|b\.?sc|bca/i.test(dept));
                        }
                      },
                      {
                        id: 'bsc',
                        label: 'B.Sc / BCA (16-Year Pathway)',
                        color: 'purple',
                        match: a => {
                          const deg = (a.ug_degree || a.ugDegree || '').toLowerCase();
                          const dept = (a.department || '').toLowerCase();
                          if (/mca|m\.?sc/i.test(deg)) return false;
                          return /b\.?sc|bca/i.test(deg) || (!deg && /b\.?sc|bca/i.test(dept));
                        }
                      },
                      {
                        id: 'mca',
                        label: 'MCA (Master of Computer Applications)',
                        color: 'info',
                        match: a => {
                          const deg = (a.ug_degree || a.ugDegree || '').toLowerCase();
                          const dept = (a.department || '').toLowerCase();
                          return /mca/i.test(deg) || (!deg && /mca/i.test(dept));
                        }
                      },
                      {
                        id: 'msc',
                        label: 'M.Sc (Computer Science / IT / Mathematics)',
                        color: 'warning',
                        match: a => {
                          const deg = (a.ug_degree || a.ugDegree || '').toLowerCase();
                          const dept = (a.department || '').toLowerCase();
                          return /m\.?sc|master of science/i.test(deg) || (!deg && /m\.?sc/i.test(dept));
                        }
                      },
                      {
                        id: 'bs_other',
                        label: 'B.S. & Other Accepted Degree Pathways',
                        color: 'teal',
                        match: a => {
                          const deg = (a.ug_degree || a.ugDegree || '').toLowerCase();
                          return /b\.?s\b|other/i.test(deg);
                        }
                      }
                    ].map(br => {
                      const count = applications.filter(a => br.match(a)).length;
                      const pct = applications.length > 0 ? Math.round((count / applications.length) * 100) : 0;
                      return (
                        <div key={br.label} className="stat-bar-item">
                          <div className="bar-labels">
                            <span>{br.label}</span>
                            <strong>{count} ({pct}%)</strong>
                          </div>
                          <div className="progress-track">
                            <div className={`progress-fill ${br.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Application Funnel Status */}
                <div className="admin-content-card">
                  <div className="card-header-with-badge">
                    <h3>Admissions Status Funnel</h3>
                    <span className="status-badge status-badge-info">
                      <span className="status-badge-dot"></span>
                      {applications.length} Candidates
                    </span>
                  </div>
                  <div className="stat-bars-list">
                    {[
                      { label: 'New Submissions', count: metrics.newCount, color: 'info' },
                      { label: 'Under Review', count: metrics.underReview, color: 'warning' },
                      { label: 'Accepted', count: metrics.accepted, color: 'success' },
                      { label: 'Declined', count: metrics.declined, color: 'danger' }
                    ].map(st => {
                      const pct = applications.length > 0 ? Math.round((st.count / applications.length) * 100) : 0;
                      return (
                        <div key={st.label} className="stat-bar-item">
                          <div className="bar-labels">
                            <span>{st.label}</span>
                            <strong>{st.count} ({pct}%)</strong>
                          </div>
                          <div className="progress-track">
                            <div className={`progress-fill ${st.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Work Experience breakdown */}
                <div className="admin-content-card">
                  <div className="card-header-with-badge">
                    <h3>Work Experience Breakdown</h3>
                    <span className="status-badge status-badge-neutral">
                      <span className="status-badge-dot"></span>
                      Cohort Mix
                    </span>
                  </div>
                  <div className="experience-stat-row">
                    <div className="exp-stat-box">
                      <span className="exp-num">
                        {applications.filter(a => a.has_experience === 'No').length}
                      </span>
                      <span className="exp-label">Fresh Graduates (Fresher)</span>
                    </div>
                    <div className="exp-stat-box">
                      <span className="exp-num text-primary">
                        {applications.filter(a => a.has_experience === 'Yes').length}
                      </span>
                      <span className="exp-label">Experienced Professionals</span>
                    </div>
                  </div>
                  {(() => {
                    const freshers = applications.filter(a => a.has_experience === 'No').length;
                    const experienced = applications.filter(a => a.has_experience === 'Yes').length;
                    const fPct = applications.length > 0 ? Math.round((freshers / applications.length) * 100) : 0;
                    const ePct = applications.length > 0 ? 100 - fPct : 0;
                    return (
                      <div style={{ marginTop: '1.25rem' }}>
                        <div className="progress-track" style={{ height: '8px', display: 'flex' }}>
                          <div style={{ width: `${fPct}%`, background: '#0284c7', height: '100%' }} />
                          <div style={{ width: `${ePct}%`, background: 'var(--primary-700)', height: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginTop: '0.4rem' }}>
                          <span>● Freshers ({fPct}%)</span>
                          <span>● Experienced Professionals ({ePct}%)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 4. Cohort Governance & Compliance Summary */}
                <div className="admin-content-card">
                  <div className="card-header-with-badge">
                    <h3>Governance & Reporting Notice</h3>
                    <span className="status-badge status-badge-success">
                      <span className="status-badge-dot"></span>
                      Live Sync
                    </span>
                  </div>
                  <div className="compliance-card-body">
                    <div className="compliance-item">
                      <span className="compliance-icon">🎯</span>
                      <div>
                        <strong>16-Year Formal Education Gate:</strong> Applicants must have completed at least 16 years of formal education (e.g. 4-year B.Tech / B.E. / B.S., or equivalent Master's degree pathways like MCA). Candidates from engineering, computing, and allied technical backgrounds are eligible.
                      </div>
                    </div>
                    <div className="compliance-item">
                      <span className="compliance-icon">⚡</span>
                      <div>
                        <strong>Real-time Pipeline Sync:</strong> Aggregate statistics calculate dynamically from verified applicant records and admissions committee actions.
                      </div>
                    </div>
                    <div className="compliance-item">
                      <span className="compliance-icon">🏛️</span>
                      <div>
                        <strong>January 2027 Cohort:</strong> Live admissions evaluation cycle with document verification and provisional offers actively processing.
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: SETTINGS & DATABASE SETUP                          */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2>Admin Settings & Supabase Setup</h2>
                  <p className="pane-sub">
                    Database schema helper, authorized test accounts, and development controls.
                  </p>
                </div>
              </div>

              <div className="settings-grid">
                
                {/* Live Admission Process & Recommended Next Action Configuration */}
                <div className="admin-content-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="content-card-header">
                    <div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                        Admission Cycle & Recommended Next Action Settings
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                        Configure key admission milestones, evaluation modes, and onboarding details. Updates sync automatically to all prospective-student dashboards.
                      </p>
                    </div>
                    {settingsSavedSuccess && (
                      <span className="status-badge status-badge-success" style={{ padding: '0.4rem 0.85rem' }}>
                        <CheckCircleIcon size={14} />
                        Saved & Synced!
                      </span>
                    )}
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSavingSettings(true);
                      try {
                        const saved = await saveAdmissionSettings(admissionSettings);
                        setAdmissionSettings(saved);
                        setSettingsSavedSuccess(true);
                        setTimeout(() => setSettingsSavedSuccess(false), 4000);
                      } catch (err) {
                        console.error('Failed to save admission settings:', err);
                      } finally {
                        setSavingSettings(false);
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Cohort Intake Title
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={admissionSettings.cohort || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, cohort: e.target.value }))}
                          placeholder="e.g. January 2027 Intake"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Application Start Date
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={admissionSettings.applicationStartDate || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, applicationStartDate: e.target.value }))}
                          placeholder="e.g. October 1, 2026"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Application Deadline
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={admissionSettings.applicationDeadline || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                          placeholder="e.g. November 30, 2026"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Admission Evaluation Modes
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={admissionSettings.admissionModes || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, admissionModes: e.target.value }))}
                          placeholder="e.g. GRE, GATE, or MSIT Exam"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          MSIT PGEE Examination Date (For Candidates Without GRE/GATE)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={admissionSettings.gatExamDate || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, gatExamDate: e.target.value }))}
                          placeholder="e.g. December 15, 2026"
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Technical Interview Timeline
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={admissionSettings.interviewSchedule || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, interviewSchedule: e.target.value }))}
                          placeholder="e.g. TBD (Announced post shortlisting)"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Batch Commencement Date
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={admissionSettings.commencementDate || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, commencementDate: e.target.value }))}
                          placeholder="e.g. January 2, 2027"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Onboarding Venue
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={admissionSettings.commencementVenue || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, commencementVenue: e.target.value }))}
                          placeholder="e.g. IIIT Hyderabad"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Evaluation Mode Card Description
                        </label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={admissionSettings.admissionModesDesc || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, admissionModesDesc: e.target.value }))}
                          placeholder="Description for Step 2 card"
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Interview & Counselling Card Instructions
                        </label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={admissionSettings.interviewInstructions || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, interviewInstructions: e.target.value }))}
                          placeholder="Description for Step 3 card"
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                          Onboarding Instructions Card Description
                        </label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={admissionSettings.onboardingInstructions || ''}
                          onChange={(e) => setAdmissionSettings(prev => ({ ...prev, onboardingInstructions: e.target.value }))}
                          placeholder="Description for Step 4 card"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                        Recommended Next Action Subtitle (Overview Banner)
                      </label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={admissionSettings.nextActionDesc || ''}
                        onChange={(e) => setAdmissionSettings(prev => ({ ...prev, nextActionDesc: e.target.value }))}
                        placeholder="Overview summary banner shown above the action cards"
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setAdmissionSettings(DEFAULT_ADMISSION_SETTINGS)}
                      >
                        Reset to Defaults
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={savingSettings}
                        style={{ minWidth: '180px', justifyContent: 'center' }}
                      >
                        {savingSettings ? 'Saving Settings...' : 'Save Admission Settings'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Supabase Schema Box */}
                <div className="admin-content-card">
                  <div className="content-card-header">
                    <h3>Supabase Schema Setup Script</h3>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleCopySql}
                    >
                      {sqlCopied ? 'Copied to Clipboard!' : 'Copy SQL Script'}
                    </button>
                  </div>
                  <p>
                    Run the SQL migration script in your Supabase SQL Editor to establish tables (<code>applications</code>, <code>admin_users</code>, <code>application_documents</code>, <code>application_notes</code>, <code>application_status_history</code>) with full Row Level Security.
                  </p>
                  <div className="code-snippet-box">
                    <pre>
{`-- Full script available in src/lib/adminSchema.sql
CREATE TABLE IF NOT EXISTS public.admin_users (...);
CREATE TABLE IF NOT EXISTS public.applications (...);
CREATE TABLE IF NOT EXISTS public.application_documents (...);
CREATE TABLE IF NOT EXISTS public.application_notes (...);
CREATE TABLE IF NOT EXISTS public.application_status_history (...);`}
                    </pre>
                  </div>
                </div>

                {/* Dev Mode & Test Accounts */}
                <div className="admin-content-card">
                  <h3>Development & Testing Authorization</h3>
                  <div className="dev-account-details">
                    <div className="detail-line">
                      <span>Authorization Mode:</span>
                      <strong className="text-warning">TEMPORARY — DEV / TESTING ONLY</strong>
                    </div>
                    <div className="detail-line">
                      <span>Authorized Domains:</span>
                      <code>@msitprogram.net</code>, <code>@getskills.io</code>
                    </div>
                    <div className="detail-line">
                      <span>Primary Test Account:</span>
                      <code>{testAccountEmail}</code>
                    </div>
                    <div className="detail-line">
                      <span>Authentication Method:</span>
                      <strong>6-Digit Security Code (OTP)</strong>
                    </div>
                  </div>

                  <div className="settings-actions-box">
                    <h4>Demo Data Management</h4>
                    <p>Reset mock test applications back to the initial sample state for demonstration:</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleResetData}
                    >
                      Reset Mock Test Data
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* Application Detail Modal */}
      <ApplicationDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        application={selectedApp}
        onApplicationUpdated={handleApplicationUpdated}
      />

      {/* Certificate & Document Viewer Modal */}
      <CertificateModal
        isOpen={viewingDocModal.isOpen}
        onClose={() => setViewingDocModal({ isOpen: false, application: null, initialDocType: 'btech' })}
        application={viewingDocModal.application}
        initialDocType={viewingDocModal.initialDocType}
      />

    </div>
  );
}
