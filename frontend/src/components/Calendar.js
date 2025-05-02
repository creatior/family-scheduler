import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { format, startOfWeek, addDays, isSameDay, parseISO, addHours } from 'date-fns';
import { ru } from 'date-fns/locale';
import EventModal from './EventModal';
import '../styles/calendar.css';
import UserDropdown from './UserDropdown';

const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#1E6575', '#FFA07A', '#1DF0BB',
  '#F06292', '#65EB63', '#7D6E96', '#C4C460', '#B32246',
  '#5FFF5C', '#FFD54F', '#FF8A65', '#A1887F', '#6B28A 6'
];

const getUserColor = (userId) => {
  if (!userId) return 'rgba(74, 107, 223, 0.7)';
  try {
    const index = parseInt(userId) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
  } catch {
    return 'rgba(74, 107, 223, 0.7)';
  }
};

export default function Calendar() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showMemberFilter, setShowMemberFilter] = useState(false);

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    is_private: false
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const weekStart = startOfWeek(currentDate, { locale: ru });
      const weekEnd = addDays(weekStart, 6);
      
      console.log('Fetching events for week:', {
        start_date: format(weekStart, 'yyyy-MM-dd'),
        end_date: format(weekEnd, 'yyyy-MM-dd')
      });

      const res = await axios.get('http://localhost:8000/api/events/week/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          start_date: format(weekStart, 'yyyy-MM-dd'),
          end_date: format(weekEnd, 'yyyy-MM-dd')
        }
      });
      console.log('Received events:', res.data);
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/family/members/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const members = [...res.data];
      if (user && !members.some(m => m.id === user.id)) {
        members.push({
          id: user.id,
          username: user.username,
          email: user.email
        });
      }
      
      setFamilyMembers(members);
      setSelectedMembers(members.map(member => member.id));
    } catch (err) {
      console.error('Error fetching family members:', err);
      if (user) {
        setFamilyMembers([{
          id: user.id,
          username: user.username,
          email: user.email
        }]);
        setSelectedMembers([user.id]);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchFamilyMembers();
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

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === familyMembers.length) {
      setSelectedMembers([user.id]);
    } else {
      setSelectedMembers(familyMembers.map(member => member.id));
    }
  };

  const filteredEvents = events.filter(event => {
    if (event.creator?.id === user?.id) {
      return selectedMembers.includes(user.id);
    }
    return !event.is_private && selectedMembers.includes(event.creator?.id);
  });

  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 8);

  const handleAddEventClick = () => {
    setShowAddEventModal(true);
    setNewEvent({
      title: '',
      description: '',
      start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      is_private: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/events/', newEvent, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setShowAddEventModal(false);
      fetchEvents();
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  return (
    <div className="calendar-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      <div className="calendar-header">
        <h2>{format(currentDate, 'MMMM yyyy', { locale: ru })}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={handleAddEventClick}
            className="add-event-button"
          >
            + Добавить событие
          </button>

          {familyMembers.length > 0 && (
            <div className="member-filter">
              <button 
                onClick={() => setShowMemberFilter(!showMemberFilter)}
                className="filter-button"
              >
                Фильтр по членам семьи ({selectedMembers.length}/{familyMembers.length})
              </button>
              {showMemberFilter && (
                <div className="member-filter-dropdown">
                  <div className="member-filter-all">
                    <button onClick={toggleSelectAll}>
                      {selectedMembers.length === familyMembers.length 
                        ? 'Убрать всех' 
                        : 'Выбрать всех'}
                    </button>
                  </div>
                  {familyMembers.map(member => (
                    <div key={member.id} className="member-filter-item">
                      <input
                        type="checkbox"
                        id={`member-${member.id}`}
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                      />
                      <label htmlFor={`member-${member.id}`}>
                        {member.username || member.email}
                        {member.id === user?.id && ' (Вы)'}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="calendar-controls">
            <button onClick={() => {
              const newDate = addDays(currentDate, -7);
              setCurrentDate(newDate);
            }}>
              &lt; Предыдущая
            </button>
            <button onClick={() => {
              setCurrentDate(new Date());
            }}>
              Сегодня
            </button>
            <button onClick={() => {
              const newDate = addDays(currentDate, 7);
              setCurrentDate(newDate);
            }}>
              Следующая &gt;
            </button>
          </div>
          <UserDropdown />
        </div>
      </div>

      {showAddEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Добавить новое событие</h3>
            <form onSubmit={handleAddEventSubmit}>
              <div className="form-group">
                <label>Название:</label>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Описание:</label>
                <textarea
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Начало:</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={newEvent.start_time}
                  onChange={handleInputChange}
                  required
                  step="60" 
                />
              </div>
              
              <div className="form-group">
                <label>Конец:</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={newEvent.end_time}
                  onChange={handleInputChange}
                  required
                  step="60" 
                />
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="is_private"
                  name="is_private"
                  checked={newEvent.is_private}
                  onChange={handleInputChange}
                />
                <label htmlFor="is_private">Приватное событие</label>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAddEventModal(false)}
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="submit-button"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  {filteredEvents
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
                            backgroundColor: getUserColor(event.creator?.id),
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
          </React.Fragment>
        ))}
      </div>

      {showModal && (
        <EventModal
          date={selectedDate}
          event={selectedEvent}
          onClose={() => setShowModal(false)}
          refreshEvents={fetchEvents}
        />
      )}
    </div>
  );
}