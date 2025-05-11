import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/profile.css';
import { FaArrowLeft } from 'react-icons/fa';
import FamilyMembers from './FamilyMembers';
import Invitations from './Invitations';

const Profile = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(true);
  const [hasFamily, setHasFamily] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkFamilyStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/family/check/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        setHasFamily(data.has_family);
      } catch (error) {
        console.error('Family check error:', error);
        setHasFamily(false);
      } finally {
        setProfileLoading(false);
      }
    };

    checkFamilyStatus();
  }, [isAuthenticated]);

  if (authLoading || profileLoading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  if (!isAuthenticated) {
    return null; // Перенаправление уже обработано в useEffect
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <Link to="/" className="back-button">
          <FaArrowLeft /> На главную
        </Link>
        <Invitations />
      </div>
      
      <div className="profile-content">
        <h1>Профиль пользователя</h1>
        <div className="profile-info">
          <p><strong>Имя:</strong> {user?.username || 'Не указано'}</p>
          <p><strong>Email:</strong> {user?.email || 'Не указан'}</p>
          {user?.birth_date && (
            <p><strong>Дата рождения:</strong> {new Date(user.birth_date).toLocaleDateString()}</p>
          )}
        </div>

        <FamilyMembers 
          hasFamily={hasFamily} 
          setHasFamily={setHasFamily} 
        />
      </div>
    </div>
  );
};

export default Profile;