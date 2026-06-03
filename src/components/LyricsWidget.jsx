import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Spinner } from 'react-bootstrap';
import { BsMusicNoteBeamed, BsCheckCircleFill } from 'react-icons/bs';
import { useLyrics } from '../hooks/useLyrics';

export default function LyricsWidget({ albumId, songId }) {
  const { t } = useTranslation('components');
  const { lyrics, loading } = useLyrics(albumId, songId);

  const lyricsPath = `/albums/${albumId}/songs/${songId}/lyrics`;
  const syncedCount = lyrics?.lines?.filter((l) => l.timestamp !== null).length ?? 0;
  const totalLines = lyrics?.lines?.length ?? 0;
  const isSynced = totalLines > 0 && syncedCount === totalLines;

  return (
    <Card className="shadow-sm mt-3">
      <Card.Header className="fw-semibold py-2 d-flex align-items-center gap-2">
        <BsMusicNoteBeamed size={14} />
        {t('lyricsWidget.title')}
      </Card.Header>
      <Card.Body className="py-2">
        {loading ? (
          <div className="text-center py-2"><Spinner size="sm" /></div>
        ) : !lyrics ? (
          <>
            <p className="small text-secondary mb-2">{t('lyricsWidget.noLyrics')}</p>
            <Button as={Link} to={lyricsPath} size="sm" variant="outline-secondary" className="w-100">
              {t('lyricsWidget.writeLyrics')}
            </Button>
          </>
        ) : (
          <>
            <div className="d-flex align-items-center gap-2 mb-2">
              <small className="text-secondary">{t('lyricsWidget.verses', { count: totalLines })}</small>
              {isSynced && (
                <small className="text-success d-flex align-items-center gap-1">
                  <BsCheckCircleFill size={11} /> {t('lyricsWidget.synced')}
                </small>
              )}
              {!isSynced && syncedCount > 0 && (
                <small className="text-warning">{t('lyricsWidget.partialSync', { synced: syncedCount, total: totalLines })}</small>
              )}
            </div>

            {lyrics.lines?.slice(0, 2).map((l, i) => (
              <p key={i} className="small fst-italic text-secondary mb-1 text-truncate" style={{ opacity: 0.8 }}>
                {l.text}
              </p>
            ))}
            {totalLines > 2 && (
              <p className="small text-secondary mb-2" style={{ opacity: 0.5 }}>
                {t('lyricsWidget.moreVerses', { count: totalLines - 2 })}
              </p>
            )}

            <Button as={Link} to={lyricsPath} size="sm" variant="outline-primary" className="w-100 mt-1">
              {t('lyricsWidget.viewEdit')}
            </Button>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
