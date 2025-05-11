import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import CreateFamilyModal from './CreateFamilyModal';
import InvitationModal from './InvitationModal';
import '../../styles/profile.css';

const FamilyMembers = ({ hasFamily, setHasFamily }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (hasFamily) {
      fetchMembers();
    }
  }, [hasFamily]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/family/members/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Ошибка загрузки');
      
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка загрузки членов семьи' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (name) => {
    try {
      const response = await fetch('http://localhost:8000/api/family/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name })
      });
      
      if (!response.ok) throw new Error('Ошибка создания семьи');
      
      setHasFamily(true);
      setModal(null);
      setMessage({ type: 'success', text: 'Семья создана!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) {
    return <div className="loading">Загрузка данных семьи...</div>;
  }

  return (
    <div className="family-section">
      <h2>Управление семьей</h2>
      
      {message.text && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

      {hasFamily ? (
        <>
          <div className="family-actions">
            <button onClick={() => setModal('invite')}>
              Пригласить в семью
            </button>
            <button className="danger" onClick={() => setHasFamily(false)}>
              Покинуть семью
            </button>
          </div>
          
          <ul className="members-list">
            {members.map(member => (
              <li key={member.id}>
                {member.username} {member.id === user?.id && '(Вы)'}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button onClick={() => setModal('create')}>
          Создать новую семью
        </button>
      )}

      {modal === 'create' && (
        <CreateFamilyModal
          onClose={() => setModal(null)}
          onCreate={handleCreateFamily}
        />
      )}

      {modal === 'invite' && (
        <InvitationModal
          onClose={() => setModal(null)}
          onSuccess={() => {
            setMessage({ type: 'success', text: 'Приглашение отправлено!' });
            fetchMembers();
          }}
        />
      )}
    </div>
  );
};

export default FamilyMembers;