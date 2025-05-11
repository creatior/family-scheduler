import React, { useState } from 'react';
import axios from 'axios';
import '../../styles/profile.css';

const CreateFamilyModal = ({ onClose, onSuccess, setError }) => {
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    if (!familyName.trim()) {
      setError('Введите название семьи');
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        'http://localhost:8000/api/family/create/',
        { name: familyName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при создании семьи');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Создать новую семью</h3>
          <button 
            className="close-btn"
            onClick={onClose}
            disabled={loading}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название семьи:</label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Введите название семьи"
              maxLength="100"
              disabled={loading}
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" disabled={loading || !familyName.trim()}>
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFamilyModal;