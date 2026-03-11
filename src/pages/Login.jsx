import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { BsGoogle, BsMusicNoteBeamed } from 'react-icons/bs';
import { useAuthContext } from '../hooks/useAuth';

export default function Login() {
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
      setError('Email o contraseña incorrectos.');
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
      setError('Error al iniciar sesión con Google.');
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div className="text-center mb-4">
          <BsMusicNoteBeamed size={48} className="text-primary mb-2" />
          <h2>Album Tracker</h2>
          <p className="text-muted">Inicia sesión para continuar</p>
        </div>

        <Card className="shadow-sm">
          <Card.Body className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••"
                />
              </Form.Group>

              <Button type="submit" variant="primary" className="w-100 mb-3" disabled={loading}>
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </Button>
            </Form>

            <div className="text-center mb-3">
              <span className="text-muted">o</span>
            </div>

            <Button variant="outline-dark" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleGoogle}>
              <BsGoogle />
              Continuar con Google
            </Button>
          </Card.Body>
        </Card>

        <p className="text-center mt-3 text-muted">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </Container>
  );
}
