import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Modal, ProgressBar } from 'react-bootstrap';
import { BsPlusLg, BsGearFill, BsArrowLeft } from 'react-icons/bs';
import { useSongs } from '../hooks/useSongs';
import { useAlbums } from '../hooks/useAlbums';
import SongCard from '../components/SongCard';

export default function AlbumDetail() {
  const { albumId } = useParams();
  const { albums } = useAlbums();
  const { songs, loading, createSong } = useSongs(albumId);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');

  const album = albums.find((a) => a.id === albumId);

  const avgProgress = songs.length > 0
    ? Math.round(songs.reduce((sum, s) => sum + (s.completionPercent || 0), 0) / songs.length)
    : 0;

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createSong(newTitle.trim(), estimatedDate ? new Date(estimatedDate) : null);
    setNewTitle('');
    setEstimatedDate('');
    setShowModal(false);
  }

  if (!album) return <Container className="py-4"><p>Álbum no encontrado.</p></Container>;

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <Button as={Link} to="/dashboard" variant="link" className="p-0 text-muted">
          <BsArrowLeft size={20} />
        </Button>
        <h3 className="mb-0 flex-grow-1">{album.title}</h3>
        <Button as={Link} to={`/albums/${albumId}/settings`} variant="outline-secondary" size="sm">
          <BsGearFill />
        </Button>
      </div>

      <div className="mb-4">
        <div className="d-flex justify-content-between mb-1">
          <small className="text-muted">Progreso general del álbum</small>
          <small className="fw-semibold">{avgProgress}%</small>
        </div>
        <ProgressBar now={avgProgress} variant={avgProgress === 100 ? 'success' : 'primary'} style={{ height: 10 }} />
        <small className="text-muted">{songs.length} canción{songs.length !== 1 ? 'es' : ''}</small>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Canciones</h5>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <BsPlusLg className="me-1" />
          Nueva Canción
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted">Cargando...</p>
      ) : songs.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No hay canciones aún.</p>
          <Button variant="primary" onClick={() => setShowModal(true)}>Agregar primera canción</Button>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-3">
          {songs.map((song) => (
            <Col key={song.id}>
              <SongCard song={song} albumId={albumId} />
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Nueva Canción</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Título</Form.Label>
              <Form.Control
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: Intro épica"
                autoFocus
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Fecha estimada de finalización (opcional)</Form.Label>
              <Form.Control
                type="date"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={!newTitle.trim()}>Crear</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
