import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="user-dropdown-container">
      <div 
        className="user-avatar" 
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {user.email.charAt(0).toUpperCase()}
        {isOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleProfileClick}>
              Профиль
            </div>
            <div className="dropdown-item" onClick={handleLogout}>
              Выйти
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDropdown;