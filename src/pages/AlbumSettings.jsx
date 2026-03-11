import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';
import { BsArrowLeft, BsTrash } from 'react-icons/bs';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAlbums } from '../hooks/useAlbums';
import { useAuthContext } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import CollaboratorManager from '../components/CollaboratorManager';
import ConfirmModal from '../components/ConfirmModal';

export default function AlbumSettings() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { albums, updateAlbum, deleteAlbum, addCollaborator, removeCollaborator } = useAlbums();
  const { t } = useTranslation('albumSettings');
  const [titleOverride, setTitleOverride] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [collaboratorUsers, setCollaboratorUsers] = useState([]);

  const album = albums.find((a) => a.id === albumId);
  const isOwner = album?.ownerId === user?.uid;
  const title = titleOverride ?? album?.title ?? '';
  const setTitle = setTitleOverride;

  useEffect(() => {
    if (!album?.collaborators?.length) return;

    let cancelled = false;
    async function fetchCollabs() {
      const users = [];
      for (const uid of album.collaborators) {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) users.push({ uid, ...snap.data() });
      }
      if (!cancelled) setCollaboratorUsers(users);
    }
    fetchCollabs();
    return () => { cancelled = true; };
  }, [album?.collaborators]);

  async function handleSaveTitle(e) {
    e.preventDefault();
    if (title.trim() && title.trim() !== album.title) {
      await updateAlbum(albumId, { title: title.trim() });
    }
  }

  async function handleDelete() {
    await deleteAlbum(albumId);
    navigate('/dashboard');
  }

  async function handleAddCollaborator(uid) {
    await addCollaborator(albumId, uid);
  }

  async function handleRemoveCollaborator(uid) {
    await removeCollaborator(albumId, uid);
  }

  if (!album) return <Container className="py-4"><p>{t('common:albumNotFound')}</p></Container>;

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <div className="d-flex align-items-center gap-2 mb-4">
        <Button as={Link} to={`/albums/${albumId}`} variant="link" className="p-0 text-muted">
          <BsArrowLeft size={20} />
        </Button>
        <h3 className="mb-0">{t('title')}</h3>
      </div>

      <Row className="g-4">
        <Col xs={12}>
          <Card className="shadow-sm">
            <Card.Header className="fw-semibold">{t('common:general')}</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSaveTitle}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('albumTitle')}</Form.Label>
                  <Form.Control
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isOwner}
                  />
                </Form.Group>
                {isOwner && (
                  <Button type="submit" variant="primary" size="sm" disabled={!title.trim()}>
                    {t('common:saveChanges')}
                  </Button>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className="shadow-sm">
            <Card.Header className="fw-semibold">{t('collaborators')}</Card.Header>
            <Card.Body>
              {isOwner ? (
                <CollaboratorManager
                  album={album}
                  collaboratorUsers={collaboratorUsers}
                  onAdd={handleAddCollaborator}
                  onRemove={handleRemoveCollaborator}
                />
              ) : (
                <div>
                  <p className="text-muted">{t('onlyOwnerCanManage')}</p>
                  {collaboratorUsers.map((c) => (
                    <div key={c.uid} className="mb-1">
                      {c.displayName || c.email}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {isOwner && (
          <Col xs={12}>
            <Card className="shadow-sm border-danger">
              <Card.Header className="fw-semibold text-danger">{t('dangerZone')}</Card.Header>
              <Card.Body>
                <p className="text-muted mb-2">{t('deleteWarning')}</p>
                <Button variant="danger" onClick={() => setShowDelete(true)}>
                  <BsTrash className="me-1" /> {t('deleteAlbum')}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <ConfirmModal
        show={showDelete}
        title={t('deleteTitle')}
        message={t('deleteMessage', { title: album.title })}
        confirmLabel={t('common:delete')}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </Container>
  );
}
