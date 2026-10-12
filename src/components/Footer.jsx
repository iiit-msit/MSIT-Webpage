import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MailIcon, 
  PhoneIcon, 
  MapPinIcon, 
  ChevronUpIcon
} from './Icons';

export default function Footer({ onGoToSignIn }) {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToTop = () => {
    const root = document.querySelector('.explore-page-root');
    if (root) {
      root.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAcademicLinkClick = (e, sectionId) => {
    e.preventDefault();
    const targetId = sectionId;
    if (location.pathname === '/') {
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.history.pushState) {
          window.history.pushState(null, null, `#${targetId}`);
        }
        return;
      }
    }
    if (targetId === 'real-world-practicum') {
      if (location.pathname === '/programme') {
        const elem = document.getElementById(targetId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (window.history.pushState) {
            window.history.pushState(null, null, `#${targetId}`);
          }
          return;
        }
      }
      navigate(`/programme#${targetId}`);
    } else {
      navigate(`/#${targetId}`);
    }
  };

  return (
    <footer className="site-footer" id="site-footer">
      <div className="footer-main-wrap">
        <div className="footer-container">
          
          {/* Main 3-Column Directory Grid */}
          <div className="footer-links-grid">
            
            {/* Column 1: Brand & Heritage */}
            <div className="footer-column footer-brand-column">
              <div className="footer-brand-badge-wrap">
                <img 
                  src="/assets/msit-logo.png" 
                  alt="MSIT Logo" 
                  className="footer-logo-main" 
                />
              </div>
              <h3 className="footer-brand-title">Consortium of Institutions of Higher Learning</h3>
              <div className="footer-programme-tag">
                Master of Science in Information Technology (MSIT)
              </div>
              <p className="footer-heritage-desc">
                Conceived in 2001 in collaboration with Carnegie Mellon University (CMU) under the guidance of Turing Laureate Prof. Raj Reddy. Headquartered at IIIT Hyderabad.
              </p>
              <div className="footer-credential-pill">
                <img 
                  src="/assets/iiit-logo.jpg" 
                  alt="IIIT Hyderabad Logo" 
                  className="footer-iiit-logo" 
                />
              </div>
            </div>

            {/* Column 2: Academic Architecture */}
            <div className="footer-column footer-nav-column">
              <h4>Academic Architecture</h4>
              <ul className="footer-nav-list">
                <li>
                  <a href="/#what-is-msit" onClick={(e) => handleAcademicLinkClick(e, 'what-is-msit')}>
                    <span className="nav-bullet"></span>
                    <span>Programme Overview</span>
                  </a>
                </li>
                <li>
                  <a href="/#pedagogy-foundations" onClick={(e) => handleAcademicLinkClick(e, 'pedagogy-foundations')}>
                    <span className="nav-bullet"></span>
                    <span>Learning-by-Doing Pedagogy</span>
                  </a>
                </li>
                <li>
                  <a href="/#t-shaped-curriculum" onClick={(e) => handleAcademicLinkClick(e, 't-shaped-curriculum')}>
                    <span className="nav-bullet"></span>
                    <span>T-Shaped Core Curriculum</span>
                  </a>
                </li>
                <li>
                  <a href="/#learning-sciences" onClick={(e) => handleAcademicLinkClick(e, 'learning-sciences')}>
                    <span className="nav-bullet"></span>
                    <span>Cognitive Apprenticeship</span>
                  </a>
                </li>
                <li>
                  <a href="/#campus-life" onClick={(e) => handleAcademicLinkClick(e, 'campus-life')}>
                    <span className="nav-bullet"></span>
                    <span>Workstation Studios &amp; Labs</span>
                  </a>
                </li>
                <li>
                  <a href="/#career-outcomes" onClick={(e) => handleAcademicLinkClick(e, 'career-outcomes')}>
                    <span className="nav-bullet"></span>
                    <span>Career Outcomes &amp; Alumni</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Admissions Office & Campus (Glass Card) */}
            <div className="footer-column footer-contact-column" id="contact">
              <h4>Admissions &amp; Campus Desk</h4>
              <div className="footer-contact-card">
                <div className="footer-contact-item">
                  <div className="contact-icon-box">
                    <MapPinIcon size={16} />
                  </div>
                  <div className="contact-text-box">
                    <strong>MSIT Programme Division</strong>
                    <span>CIHL, IIIT Hyderabad Campus</span>
                    <span>Prof. C.R. Rao Road, Gachibowli, Hyderabad – 500 032</span>
                  </div>
                </div>

                <div className="footer-contact-item">
                  <div className="contact-icon-box">
                    <MailIcon size={16} />
                  </div>
                  <div className="contact-text-box">
                    <span className="contact-label">Official Query Email</span>
                    <a href="mailto:admissions@msit.ac.in">admissions@msit.ac.in</a>
                  </div>
                </div>

                {/* TODO: Restore Admissions Support Desk once official contact number and desk details are confirmed. */}
                {/*
                <div className="footer-contact-item">
                  <div className="contact-icon-box">
                    <PhoneIcon size={16} />
                  </div>
                  <div className="contact-text-box">
                    <span className="contact-label">Admissions Support Desk</span>
                    <a href="tel:+914066531000">+91 (40) 6653 1000</a>
                    <span className="contact-timings">Mon – Sat: 9:30 AM – 5:30 PM IST</span>
                  </div>
                </div>
                */}
              </div>
            </div>

          </div>

          {/* Pedagogical Statement Strip */}
          <div className="footer-pedagogy-badge">
            <div className="pedagogy-badge-content">
              <span className="pedagogy-spark-dot"></span>
              <span className="pedagogy-text-highlight">Zero Traditional Lectures:</span>
              <span className="pedagogy-text-body">100% Active Learning-by-Doing • Continuous Guided Practice • Industry Co-op Integration</span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Bottom Bar: Copyright, Legal & Back-to-Top */}
      <div className="footer-bottom-wrap">
        <div className="footer-container footer-bottom-inner">
          <div className="footer-copyright-text">
            © 2026 Consortium of Institutions of Higher Learning (CIHL) – MSIT. All rights reserved.
          </div>


          <button 
            className="footer-back-to-top" 
            onClick={scrollToTop} 
            title="Scroll to Top"
            aria-label="Back to Top"
          >
            <span>Back to Top</span>
            <ChevronUpIcon size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
}
