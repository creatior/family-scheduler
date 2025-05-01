import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import EventModal from './EventModal';
import '../styles/calendar.css';
import UserDropdown from './UserDropdown';

const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F06292', '#7986CB', '#9575CD', '#64B5F6', '#4DB6AC',
  '#81C784', '#FFD54F', '#FF8A65', '#A1887F', '#90A4AE'
];

const getFamilyColor = (familyId) => {
  if (!familyId) return 'rgba(74, 107, 223, 0.7)';
  const index = parseInt(familyId) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
};

export default function Calendar() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/events/week/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, currentDate]);

  const weekStart = startOfWeek(currentDate, { locale: ru });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowModal(true);
    setSelectedEvent(null);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowModal(true);
  };

  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 8);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>{format(currentDate, 'MMMM yyyy', { locale: ru })}</h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="calendar-controls">
            <button onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              &lt; Предыдущая
            </button>
            <button onClick={() => setCurrentDate(new Date())}>
              Сегодня
            </button>
            <button onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              Следующая &gt;
            </button>
          </div>
          <UserDropdown />
        </div>
      </div>

      <div className="calendar-grid">
        <div className="time-corner"></div>
        
        {weekDays.map((day, i) => (
          <div key={`header-${i}`} className="day-header">
            <div className="day-name">{format(day, 'EEE', { locale: ru })}</div>
            <div className={`day-number ${isSameDay(day, new Date()) ? 'today' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}

        {timeSlots.map((hour, hourIdx) => (
          <React.Fragment key={hour}>
            <div className="time-label">
              {`${hour}:00`}
            </div>
            
            {weekDays.map((day, dayIdx) => {
              const cellStart = new Date(day);
              cellStart.setHours(hour, 0, 0, 0);
              
              const cellEnd = new Date(day);
              cellEnd.setHours(hour + 1, 0, 0, 0);

              return (
                <div 
                  key={`cell-${dayIdx}-${hourIdx}`}
                  className="calendar-cell"
                  onClick={() => handleDateClick(cellStart)}
                >
                  {events
                    .filter(event => {
                      const eventStart = parseISO(event.start_time);
                      const eventEnd = parseISO(event.end_time);
                      return eventStart >= cellStart && eventStart < cellEnd;
                    })
                    .map(event => {
                      const eventStart = parseISO(event.start_time);
                      const eventEnd = parseISO(event.end_time);
                      const durationMinutes = (eventEnd - eventStart) / (1000 * 60);
                      const hoursSpan = Math.ceil(durationMinutes / 60);

                      return (
                        <div
                          key={event.id}
                          className="calendar-event"
                          onClick={(e) => handleEventClick(event, e)}
                          style={{
                            backgroundColor: getFamilyColor(event.family?.id),
                            height: `${durationMinutes}px`,
                            position: 'absolute',
                            width: 'calc(100% - 4px)',
                            zIndex: 1,
                            top: `${eventStart.getMinutes() + 10}px`,
                            borderRadius: hoursSpan > 1 ? '3px' : '3px',
                          }}
                        >
                          <div className="event-content">
                            <div className="event-time">
                              {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
                            </div>
                            <div className="event-title">{event.title}</div>
                            {event.family && (
                              <div className="event-family">{event.family.name}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {showModal && (
        <EventModal
          date={selectedDate}
          event={selectedEvent}
          onClose={() => {
            setShowModal(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}