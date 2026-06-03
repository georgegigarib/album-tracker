import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container, Card, Button, Form, Spinner, Alert, Badge, Nav,
} from 'react-bootstrap';
import {
  BsArrowLeft, BsMusicNoteBeamed, BsPlayFill, BsPauseFill,
  BsCheck2Circle, BsExclamationTriangle,
} from 'react-icons/bs';
import { useLyrics } from '../hooks/useLyrics';
import { useLinks } from '../hooks/useLinks';
import { useSongs } from '../hooks/useSongs';
import { useAuthContext } from '../hooks/useAuth';
import { getGoogleDriveFileId } from '../utils/formatters';
import { driveAudioCache } from '../utils/driveAudioCache';
import KaraokeView from '../components/KaraokeView';
import WaveformScrubber from '../components/WaveformScrubber';

function formatTime(s) {
  if (!s || isNaN(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function parseLines(raw, existingLines = []) {
  const byText = {};
  existingLines.forEach((l) => { byText[l.text] = l.timestamp; });
  return raw
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ text, timestamp: byText[text] ?? null }));
}

export default function LyricsEditor() {
  const { albumId, songId } = useParams();
  const { googleAccessToken } = useAuthContext();
  const { lyrics, loading: lyricsLoading, saveLyrics } = useLyrics(albumId, songId);
  const { allLinks } = useLinks(albumId, songId);
  const { songs } = useSongs(albumId);

  const song = songs.find((s) => s.id === songId);
  const driveLinks = allLinks.filter((l) => getGoogleDriveFileId(l.url));

  // ── Tab ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('write');

  // ── Write mode ────────────────────────────────────────────────────────────
  const [rawText, setRawText] = useState('');
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // ── Working lines (sync / view) ───────────────────────────────────────────
  const [workingLines, setWorkingLines] = useState([]);
  const [syncIndex, setSyncIndex] = useState(0);
  const syncIndexRef = useRef(0);
  syncIndexRef.current = syncIndex;

  // ── Audio ─────────────────────────────────────────────────────────────────
  const audioRef = useRef(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [durationMismatch, setDurationMismatch] = useState(false);

  // ── Scroll refs ───────────────────────────────────────────────────────────
  const syncLineRefs = useRef([]);
  const viewLineRefs = useRef([]);

  // ── Init from Firestore ───────────────────────────────────────────────────
  useEffect(() => {
    if (lyricsLoading) return;
    setRawText(lyrics?.rawText || '');
    setWorkingLines(lyrics?.lines || []);
    setSelectedLinkId(
      lyrics?.linkedLinkId || driveLinks[0]?.id || ''
    );
    setIsDirty(false);
    setSavedOk(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lyricsLoading]);

  // ── Fetch audio when selectedLinkId changes ───────────────────────────────
  const selectedLink = driveLinks.find((l) => l.id === selectedLinkId);
  const selectedFileId = selectedLink ? getGoogleDriveFileId(selectedLink.url) : null;

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setDurationMismatch(false);

    if (!selectedFileId || !googleAccessToken) {
      setBlobUrl(null);
      setAudioError(null);
      return;
    }

    if (driveAudioCache.has(selectedFileId)) {
      setBlobUrl(driveAudioCache.get(selectedFileId));
      setAudioError(null);
      return;
    }

    let cancelled = false;
    setAudioLoading(true);
    setAudioError(null);
    setBlobUrl(null);

    fetch(`https://www.googleapis.com/drive/v3/files/${selectedFileId}?alt=media`, {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const reason = body?.error?.errors?.[0]?.reason || res.status;
          throw new Error(`${res.status}: ${reason}`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        driveAudioCache.set(selectedFileId, url);
        setBlobUrl(url);
      })
      .catch((err) => { if (!cancelled) setAudioError(err.message); })
      .finally(() => { if (!cancelled) setAudioLoading(false); });

    return () => { cancelled = true; };
  }, [selectedFileId, googleAccessToken]);

  // ── Duration mismatch detection ───────────────────────────────────────────
  function handleAudioMetadata() {
    const d = audioRef.current?.duration || 0;
    setDuration(d);
    if (
      lyrics?.linkedLinkId === selectedLinkId &&
      lyrics?.linkedLinkDuration &&
      d > 0
    ) {
      setDurationMismatch(Math.abs(d - lyrics.linkedLinkDuration) > 2);
    }
  }

  // ── Audio controls ────────────────────────────────────────────────────────
  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
  }

  function skip(secs) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(duration, audioRef.current.currentTime + secs)
    );
  }

  function handleSeek(val) {
    if (audioRef.current) audioRef.current.currentTime = val;
    setCurrentTime(val);
  }

  // ── Sync actions ──────────────────────────────────────────────────────────
  const stampCurrentLine = useCallback(() => {
    const idx = syncIndexRef.current;
    if (!audioRef.current || idx >= workingLines.length) return;
    const t = audioRef.current.currentTime;
    setWorkingLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, timestamp: t } : l))
    );
    setSyncIndex((prev) => prev + 1);
  }, [workingLines.length]);

  function handleSkipLine() {
    setSyncIndex((prev) => Math.min(prev + 1, workingLines.length));
  }

  function handleResetSync() {
    setWorkingLines((prev) => prev.map((l) => ({ ...l, timestamp: null })));
    setSyncIndex(0);
  }

  function jumpToLine(index) {
    setSyncIndex(index);
    if (audioRef.current && workingLines[index]?.timestamp !== null) {
      audioRef.current.currentTime = Math.max(
        0,
        workingLines[index].timestamp - 2
      );
    }
  }

  // ── Space key for sync mode ───────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'sync') return;
    function onKey(e) {
      const tag = e.target.tagName;
      if (
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)
      ) {
        e.preventDefault();
        stampCurrentLine();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mode, stampCurrentLine]);

  // ── Auto-scroll in sync mode ──────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'sync') return;
    syncLineRefs.current[syncIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [syncIndex, mode]);

  // ── Active line for karaoke view ──────────────────────────────────────────
  const activeLineIndex = workingLines.reduce((active, line, i) => {
    if (line.timestamp !== null && line.timestamp <= currentTime) return i;
    return active;
  }, -1);

  useEffect(() => {
    if (mode !== 'view' || activeLineIndex < 0) return;
    const el = viewLineRefs.current[activeLineIndex];
    const container = viewLineRefs._container;
    if (!el) return;
    if (container) {
      const target = el.offsetTop - container.clientHeight * 0.35 + el.offsetHeight / 2;
      container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIndex, mode]);

  // ── Save helpers ──────────────────────────────────────────────────────────
  async function handleSaveWrite() {
    if (!rawText.trim()) return;
    setSaving(true);
    try {
      const newLines = parseLines(rawText, workingLines);
      await saveLyrics({
        rawText,
        lines: newLines,
        linkedLinkId: selectedLinkId || null,
        linkedLinkDuration:
          duration > 0 ? duration : (lyrics?.linkedLinkDuration ?? null),
      });
      setWorkingLines(newLines);
      setIsDirty(false);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSync() {
    setSaving(true);
    try {
      const textForRaw = workingLines.map((l) => l.text).join('\n');
      await saveLyrics({
        rawText: textForRaw,
        lines: workingLines,
        linkedLinkId: selectedLinkId || null,
        linkedLinkDuration:
          duration > 0 ? duration : (lyrics?.linkedLinkDuration ?? null),
      });
      setIsDirty(false);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const hasLines = workingLines.length > 0;
  const syncedCount = workingLines.filter((l) => l.timestamp !== null).length;
  const syncComplete = syncIndex >= workingLines.length && hasLines;
  const hasSomeSync = syncedCount > 0;
  // ── Shared audio player UI ────────────────────────────────────────────────
  function renderPlayer() {
    return (
      <div
        className="rounded-3 p-3 mb-3"
        style={{
          background: 'linear-gradient(135deg, #0f0c29, #302b63)',
          color: 'white',
        }}
      >
        {audioLoading && (
          <div className="d-flex align-items-center gap-2">
            <Spinner size="sm" style={{ color: 'white' }} />
            <small style={{ opacity: 0.6 }}>Descargando audio...</small>
          </div>
        )}
        {audioError && (
          <small style={{ color: '#ff6b6b' }}>
            {audioError.includes('401') || audioError.includes('403')
              ? 'Sin permiso. Cierra sesión y vuelve a entrar con Google.'
              : `Error: ${audioError}`}
          </small>
        )}
        {!selectedFileId && !audioLoading && (
          <small style={{ opacity: 0.5 }}>
            Sin audio seleccionado — selecciona un demo en la pestaña Escribir.
          </small>
        )}
        {blobUrl && (
          <div>
            <div className="d-flex align-items-center gap-3 mb-2">
              <button
                onClick={() => skip(-10)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.65)', fontSize: 11,
                  cursor: 'pointer', padding: '4px 6px',
                }}
              >
                −10s
              </button>
              <button
                onClick={togglePlay}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: '#1DB954', border: 'none', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(29,185,84,0.35)',
                  flexShrink: 0,
                }}
              >
                {playing
                  ? <BsPauseFill size={18} />
                  : <BsPlayFill size={18} style={{ marginLeft: 2 }} />}
              </button>
              <button
                onClick={() => skip(10)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.65)', fontSize: 11,
                  cursor: 'pointer', padding: '4px 6px',
                }}
              >
                +10s
              </button>
              <span
                className="ms-auto"
                style={{
                  fontSize: 12, opacity: 0.55,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Waveform scrubber */}
            <WaveformScrubber
              blobUrl={blobUrl}
              currentTime={currentTime}
              duration={duration}
              playing={playing}
              onSeek={handleSeek}
              height={44}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (lyricsLoading || !song) {
    return (
      <Container className="py-5 text-center">
        <Spinner />
      </Container>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Container className="py-4" style={{ maxWidth: 760 }}>

      {/* Hidden audio element */}
      {blobUrl && (
        <audio
          ref={audioRef}
          src={blobUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={handleAudioMetadata}
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          style={{ display: 'none' }}
        />
      )}

      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button
          as={Link}
          to={`/albums/${albumId}/songs/${songId}`}
          variant="link"
          className="p-0 text-secondary"
        >
          <BsArrowLeft size={20} />
        </Button>
        <div className="flex-grow-1">
          <div className="text-secondary" style={{ fontSize: 12 }}>{song.title}</div>
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <BsMusicNoteBeamed size={18} className="text-primary" />
            Letra
          </h4>
        </div>
        <div className="d-flex align-items-center gap-2">
          {isDirty && <Badge bg="warning" text="dark">Sin guardar</Badge>}
          {savedOk && !isDirty && (
            <span className="text-success small d-flex align-items-center gap-1">
              <BsCheck2Circle size={14} /> Guardado
            </span>
          )}
        </div>
      </div>

      {/* Mode tabs */}
      <Nav
        variant="pills"
        className="mb-4"
        style={{
          background: 'var(--bs-tertiary-bg)',
          borderRadius: 10,
          padding: 4,
          gap: 2,
        }}
      >
        {[
          { key: 'write', label: '✏️ Escribir' },
          { key: 'sync', label: '⏱ Sincronizar' },
          { key: 'view', label: '👁 Ver' },
        ].map(({ key, label }) => (
          <Nav.Item key={key} style={{ flex: 1 }}>
            <Nav.Link
              active={mode === key}
              onClick={() => setMode(key)}
              className="text-center"
              style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 12px' }}
            >
              {label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {/* ═══ WRITE MODE ═══════════════════════════════════════════════════ */}
      {mode === 'write' && (
        <Card className="shadow-sm">
          <Card.Body className="p-4">
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small">Demo de audio</Form.Label>
              {driveLinks.length === 0 ? (
                <Alert variant="info" className="mb-0 py-2 small">
                  No hay links de Google Drive. Agrégalos en la sección de enlaces de la canción.
                </Alert>
              ) : (
                <Form.Select
                  size="sm"
                  value={selectedLinkId}
                  onChange={(e) => setSelectedLinkId(e.target.value)}
                >
                  <option value="">Sin audio</option>
                  {driveLinks.map((l) => (
                    <option key={l.id} value={l.id}>{l.title || l.url}</option>
                  ))}
                </Form.Select>
              )}
              <Form.Text className="text-secondary">
                Se usará para sincronizar los timestamps de cada verso.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small">Letra</Form.Label>
              <Form.Control
                as="textarea"
                rows={Math.max(10, (rawText.match(/\n/g) || []).length + 3)}
                value={rawText}
                onChange={(e) => { setRawText(e.target.value); setIsDirty(true); }}
                placeholder={
                  'Escribe la letra aquí...\n\nCada línea es un verso.\n' +
                  'Usa líneas vacías para separar estrofas.\n\n' +
                  'Ejemplo:\nI see trees of green\nRed roses too\nI\'ll see them bloom'
                }
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 14,
                  lineHeight: 1.7,
                  resize: 'vertical',
                  minHeight: 220,
                }}
              />
              <div className="d-flex justify-content-between mt-1">
                <Form.Text className="text-secondary">
                  Una línea = un verso. Las líneas vacías se ignoran al sincronizar.
                </Form.Text>
                <Form.Text className="text-secondary">
                  {rawText.split('\n').filter((l) => l.trim()).length} versos
                </Form.Text>
              </div>
            </Form.Group>

            <Button
              variant="primary"
              onClick={handleSaveWrite}
              disabled={saving || !rawText.trim()}
              className="px-4"
            >
              {saving
                ? <><Spinner size="sm" className="me-2" />Guardando...</>
                : '💾 Guardar letra'}
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* ═══ SYNC MODE ════════════════════════════════════════════════════ */}
      {mode === 'sync' && (
        <div>
          {/* Warnings */}
          {!hasLines && (
            <Alert variant="warning" className="d-flex align-items-center gap-2">
              <BsExclamationTriangle className="flex-shrink-0" />
              <span>
                Sin versos. Escribe la letra en{' '}
                <span
                  className="fw-semibold"
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setMode('write')}
                >
                  Escribir
                </span>
                {' '}y guarda antes de sincronizar.
              </span>
            </Alert>
          )}

          {hasLines && !selectedFileId && (
            <Alert variant="info" className="d-flex align-items-center gap-2">
              <BsExclamationTriangle className="flex-shrink-0" />
              Selecciona un demo de audio en{' '}
              <span
                className="fw-semibold ms-1"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setMode('write')}
              >
                Escribir
              </span>
              .
            </Alert>
          )}

          {hasLines && selectedFileId && !googleAccessToken && (
            <Alert variant="warning">
              Inicia sesión con Google para reproducir el audio de Drive.
            </Alert>
          )}

          {durationMismatch && (
            <Alert variant="warning" className="d-flex align-items-center gap-2 flex-wrap">
              <BsExclamationTriangle className="flex-shrink-0" />
              <span className="flex-grow-1">
                La duración del audio cambió respecto a la sincronización guardada.
                Los timestamps pueden no coincidir.
              </span>
              <Button
                size="sm"
                variant="outline-warning"
                className="flex-shrink-0"
                onClick={handleResetSync}
              >
                Reiniciar sync
              </Button>
            </Alert>
          )}

          {/* Player */}
          {renderPlayer()}

          {hasLines && (
            <>
              {/* Lines list — redesigned */}
              <div
                className="hide-scrollbar"
                style={{
                  maxHeight: '42vh',
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '4px 2px',
                }}
              >
                {workingLines.map((line, i) => {
                  const isCurrent = i === syncIndex;
                  const isStamped = line.timestamp !== null;
                  const isPast = i < syncIndex && isStamped;

                  return (
                    <div
                      key={i}
                      ref={(el) => { syncLineRefs.current[i] = el; }}
                      onClick={() => jumpToLine(i)}
                      className="d-flex align-items-center gap-3 rounded-3"
                      style={{
                        cursor: 'pointer',
                        padding: '11px 14px',
                        background: isCurrent
                          ? 'linear-gradient(135deg, var(--bs-primary), #6f42c1)'
                          : isPast
                            ? 'var(--bs-success-bg-subtle)'
                            : 'var(--bs-tertiary-bg)',
                        color: isCurrent ? 'white' : 'inherit',
                        transition: 'all 0.22s ease',
                        border: isCurrent
                          ? 'none'
                          : `1px solid ${isPast ? 'var(--bs-success-border-subtle)' : 'var(--bs-border-color)'}`,
                        boxShadow: isCurrent
                          ? '0 4px 18px rgba(13,110,253,0.32)'
                          : 'none',
                      }}
                    >
                      {/* Number circle */}
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: isCurrent
                            ? 'rgba(255,255,255,0.2)'
                            : isPast
                              ? 'var(--bs-success-bg-subtle)'
                              : 'var(--bs-body-bg)',
                          border: isCurrent
                            ? 'none'
                            : `1px solid ${isPast ? 'var(--bs-success-border-subtle)' : 'var(--bs-border-color)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 600,
                          flexShrink: 0,
                          color: isCurrent
                            ? 'rgba(255,255,255,0.85)'
                            : isPast
                              ? 'var(--bs-success)'
                              : 'var(--bs-secondary-color)',
                        }}
                      >
                        {i + 1}
                      </div>

                      {/* Lyric text */}
                      <span
                        className="flex-grow-1"
                        style={{
                          fontSize: isCurrent ? 15 : 14,
                          fontWeight: isCurrent ? 600 : 400,
                          lineHeight: 1.4,
                          letterSpacing: isCurrent ? 0.1 : 0,
                        }}
                      >
                        {line.text}
                      </span>

                      {/* Timestamp pill */}
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontFamily: 'monospace',
                          flexShrink: 0,
                          fontWeight: 500,
                          background: isStamped
                            ? isCurrent
                              ? 'rgba(255,255,255,0.18)'
                              : 'var(--bs-success-bg-subtle)'
                            : 'transparent',
                          color: isStamped
                            ? isCurrent
                              ? 'rgba(255,255,255,0.9)'
                              : 'var(--bs-success)'
                            : 'var(--bs-tertiary-color)',
                          border: isStamped && !isCurrent
                            ? '1px solid var(--bs-success-border-subtle)'
                            : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isStamped ? formatTime(line.timestamp) : '—'}
                      </span>
                    </div>
                  );
                })}

                {syncComplete && (
                  <div
                    className="d-flex align-items-center justify-content-center gap-2 rounded-3 py-3"
                    style={{
                      background: 'var(--bs-success-bg-subtle)',
                      border: '1px solid var(--bs-success-border-subtle)',
                      color: 'var(--bs-success)',
                    }}
                  >
                    <BsCheck2Circle size={20} />
                    <span className="fw-semibold" style={{ fontSize: 14 }}>¡Todos los versos sincronizados!</span>
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="mt-3">
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div style={{ fontSize: 13 }}>
                    {syncComplete ? (
                      <span className="text-success fw-semibold">
                        ✓ {syncedCount} / {workingLines.length} sincronizados
                      </span>
                    ) : (
                      <span className="text-secondary">
                        Verso{' '}
                        <span className="fw-semibold text-body">
                          {Math.min(syncIndex + 1, workingLines.length)}
                        </span>
                        {' '}de {workingLines.length}
                      </span>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      onClick={handleResetSync}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--bs-secondary-color)',
                        fontSize: 13, cursor: 'pointer', padding: '4px 8px',
                        borderRadius: 8,
                      }}
                    >
                      ↺ Reiniciar
                    </button>
                    {!syncComplete && (
                      <Button size="sm" variant="outline-secondary" onClick={handleSkipLine}>
                        Saltar →
                      </Button>
                    )}
                  </div>
                </div>

                <button
                  onClick={syncComplete ? handleSaveSync : stampCurrentLine}
                  disabled={
                    saving ||
                    (!syncComplete && (!blobUrl || syncIndex >= workingLines.length))
                  }
                  style={{
                    width: '100%',
                    height: 60,
                    borderRadius: 16,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    cursor: saving || (!syncComplete && !blobUrl) ? 'not-allowed' : 'pointer',
                    opacity: saving || (!syncComplete && !blobUrl) ? 0.5 : 1,
                    color: 'white',
                    background: syncComplete
                      ? 'linear-gradient(135deg, #198754, #20c997)'
                      : 'linear-gradient(135deg, #0d6efd, #6f42c1)',
                    boxShadow: syncComplete
                      ? '0 4px 20px rgba(25,135,84,0.38)'
                      : '0 4px 20px rgba(13,110,253,0.38)',
                    transition: 'opacity 0.2s, transform 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {saving ? (
                    <Spinner size="sm" style={{ color: 'white' }} />
                  ) : syncComplete ? (
                    '💾 Guardar sincronización'
                  ) : (
                    <>
                      <span>⏺ MARCAR VERSO</span>
                      <span
                        className="d-none d-md-inline"
                        style={{ fontSize: 11, opacity: 0.55, fontWeight: 400 }}
                      >
                        · Espacio
                      </span>
                    </>
                  )}
                </button>

                {!blobUrl && selectedFileId && !audioLoading && !audioError && (
                  <small className="text-secondary d-block text-center mt-2">
                    Esperando que cargue el audio...
                  </small>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ VIEW MODE — Apple Music karaoke ═════════════════════════════ */}
      {mode === 'view' && (
        <>
          {!hasLines ? (
            <div
              className="rounded-4 d-flex flex-column align-items-center justify-content-center text-center"
              style={{
                minHeight: 360,
                background: 'linear-gradient(180deg, #06060f 0%, #0d0921 100%)',
                color: 'white',
                gap: 16,
              }}
            >
              <BsMusicNoteBeamed size={44} style={{ opacity: 0.25 }} />
              <p style={{ opacity: 0.4, margin: 0 }}>Sin letra aún.</p>
              <button
                onClick={() => setMode('write')}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 20,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ✏️ Escribir letra
              </button>
            </div>
          ) : (
            <div
              className="rounded-4 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #06060f 0%, #0d0921 45%, #12082a 100%)',
                height: 'calc(100vh - 200px)',
                maxHeight: 700,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Player inside the dark card */}
              {selectedFileId && (
                <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
                  {renderPlayer()}
                </div>
              )}

              {!hasSomeSync && (
                <div style={{ padding: '0 24px 12px' }}>
                  <div
                    className="rounded-3 d-flex align-items-center gap-2"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '10px 14px',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <BsMusicNoteBeamed size={13} />
                    <span>
                      Letra sin sincronizar.{' '}
                      <span
                        style={{ textDecoration: 'underline', cursor: 'pointer', opacity: 0.85 }}
                        onClick={() => setMode('sync')}
                      >
                        Sincroniza
                      </span>
                      {' '}para ver el karaoke en tiempo real.
                    </span>
                  </div>
                </div>
              )}

              {/* Lyrics — Apple Music style */}
              <div
                className="hide-scrollbar"
                ref={(el) => { viewLineRefs._container = el; }}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  padding: 'clamp(24px, 5vw, 48px) clamp(20px, 6vw, 60px) 45vh',
                  position: 'relative',
                }}
              >
                {workingLines.map((line, i) => {
                  const isActive = i === activeLineIndex;
                  const dist = i - activeLineIndex;

                  let opacity;
                  if (activeLineIndex < 0) {
                    opacity = i === 0 ? 0.7 : Math.max(0.08, 0.7 - i * 0.1);
                  } else if (isActive) {
                    opacity = 1;
                  } else if (Math.abs(dist) === 1) {
                    opacity = 0.38;
                  } else if (Math.abs(dist) === 2) {
                    opacity = 0.18;
                  } else {
                    opacity = 0.08;
                  }

                  return (
                    <div
                      key={i}
                      ref={(el) => { viewLineRefs.current[i] = el; }}
                      onClick={() => {
                        if (line.timestamp !== null && audioRef.current) {
                          audioRef.current.currentTime = line.timestamp;
                          setCurrentTime(line.timestamp);
                        }
                      }}
                      style={{
                        fontSize: isActive
                          ? 'clamp(22px, 4vw, 34px)'
                          : 'clamp(15px, 2.5vw, 22px)',
                        fontWeight: isActive ? 800 : 500,
                        lineHeight: 1.35,
                        marginBottom: isActive
                          ? 'clamp(20px, 3.5vw, 34px)'
                          : 'clamp(12px, 2vw, 20px)',
                        opacity,
                        transition: 'opacity 0.45s ease, font-size 0.35s ease',
                        color: 'white',
                        letterSpacing: isActive ? 0.4 : 0,
                        userSelect: 'none',
                        cursor: line.timestamp !== null ? 'pointer' : 'default',
                      }}
                    >
                      {line.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
