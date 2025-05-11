import React, { useState } from 'react';
import axios from 'axios';
import '../../styles/profile.css';

const InvitationModal = ({ onClose, onSuccess, setError }) => {
  const [identifier, setIdentifier] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmitInvitation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identifier) {
      setError('Введите email или имя пользователя');
      return;
    }

    const isEmail = identifier.includes('@');
    const requestData = {
      [isEmail ? 'email' : 'username']: identifier
    };

    try {
      await axios.post(
        'http://localhost:8000/api/invitations/send/',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setSuccess('Приглашение успешно отправлено!');
      setIdentifier('');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке приглашения');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Отправить приглашение</h3>
          <button 
            className="close-btn"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmitInvitation}>
          <div className="form-group">
            <label>Email или имя пользователя получателя:</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="example@example.com или username"
            />
          </div>
          {success && <div className="success-message">{success}</div>}
          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Отмена
            </button>
            <button type="submit">Отправить</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvitationModal;