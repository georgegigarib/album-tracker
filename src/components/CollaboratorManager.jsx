import { useState } from 'react';
import { Form, InputGroup, Button, ListGroup, Alert } from 'react-bootstrap';
import { BsPersonPlus, BsTrash } from 'react-icons/bs';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { validateEmail } from '../utils/validators';

export default function CollaboratorManager({ album, collaboratorUsers, onAdd, onRemove }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Email inválido.');
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('No se encontró un usuario con ese email.');
        return;
      }

      const foundUser = snap.docs[0];
      if (foundUser.id === album.ownerId) {
        setError('El propietario ya tiene acceso.');
        return;
      }
      if (album.collaborators?.includes(foundUser.id)) {
        setError('Este usuario ya es colaborador.');
        return;
      }

      await onAdd(foundUser.id);
      setEmail('');
    } catch {
      setError('Error al agregar colaborador.');
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
            placeholder="Email del colaborador"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={loading || !email.trim()}>
            <BsPersonPlus className="me-1" />
            Agregar
          </Button>
        </InputGroup>
      </Form>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      {collaboratorUsers.length === 0 && (
        <p className="text-muted text-center">No hay colaboradores aún.</p>
      )}

      <ListGroup variant="flush">
        {collaboratorUsers.map((collab) => (
          <ListGroup.Item key={collab.uid} className="d-flex justify-content-between align-items-center px-0">
            <div>
              <div className="fw-medium">{collab.displayName || 'Sin nombre'}</div>
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
