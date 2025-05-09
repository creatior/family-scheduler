import React from 'react';

const AddEventModal = ({ 
  show, 
  onClose, 
  newEvent, 
  onInputChange, 
  onSubmit 
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Добавить новое событие</h3>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Название:</label>
            <input
              type="text"
              name="title"
              value={newEvent.title}
              onChange={onInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Описание:</label>
            <textarea
              name="description"
              value={newEvent.description}
              onChange={onInputChange}
            />
          </div>
          
          <div className="form-group">
            <label>Начало:</label>
            <input
              type="datetime-local"
              name="start_time"
              value={newEvent.start_time}
              onChange={onInputChange}
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
              onChange={onInputChange}
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
              onChange={onInputChange}
            />
            <label htmlFor="is_private">Приватное событие</label>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={onClose}
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
  );
};

export default AddEventModal;