import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaExclamation } from 'react-icons/fa';
import '../../styles/profile.css';

const Invitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/invitations/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setInvitations(res.data);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await axios.post(
        `http://localhost:8000/api/invitations/${invitationId}/accept/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchInvitations();
      setSuccess('Приглашение принято!');
    } catch (err) {
      setError('Ошибка при принятии приглашения');
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      await axios.post(
        `http://localhost:8000/api/invitations/${invitationId}/reject/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchInvitations();
      setSuccess('Приглашение отклонено');
    } catch (err) {
      setError('Ошибка при отклонении приглашения');
    }
  };

  return (
    <div className="notification-icon-container">
      <button 
        className="notification-icon"
        onClick={() => setShowInvitations(!showInvitations)}
      >
        <FaBell />
        {invitations.length > 0 && (
          <span className="notification-badge">
            <FaExclamation />
          </span>
        )}
      </button>
      
      {showInvitations && (
        <div className="invitations-dropdown">
          {invitations.length > 0 ? (
            <ul>
              {invitations.map(invite => (
                <li key={invite.id}>
                  <div className="invitation-message">
                    Приглашение в семью "{invite.family.name}" 
                    от {invite.sender.username}
                  </div>
                  <div className="invitation-actions">
                    <button 
                      onClick={() => handleAcceptInvitation(invite.id)}
                      className="accept-btn"
                    >
                      Принять
                    </button>
                    <button 
                      onClick={() => handleRejectInvitation(invite.id)}
                      className="reject-btn"
                    >
                      Отклонить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-invitations">
              Новых приглашений нет
            </div>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default Invitations;