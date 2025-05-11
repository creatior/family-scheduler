import React, { useEffect, useRef } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { startOfWeek, addDays } from 'date-fns';
import { getUserColor } from './constants';

const allTimeSlots = Array.from({ length: 24 }, (_, i) => i);

const CalendarGrid = ({ 
  currentDate, 
  filteredEvents, 
  onDateClick, 
  onEventClick 
}) => {
  const weekStart = startOfWeek(currentDate, { locale: ru });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const gridRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = (currentHour - 5) * 60;
      bodyRef.current.scrollTop = scrollPosition;
    }
  }, []);

  return (
    <div className="calendar-grid-container">
      <div className="calendar-grid-header">
        <div className="time-corner"></div>
        {weekDays.map((day, i) => (
          <div key={`header-${i}`} className="day-header">
            <div className="day-name">{format(day, 'EEE', { locale: ru })}</div>
            <div className={`day-number ${isSameDay(day, new Date()) ? 'today' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      <div className="calendar-body" ref={bodyRef}>
        {allTimeSlots.map((hour) => (
          <div key={hour} className="time-row">
            <div className="time-label">
              {`${hour.toString().padStart(2, '0')}:00`}
            </div>
            
            {weekDays.map((day, dayIdx) => {
              const cellStart = new Date(day);
              cellStart.setHours(hour, 0, 0, 0);
              const cellEnd = new Date(day);
              cellEnd.setHours(hour + 1, 0, 0, 0);

              return (
                <div 
                  key={`cell-${dayIdx}-${hour}`}
                  className="calendar-cell"
                  onClick={() => onDateClick(cellStart)}
                >
                  {filteredEvents
                    .filter(event => {
                      const eventStart = parseISO(event.start_time);
                      return eventStart >= cellStart && eventStart < cellEnd;
                    })
                    .map(event => {
                      const eventStart = parseISO(event.start_time);
                      const eventEnd = parseISO(event.end_time);
                      const durationMinutes = (eventEnd - eventStart) / (1000 * 60);
                      const topPosition = eventStart.getMinutes();

                      return (
                        <div
                          key={event.id}
                          className="calendar-event"
                          onClick={(e) => onEventClick(event, e)}
                          style={{
                            backgroundColor: getUserColor(event.creator?.id),
                            height: `${durationMinutes}px`,
                            position: 'absolute',
                            width: 'calc(100% - 4px)',
                            zIndex: 1,
                            top: `${topPosition}px`,
                            borderRadius: '3px',
                          }}
                        >
                          <div className="event-content">
                            <div className="event-time">
                              {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
                            </div>
                            <div className="event-title">{event.title}</div>
                            {event.creator && (
                              <div className="event-creator">
                                {event.creator.username || event.creator.email || 'Неизвестно'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;