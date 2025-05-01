import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';
import '../styles/register.css';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        birth_date: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const res = await axios.post('http://localhost:8000/api/register/', formData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            localStorage.setItem('token', res.data.access);
            navigate('/');
        } catch (err) {
            const errorMsg = err.response?.data?.detail 
            || err.response?.data?.message 
            || 'Ошибка регистрации';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container auth-container">
            <div className="register-content">
                <div className="auth-header">
                    <h2>Создайте аккаунт</h2>
                    <p>Заполните форму для регистрации</p>
                </div>
                
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Имя пользователя*</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            className="form-control"
                            placeholder="Придумайте username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">Email*</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="form-control"
                            placeholder="Ваш email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Пароль*</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="form-control"
                            placeholder="Придумайте пароль"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <div className="password-hint">
                            Пароль должен содержать минимум 8 символов
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="birth_date">Дата рождения</label>
                        <input
                            id="birth_date"
                            name="birth_date"
                            type="date"
                            className="form-control"
                            value={formData.birth_date}
                            onChange={handleChange}
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
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Регистрация...
                            </>
                        ) : (
                            'Зарегистрироваться'
                        )}
                    </button>
                    
                    <div className="auth-footer">
                        Уже есть аккаунт? <a href="/login" className="auth-link">Войдите</a>
                    </div>
                </form>
            </div>
        </div>
    );
}