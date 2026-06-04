import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BsPlusLg, BsTrash, BsCheck } from 'react-icons/bs';

function SubtaskRow({ subtask, onToggle, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="d-flex align-items-center gap-2 py-1 px-1 rounded"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ minHeight: 32 }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={subtask.completed}
        aria-label={subtask.title}
        onClick={() => onToggle(subtask.id, subtask.completed)}
        style={{
          width: 20, height: 20, borderRadius: 4, flexShrink: 0, padding: 0,
          border: subtask.completed ? 'none' : '1.5px solid var(--bs-border-color)',
          background: subtask.completed ? 'var(--bs-success)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
          color: 'white',
        }}
      >
        {subtask.completed && <BsCheck size={12} />}
      </button>
      <span
        className={`flex-grow-1 ${subtask.completed ? 'text-decoration-line-through' : ''}`}
        style={{ fontSize: 14, opacity: subtask.completed ? 0.45 : 1, color: 'var(--bs-body-color)' }}
      >
        {subtask.title}
      </span>
      <button
        type="button"
        onClick={() => onDelete(subtask.id)}
        style={{
          border: 'none', background: 'transparent', padding: '2px 4px',
          color: 'var(--bs-danger)', cursor: 'pointer',
          opacity: hovered ? 0.8 : 0,
          transition: 'opacity 0.15s',
          flexShrink: 0,
        }}
      >
        <BsTrash size={12} />
      </button>
    </div>
  );
}

export default function SubtaskList({ subtasks, onAdd, onToggle, onDelete }) {
  const { t } = useTranslation('components');
  const [newTitle, setNewTitle] = useState('');
  const [focused, setFocused] = useState(false);

  const completed = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  function submit() {
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim());
    setNewTitle('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div>
      {total > 0 && (
        <div className="mb-2">
          <div className="d-flex justify-content-between mb-1" style={{ fontSize: 11, opacity: 0.55 }}>
            <span>{completed}/{total} completados</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: 'var(--bs-border-color)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', width: `${progress}%`,
                background: 'var(--bs-success)', borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      <div className="mb-1">
        {subtasks.map((subtask) => (
          <SubtaskRow key={subtask.id} subtask={subtask} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>

      {subtasks.length === 0 && (
        <p className="text-muted text-center small py-1 mb-2">{t('subtaskList.empty')}</p>
      )}

      {/* Add row */}
      <div
        className="d-flex align-items-center gap-2 py-2 px-2"
        style={{
          borderRadius: 6,
          border: focused ? '1px solid var(--bs-primary)' : '1px dashed var(--bs-border-color)',
          background: 'transparent',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div
          style={{
            width: 20, height: 20, borderRadius: 4, flexShrink: 0,
            border: '1.5px dashed var(--bs-border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--bs-secondary)',
          }}
        >
          <BsPlusLg size={9} />
        </div>
        <input
          type="text"
          placeholder={t('subtaskList.placeholder')}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="bare-input"
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 14, color: 'var(--bs-body-color)',
          }}
        />
        {newTitle.trim() && (
          <button
            type="button"
            onClick={submit}
            style={{
              border: 'none', background: 'var(--bs-primary)',
              color: 'white', borderRadius: 4, padding: '2px 10px',
              fontSize: 12, cursor: 'pointer', flexShrink: 0,
              transition: 'opacity 0.15s',
            }}
          >
            Añadir
          </button>
        )}
      </div>
    </div>
  );
}
