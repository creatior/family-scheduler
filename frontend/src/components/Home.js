import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="home-page">
      <h1>Добро пожаловать{user ? `, ${user.username}` : ''}!</h1>
      {user && (
        <>
          <p>Вы вошли как: {user.email}</p>
          <button onClick={logout} className="logout-btn">
            Выйти
          </button>
        </>
      )}
    </div>
  );
}