import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { login, isLoading } = useContext(AuthContext); // Access isLoading from context
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:8000/api/login/', formData);
      await login(res.data.access);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    }
  };

  return (
    <div className="login-container auth-container">
        <div className="login-content">
            <div className="auth-header login-header">
                <h2>Добро пожаловать</h2>
                <p>Введите свои данные для входа</p>
            </div>
            
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Имя пользователя</label>
                    <input
                        id="username"
                        type="text"
                        className="form-control"
                        placeholder="Введите ваш username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <div className="flex-between">
                        <label htmlFor="password">Пароль</label>
                    </div>
                    <input
                        id="password"
                        type="password"
                        className="form-control"
                        placeholder="Введите ваш пароль"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />
                </div>
                
                {error && (
                    <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i> {error}
                    </div>
                )}
                
                <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isLoading} // Disable button when loading
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Вход...
                        </>
                    ) : (
                        'Войти в аккаунт'
                    )}
                </button>
                
                <div className="auth-footer">
                    Ещё нет аккаунта? <a href="/register" className="auth-link">Зарегистрируйтесь</a>
                </div>
            </form>
        </div>
    </div>
  );
}