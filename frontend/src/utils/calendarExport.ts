import type { Roadmap, Phase } from '../store/roadmapStore';

/**
 * Generates and downloads an RFC 5545 compliant .ics calendar file
 * containing scheduled milestone sessions for a roadmap.
 */
export function exportRoadmapToCalendar(roadmap: Roadmap, phases: Phase[]) {
  const allMilestones = phases.flatMap((phase) =>
    phase.milestones.map((m) => ({
      ...m,
      phaseTitle: phase.title,
    }))
  );

  if (allMilestones.length === 0) {
    alert('This roadmap does not have any milestones to export yet.');
    return;
  }

  const now = new Date();
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeICS = (str: string) => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const events: string[] = [];

  // Schedule each milestone on sequential days (starting tomorrow at 9:00 AM)
  allMilestones.forEach((m, idx) => {
    const eventDate = new Date(now);
    eventDate.setDate(now.getDate() + 1 + idx);
    eventDate.setHours(9, 0, 0, 0); // 9:00 AM

    const endDate = new Date(eventDate);
    const durationHours = Math.max(1, Math.min(3, Math.round(roadmap.hoursPerDay || 1)));
    endDate.setHours(eventDate.getHours() + durationHours);

    const description = `Milestone: ${m.title}\nPhase: ${m.phaseTitle}\nMicro First Step: ${m.microFirstStep}\nGoal: ${roadmap.goal}\n\nTimebox: ${m.suggestedTimeBox}`;

    events.push(
      [
        'BEGIN:VEVENT',
        `UID:goalweave-${m._id}-${Date.now()}@goalweave.app`,
        `DTSTAMP:${formatICSDate(now)}`,
        `DTSTART:${formatICSDate(eventDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${escapeICS(`[GoalWeave] ${m.title}`)}`,
        `DESCRIPTION:${escapeICS(description)}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: Time to work on ${escapeICS(m.title)}`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n')
    );
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GoalWeave//Learning Roadmap Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(`GoalWeave: ${roadmap.goal}`)}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${roadmap.goal.slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_')}_schedule.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
