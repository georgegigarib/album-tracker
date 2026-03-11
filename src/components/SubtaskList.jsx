import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, InputGroup, Button, ListGroup } from 'react-bootstrap';
import { BsPlusLg, BsTrash } from 'react-icons/bs';

export default function SubtaskList({ subtasks, onAdd, onToggle, onDelete }) {
  const { t } = useTranslation('components');
  const [newTitle, setNewTitle] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim());
    setNewTitle('');
  }

  return (
    <div>
      <Form onSubmit={handleAdd} className="mb-2">
        <InputGroup size="sm">
          <Form.Control
            placeholder={t('subtaskList.placeholder')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button type="submit" variant="outline-primary" disabled={!newTitle.trim()}>
            <BsPlusLg />
          </Button>
        </InputGroup>
      </Form>

      {subtasks.length === 0 && (
        <p className="text-muted text-center small py-2 mb-0">{t('subtaskList.empty')}</p>
      )}

      <ListGroup variant="flush">
        {subtasks.map((subtask) => (
          <ListGroup.Item key={subtask.id} className="d-flex align-items-center gap-2 px-0 py-1">
            <Form.Check
              type="checkbox"
              checked={subtask.completed}
              onChange={() => onToggle(subtask.id, subtask.completed)}
              id={`subtask-${subtask.id}`}
              className="m-0"
            />
            <span className={`flex-grow-1 ${subtask.completed ? 'text-decoration-line-through text-muted' : ''}`}>
              {subtask.title}
            </span>
            <Button
              size="sm"
              variant="link"
              className="p-0 text-danger flex-shrink-0"
              onClick={() => onDelete(subtask.id)}
            >
              <BsTrash size={14} />
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}
