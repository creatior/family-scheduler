import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/profile.css';
import { FaArrowLeft, FaBell, FaExclamation } from 'react-icons/fa';

const Profile = () => {
  const { user, logout } = useAuth();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchFamilyMembers();
      fetchInvitations();
    } else {
      navigate('/login', {replace: true});
    }
  }, [user, navigate]);

  const fetchFamilyMembers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/family/members/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFamilyMembers(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching family members:', err);
      setLoading(false);
    }
  };

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
      const response = await axios.post(
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
        setShowModal(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке приглашения');
    }
  };

  const handleLeaveFamily = async () => {
    if (window.confirm('Вы уверены, что хотите покинуть семью?')) {
      try {
        const response = await axios.post(
          'http://localhost:8000/api/family/leave/',
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        setSuccess('Вы успешно покинули семью');
        fetchFamilyMembers();
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка при выходе из семьи');
      }
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
      fetchFamilyMembers();
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
    <div className="profile-container">
      <div className="profile-header">
        <div className="back-button-container">
          <Link to="/" className="back-button">
            <FaArrowLeft /> На главную
          </Link>
        </div>
        
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
        </div>
      </div>
      
      <h1>Профиль пользователя</h1>
      <div className="profile-info">
        <p><strong>Имя пользователя:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        {user?.birth_date && <p><strong>Дата рождения:</strong> {new Date(user.birth_date).toLocaleDateString()}</p>}
      </div>

      {familyMembers.length > 0 ? (
        <div className="family-members">
          <div className="family-header">
            <h2>Члены семьи</h2>
            <button 
              className="add-member-btn"
              onClick={() => setShowModal(true)}
            >
              Добавить
            </button>
          </div>
          <ul>
            {familyMembers.map(member => (
              <li key={member.id}>
                <span>
                  {member.username} ({member.email})
                  {member.id === user?.id && ' (Вы)'}
                </span>
              </li>
            ))}
          </ul>
          <button 
            className="leave-family-btn" 
            onClick={handleLeaveFamily}
          >
            Выйти из семьи
          </button>
        </div>
      ) : (
        <p>Вы не состоите ни в одной семье.</p>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Отправить приглашение</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setError('');
                  setSuccess('');
                }}
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
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit">Отправить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default Profile;