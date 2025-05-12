import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import '../styles/modal.css';

const EventModal = ({ date, event, onClose, refreshEvents }) => {
  const { user } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    is_private: false,
    family: null
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        start_time: event.start_time,
        end_time: event.end_time,
        is_private: event.is_private,
        family: event.family?.id || null
      });
    } else if (date) {
      setFormData({
        title: '',
        description: '',
        start_time: date.toISOString(),
        end_time: new Date(date.getTime() + 60 * 60 * 1000).toISOString(),
        is_private: false,
        family: null
      });
      setIsEditing(true);
    }
  }, [event, date]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        start_time: formData.start_time.endsWith('Z') ? formData.start_time : formData.start_time,
        end_time: formData.end_time.endsWith('Z') ? formData.end_time : formData.end_time
      };

      if (event) {
        await axios.put(`http://localhost:8000/api/events/${event.id}/`, dataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('http://localhost:8000/api/events/', dataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
      }
      refreshEvents();
      onClose();
    } catch (err) {
      console.error('Error saving event:', err.response?.data || err.message);
      alert('Ошибка при сохранении: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить это событие?')) {
      try {
        await axios.delete(`http://localhost:8000/api/events/${event.id}/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        refreshEvents();
        onClose();
      } catch (err) {
        console.error('Error deleting event:', err.response?.data || err.message);
        alert('Ошибка при удалении: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const isCreator = user && event && (user.id === event.creator.id);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {isEditing ? (
          <>
            <h2>{event ? 'Редактировать событие' : 'Создать событие'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Начало</label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time.slice(0, 16)}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Конец</label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time.slice(0, 16)}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_private"
                      checked={formData.is_private}
                      onChange={handleInputChange}
                    />
                    Личное событие
                  </label>
                </div>
                
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="save-btn">Сохранить</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    if (event) setIsEditing(false);
                    else onClose();
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2>{event?.title || 'Просмотр события'}</h2>
            
            <div className="event-details">
              <p><strong>Время:</strong> {format(parseISO(event.start_time), 'HH:mm', { locale: ru })} - {format(parseISO(event.end_time), 'HH:mm', { locale: ru })}</p>
              <p><strong>Дата:</strong> {format(parseISO(event.start_time), 'dd.MM.yyyy', { locale: ru })}</p>
              {event.description && <p><strong>Описание:</strong> {event.description}</p>}
              <p><strong>Создатель:</strong> {event.creator?.username || event.creator?.email}</p>
              <p><strong>Статус:</strong> {event.is_private ? 'Личное' : 'Общее'}</p>
              {event.family && !event.is_private && <p><strong>Семья:</strong> {event.family.name}</p>}
            </div>
            
            <div className="modal-actions">
              {isCreator && (
                <>
                  <button 
                    type="button" 
                    className="edit-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    Редактировать
                  </button>
                  <button 
                    type="button" 
                    className="delete-btn"
                    onClick={handleDelete}
                  >
                    Удалить
                  </button>
                </>
              )}
              <button 
                type="button" 
                className="close-btn"
                onClick={onClose}
              >
                Закрыть
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventModal;