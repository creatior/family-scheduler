import React, { useContext } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="profile-container">
      <h1>Профиль пользователя</h1>
      <div className="profile-info">
        <p>Email: {user?.email}</p>
      </div>
    </div>
  );
};

export default Profile;