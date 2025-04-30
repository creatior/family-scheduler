  import { useContext } from 'react';
  import { Navigate } from 'react-router-dom';
  import { AuthContext } from '../context/AuthContext';

  const PrivateRoute = ({ children }) => {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
      return <div className="loading-spinner">Loading...</div>;
    }

    return user ? children : <Navigate to="/login" replace />;
  };

  export default PrivateRoute;