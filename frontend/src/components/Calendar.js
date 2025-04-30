import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { format, startOfWeek, addDays, isSameDay, getMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import EventModal from './EventModal';
import '../styles/calendar.css';
import UserDropdown from './UserDropdown';

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
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    weekDays.push(day);
  }

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
        {/* Пустая ячейка в углу */}
        <div className="time-corner"></div>
        
        {/* Заголовки дней недели */}
        {weekDays.map((day, i) => (
          <div key={`header-${i}`} className="day-header">
            <div className="day-name">{format(day, 'EEE', { locale: ru })}</div>
            <div className={`day-number ${isSameDay(day, new Date()) ? 'today' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}

        {/* Сетка времени и событий */}
        {timeSlots.map((hour, hourIdx) => (
          <React.Fragment key={hour}>
            {/* Метка времени */}
            <div className="time-label">
              {`${hour}:00`}
            </div>
            
            {/* Ячейки дней для этого часа */}
            {weekDays.map((day, dayIdx) => {
              const hourStart = new Date(day);
              hourStart.setHours(hour, 0, 0, 0);
              
              const hourEnd = new Date(day);
              hourEnd.setHours(hour + 1, 0, 0, 0);
              
              const hourEvents = events.filter(event => {
                const eventStart = new Date(event.start_time);
                const eventEnd = new Date(event.end_time);
                return (
                  (eventStart >= hourStart && eventStart < hourEnd) ||
                  (eventEnd > hourStart && eventEnd <= hourEnd) ||
                  (eventStart <= hourStart && eventEnd >= hourEnd)
                );
              });

              return (
                <div 
                  key={`cell-${dayIdx}-${hourIdx}`}
                  className="calendar-cell"
                  onClick={() => handleDateClick(hourStart)}
                >
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="calendar-event"
                      onClick={(e) => handleEventClick(event, e)}
                      style={{
                        backgroundColor: event.family ? `#${event.family.id.toString().padStart(6, '0')}` : '#4a6bdf',
                        top: `${(new Date(event.start_time).getHours() - hour + getMinutes(new Date(event.start_time)) / 60) * 60}px`,
                        height: `${(new Date(event.end_time) - new Date(event.start_time)) / (1000 * 60) * 1}px`,
                        position: 'absolute',
                        width: 'calc(100% - 4px)',
                      }}
                    >
                      <div className="event-time">
                        {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')} 
                      </div>
                      <div className="event-title">{event.title}</div>
                      {event.family && (
                        <div className="event-family">{event.family.name}</div>
                      )}
                    </div>
                  ))}
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