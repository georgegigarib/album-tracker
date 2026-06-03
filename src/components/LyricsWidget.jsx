import { Link } from 'react-router-dom';
import { Card, Button, Spinner } from 'react-bootstrap';
import { BsMusicNoteBeamed, BsCheckCircleFill } from 'react-icons/bs';
import { useLyrics } from '../hooks/useLyrics';

export default function LyricsWidget({ albumId, songId }) {
  const { lyrics, loading } = useLyrics(albumId, songId);

  const lyricsPath = `/albums/${albumId}/songs/${songId}/lyrics`;
  const syncedCount = lyrics?.lines?.filter((l) => l.timestamp !== null).length ?? 0;
  const totalLines = lyrics?.lines?.length ?? 0;
  const isSynced = totalLines > 0 && syncedCount === totalLines;

  return (
    <Card className="shadow-sm mt-3">
      <Card.Header className="fw-semibold py-2 d-flex align-items-center gap-2">
        <BsMusicNoteBeamed size={14} />
        Letra
      </Card.Header>
      <Card.Body className="py-2">
        {loading ? (
          <div className="text-center py-2"><Spinner size="sm" /></div>
        ) : !lyrics ? (
          <>
            <p className="small text-secondary mb-2">Sin letra escrita.</p>
            <Button as={Link} to={lyricsPath} size="sm" variant="outline-secondary" className="w-100">
              + Escribir letra
            </Button>
          </>
        ) : (
          <>
            <div className="d-flex align-items-center gap-2 mb-2">
              <small className="text-secondary">{totalLines} versos</small>
              {isSynced && (
                <small className="text-success d-flex align-items-center gap-1">
                  <BsCheckCircleFill size={11} /> Sincronizada
                </small>
              )}
              {!isSynced && syncedCount > 0 && (
                <small className="text-warning">{syncedCount}/{totalLines} sincronizados</small>
              )}
            </div>

            {lyrics.lines?.slice(0, 2).map((l, i) => (
              <p key={i} className="small fst-italic text-secondary mb-1 text-truncate" style={{ opacity: 0.8 }}>
                {l.text}
              </p>
            ))}
            {totalLines > 2 && (
              <p className="small text-secondary mb-2" style={{ opacity: 0.5 }}>
                +{totalLines - 2} versos más...
              </p>
            )}

            <Button as={Link} to={lyricsPath} size="sm" variant="outline-primary" className="w-100 mt-1">
              Ver / Editar letra
            </Button>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
