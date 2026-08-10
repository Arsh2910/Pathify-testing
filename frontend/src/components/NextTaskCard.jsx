export default function NextTaskCard({ milestone, onComplete }) {
  if (!milestone) {
    return (
      <div className="next-task-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--th-primary-container)' }}>celebration</span>
          <h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '11px', fontWeight: 700, color: 'var(--th-primary-container)', letterSpacing: '0.09em' }}>
            ALL MILESTONES COMPLETE!
          </h3>
        </div>
        <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'var(--th-on-surface-variant)' }}>
          You've completed all milestones on this roadmap. 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="next-task-card relative overflow-hidden">
      {/* Ambient accent */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: 'color-mix(in srgb, var(--th-primary-container) 8%, transparent)', filter: 'blur(30px)', transform: 'translate(30%,-30%)' }} />

      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--th-primary-container)', fontSize: '19px' }}>my_location</span>
        <h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '10px', fontWeight: 700, color: 'var(--th-primary-container)', letterSpacing: '0.1em' }}>
          TODAY'S FOCUS
        </h3>
      </div>

      <h4 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '17px', color: 'var(--th-on-surface)', marginBottom: '14px', lineHeight: '25px' }}>
        {milestone.title}
      </h4>

      {milestone.suggestedTimeBox && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4"
          style={{ background: 'color-mix(in srgb, var(--th-secondary) 10%, transparent)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--th-secondary)', fontSize: '15px' }}>schedule</span>
          <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 600, color: 'var(--th-secondary)' }}>{milestone.suggestedTimeBox}</span>
        </div>
      )}

      {milestone.microFirstStep && (
        <div className="micro-step-box flex gap-3 mb-3">
          <span className="material-symbols-outlined" style={{ color: 'var(--th-micro-step-color)', fontSize: '17px', flexShrink: 0 }}>bolt</span>
          <div>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '10px', fontWeight: 700, color: 'var(--th-micro-step-color)', letterSpacing: '0.09em', marginBottom: '3px' }}>MICRO STEP</p>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface-variant)', lineHeight: '19px' }}>{milestone.microFirstStep}</p>
          </div>
        </div>
      )}

      {milestone.whyNow && (
        <div className="why-now-box flex gap-3 mb-5">
          <span className="material-symbols-outlined" style={{ color: 'var(--th-why-now-color)', fontSize: '17px', flexShrink: 0 }}>lightbulb</span>
          <div>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '10px', fontWeight: 700, color: 'var(--th-why-now-color)', letterSpacing: '0.09em', marginBottom: '3px' }}>WHY NOW</p>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface-variant)', lineHeight: '19px' }}>{milestone.whyNow}</p>
          </div>
        </div>
      )}

      {onComplete && (
        <button onClick={() => onComplete(milestone._id)} className="btn-primary w-full">
          <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px' }}>check_circle</span>
          Mark Complete
        </button>
      )}
    </div>
  );
}
