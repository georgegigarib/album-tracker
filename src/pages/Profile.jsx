import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthContext } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuthContext();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      await updateDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() });
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-4" style={{ maxWidth: 480 }}>
      <h3 className="mb-4">Perfil</h3>

      <Card className="shadow-sm">
        <Card.Body>
          {success && <Alert variant="success">Perfil actualizado.</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control value={user?.email || ''} disabled />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
