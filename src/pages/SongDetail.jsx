import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import LatestDemoPlayer from '../components/LatestDemoPlayer';
import LyricsWidget from '../components/LyricsWidget';
import { formatDate, getStatusLabel, getStatusVariant, getGoogleDriveFileId } from '../utils/formatters';

export default function SongDetail() {
  const { t } = useTranslation('songDetail');
  const { albumId, songId } = useParams();
  const navigate = useNavigate();
  const { albums } = useAlbums();
  const {
    songs, toggleInstrument, addInstrument, removeInstrument,
    toggleStage, updateSong, deleteSong,
  } = useSongs(albumId);
  const { getNotesByStage, addNote, updateNote, deleteNote } = useNotes(albumId, songId);
  const { allLinks, getLinksByStage, addLink, deleteLink, setLatestDemo } = useLinks(albumId, songId);
  const { getSubtasksByStage, addSubtask, toggleSubtask, deleteSubtask } = useSubtasks(albumId, songId);
  const [showDelete, setShowDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [activeStage, setActiveStage] = useState('recording');

  const album = albums.find((a) => a.id === albumId);
  const song = songs.find((s) => s.id === songId);
  const latestDemo = allLinks.find((l) => l.isLatestDemo);

  if (!album || !song) {
    return <Container className="py-4"><p className="text-secondary">{t('common:loading')}</p></Container>;
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

  function getDateInputValue() {
    if (!song.estimatedEndDate) return '';
    const d = song.estimatedEndDate?.toDate?.() ?? new Date(song.estimatedEndDate);
    return d.toISOString().slice(0, 10);
  }

  async function saveDate(e) {
    const val = e.target.value;
    setEditingDate(false);
    await updateSong(songId, { estimatedEndDate: val ? new Date(val) : null });
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
              title={t('clickToEdit')}
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
          <small className="text-secondary">{t('common:overallProgress')}</small>
          <small className="fw-semibold">{percent}%</small>
        </div>
        <div className="progress" style={{ height: 8, borderRadius: 4 }}>
          <div
            className={`progress-bar bg-${percent === 100 ? 'success' : 'primary'}`}
            style={{ width: `${percent}%`, borderRadius: 4 }}
          />
        </div>
      </div>

      {/* Latest demo player */}
      {latestDemo && getGoogleDriveFileId(latestDemo.url) && (
        <LatestDemoPlayer
          fileId={getGoogleDriveFileId(latestDemo.url)}
          linkTitle={latestDemo.title}
          songTitle={song.title}
          albumId={albumId}
          songId={songId}
        />
      )}

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
            <Card.Header className="fw-semibold py-2">{t('common:info')}</Card.Header>
            <Card.Body className="py-2">
              <div className="mb-3">
                <small className="text-secondary d-block mb-1">{t('common:status.label')}</small>
                <Form.Select value={song.status} onChange={handleStatusChange} size="sm">
                  <option value="not_started">{t('common:status.not_started')}</option>
                  <option value="in_progress">{t('common:status.in_progress')}</option>
                  <option value="mixing">{t('common:status.mixing')}</option>
                  <option value="done">{t('common:status.done')}</option>
                </Form.Select>
              </div>

              <div className="mb-3">
                <small className="text-secondary d-flex align-items-center gap-1">
                  <BsCalendar3 /> {t('common:created')}: {formatDate(song.createdAt)}
                </small>
              </div>

              <div className="mb-3">
                {editingDate ? (
                  <Form.Control
                    type="date"
                    size="sm"
                    defaultValue={getDateInputValue()}
                    onChange={saveDate}
                    onBlur={() => setEditingDate(false)}
                    autoFocus
                  />
                ) : (
                  <small
                    className="text-secondary d-flex align-items-center gap-1"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setEditingDate(true)}
                    title={t('clickToEdit')}
                  >
                    <BsCalendar3 />
                    {t('common:delivery')}:{' '}
                    {song.estimatedEndDate
                      ? <span className="text-body">{formatDate(song.estimatedEndDate)}</span>
                      : <span style={{ opacity: 0.45 }}>+</span>
                    }
                  </small>
                )}
              </div>

              <div className="text-center mt-3">
                <Button variant="link" size="sm" className="text-secondary p-0" onClick={() => setShowDelete(true)}>
                  {t('deleteSong')}
                </Button>
              </div>
            </Card.Body>
          </Card>

          <LyricsWidget albumId={albumId} songId={songId} />
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
            onSetLatestDemo={setLatestDemo}
          />
        </Col>
      </Row>

      <ConfirmModal
        show={showDelete}
        title={t('deleteTitle')}
        message={t('deleteMessage', { title: song.title })}
        confirmLabel={t('common:delete')}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </Container>
  );
}
