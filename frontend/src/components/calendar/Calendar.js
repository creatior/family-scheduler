import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { format, startOfWeek, addDays, isSameDay, parseISO, addHours, add } from 'date-fns';
import { ru } from 'date-fns/locale';
import EventModal from '../EventModal';
import '../../styles/calendar.css';
import UserDropdown from '../UserDropdown';
import CalendarGrid from './CalendarGrid';
import CalendarHeader from './CalendarHeader';
import { getUserColor, timeSlots } from './constants';
import AddEventModal from './AddEventModal';

const Calendar = () => {
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

      const res = await axios.get('http://localhost:8000/api/events/week/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          start_date: format(weekStart, 'yyyy-MM-dd'),
          end_date: format(weekEnd, 'yyyy-MM-dd')
        }
      });
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
      
      const members = [...res.data.members];
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

      <CalendarHeader
        currentDate={currentDate}
        onPrevWeek={() => setCurrentDate(addDays(currentDate, -7))}
        onNextWeek={() => setCurrentDate(addDays(currentDate, 7))}
        onToday={() => setCurrentDate(new Date())}
        onAddEvent={handleAddEventClick}
        familyMembers={familyMembers}
        selectedMembers={selectedMembers}
        onToggleMember={handleMemberToggle}
        onToggleSelectAll={toggleSelectAll}
        showMemberFilter={showMemberFilter}
        setShowMemberFilter={setShowMemberFilter}
      />

      <AddEventModal
        show={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        newEvent={newEvent}
        onInputChange={handleInputChange}
        onSubmit={handleAddEventSubmit}
      />

      {showModal && (
        <EventModal
          date={selectedDate}
          event={selectedEvent}
          onClose={() => setShowModal(false)}
          refreshEvents={fetchEvents}
        />
      )}

      <CalendarGrid
        currentDate={currentDate}
        filteredEvents={filteredEvents}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />
    </div>
  );
}

export default Calendar;