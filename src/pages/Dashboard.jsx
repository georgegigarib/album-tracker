import { useState } from 'react';
import { Container, Row, Col, Button, Form, Modal } from 'react-bootstrap';
import { BsPlusLg } from 'react-icons/bs';
import { useAlbums } from '../hooks/useAlbums';
import { useSongs } from '../hooks/useSongs';
import AlbumCard from '../components/AlbumCard';

function AlbumWithProgress({ album }) {
  const { songs } = useSongs(album.id);

  const avgProgress = songs.length > 0
    ? Math.round(songs.reduce((sum, s) => sum + (s.completionPercent || 0), 0) / songs.length)
    : 0;

  return <AlbumCard album={album} songsProgress={avgProgress} songCount={songs.length} />;
}

export default function Dashboard() {
  const { albums, loading, createAlbum } = useAlbums();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createAlbum(newTitle.trim());
    setNewTitle('');
    setShowModal(false);
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Mis Álbumes</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <BsPlusLg className="me-1" />
          Nuevo Álbum
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted">Cargando...</p>
      ) : albums.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted fs-5">No tienes álbumes aún.</p>
          <Button variant="primary" onClick={() => setShowModal(true)}>Crear tu primer álbum</Button>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-3">
          {albums.map((album) => (
            <Col key={album.id}>
              <AlbumWithProgress album={album} />
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Nuevo Álbum</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Título del álbum</Form.Label>
              <Form.Control
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: Mi Primer Álbum"
                autoFocus
                required
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
