import { useState, useRef, useEffect } from 'react';
import { Badge, Spinner } from 'react-bootstrap';
import { BsPlayFill, BsPauseFill, BsMusicNoteBeamed } from 'react-icons/bs';
import { useAuthContext } from '../hooks/useAuth';
import { driveAudioCache } from '../utils/driveAudioCache';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LatestDemoPlayer({ fileId, linkTitle, songTitle }) {
  const { googleAccessToken } = useAuthContext();
  const audioRef = useRef(null);
  const [blobUrl, setBlobUrl] = useState(() => driveAudioCache.get(fileId) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

  function handleSeek(e) {
    const val = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = val;
    setCurrentTime(val);
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
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
        <BsMusicNoteBeamed size={28} style={{ opacity: 0.2, flexShrink: 0 }} />
      </div>

      {/* Controls */}
      <div className="d-flex align-items-center justify-content-center gap-4 mb-4">
        <button
          onClick={() => skip(-10)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}
        >
          −10s
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
          onClick={() => skip(10)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}
        >
          +10s
        </button>
      </div>

      {/* Seek bar */}
      <div>
        <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginBottom: 8, cursor: 'pointer' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${progress}%`,
              background: '#1DB954',
              borderRadius: 2,
              transition: playing ? 'width 0.5s linear' : 'none',
            }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              opacity: 0,
              cursor: 'pointer',
              height: '100%',
              margin: 0,
            }}
          />
        </div>
        <div className="d-flex justify-content-between" style={{ fontSize: 12, opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>
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
  );
}
