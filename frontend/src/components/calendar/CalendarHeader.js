import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import UserDropdown from '../UserDropdown';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const CalendarHeader = ({ 
  currentDate, 
  onPrevWeek, 
  onNextWeek, 
  onToday, 
  onAddEvent,
  familyMembers,
  selectedMembers,
  onToggleMember,
  onToggleSelectAll,
  showMemberFilter,
  setShowMemberFilter,
}) => {
  const { user } = useContext(AuthContext);
  return (
    <div className="calendar-header">
      <h2>{format(currentDate, 'MMMM yyyy', { locale: ru })}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button 
          onClick={onAddEvent}
          className="add-event-button"
        >
          + Добавить событие
        </button>

        {familyMembers.length > 0 && (
          <div className="member-filter">
            <button 
              onClick={() => setShowMemberFilter(!showMemberFilter)}
              className="filter-button"
            >
              Фильтр по членам семьи ({selectedMembers.length}/{familyMembers.length})
            </button>
            {showMemberFilter && (
              <div className="member-filter-dropdown">
                <div className="member-filter-all">
                  <button onClick={onToggleSelectAll}>
                    {selectedMembers.length === familyMembers.length 
                      ? 'Убрать всех' 
                      : 'Выбрать всех'}
                  </button>
                </div>
                {familyMembers.map(member => (
                  <div key={member.id} className="member-filter-item">
                    <input
                      type="checkbox"
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => onToggleMember(member.id)}
                    />
                    <label htmlFor={`member-${member.id}`}>
                      {member.username || member.email}
                      {member.id === user?.id && ' (Вы)'}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="calendar-controls">
          <button onClick={onPrevWeek}>
            &lt; Предыдущая
          </button>
          <button onClick={onToday}>
            Сегодня
          </button>
          <button onClick={onNextWeek}>
            Следующая &gt;
          </button>
        </div>
        <UserDropdown />
      </div>
    </div>
  );
};

export default CalendarHeader;