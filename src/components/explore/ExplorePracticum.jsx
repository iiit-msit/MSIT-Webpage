import React from 'react';
import { 
  BriefcaseIcon,
  CodeIcon,
  UsersIcon,
  TrendingUpIcon,
  CorporateBuildingIcon, 
  RocketIcon, 
  BuildingIcon, 
  TerminalIcon
} from '../Icons';

export default function ExplorePracticum() {
  return (
    <section className="explore-section bg-white" id="real-world-practicum">
      <div className="explore-container">
        
        {/* Section Header */}
        <div className="explore-section-header">
          <span className="practicum-kicker-badge">
            <span className="practicum-kicker-dot"></span>
            Real-World Experience
          </span>
          <h2>Real-World Practicum &amp; Projects</h2>
          <p className="section-lead">
            In the final stage of MSIT, you put your learning into practice by working on real projects and gaining experience in a professional environment.
          </p>
        </div>

        {/* Practicum Journey: Two-Phase Horizon Strip */}
        <div className="practicum-horizon-banner">
          <div className="horizon-phase phase-academic">
            <div className="horizon-phase-badge">
              <span>Phase 1</span>
            </div>
            <h4>Learning &amp; Preparation</h4>
            <p>Build the skills and confidence you need for practical work.</p>
          </div>

          <div className="horizon-connector">
            <span className="connector-pill">
              <span className="connector-arrow">→</span>
              <span>Smooth Transition</span>
            </span>
          </div>

          <div className="horizon-phase phase-industry">
            <div className="horizon-phase-badge badge-highlight">
              <span>Phase 2</span>
            </div>
            <h4>Practical Experience</h4>
            <p>Apply your skills while working on real projects.</p>
          </div>
        </div>

        {/* Dual Experiential Tracks Grid */}
        <div className="practicum-tracks-grid">
          
          {/* Track 1: Industry Track */}
          <div className="practicum-track-card card-coop">
            <div className="track-card-body">
              <div className="track-header-row">
                <h3>Work with Industry</h3>
                <span className="track-tenure-badge">
                  <CorporateBuildingIcon size={14} />
                  <span>Industry Track</span>
                </span>
              </div>
              
              <p className="track-lead-desc">
                Gain practical experience by working on real projects in a professional environment.
              </p>

              <div className="track-features-list">
                <div className="track-feature-item">
                  <span className="track-check-bullet check-blue">✓</span>
                  <div>
                    <strong>Work on Practical Projects</strong>
                    <span>Apply what you learn to real problems.</span>
                  </div>
                </div>

                <div className="track-feature-item">
                  <span className="track-check-bullet check-blue">✓</span>
                  <div>
                    <strong>Learn from Professionals</strong>
                    <span>Get guidance and feedback while you work.</span>
                  </div>
                </div>

                <div className="track-feature-item">
                  <span className="track-check-bullet check-blue">✓</span>
                  <div>
                    <strong>Experience Teamwork</strong>
                    <span>Learn how people work together on real projects.</span>
                  </div>
                </div>
              </div>

              <div className="track-footer-strip strip-coop">
                <BuildingIcon size={16} />
                <span>Gain practical experience in a professional team environment</span>
              </div>
            </div>
          </div>

          {/* Track 2: Innovation Track */}
          <div className="practicum-track-card card-venture">
            <div className="track-card-body">
              <div className="track-header-row">
                <h3>Build &amp; Explore</h3>
                <span className="track-tenure-badge badge-venture">
                  <RocketIcon size={14} />
                  <span>Innovation Track</span>
                </span>
              </div>
              
              <p className="track-lead-desc">
                Explore ideas, products, or research projects with guidance from experienced mentors.
              </p>

              <div className="track-features-list">
                <div className="track-feature-item">
                  <span className="track-check-bullet check-purple">✓</span>
                  <div>
                    <strong>Build Your Ideas</strong>
                    <span>Turn an idea into a working project.</span>
                  </div>
                </div>

                <div className="track-feature-item">
                  <span className="track-check-bullet check-purple">✓</span>
                  <div>
                    <strong>Explore New Technologies</strong>
                    <span>Try new tools and technologies through practical work.</span>
                  </div>
                </div>

                <div className="track-feature-item">
                  <span className="track-check-bullet check-purple">✓</span>
                  <div>
                    <strong>Learn Through Experience</strong>
                    <span>Get feedback and improve your work as you build.</span>
                  </div>
                </div>
              </div>

              <div className="track-footer-strip strip-venture">
                <TerminalIcon size={16} />
                <span>Mentorship and support to turn your ideas into working projects</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Highlights Panel */}
        <div className="practicum-metrics-strip">
          <div className="practicum-metric-box">
            <div className="p-metric-icon" style={{ color: '#38bdf8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BriefcaseIcon size={24} />
            </div>
            <span className="p-metric-title">Practical Experience</span>
            <span className="p-metric-sub">Apply what you learn</span>
          </div>

          <div className="practicum-metric-divider"></div>

          <div className="practicum-metric-box">
            <div className="p-metric-icon" style={{ color: '#38bdf8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CodeIcon size={24} />
            </div>
            <span className="p-metric-title">Real Projects</span>
            <span className="p-metric-sub">Build and solve real problems</span>
          </div>

          <div className="practicum-metric-divider"></div>

          <div className="practicum-metric-box">
            <div className="p-metric-icon" style={{ color: '#38bdf8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UsersIcon size={24} />
            </div>
            <span className="p-metric-title">Mentor Guidance</span>
            <span className="p-metric-sub">Learn with support</span>
          </div>

          <div className="practicum-metric-divider"></div>

          <div className="practicum-metric-box">
            <div className="p-metric-icon" style={{ color: '#38bdf8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUpIcon size={24} />
            </div>
            <span className="p-metric-title">Career Preparation</span>
            <span className="p-metric-sub">Develop workplace skills</span>
          </div>
        </div>

      </div>
    </section>
  );
}
