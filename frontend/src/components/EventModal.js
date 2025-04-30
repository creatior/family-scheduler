import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/modal.css';

export default function EventModal({ date, event, onClose }) {
  const { user } = useContext(AuthContext);
  const [families, setFamilies] = useState([]);
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_time: event?.start_time || date.toISOString(),
    end_time: event?.end_time || new Date(date.getTime() + 60 * 60 * 1000).toISOString(),
    is_private: event?.is_private || false,
    family: event?.family?.id || null
  });

  const fetchFamilies = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/families/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFamilies(res.data);
    } catch (err) {
      console.error('Error fetching families:', err);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (event) {
        await axios.put(`http://localhost:8000/api/events/${event.id}/`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('http://localhost:8000/api/events/', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
      }
      onClose();
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8000/api/events/${event.id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      onClose();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{event ? 'Редактировать событие' : 'Создать событие'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Начало</label>
              <input
                type="datetime-local"
                value={formData.start_time.slice(0, 16)}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Конец</label>
              <input
                type="datetime-local"
                value={formData.end_time.slice(0, 16)}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_private}
                  onChange={(e) => setFormData({...formData, is_private: e.target.checked})}
                />
                Личное событие
              </label>
            </div>
            
            <div className="form-group">
              <label>Семья</label>
              <select
                value={formData.family || ''}
                onChange={(e) => setFormData({...formData, family: e.target.value || null})}
                disabled={formData.is_private}
              >
                <option value="">Без семьи</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>{family.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="submit">Сохранить</button>
            {event && (
              <button type="button" className="delete-btn" onClick={handleDelete}>
                Удалить
              </button>
            )}
            <button type="button" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}