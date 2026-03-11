import { Card, Badge, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsMusicNote, BsCalendar3, BsCheckCircleFill, BsCircle } from 'react-icons/bs';
import { formatDate, getStatusLabel, getStatusVariant, getStageLabel } from '../utils/formatters';

const STAGE_ORDER = ['recording', 'editing', 'mixing_stage', 'mastering'];

export default function SongCard({ song, albumId }) {
  const percent = song.completionPercent ?? 0;

  return (
    <Card as={Link} to={`/albums/${albumId}/songs/${song.id}`} className="text-decoration-none h-100 shadow-sm song-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center gap-2">
            <BsMusicNote className="text-primary" />
            <Card.Title as="h6" className="mb-0 text-truncate">{song.title}</Card.Title>
          </div>
          <Badge bg={getStatusVariant(song.status)}>{getStatusLabel(song.status)}</Badge>
        </div>

        {song.estimatedEndDate && (
          <small className="text-muted d-flex align-items-center gap-1 mb-2">
            <BsCalendar3 />
            Entrega: {formatDate(song.estimatedEndDate)}
          </small>
        )}

        {/* Mini stage indicators */}
        {song.stages && (
          <div className="d-flex align-items-center gap-1 mb-2">
            {STAGE_ORDER.map((key) => {
              const stage = song.stages[key];
              if (!stage) return null;
              return (
                <div key={key} className="d-flex align-items-center gap-1" title={getStageLabel(key)}>
                  {stage.completed ? (
                    <BsCheckCircleFill size={12} className="text-success" />
                  ) : (
                    <BsCircle size={12} className="text-muted" />
                  )}
                  <small className="text-muted d-none d-md-inline" style={{ fontSize: '0.7rem' }}>
                    {getStageLabel(key).slice(0, 4)}
                  </small>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-2">
          <div className="d-flex justify-content-between mb-1">
            <small className="text-muted">Progreso</small>
            <small className="fw-semibold">{percent}%</small>
          </div>
          <ProgressBar
            now={percent}
            variant={percent === 100 ? 'success' : percent > 50 ? 'info' : 'primary'}
            style={{ height: 6 }}
          />
        </div>
      </Card.Body>
    </Card>
  );
}
