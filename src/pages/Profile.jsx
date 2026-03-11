import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthContext } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { user } = useAuthContext();
  const { t } = useTranslation('profile');
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
      <h3 className="mb-4">{t('title')}</h3>

      <Card className="shadow-sm">
        <Card.Body>
          {success && <Alert variant="success">{t('profileUpdated')}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t('email')}</Form.Label>
              <Form.Control value={user?.email || ''} disabled />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('name')}</Form.Label>
              <Form.Control
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('namePlaceholder')}
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? t('common:saving') : t('common:save')}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
