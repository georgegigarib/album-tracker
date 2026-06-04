import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Modal, ProgressBar } from 'react-bootstrap';
import { BsPlusLg, BsGearFill, BsArrowLeft } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSongs } from '../hooks/useSongs';
import { useAlbums } from '../hooks/useAlbums';
import SongCard from '../components/SongCard';

function SortableSongCol({ song, albumId, anyDragging }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({
    id: song.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Completely invisible while this item is being dragged (overlay shows instead)
    opacity: isDragging ? 0 : 1,
    cursor: anyDragging ? 'grabbing' : 'grab',
  };

  return (
    <Col
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {/* pointer-events:none on the card while any drag is active so links don't fire */}
      <div style={{ pointerEvents: anyDragging ? 'none' : 'auto', height: '100%' }}>
        <SongCard song={song} albumId={albumId} />
      </div>
    </Col>
  );
}

export default function AlbumDetail() {
  const { t } = useTranslation('albumDetail');
  const { albumId } = useParams();
  const { albums, updateAlbum } = useAlbums();
  const { songs, loading, createSong } = useSongs(albumId);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [activeId, setActiveId] = useState(null);
  // Local order updated immediately on drop — no waiting for Firestore round-trip
  const [localOrder, setLocalOrder] = useState(null);
  const skipSyncRef = useRef(false);

  const album = albums.find((a) => a.id === albumId);

  // Keep localOrder in sync with Firestore when it changes externally
  useEffect(() => {
    if (skipSyncRef.current) { skipSyncRef.current = false; return; }
    setLocalOrder(album?.songOrder || null);
  }, [album?.songOrder]);

  // Sort songs by localOrder (or album.songOrder as fallback)
  const orderedSongs = useMemo(() => {
    const order = localOrder ?? album?.songOrder ?? [];
    if (order.length === 0) return songs;
    const byId = Object.fromEntries(songs.map((s) => [s.id, s]));
    const sorted = order.filter((id) => byId[id]).map((id) => byId[id]);
    const rest = songs.filter((s) => !order.includes(s.id));
    return [...sorted, ...rest];
  }, [songs, localOrder, album?.songOrder]);

  const avgProgress = songs.length > 0
    ? Math.round(songs.reduce((sum, s) => sum + (s.completionPercent || 0), 0) / songs.length)
    : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px movement before starting drag so clicks still work
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSongs.findIndex((s) => s.id === active.id);
    const newIndex = orderedSongs.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(orderedSongs, oldIndex, newIndex).map((s) => s.id);

    // Update UI instantly — skip the next Firestore sync so it doesn't flicker back
    skipSyncRef.current = true;
    setLocalOrder(newOrder);

    // Persist in background, no await
    updateAlbum(albumId, { songOrder: newOrder });
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createSong(newTitle.trim(), estimatedDate ? new Date(estimatedDate) : null);
    setNewTitle('');
    setEstimatedDate('');
    setShowModal(false);
  }

  if (!album) return <Container className="py-4"><p>{t('common:albumNotFound')}</p></Container>;

  const activeSong = activeId ? orderedSongs.find((s) => s.id === activeId) : null;

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
          <small className="text-muted">{t('albumProgress')}</small>
          <small className="fw-semibold">{avgProgress}%</small>
        </div>
        <ProgressBar now={avgProgress} variant={avgProgress === 100 ? 'success' : 'primary'} style={{ height: 10 }} />
        <small className="text-muted">{t('common:songs', { count: songs.length })}</small>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">{t('songs')}</h5>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <BsPlusLg className="me-1" />
          {t('newSong')}
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted">{t('common:loading')}</p>
      ) : songs.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">{t('noSongs')}</p>
          <Button variant="primary" onClick={() => setShowModal(true)}>{t('addFirstSong')}</Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedSongs.map((s) => s.id)} strategy={rectSortingStrategy}>
            <Row xs={1} md={2} lg={3} className="g-3">
              {orderedSongs.map((song) => (
                <SortableSongCol
                  key={song.id}
                  song={song}
                  albumId={albumId}
                  anyDragging={!!activeId}
                />
              ))}
            </Row>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeSong && (
              <div
                style={{
                  transform: 'scale(1.03) rotate(1deg)',
                  boxShadow: '0 20px 48px rgba(0,0,0,0.22)',
                  borderRadius: 12,
                  transition: 'transform 0.2s ease',
                  cursor: 'grabbing',
                }}
              >
                <SongCard song={activeSong} albumId={albumId} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('newSong')}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t('songTitle')}</Form.Label>
              <Form.Control
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('songTitlePlaceholder')}
                autoFocus
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t('estimatedDate')}</Form.Label>
              <Form.Control
                type="date"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>{t('common:cancel')}</Button>
            <Button type="submit" variant="primary" disabled={!newTitle.trim()}>{t('common:create')}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
