import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { BsGoogle, BsMusicNoteBeamed } from 'react-icons/bs';
import { useAuthContext } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation('auth');
  const { login, loginWithGoogle } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError(t('login.errorInvalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch {
      setError(t('login.errorGoogle'));
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div className="text-center mb-4">
          <BsMusicNoteBeamed size={48} className="text-primary mb-2" />
          <h2>{t('login.title')}</h2>
          <p className="text-muted">{t('login.subtitle')}</p>
        </div>

        <Card className="shadow-sm">
          <Card.Body className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>{t('login.email')}</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('login.emailPlaceholder')}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t('login.password')}</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('login.passwordPlaceholder')}
                />
              </Form.Group>

              <Button type="submit" variant="primary" className="w-100 mb-3" disabled={loading}>
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>
            </Form>

            <div className="text-center mb-3">
              <span className="text-muted">{t('common:or')}</span>
            </div>

            <Button variant="outline-dark" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleGoogle}>
              <BsGoogle />
              {t('login.continueWithGoogle')}
            </Button>
          </Card.Body>
        </Card>

        <p className="text-center mt-3 text-muted">
          {t('login.noAccount')} <Link to="/register">{t('login.register')}</Link>
        </p>
      </div>
    </Container>
  );
}
