import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import AppNavbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AlbumDetail from './pages/AlbumDetail';
import SongDetail from './pages/SongDetail';
import AlbumSettings from './pages/AlbumSettings';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <AppNavbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/albums/:albumId" element={<PrivateRoute><AlbumDetail /></PrivateRoute>} />
          <Route path="/albums/:albumId/songs/:songId" element={<PrivateRoute><SongDetail /></PrivateRoute>} />
          <Route path="/albums/:albumId/settings" element={<PrivateRoute><AlbumSettings /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
