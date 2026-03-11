import { Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useAuthContext } from '../hooks/useAuth';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
