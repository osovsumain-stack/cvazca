import { type ReactNode } from 'react';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  icon?: ReactNode;
  status?: string;
}

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p style={{ fontSize: 14, color: 'var(--muted)' }}>Событий пока нет</p>;
  }

  return (
    <div className="timeline">
      {events.map((event) => (
        <div className="timeline-item" key={event.id}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-header">
              <span className="timeline-title">{event.title}</span>
              <span className="timeline-date">{new Date(event.date).toLocaleDateString('ru-RU')}</span>
            </div>
            {event.description && <p className="timeline-desc">{event.description}</p>}
            {event.status && <span className="timeline-status">{event.status}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
