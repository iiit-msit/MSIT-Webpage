import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentDisplayName } from '../utils/userUtils';
import { ArrowRightIcon, XIcon, UserIcon, ShieldCheckIcon } from './Icons';
import AuthFlow from './AuthFlow';

// Import New Vertical Sections
import ExploreHero from './explore/ExploreHero';
import ExploreWhatIsMSIT from './explore/ExploreWhatIsMSIT';
import ExploreWhyMSIT from './explore/ExploreWhyMSIT';
import ExploreWhoIsFor from './explore/ExploreWhoIsFor';
import ExplorePedagogy from './explore/ExplorePedagogy';
import ExploreCurriculum from './explore/ExploreCurriculum';
import ExploreResearch from './explore/ExploreResearch';
import ExploreCampus from './explore/ExploreCampus';
import ExploreCareerOutcomes from './explore/ExploreCareerOutcomes';
import ExploreAdmissions from './explore/ExploreAdmissions';
import Footer from './Footer';

export default function KnowAboutMSITPage({ onBack, onGoToSignIn }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();

  // Registration / Sign In modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-open modal if requested via URL query params
  useEffect(() => {
    if (searchParams.get('register') === 'true' || searchParams.get('login') === 'true') {
      setShowAuthModal(true);
    }
  }, [searchParams]);

  // Auto-redirect to Student Dashboard if candidate arrives via an authentication magic link
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (
        hash.includes('access_token') ||
        hash.includes('type=magiclink') ||
        hash.includes('type=signup') ||
        hash.includes('type=recovery')
      ) {
        const timer = setTimeout(() => {
          navigate('/programme', { replace: true });
        }, 350);
        return () => clearTimeout(timer);
      } else {
        const anchorId = hash.replace('#', '');
        if (anchorId) {
          const scrollTimer = setTimeout(() => {
            const el = document.getElementById(anchorId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
          return () => clearTimeout(scrollTimer);
        }
      }
    }
  }, [navigate]);

  // Mobile navigation drawer state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile nav on resize above breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleApplyClick = () => {
    if (user) {
      navigate('/programme');
    } else if (onGoToSignIn) {
      onGoToSignIn();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
  };

  const displayName = user ? getStudentDisplayName(user) : '';

  return (
    <div className="explore-page-root">
      {/* Top Navigation Bar */}
      <header className="explore-top-nav" role="banner">
        <div className="explore-nav-brand-group">
          {onBack && (
            <button className="btn btn-icon-only explore-back-btn" onClick={onBack} aria-label="Go Back">
              <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
                <ArrowRightIcon size={18} />
              </span>
              <span className="back-text">Back</span>
            </button>
          )}

          <a href="#what-is-msit" className="explore-brand-link" aria-label="MSIT Home" onClick={() => setMobileNavOpen(false)}>
            <img src="/assets/msit-logo.png" alt="MSIT Logo" className="explore-header-logo" width="46" height="46" />
            <div className="explore-brand-text">
              <span className="explore-brand-title">MSIT</span>
              <span className="explore-brand-sub">Consortium of Institutions of Higher Learning</span>
            </div>
          </a>
        </div>
        
        <nav className="explore-inpage-nav" aria-label="Page Sections">
          <a href="#what-is-msit">Overview</a>
          <a href="#t-shaped-curriculum">Curriculum</a>
          <a href="#campus-life">Campus Life</a>
          <a href="#admission-journey">Admissions</a>
        </nav>

        <div className="explore-nav-actions">
          {user ? (
            <div className="explore-auth-user-row">
              <div 
                className="explore-user-badge" 
                title={`Signed in as ${displayName} (${user.email})`}
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMobileNavOpen(!mobileNavOpen); }}
              >
                <span className="explore-user-avatar">{displayName.charAt(0).toUpperCase()}</span>
                <span className="explore-user-name">{displayName}</span>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm explore-dashboard-btn"
                onClick={() => navigate('/programme')}
              >
                <span className="explore-dashboard-label-full">Student Dashboard</span>
                <span className="explore-dashboard-label-short">Dashboard</span>
                <ArrowRightIcon size={14} />
              </button>
              <button
                type="button"
                className="explore-signout-link explore-signout-desktop"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="explore-guest-actions">
              <button
                type="button"
                className="explore-signin-text-btn"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm explore-register-btn"
                onClick={handleApplyClick}
              >
                <span className="explore-register-label-full">Register Interest / Apply</span>
                <span className="explore-register-label-short">Apply</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            className={`explore-mobile-menu-toggle ${mobileNavOpen ? 'open' : ''}`}
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Dropdown & Backdrop */}
      {mobileNavOpen && (
        <div 
          className="explore-mobile-backdrop" 
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className={`explore-mobile-drawer ${mobileNavOpen ? 'open' : ''}`} aria-hidden={!mobileNavOpen}>
        <div className="explore-mobile-drawer-inner">
          {user && (
            <div className="explore-mobile-user-card">
              <div className="explore-mobile-user-info">
                <span className="explore-user-avatar large">{displayName.charAt(0).toUpperCase()}</span>
                <div className="explore-mobile-user-text">
                  <span className="explore-mobile-user-name">{displayName}</span>
                  <span className="explore-mobile-user-email">{user.email}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm explore-mobile-action-btn"
                onClick={() => {
                  setMobileNavOpen(false);
                  navigate('/programme');
                }}
              >
                <span>Go to Student Dashboard</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>
          )}

          <nav className="explore-mobile-inpage-nav" aria-label="Mobile Navigation Links">
            <a 
              href="#what-is-msit" 
              onClick={() => setMobileNavOpen(false)}
            >
              Overview
            </a>
            <a 
              href="#t-shaped-curriculum" 
              onClick={() => setMobileNavOpen(false)}
            >
              Curriculum
            </a>
            <a 
              href="#campus-life" 
              onClick={() => setMobileNavOpen(false)}
            >
              Campus Life
            </a>
            <a 
              href="#admission-journey" 
              onClick={() => setMobileNavOpen(false)}
            >
              Admissions
            </a>
          </nav>

          <div className="explore-mobile-drawer-footer">
            {user ? (
              <button
                type="button"
                className="explore-mobile-signout-btn"
                onClick={() => {
                  setMobileNavOpen(false);
                  handleSignOut();
                }}
              >
                Sign Out
              </button>
            ) : (
              <div className="explore-mobile-guest-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setMobileNavOpen(false);
                    setShowAuthModal(true);
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setMobileNavOpen(false);
                    handleApplyClick();
                  }}
                >
                  <span>Register Interest / Apply</span>
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Public Content */}
      <main className="explore-main-content">
        <ExploreHero onGoToSignIn={handleApplyClick} />
        <ExploreWhatIsMSIT />
        <ExploreWhyMSIT />
        <ExploreWhoIsFor />
        <ExplorePedagogy />
        <ExploreCurriculum />
        <ExploreResearch />
        <ExploreCampus />
        <ExploreCareerOutcomes />
        <ExploreAdmissions onGoToSignIn={handleApplyClick} />
        <Footer onGoToSignIn={handleApplyClick} />
      </main>

      {/* Candidate Registration / Magic Link Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div
            className="auth-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <button
              type="button"
              className="auth-modal-close-btn"
              onClick={() => setShowAuthModal(false)}
              aria-label="Close registration modal"
            >
              <XIcon size={20} />
            </button>
            <div className="auth-modal-body">
              <AuthFlow />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
