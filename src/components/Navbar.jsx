import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap';
import { BsMusicNoteBeamed, BsBoxArrowRight, BsPersonCircle, BsSunFill, BsMoonFill, BsTranslate } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function AppNavbar() {
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation('navbar');
  const navigate = useNavigate();

  function toggleLanguage() {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  }

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
          {t('brand')}
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="main-nav" />
        <BsNavbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">{t('dashboard')}</Nav.Link>
          </Nav>
          <Nav className="d-flex align-items-center gap-2">
            <Button
              variant="link"
              size="sm"
              onClick={toggleLanguage}
              className="p-1 text-secondary"
              title={t('language')}
            >
              <BsTranslate size={18} />
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={toggleTheme}
              className="p-1 text-secondary"
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? <BsSunFill size={18} /> : <BsMoonFill size={18} />}
            </Button>
            <Nav.Link as={Link} to="/profile" className="d-flex align-items-center gap-1">
              <BsPersonCircle />
              <span className="d-none d-md-inline">{user.displayName || user.email}</span>
            </Nav.Link>
            <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
              <BsBoxArrowRight className="me-1" />
              {t('logout')}
            </Button>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
