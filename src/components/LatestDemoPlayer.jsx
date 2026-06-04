import { useState, useRef, useEffect } from 'react';
import { Badge, Spinner } from 'react-bootstrap';
import { BsPlayFill, BsPauseFill, BsMusicNoteBeamed, BsArrowCounterclockwise, BsArrowClockwise } from 'react-icons/bs';
import { useAuthContext } from '../hooks/useAuth';
import { useLyrics } from '../hooks/useLyrics';
import { useTheme } from '../hooks/useTheme';
import { driveAudioCache } from '../utils/driveAudioCache';
import KaraokeView from './KaraokeView';
import WaveformScrubber from './WaveformScrubber';
import { useTranslation } from 'react-i18next';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LatestDemoPlayer({ fileId, linkTitle, songTitle, albumId, songId }) {
  const { t } = useTranslation('components');
  const { googleAccessToken } = useAuthContext();
  const { lyrics } = useLyrics(albumId, songId);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const audioRef = useRef(null);
  const [blobUrl, setBlobUrl] = useState(() => driveAudioCache.get(fileId) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showKaraoke, setShowKaraoke] = useState(false);

  const syncedLines = lyrics?.lines?.filter((l) => l.timestamp !== null) ?? [];
  const hasKaraoke = syncedLines.length > 0;

  const skipBtnStyle = {
    display: 'flex', alignItems: 'center', gap: 5,
    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)',
    borderRadius: 20, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)',
    cursor: 'pointer', padding: '7px 14px',
    transition: 'background 0.15s',
  };
  const skipHoverBg = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  const skipBaseBg  = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    let cancelled = false;

    async function loadAudio() {
      if (driveAudioCache.has(fileId)) {
        if (!cancelled) {
          setBlobUrl(driveAudioCache.get(fileId));
        }
        return;
      }
      if (!googleAccessToken) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const reason = body?.error?.errors?.[0]?.reason || res.status;
          throw new Error(`${res.status}:${reason}`);
        }

        const blob = await res.blob();
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        driveAudioCache.set(fileId, url);
        setBlobUrl(url);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAudio();

    return () => { cancelled = true; };
  }, [fileId, googleAccessToken]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  }

  function skip(seconds) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  }

  function handleSeek(val) {
    if (audioRef.current) audioRef.current.currentTime = val;
    setCurrentTime(val);
  }

  return (
    <>
      {/* Karaoke full-screen overlay */}
      {showKaraoke && (
        <KaraokeView
          lines={lyrics?.lines ?? []}
          currentTime={currentTime}
          duration={duration}
          playing={playing}
          songTitle={songTitle}
          onClose={() => setShowKaraoke(false)}
          blobUrl={blobUrl}
          onTogglePlay={togglePlay}
          onSeek={handleSeek}
          onSkip={skip}
        />
      )}

      <div
        className="rounded-3 mb-4 p-4"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
            : 'var(--app-surface)',
          color: isDark ? 'white' : 'var(--app-text)',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
          border: isDark ? 'none' : '1px solid var(--app-border)',
        }}
      >
        {blobUrl && (
          <audio
            ref={audioRef}
            src={blobUrl}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onEnded={() => setPlaying(false)}
          />
        )}

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <Badge
              style={{
                background: isDark ? 'rgba(255,255,255,0.15)' : 'var(--app-surface-2)',
                color: isDark ? 'white' : 'var(--app-text-secondary)',
                fontSize: 10, letterSpacing: 1,
                border: isDark ? 'none' : '1px solid var(--app-border)',
              }}
              className="mb-2 fw-normal text-uppercase"
            >
              {t('latestDemoPlayer.badge')}
            </Badge>
            <div className="fw-bold" style={{ fontSize: 18, lineHeight: 1.2 }}>{songTitle}</div>
            {linkTitle && <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>{linkTitle}</div>}
          </div>
          <div className="d-flex align-items-center gap-2">
            {hasKaraoke && (
              <button
                onClick={() => setShowKaraoke(true)}
                title={t('latestDemoPlayer.viewLyricsTitle')}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'var(--app-surface-2)',
                  border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--app-border)',
                  color: isDark ? 'white' : 'var(--app-text)',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = skipHoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = skipBaseBg; }}
              >
                <BsMusicNoteBeamed size={12} />
                {t('latestDemoPlayer.lyricsBtn')}
              </button>
            )}
            <BsMusicNoteBeamed size={24} style={{ opacity: 0.15, flexShrink: 0 }} />
          </div>
        </div>

        {/* Controls */}
        <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
          <button
            onClick={() => skip(-5)}
            style={skipBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = skipHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = skipBaseBg; }}
          >
            <BsArrowCounterclockwise size={15} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>5s</span>
          </button>

          <button
            onClick={togglePlay}
            disabled={!blobUrl}
            style={{
              width: 60, height: 60, borderRadius: '50%',
              background: blobUrl ? '#1DB954' : (isDark ? 'rgba(255,255,255,0.15)' : 'var(--app-surface-3)'),
              border: 'none', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: blobUrl ? 'pointer' : 'default',
              transition: 'transform 0.1s, background 0.2s',
              boxShadow: blobUrl ? '0 4px 15px rgba(29,185,84,0.4)' : 'none',
            }}
            onMouseDown={(e) => { if (blobUrl) e.currentTarget.style.transform = 'scale(0.94)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading
              ? <Spinner size="sm" style={{ color: 'white' }} />
              : playing
                ? <BsPauseFill size={26} />
                : <BsPlayFill size={26} style={{ marginLeft: 3 }} />
            }
          </button>

          <button
            onClick={() => skip(5)}
            style={skipBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = skipHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = skipBaseBg; }}
          >
            <span style={{ fontSize: 11, fontWeight: 600 }}>5s</span>
            <BsArrowClockwise size={15} />
          </button>
        </div>

        {/* Waveform scrubber */}
        <div>
          <WaveformScrubber
            blobUrl={blobUrl}
            currentTime={currentTime}
            duration={duration}
            playing={playing}
            onSeek={handleSeek}
            height={52}
            colorPlayed="#1DB954"
            colorUnplayed={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
          />
          <div className="d-flex justify-content-between mt-2" style={{ fontSize: 12, opacity: 0.55, fontVariantNumeric: 'tabular-nums', color: isDark ? 'white' : 'var(--app-text)' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{error ? <span style={{ color: '#ff6b6b' }}>Error: {error}</span> : formatTime(duration)}</span>
          </div>
        </div>

        {!googleAccessToken && (
          <p className="mb-0 mt-2 text-center" style={{ fontSize: 12, opacity: 0.6 }}>
            {t('latestDemoPlayer.signInRequired')}
          </p>
        )}
      </div>
    </>
  );
}
