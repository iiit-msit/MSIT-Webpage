import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth, isAuthorizedAdminEmail } from '../../context/AdminAuthContext';
import { MailIcon, LoaderIcon, ArrowRightIcon, LockIcon } from '../../components/Icons';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminUser, isAdmin, requestAdminMagicLink } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If already authorized, automatically route to /admin/dashboard
  useEffect(() => {
    if (adminUser && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [adminUser, isAdmin, navigate]);

  // Parse error parameters from URL hash or query if redirected with error
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    const search = window.location.search;

    const parseParams = (str) => {
      const clean = str.replace(/^[#?]/, '');
      return new URLSearchParams(clean);
    };

    const hashParams = parseParams(hash);
    const searchParams = parseParams(search);

    const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');
    const errorCode = hashParams.get('error_code') || searchParams.get('error_code');

    if (errorCode === 'otp_expired' || (errorDesc && errorDesc.toLowerCase().includes('expired'))) {
      setError('The verification link has expired or has already been used. Please request a new one.');
      window.history.replaceState(null, '', window.location.pathname);
    } else if (errorDesc) {
      setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your administrator email address.');
      return;
    }

    if (!isAuthorizedAdminEmail(cleanEmail)) {
      setError('Access Restricted: Only authorized accounts (@msitprogram.net or @getskills.io) have access to the Admin Dashboard.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      localStorage.setItem('msit_auth_intent', 'admin');
      sessionStorage.setItem('msit_auth_intent', 'admin');
    } catch (e) {}

    try {
      const { error: reqError } = await requestAdminMagicLink(cleanEmail);
      if (reqError) {
        setError(reqError.message || 'Failed to dispatch magic link. Please check your connection and retry.');
      } else {
        setIsSent(true);
        setResendCooldown(60);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        
        {/* Brand Header */}
        <div className="admin-login-header">
          <img 
            src="/assets/msit-logo.png" 
            alt="MSIT Logo" 
            className="admin-login-logo" 
          />
          <div className="admin-login-title-wrap">
            <h2>MSIT Admin Portal</h2>
            <p className="admin-login-sub">Admissions Management System</p>
          </div>
        </div>

        {isSent ? (
          <div className="admin-login-sent-state">
            <div className="sent-icon-badge">
              <MailIcon size={32} />
            </div>
            <h3>Check Your Inbox</h3>
            <p className="sent-desc">
              We dispatched an authorized Magic Link directly to:
            </p>
            <div className="sent-email-box">
              <code>{email}</code>
            </div>
            <p className="sent-hint">
              Open your email and click the magic link to sign in to the MSIT Admissions Admin Console. You will be automatically redirected to your dashboard.
            </p>

            <div className="sent-actions" style={{ marginTop: '1.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSubmit}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend Magic Link (${resendCooldown}s)` : 'Resend Magic Link'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsSent(false);
                  setEmail('');
                }}
              >
                Use Different Email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
            
            <div className="form-field-group">
              <label htmlFor="adminEmail">Administrator Email Address <span className="req">*</span></label>
              <div className="input-with-icon">
                <MailIcon size={18} className="field-icon" />
                <input
                  id="adminEmail"
                  type="email"
                  className={`form-input-control ${error ? 'has-error' : ''}`}
                  placeholder="name@msitprogram.net or name@getskills.io"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  required
                />
              </div>
              {error && <span className="field-err-msg">{error}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block admin-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderIcon size={18} />
                  <span>Sending Magic Link...</span>
                </>
              ) : (
                <>
                  <span>Send Admin Magic Link</span>
                  <ArrowRightIcon size={18} />
                </>
              )}
            </button>

            <div className="admin-login-footer-info">
              <LockIcon size={14} />
              <span>Protected portal. Unauthorized access attempts are monitored and logged.</span>
            </div>

          </form>
        )}

        <div className="admin-login-links">
          <button 
            type="button" 
            className="back-to-site-link"
            onClick={() => navigate('/')}
          >
            ← Return to MSIT Public Website
          </button>
        </div>

      </div>
    </div>
  );
}
