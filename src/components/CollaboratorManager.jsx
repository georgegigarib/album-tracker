import { useState } from 'react';
import { Form, InputGroup, Button, ListGroup, Alert } from 'react-bootstrap';
import { BsPersonPlus, BsTrash } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { validateEmail } from '../utils/validators';

export default function CollaboratorManager({ album, collaboratorUsers, onAdd, onRemove }) {
  const { t } = useTranslation('components');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError(t('collaboratorManager.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError(t('collaboratorManager.userNotFound'));
        return;
      }

      const foundUser = snap.docs[0];
      if (foundUser.id === album.ownerId) {
        setError(t('collaboratorManager.ownerAlreadyHasAccess'));
        return;
      }
      if (album.collaborators?.includes(foundUser.id)) {
        setError(t('collaboratorManager.alreadyCollaborator'));
        return;
      }

      await onAdd(foundUser.id);
      setEmail('');
    } catch {
      setError(t('collaboratorManager.errorAdding'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Form onSubmit={handleAdd} className="mb-3">
        <InputGroup>
          <Form.Control
            type="email"
            placeholder={t('collaboratorManager.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={loading || !email.trim()}>
            <BsPersonPlus className="me-1" />
            {t('common:add')}
          </Button>
        </InputGroup>
      </Form>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      {collaboratorUsers.length === 0 && (
        <p className="text-muted text-center">{t('collaboratorManager.noCollaborators')}</p>
      )}

      <ListGroup variant="flush">
        {collaboratorUsers.map((collab) => (
          <ListGroup.Item key={collab.uid} className="d-flex justify-content-between align-items-center px-0">
            <div>
              <div className="fw-medium">{collab.displayName || t('collaboratorManager.noName')}</div>
              <small className="text-muted">{collab.email}</small>
            </div>
            <Button size="sm" variant="outline-danger" onClick={() => onRemove(collab.uid)}>
              <BsTrash />
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}
