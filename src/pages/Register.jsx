import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { BsMusicNoteBeamed } from 'react-icons/bs';
import { useAuthContext } from '../hooks/useAuth';
import { validatePassword } from '../utils/validators';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation('auth');
  const { register } = useAuthContext();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('register.errorEmailInUse'));
      } else {
        setError(t('register.errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div className="text-center mb-4">
          <BsMusicNoteBeamed size={48} className="text-primary mb-2" />
          <h2>{t('register.title')}</h2>
          <p className="text-muted">{t('register.subtitle')}</p>
        </div>

        <Card className="shadow-sm">
          <Card.Body className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>{t('register.name')}</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={t('register.namePlaceholder')}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t('register.email')}</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('register.emailPlaceholder')}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t('register.password')}</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('register.passwordPlaceholder')}
                />
              </Form.Group>

              <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                {loading ? t('register.submitting') : t('register.submit')}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        <p className="text-center mt-3 text-muted">
          {t('register.hasAccount')} <Link to="/login">{t('register.login')}</Link>
        </p>
      </div>
    </Container>
  );
}
