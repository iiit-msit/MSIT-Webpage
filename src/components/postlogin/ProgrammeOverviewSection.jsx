import React from 'react';
import { 
  CpuIcon, 
  FlaskConicalIcon, 
  RocketIcon, 
  BriefcaseIcon 
} from '../Icons';

export default function ProgrammeOverviewSection({ data }) {
  const getSemesterIcon = (idx) => {
    switch (idx) {
      case 0:
        return <CpuIcon size={22} />;
      case 1:
        return <FlaskConicalIcon size={22} />;
      case 2:
        return <RocketIcon size={22} />;
      case 3:
      default:
        return <BriefcaseIcon size={22} />;
    }
  };

  const semestersList = data?.semesters || [];

  return (
    <section className="section programme-specs-section" id="programme-specs">
      <div className="container">
        <div className="section-heading">
          <span className="kicker">{data?.kicker || 'Programme Structure'}</span>
          <h2>{data?.heading || '4-Semester Programme Structure'}</h2>
          <p>{data?.description}</p>
        </div>

        {/* Four-Semester Programme Structure Grid (Detailed & Concise) */}
        {semestersList.length > 0 && (
          <div className="programme-structure-block">
            <div className="programme-structure-grid">
              {semestersList.map((sem, idx) => (
                <div key={idx} className={`semester-card semester-card-${idx + 1}`}>
                  <div className="semester-card-header">
                    <div className="semester-icon-badge" aria-hidden="true">
                      {getSemesterIcon(idx)}
                    </div>
                    <div className="semester-meta">
                      <span className="semester-num-badge">{sem.semNumber}</span>
                      {sem.tag && <span className="semester-tag-pill">{sem.tag}</span>}
                    </div>
                  </div>

                  <h3 className="semester-title">{sem.title}</h3>

                  {sem.points && sem.points.length > 0 ? (
                    <ul className="semester-points-list">
                      {sem.points.map((pt, pIdx) => {
                        const isString = typeof pt === 'string';
                        const label = isString ? null : pt.label;
                        const desc = isString ? pt : pt.desc;
                        return (
                          <li key={pIdx} className="semester-point-item">
                            <span className="point-bullet" aria-hidden="true">•</span>
                            <div className="point-text-wrap">
                              {label && <strong className="point-label">{label}: </strong>}
                              <span className="point-desc">{desc}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <>
                      {sem.courses && sem.courses.length > 0 && (
                        <ul className="semester-courses-list">
                          {sem.courses.map((course, cIdx) => (
                            <li key={cIdx} className="semester-course-item">
                              <span className="course-bullet" aria-hidden="true">•</span>
                              <span>{course}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {sem.emphasis && <p className="semester-desc">{sem.emphasis}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

