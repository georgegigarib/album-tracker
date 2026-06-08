import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container, Card, Button, Form, Spinner, Alert, Badge, Nav,
} from 'react-bootstrap';
import {
  BsArrowLeft, BsMusicNoteBeamed, BsPlayFill, BsPauseFill,
  BsCheck2Circle, BsExclamationTriangle, BsArrowCounterclockwise, BsArrowClockwise,
} from 'react-icons/bs';
import { useTranslation } from 'react-i18next';
import { useLyrics } from '../hooks/useLyrics';
import { useLinks } from '../hooks/useLinks';
import { useSongs } from '../hooks/useSongs';
import { useAuthContext } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
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
  // Group timestamps by text in order of appearance, so repeated lines
  // each get their own timestamp instead of all sharing the last one.
  const timestampQueues = {};
  existingLines.forEach((l) => {
    if (!timestampQueues[l.text]) timestampQueues[l.text] = [];
    timestampQueues[l.text].push(l.timestamp);
  });
  return raw
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => {
      const queue = timestampQueues[text];
      const timestamp = queue && queue.length > 0 ? queue.shift() : null;
      return { text, timestamp };
    });
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

  // ── Live mode ─────────────────────────────────────────────────────────────
  const [liveInput, setLiveInput] = useState('');
  const liveListRef = useRef(null);

  // ── Reset confirmation ────────────────────────────────────────────────────
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const { t } = useTranslation('components');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  function handleClearTimestamp(index) {
    setWorkingLines((prev) => prev.map((l, i) => (i === index ? { ...l, timestamp: null } : l)));
  }

  // ── Live mode actions ─────────────────────────────────────────────────────
  function stampLiveLine() {
    const text = liveInput.trim();
    if (!text) return;
    const t = audioRef.current?.currentTime ?? null;
    setWorkingLines((prev) => [...prev, { text, timestamp: t }]);
    setLiveInput('');
    setTimeout(() => {
      liveListRef.current?.scrollTo({ top: liveListRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }

  function handleLiveKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stampLiveLine();
    }
  }

  function handleRestamp(index) {
    const t = audioRef.current?.currentTime ?? null;
    setWorkingLines((prev) => prev.map((l, i) => (i === index ? { ...l, timestamp: t } : l)));
  }

  function handleDeleteLiveLine(index) {
    setWorkingLines((prev) => prev.filter((_, i) => i !== index));
  }

  function sortedLines(lines) {
    return [...lines].sort((a, b) => {
      if (a.timestamp === null && b.timestamp === null) return 0;
      if (a.timestamp === null) return 1;
      if (b.timestamp === null) return -1;
      return a.timestamp - b.timestamp;
    });
  }

  async function handleLiveSave() {
    if (workingLines.length === 0) return;
    setSaving(true);
    try {
      const sorted = sortedLines(workingLines);
      setWorkingLines(sorted);
      const textForRaw = sorted.map((l) => l.text).join('\n');
      await saveLyrics({
        rawText: textForRaw,
        lines: sorted,
        linkedLinkId: selectedLinkId || null,
        linkedLinkDuration: duration > 0 ? duration : (lyrics?.linkedLinkDuration ?? null),
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleLiveFinish() {
    if (workingLines.length === 0) return;
    setSaving(true);
    try {
      const sorted = sortedLines(workingLines);
      setWorkingLines(sorted);
      const textForRaw = sorted.map((l) => l.text).join('\n');
      await saveLyrics({
        rawText: textForRaw,
        lines: sorted,
        linkedLinkId: selectedLinkId || null,
        linkedLinkDuration: duration > 0 ? duration : (lyrics?.linkedLinkDuration ?? null),
      });
      setSyncIndex(0);
      setMode('sync');
    } finally {
      setSaving(false);
    }
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
  // ── Link selector (custom styled pills) ─────────────────────────────────
  function renderLinkSelector(inDark = false) {
    if (driveLinks.length === 0) return null;
    const txt = inDark ? 'rgba(255,255,255,0.5)' : 'var(--app-text-secondary)';
    return (
      <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
        <small style={{ color: txt, flexShrink: 0, fontSize: 11 }}>Demo:</small>
        {driveLinks.map((l, idx) => {
          const active = l.id === selectedLinkId;
          return (
            <button
              key={l.id}
              onClick={() => setSelectedLinkId(l.id)}
              style={{
                padding: '4px 13px', borderRadius: 20, cursor: 'pointer',
                fontSize: 12, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                border: active
                  ? '1.5px solid var(--app-accent)'
                  : inDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--app-border)',
                background: active
                  ? 'var(--app-accent)'
                  : inDark ? 'rgba(255,255,255,0.07)' : 'var(--app-surface-2)',
                color: active ? 'white' : inDark ? 'rgba(255,255,255,0.75)' : 'var(--app-text)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <BsMusicNoteBeamed size={10} />
              {l.title || `Demo ${idx + 1}`}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Shared audio player UI ────────────────────────────────────────────────
  function renderPlayer(inDark = false) {
    const onDark = inDark || isDark;
    const skipStyle = {
      display: 'flex', alignItems: 'center', gap: 4,
      background: onDark ? 'rgba(255,255,255,0.1)' : 'var(--app-surface-3)',
      border: onDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--app-border)',
      borderRadius: 20,
      color: onDark ? 'rgba(255,255,255,0.9)' : 'var(--app-text)',
      cursor: 'pointer', padding: '6px 13px', fontSize: 11, fontWeight: 600,
      transition: 'background 0.15s',
    };
    const hoverBg = onDark ? 'rgba(255,255,255,0.18)' : 'var(--app-surface-2)';
    const baseBg = onDark ? 'rgba(255,255,255,0.1)' : 'var(--app-surface-3)';

    return (
      <div
        className="rounded-3 p-3"
        style={{
          background: inDark
            ? 'rgba(0,0,0,0.25)'
            : isDark
              ? 'linear-gradient(135deg, #0f0c29, #302b63)'
              : 'var(--app-surface-2)',
          border: inDark
            ? '1px solid rgba(255,255,255,0.08)'
            : isDark ? 'none' : '1px solid var(--app-border)',
          color: onDark ? 'white' : 'var(--app-text)',
        }}
      >
        {audioLoading && (
          <div className="d-flex align-items-center justify-content-center gap-2 py-1">
            <Spinner size="sm" style={{ color: onDark ? 'white' : undefined }} />
            <small style={{ opacity: 0.6 }}>{t('lyricsEditor.player.downloading')}</small>
          </div>
        )}
        {audioError && (
          <small style={{ color: '#ff6b6b' }}>
            {audioError.includes('401') || audioError.includes('403')
              ? t('lyricsEditor.player.noPermission')
              : t('lyricsEditor.player.error', { error: audioError })}
          </small>
        )}
        {!selectedFileId && !audioLoading && !audioError && (
          <small style={{ opacity: 0.45 }}>
            {t('lyricsEditor.player.noAudioSelected')}
          </small>
        )}
        {blobUrl && (
          <>
            {/* Centered controls */}
            <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
              <button
                onClick={() => skip(-5)}
                style={skipStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = baseBg; }}
              >
                <BsArrowCounterclockwise size={13} /><span>5s</span>
              </button>
              <button
                onClick={togglePlay}
                style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: '#1DB954', border: 'none', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(29,185,84,0.4)',
                  transition: 'transform 0.1s',
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.94)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {playing
                  ? <BsPauseFill size={20} />
                  : <BsPlayFill size={20} style={{ marginLeft: 2 }} />}
              </button>
              <button
                onClick={() => skip(5)}
                style={skipStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = baseBg; }}
              >
                <span>5s</span><BsArrowClockwise size={13} />
              </button>
            </div>

            {/* Waveform */}
            <WaveformScrubber
              blobUrl={blobUrl}
              currentTime={currentTime}
              duration={duration}
              playing={playing}
              onSeek={handleSeek}
              height={44}
              colorPlayed="#1DB954"
              colorUnplayed={onDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
            />

            {/* Time row */}
            <div
              className="d-flex justify-content-between mt-1"
              style={{ fontSize: 11, opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </>
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
            {t('lyricsEditor.title')}
          </h4>
        </div>
        <div className="d-flex align-items-center gap-2">
          {isDirty && <Badge bg="warning" text="dark">{t('lyricsEditor.unsaved')}</Badge>}
          {savedOk && !isDirty && (
            <span className="text-success small d-flex align-items-center gap-1">
              <BsCheck2Circle size={14} /> {t('lyricsEditor.saved')}
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
          { key: 'write', label: t('lyricsEditor.tabs.write') },
          { key: 'live', label: t('lyricsEditor.tabs.live') },
          { key: 'sync', label: t('lyricsEditor.tabs.sync') },
          { key: 'view', label: t('lyricsEditor.tabs.view') },
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
              <Form.Label className="fw-semibold small">{t('lyricsEditor.write.audioDemo')}</Form.Label>
              {driveLinks.length === 0 ? (
                <Alert variant="info" className="mb-0 py-2 small">
                  {t('lyricsEditor.write.noDriveLinks')}
                </Alert>
              ) : (
                <Form.Select
                  size="sm"
                  value={selectedLinkId}
                  onChange={(e) => setSelectedLinkId(e.target.value)}
                >
                  <option value="">{t('lyricsEditor.write.noAudio')}</option>
                  {driveLinks.map((l) => (
                    <option key={l.id} value={l.id}>{l.title || l.url}</option>
                  ))}
                </Form.Select>
              )}
              <Form.Text className="text-secondary">
                {t('lyricsEditor.write.audioHint')}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small">{t('lyricsEditor.write.lyricsLabel')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={Math.max(10, (rawText.match(/\n/g) || []).length + 3)}
                value={rawText}
                onChange={(e) => { setRawText(e.target.value); setIsDirty(true); }}
                placeholder={t('lyricsEditor.write.lyricsPlaceholder')}
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
                  {t('lyricsEditor.write.lyricsHint')}
                </Form.Text>
                <Form.Text className="text-secondary">
                  {t('lyricsEditor.write.verseCount', { count: rawText.split('\n').filter((l) => l.trim()).length })}
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
                ? <><Spinner size="sm" className="me-2" />{t('lyricsEditor.write.saving')}</>
                : t('lyricsEditor.write.saveLyrics')}
            </Button>

            {selectedFileId && (
              <div className="mt-4">
                {renderPlayer()}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ═══ LIVE MODE ════════════════════════════════════════════════════ */}
      {mode === 'live' && (
        <div
          className="rounded-4 overflow-hidden d-flex flex-column"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, #06060f 0%, #0d0921 100%)'
              : 'var(--app-surface)',
            border: isDark ? 'none' : '1px solid var(--app-border)',
            height: 'calc(100vh - 210px)',
            maxHeight: 720,
            color: isDark ? 'white' : 'var(--app-text)',
          }}
        >
          {/* ── Header: link selector ──────────────────────────────────── */}
          <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
            {renderLinkSelector(true)}
            {!selectedFileId && driveLinks.length === 0 && (
              <div
                style={{
                  marginBottom: 10, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, fontSize: 13,
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {t('lyricsEditor.live.noDemo')}{' '}
                <span
                  style={{ textDecoration: 'underline', cursor: 'pointer', opacity: 0.85 }}
                  onClick={() => setMode('write')}
                >
                  {t('lyricsEditor.live.writeModeLabel')}
                </span>.
              </div>
            )}
          </div>

          {/* ── Lines list ─────────────────────────────────────────────── */}
          <div
            ref={liveListRef}
            className="hide-scrollbar"
            style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}
          >
            {workingLines.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 32, opacity: 0.25 }}>
                <p style={{ margin: 0, fontSize: 14 }}>
                  {t('lyricsEditor.live.emptyHint')}
                </p>
              </div>
            ) : (
              workingLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', marginBottom: 6,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'var(--app-surface-2)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--app-border)',
                    borderRadius: 12,
                  }}
                >
                  {/* Timestamp pill — tap to re-stamp */}
                  <button
                    onClick={() => handleRestamp(i)}
                    title="Toca para estampar en el tiempo actual"
                    style={{
                      padding: '3px 9px', borderRadius: 20, flexShrink: 0,
                      background: line.timestamp !== null
                        ? 'rgba(29,185,84,0.18)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${line.timestamp !== null ? 'rgba(29,185,84,0.5)' : 'rgba(255,255,255,0.12)'}`,
                      color: line.timestamp !== null ? '#1DB954' : 'rgba(255,255,255,0.35)',
                      fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      minWidth: 44, textAlign: 'center',
                    }}
                  >
                    {line.timestamp !== null ? formatTime(line.timestamp) : '—'}
                  </button>

                  {/* Line text */}
                  <span style={{ flex: 1, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {line.text}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteLiveLine(i)}
                    style={{
                      background: 'none', border: 'none', flexShrink: 0,
                      color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
                      fontSize: 18, lineHeight: 1, padding: '2px 6px',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,80,80,0.7)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* ── Player — below lines so hand stays near input ──────────── */}
          <div style={{ padding: '0 14px', flexShrink: 0 }}>
            {renderPlayer(true)}
          </div>

          {/* ── Input bar ──────────────────────────────────────────────── */}
          <div
            style={{
              flexShrink: 0, padding: '12px 14px 16px',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid var(--app-border)',
              background: isDark ? 'rgba(0,0,0,0.35)' : 'var(--app-surface-2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 10 }}>
              <textarea
                value={liveInput}
                onChange={(e) => setLiveInput(e.target.value)}
                onKeyDown={handleLiveKeyDown}
                placeholder={t('lyricsEditor.live.inputPlaceholder')}
                rows={2}
                autoComplete="off"
                style={{
                  flex: 1, resize: 'none', outline: 'none',
                  background: isDark ? 'rgba(255,255,255,0.07)' : 'var(--app-surface)',
                  border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--app-border)',
                  borderRadius: 12, color: isDark ? 'white' : 'var(--app-text)',
                  padding: '10px 14px', fontSize: 15, lineHeight: 1.5,
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
              />
              {/* Capture button (visible on mobile where Enter is less natural) */}
              <button
                onClick={stampLiveLine}
                disabled={!liveInput.trim()}
                style={{
                  width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                  background: liveInput.trim() ? '#1DB954' : 'rgba(255,255,255,0.08)',
                  border: 'none', color: 'white', fontSize: 22,
                  cursor: liveInput.trim() ? 'pointer' : 'default',
                  transition: 'background 0.2s, transform 0.1s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: liveInput.trim() ? '0 4px 14px rgba(29,185,84,0.35)' : 'none',
                }}
                onMouseDown={(e) => { if (liveInput.trim()) e.currentTarget.style.transform = 'scale(0.93)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                ↵
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                {workingLines.length === 0
                  ? t('lyricsEditor.live.captureHint')
                  : t('lyricsEditor.live.versesHint', { count: workingLines.length })}
              </span>
              {workingLines.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={handleLiveSave}
                    disabled={saving}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.8)',
                      borderRadius: 20, padding: '7px 16px',
                      fontSize: 13, fontWeight: 500, cursor: saving ? 'wait' : 'pointer',
                      transition: 'all 0.2s', flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {saving ? t('lyricsEditor.live.saving') : (savedOk ? '✓ ' + t('lyricsEditor.saved') : '💾 ' + t('lyricsEditor.write.saveLyrics').replace('💾 ', ''))}
                  </button>
                  <button
                    onClick={handleLiveFinish}
                    disabled={saving}
                    style={{
                      background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #0d6efd, #6f42c1)',
                      border: 'none', color: 'white',
                      borderRadius: 20, padding: '7px 18px',
                      fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
                      boxShadow: saving ? 'none' : '0 4px 14px rgba(13,110,253,0.3)',
                      transition: 'all 0.2s', flexShrink: 0,
                    }}
                  >
                    {saving ? t('lyricsEditor.live.saving') : t('lyricsEditor.live.reviewSync')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SYNC MODE ════════════════════════════════════════════════════ */}
      {mode === 'sync' && (
        <div>
          {/* Warnings */}
          {!hasLines && (
            <Alert variant="warning" className="d-flex align-items-center gap-2">
              <BsExclamationTriangle className="flex-shrink-0" />
              <span>
                {t('lyricsEditor.sync.noVerses')}{' '}
                <span
                  className="fw-semibold"
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setMode('write')}
                >
                  {t('lyricsEditor.sync.noVersesLink')}
                </span>
                {' '}{t('lyricsEditor.sync.noVersesHint')}
              </span>
            </Alert>
          )}

          {hasLines && !selectedFileId && (
            <Alert variant="info" className="d-flex align-items-center gap-2">
              <BsExclamationTriangle className="flex-shrink-0" />
              {t('lyricsEditor.sync.selectDemo')}{' '}
              <span
                className="fw-semibold ms-1"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setMode('write')}
              >
                {t('lyricsEditor.sync.selectDemoLink')}
              </span>
              .
            </Alert>
          )}

          {hasLines && selectedFileId && !googleAccessToken && (
            <Alert variant="warning">
              {t('lyricsEditor.sync.loginRequired')}
            </Alert>
          )}

          {durationMismatch && (
            <Alert variant="warning" className="d-flex align-items-center gap-2 flex-wrap">
              <BsExclamationTriangle className="flex-shrink-0" />
              <span className="flex-grow-1">
                {t('lyricsEditor.sync.durationChanged')}
              </span>
              <Button
                size="sm"
                variant="outline-warning"
                className="flex-shrink-0"
                onClick={handleResetSync}
              >
                {t('lyricsEditor.sync.resetSync')}
              </Button>
            </Alert>
          )}

          {/* Link selector */}
          {renderLinkSelector()}

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
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '2px 6px 2px 10px',
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
                        {isStamped && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClearTimestamp(i); }}
                            style={{
                              background: 'none', border: 'none', padding: '0 2px',
                              cursor: 'pointer', lineHeight: 1,
                              color: isCurrent ? 'rgba(255,255,255,0.6)' : 'var(--bs-success)',
                              opacity: 0.6,
                              fontSize: 13,
                            }}
                            title="Quitar timestamp"
                          >
                            ×
                          </button>
                        )}
                      </div>
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
                    <span className="fw-semibold" style={{ fontSize: 14 }}>{t('lyricsEditor.sync.allSynced')}</span>
                  </div>
                )}
              </div>

              {/* Player — below lines so mouse stays near the Mark button */}
              <div className="mt-3 mb-3">
                {renderPlayer()}
              </div>

              {/* Action bar */}
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div style={{ fontSize: 13 }}>
                    {syncComplete ? (
                      <span className="text-success fw-semibold">
                        {t('lyricsEditor.sync.syncedCount', { synced: syncedCount, total: workingLines.length })}
                      </span>
                    ) : (
                      <span className="text-secondary">
                        {t('lyricsEditor.sync.verseOf', { current: Math.min(syncIndex + 1, workingLines.length), total: workingLines.length })}
                      </span>
                    )}
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    {/* Reset with inline confirmation */}
                    {showResetConfirm ? (
                      <div className="d-flex align-items-center gap-2">
                        <small className="text-secondary">{t('lyricsEditor.sync.deleteAllTimestamps')}</small>
                        <Button
                          size="sm" variant="danger"
                          onClick={() => { handleResetSync(); setShowResetConfirm(false); }}
                        >
                          {t('lyricsEditor.sync.confirmReset')}
                        </Button>
                        <Button
                          size="sm" variant="outline-secondary"
                          onClick={() => setShowResetConfirm(false)}
                        >
                          {t('lyricsEditor.sync.cancel')}
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--bs-secondary-color)',
                          fontSize: 13, cursor: 'pointer', padding: '4px 8px',
                          borderRadius: 8,
                        }}
                      >
                        {t('lyricsEditor.sync.reset')}
                      </button>
                    )}
                    {!syncComplete && !showResetConfirm && (
                      <Button size="sm" variant="outline-secondary" onClick={handleSkipLine}>
                        {t('lyricsEditor.sync.skip')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mark verse button — only while there are lines left to stamp */}
                {!syncComplete && (
                  <button
                    onClick={stampCurrentLine}
                    disabled={saving || !blobUrl || syncIndex >= workingLines.length}
                    style={{
                      width: '100%',
                      height: 60,
                      borderRadius: 16,
                      border: 'none',
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      cursor: !blobUrl ? 'not-allowed' : 'pointer',
                      opacity: !blobUrl ? 0.5 : 1,
                      color: 'white',
                      background: 'linear-gradient(135deg, #0d6efd, #6f42c1)',
                      boxShadow: '0 4px 20px rgba(13,110,253,0.38)',
                      transition: 'opacity 0.2s, transform 0.1s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <>
                      <span>{t('lyricsEditor.sync.markVerse')}</span>
                      <span
                        className="d-none d-md-inline"
                        style={{ fontSize: 11, opacity: 0.55, fontWeight: 400 }}
                      >
                        {t('lyricsEditor.sync.spaceShortcut')}
                      </span>
                    </>
                  </button>
                )}

                {/* Save button — always visible once at least one line is stamped */}
                {hasSomeSync && (
                  <button
                    onClick={handleSaveSync}
                    disabled={saving}
                    style={{
                      width: '100%',
                      height: syncComplete ? 60 : 44,
                      borderRadius: 16,
                      fontSize: syncComplete ? 15 : 14,
                      fontWeight: 600,
                      cursor: saving ? 'wait' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      color: 'white',
                      background: syncComplete
                        ? 'linear-gradient(135deg, #198754, #20c997)'
                        : 'rgba(25,135,84,0.18)',
                      border: syncComplete ? 'none' : '1px solid rgba(25,135,84,0.4)',
                      boxShadow: syncComplete ? '0 4px 20px rgba(25,135,84,0.38)' : 'none',
                      transition: 'opacity 0.2s, transform 0.1s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginTop: syncComplete ? 0 : 8,
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {saving
                      ? <Spinner size="sm" style={{ color: 'white' }} />
                      : syncComplete
                        ? t('lyricsEditor.sync.saveSync')
                        : t('lyricsEditor.sync.savePartial', { synced: syncedCount, total: workingLines.length })}
                  </button>
                )}

                {!blobUrl && selectedFileId && !audioLoading && !audioError && (
                  <small className="text-secondary d-block text-center mt-2">
                    {t('lyricsEditor.sync.waitingAudio')}
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
              <p style={{ opacity: 0.4, margin: 0 }}>{t('lyricsEditor.view.noLyrics')}</p>
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
                {t('lyricsEditor.view.writeLyrics')}
              </button>
            </div>
          ) : (
            <div
              className="rounded-4 overflow-hidden"
              style={{
                background: isDark
                  ? 'linear-gradient(180deg, #06060f 0%, #0d0921 45%, #12082a 100%)'
                  : 'var(--app-surface)',
                border: isDark ? 'none' : '1px solid var(--app-border)',
                height: 'calc(100vh - 200px)',
                maxHeight: 700,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Lyrics — Apple Music style */}
              <div
                className="hide-scrollbar"
                ref={(el) => { viewLineRefs._container = el; }}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  padding: 'clamp(24px, 5vw, 48px) clamp(20px, 6vw, 60px) 10vh',
                  position: 'relative',
                }}
              >
                {!hasSomeSync && (
                  <div
                    className="rounded-3 d-flex align-items-center gap-2 mb-4"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '10px 14px', fontSize: 13,
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
                )}
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
                        color: isDark ? 'white' : 'var(--app-text)',
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

              {/* Player — at the bottom */}
              <div
                style={{
                  flexShrink: 0, padding: '10px 16px 16px',
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(0,0,0,0.2)',
                }}
              >
                {renderLinkSelector(true)}
                {renderPlayer(true)}
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
