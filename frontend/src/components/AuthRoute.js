import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AuthRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return user ? <Navigate to="/" replace /> : children;
};

export default AuthRoute;