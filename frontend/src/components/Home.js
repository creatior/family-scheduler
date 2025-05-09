import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Calendar from '../components/calendar/Calendar';
import '../styles/home.css';

export default function Home() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  if (loading) {
    return <div className="loading">Загрузка календаря...</div>;
  }

  return (
    <div className="home-page">
      <div className="calendar-wrapper">
        <h1>Семейный календарь</h1>
        <div className="calendar-container-wrapper">
          <Calendar events={events} />
        </div>
      </div>
    </div>
  );
}