import { useState, useRef, useEffect } from 'react';
import { Badge, Spinner } from 'react-bootstrap';
import { BsPlayFill, BsPauseFill, BsMusicNoteBeamed, BsArrowCounterclockwise, BsArrowClockwise } from 'react-icons/bs';
import { useAuthContext } from '../hooks/useAuth';
import { useLyrics } from '../hooks/useLyrics';
import { driveAudioCache } from '../utils/driveAudioCache';
import KaraokeView from './KaraokeView';
import WaveformScrubber from './WaveformScrubber';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LatestDemoPlayer({ fileId, linkTitle, songTitle, albumId, songId }) {
  const { googleAccessToken } = useAuthContext();
  const { lyrics } = useLyrics(albumId, songId);
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
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 20, color: 'rgba(255,255,255,0.9)',
    cursor: 'pointer', padding: '7px 14px',
    transition: 'background 0.15s',
  };

  useEffect(() => {
    if (driveAudioCache.has(fileId)) {
      setBlobUrl(driveAudioCache.get(fileId));
      return;
    }
    if (!googleAccessToken) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const reason = body?.error?.errors?.[0]?.reason || res.status;
          throw new Error(`${res.status}:${reason}`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        driveAudioCache.set(fileId, url);
        setBlobUrl(url);
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

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

  const progress = duration ? (currentTime / duration) * 100 : 0;

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
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
          color: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
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
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 10, letterSpacing: 1 }}
              className="mb-2 fw-normal text-uppercase"
            >
              Latest Demo
            </Badge>
            <div className="fw-bold" style={{ fontSize: 18, lineHeight: 1.2 }}>{songTitle}</div>
            {linkTitle && <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>{linkTitle}</div>}
          </div>
          <div className="d-flex align-items-center gap-2">
            {hasKaraoke && (
              <button
                onClick={() => setShowKaraoke(true)}
                title="Ver letra (karaoke)"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'white',
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
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              >
                <BsMusicNoteBeamed size={12} />
                Letra
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
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            <BsArrowCounterclockwise size={15} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>5s</span>
          </button>

          <button
            onClick={togglePlay}
            disabled={!blobUrl}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: blobUrl ? '#1DB954' : 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
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
          />
          <div className="d-flex justify-content-between mt-2" style={{ fontSize: 12, opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{error ? <span style={{ color: '#ff6b6b' }}>Error: {error}</span> : formatTime(duration)}</span>
          </div>
        </div>

        {!googleAccessToken && (
          <p className="mb-0 mt-2 text-center" style={{ fontSize: 12, opacity: 0.6 }}>
            Inicia sesión con Google para reproducir.
          </p>
        )}
      </div>
    </>
  );
}
