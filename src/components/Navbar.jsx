import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap';
import { BsMusicNoteBeamed, BsBoxArrowRight, BsPersonCircle, BsSunFill, BsMoonFill } from 'react-icons/bs';
import { useAuthContext } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function AppNavbar() {
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <BsNavbar expand="md" sticky="top" className="shadow-sm">
      <Container>
        <BsNavbar.Brand as={Link} to="/dashboard" className="d-flex align-items-center gap-2 fw-bold">
          <BsMusicNoteBeamed size={20} />
          Album Tracker
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="main-nav" />
        <BsNavbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
          </Nav>
          <Nav className="d-flex align-items-center gap-2">
            <Button
              variant="link"
              size="sm"
              onClick={toggleTheme}
              className="p-1 text-secondary"
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <BsSunFill size={18} /> : <BsMoonFill size={18} />}
            </Button>
            <Nav.Link as={Link} to="/profile" className="d-flex align-items-center gap-1">
              <BsPersonCircle />
              <span className="d-none d-md-inline">{user.displayName || user.email}</span>
            </Nav.Link>
            <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
              <BsBoxArrowRight className="me-1" />
              Salir
            </Button>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
