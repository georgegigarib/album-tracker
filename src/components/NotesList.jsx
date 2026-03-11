import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Form, InputGroup } from 'react-bootstrap';
import { BsTrash, BsPencil, BsCheck, BsX, BsSend } from 'react-icons/bs';
import { formatDate } from '../utils/formatters';

export default function NotesList({ notes, onAdd, onUpdate, onDelete }) {
  const { t } = useTranslation('components');
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAdd(newNote.trim());
    setNewNote('');
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

  return (
    <div>
      <Form onSubmit={handleAdd} className="mb-3">
        <InputGroup>
          <Form.Control
            placeholder={t('notesList.placeholder')}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={!newNote.trim()}>
            <BsSend />
          </Button>
        </InputGroup>
      </Form>

      {notes.length === 0 && (
        <p className="text-muted text-center py-3">{t('notesList.empty')}</p>
      )}

      {notes.map((note) => (
        <Card key={note.id} className="mb-2 shadow-sm">
          <Card.Body className="py-2 px-3">
            {editingId === note.id ? (
              <div className="d-flex gap-2">
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                />
                <div className="d-flex flex-column gap-1">
                  <Button size="sm" variant="success" onClick={() => saveEdit(note.id)}>
                    <BsCheck />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={cancelEdit}>
                    <BsX />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {note.authorName} &middot; {formatDate(note.createdAt)}
                  </small>
                  <div className="d-flex gap-1">
                    <Button size="sm" variant="link" className="p-0 text-muted" onClick={() => startEdit(note)}>
                      <BsPencil />
                    </Button>
                    <Button size="sm" variant="link" className="p-0 text-danger" onClick={() => onDelete(note.id)}>
                      <BsTrash />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
