import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BsTrash, BsPencil, BsCheck, BsX, BsSend } from 'react-icons/bs';
import { formatDate } from '../utils/formatters';

export default function NotesList({ notes, onAdd, onUpdate, onDelete }) {
  const { t } = useTranslation('components');
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef(null);

  function handleInput(e) {
    setNewNote(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    if (!newNote.trim()) return;
    onAdd(newNote.trim());
    setNewNote('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function startEdit(note) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent('');
  }

  function saveEdit(noteId) {
    if (!editContent.trim()) return;
    onUpdate(noteId, editContent.trim());
    setEditingId(null);
    setEditContent('');
  }

  function handleEditKeyDown(e, noteId) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveEdit(noteId);
    }
    if (e.key === 'Escape') cancelEdit();
  }

  return (
    <div>
      {/* Add note */}
      <div
        className="mb-3 rounded-2 p-2"
        style={{ border: '1px solid var(--bs-border-color)', background: 'var(--app-surface)' }}
      >
        <textarea
          ref={textareaRef}
          placeholder={t('notesList.placeholder')}
          value={newNote}
          onInput={handleInput}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="bare-textarea"
          style={{
            width: '100%', border: 'none', outline: 'none',
            resize: 'none', fontSize: 14, color: 'var(--bs-body-color)',
            lineHeight: 1.5, overflow: 'hidden',
          }}
        />
        {newNote.trim() && (
          <div className="d-flex justify-content-between align-items-center mt-1 pt-1" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
            <span style={{ fontSize: 11, opacity: 0.4 }}>Ctrl+Enter para guardar</span>
            <button
              type="button"
              onClick={submit}
              style={{
                border: 'none', borderRadius: 20, padding: '4px 12px',
                background: 'var(--bs-primary)', color: 'white',
                fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <BsSend size={11} /> Añadir
            </button>
          </div>
        )}
      </div>

      {notes.length === 0 && (
        <p className="text-muted text-center py-2 small mb-0">{t('notesList.empty')}</p>
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className="mb-2 rounded-2 p-3"
          style={{ border: '1px solid var(--bs-border-color)', background: 'var(--app-surface)' }}
        >
          {editingId === note.id ? (
            <>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, note.id)}
                autoFocus
                rows={3}
                className="bare-textarea"
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  resize: 'none', fontSize: 14, color: 'var(--bs-body-color)',
                }}
              />
              <div className="d-flex justify-content-end gap-2 mt-1 pt-1" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    border: '1px solid var(--bs-border-color)', background: 'transparent',
                    borderRadius: 20, padding: '3px 10px',
                    color: 'var(--bs-secondary)', cursor: 'pointer', fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}
                >
                  <BsX size={14} /> Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => saveEdit(note.id)}
                  style={{
                    border: 'none', borderRadius: 20, padding: '3px 10px',
                    background: 'var(--bs-success)', color: 'white',
                    fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}
                >
                  <BsCheck size={14} /> Guardar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-2" style={{ whiteSpace: 'pre-wrap', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{note.content}</p>
              <div className="d-flex justify-content-between align-items-center">
                <small style={{ opacity: 0.4, fontSize: 11 }}>
                  {note.authorName} · {formatDate(note.createdAt)}
                </small>
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(note)}
                    style={{ border: 'none', background: 'transparent', padding: '2px 5px', cursor: 'pointer', color: 'var(--bs-secondary)', opacity: 0.6 }}
                  >
                    <BsPencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(note.id)}
                    style={{ border: 'none', background: 'transparent', padding: '2px 5px', cursor: 'pointer', color: 'var(--bs-danger)', opacity: 0.7 }}
                  >
                    <BsTrash size={12} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
