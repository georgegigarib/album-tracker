import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { BsArrowLeft, BsCalendar3 } from 'react-icons/bs';
import { useSongs } from '../hooks/useSongs';
import { useNotes } from '../hooks/useNotes';
import { useLinks } from '../hooks/useLinks';
import { useSubtasks } from '../hooks/useSubtasks';
import { useAlbums } from '../hooks/useAlbums';
import Timeline from '../components/Timeline';
import StagePanel from '../components/StagePanel';
import ConfirmModal from '../components/ConfirmModal';
import { formatDate, getStatusLabel, getStatusVariant } from '../utils/formatters';

export default function SongDetail() {
  const { albumId, songId } = useParams();
  const navigate = useNavigate();
  const { albums } = useAlbums();
  const {
    songs, toggleInstrument, addInstrument, removeInstrument,
    toggleStage, updateSong, deleteSong,
  } = useSongs(albumId);
  const { getNotesByStage, addNote, updateNote, deleteNote } = useNotes(albumId, songId);
  const { getLinksByStage, addLink, deleteLink } = useLinks(albumId, songId);
  const { getSubtasksByStage, addSubtask, toggleSubtask, deleteSubtask } = useSubtasks(albumId, songId);
  const [showDelete, setShowDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [activeStage, setActiveStage] = useState('recording');

  const album = albums.find((a) => a.id === albumId);
  const song = songs.find((s) => s.id === songId);

  if (!album || !song) {
    return <Container className="py-4"><p className="text-secondary">Cargando...</p></Container>;
  }

  const percent = song.completionPercent ?? 0;
  const currentStage = song.stages?.[activeStage];
  const stageNotes = getNotesByStage(activeStage);
  const stageLinks = getLinksByStage(activeStage);
  const stageSubtasks = getSubtasksByStage(activeStage);

  async function handleToggleInstrument(key) {
    await toggleInstrument(songId, activeStage, key, song.stageProgress);
  }

  async function handleAddInstrument(key) {
    await addInstrument(songId, key, song.stageProgress);
  }

  async function handleRemoveInstrument(key) {
    await removeInstrument(songId, key, song.stageProgress);
  }

  async function handleToggleStage() {
    if (!song.stages) return;
    await toggleStage(songId, activeStage, song.stages);
  }

  async function handleStatusChange(e) {
    await updateSong(songId, { status: e.target.value });
  }

  async function handleDelete() {
    await deleteSong(songId);
    navigate(`/albums/${albumId}`);
  }

  async function saveTitle() {
    if (titleValue.trim() && titleValue.trim() !== song.title) {
      await updateSong(songId, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Button as={Link} to={`/albums/${albumId}`} variant="link" className="p-0 text-secondary">
          <BsArrowLeft size={20} />
        </Button>
        <div className="flex-grow-1">
          {editingTitle ? (
            <Form.Control
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              autoFocus
            />
          ) : (
            <h3
              className="mb-0"
              style={{ cursor: 'pointer' }}
              onClick={() => { setTitleValue(song.title); setEditingTitle(true); }}
              title="Click para editar"
            >
              {song.title}
            </h3>
          )}
        </div>
        <Badge bg={getStatusVariant(song.status)} className="fs-6">{getStatusLabel(song.status)}</Badge>
      </div>

      {/* Overall progress */}
      <div className="mb-2">
        <div className="d-flex justify-content-between mb-1">
          <small className="text-secondary">Progreso general</small>
          <small className="fw-semibold">{percent}%</small>
        </div>
        <div className="progress" style={{ height: 8, borderRadius: 4 }}>
          <div
            className={`progress-bar bg-${percent === 100 ? 'success' : 'primary'}`}
            style={{ width: `${percent}%`, borderRadius: 4 }}
          />
        </div>
      </div>

      {/* Timeline */}
      <Timeline
        stages={song.stages}
        activeStage={activeStage}
        onSelectStage={setActiveStage}
      />

      <Row className="g-4">
        {/* Left sidebar */}
        <Col xs={12} lg={3}>
          <Card className="shadow-sm">
            <Card.Header className="fw-semibold py-2">Info</Card.Header>
            <Card.Body className="py-2">
              <div className="mb-3">
                <small className="text-secondary d-block mb-1">Estado</small>
                <Form.Select value={song.status} onChange={handleStatusChange} size="sm">
                  <option value="not_started">Sin iniciar</option>
                  <option value="in_progress">En progreso</option>
                  <option value="mixing">En mezcla</option>
                  <option value="done">Terminada</option>
                </Form.Select>
              </div>

              <div className="mb-3">
                <small className="text-secondary d-flex align-items-center gap-1">
                  <BsCalendar3 /> Creada: {formatDate(song.createdAt)}
                </small>
              </div>

              {song.estimatedEndDate && (
                <div className="mb-3">
                  <small className="text-secondary d-flex align-items-center gap-1">
                    <BsCalendar3 /> Entrega: {formatDate(song.estimatedEndDate)}
                  </small>
                </div>
              )}

              <div className="text-center mt-3">
                <Button variant="link" size="sm" className="text-secondary p-0" onClick={() => setShowDelete(true)}>
                  Eliminar canción
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right content */}
        <Col xs={12} lg={9}>
          <StagePanel
            stageKey={activeStage}
            stage={currentStage}
            onToggleStage={handleToggleStage}
            progress={song.stageProgress?.[activeStage]}
            onToggleInstrument={handleToggleInstrument}
            onAddInstrument={handleAddInstrument}
            onRemoveInstrument={handleRemoveInstrument}
            subtasks={stageSubtasks}
            onAddSubtask={(title) => addSubtask(title, activeStage)}
            onToggleSubtask={toggleSubtask}
            onDeleteSubtask={deleteSubtask}
            notes={stageNotes}
            onAddNote={(content) => addNote(content, activeStage)}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            links={stageLinks}
            onAddLink={(title, url) => addLink(title, url, activeStage)}
            onDeleteLink={deleteLink}
          />
        </Col>
      </Row>

      <ConfirmModal
        show={showDelete}
        title="Eliminar cancion"
        message={`Se eliminara "${song.title}" con todas sus notas, subtareas y enlaces.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </Container>
  );
}
