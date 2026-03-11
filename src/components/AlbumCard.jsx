import { Card, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsDisc, BsCalendar3, BsMusicNote } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/formatters';

export default function AlbumCard({ album, songsProgress, songCount }) {
  const { t } = useTranslation();
  const progress = songsProgress ?? 0;

  return (
    <Card as={Link} to={`/albums/${album.id}`} className="text-decoration-none h-100 shadow-sm album-card">
      <Card.Body>
        <div className="d-flex align-items-start gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10"
            style={{ width: 48, height: 48, minWidth: 48 }}
          >
            {album.coverURL ? (
              <img src={album.coverURL} alt="" className="rounded" style={{ width: 48, height: 48, objectFit: 'cover' }} />
            ) : (
              <BsDisc size={24} className="text-primary" />
            )}
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <Card.Title className="mb-1 text-truncate">{album.title}</Card.Title>
            <div className="d-flex align-items-center gap-3">
              <small className="text-muted d-flex align-items-center gap-1">
                <BsCalendar3 />
                {formatDate(album.createdAt)}
              </small>
              {songCount != null && (
                <small className="text-muted d-flex align-items-center gap-1">
                  <BsMusicNote />
                  {t('common:songs', { count: songCount })}
                </small>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="d-flex justify-content-between mb-1">
            <small className="text-muted">{t('common:overallProgress')}</small>
            <small className="fw-semibold">{progress}%</small>
          </div>
          <ProgressBar
            now={progress}
            variant={progress === 100 ? 'success' : 'primary'}
            style={{ height: 8 }}
          />
        </div>
      </Card.Body>
    </Card>
  );
}
