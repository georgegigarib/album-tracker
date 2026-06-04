import { useState, useRef, useEffect } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { BsPlayFill, BsPauseFill, BsArrowCounterclockwise, BsArrowClockwise } from 'react-icons/bs';
import { useAuthContext } from '../hooks/useAuth';
import { driveAudioCache } from '../utils/driveAudioCache';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function DriveAudioPlayer({ fileId }) {
  const { googleAccessToken } = useAuthContext();
  const audioRef = useRef(null);
  const [blobUrl, setBlobUrl] = useState(() => driveAudioCache.get(fileId) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (driveAudioCache.has(fileId)) {
        if (!cancelled) setBlobUrl(driveAudioCache.get(fileId));
        return;
      }
      if (!googleAccessToken) return;

      if (!cancelled) setLoading(true);
      if (!cancelled) setError(null);

      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const reason = body?.error?.errors?.[0]?.reason || body?.error?.message || res.status;
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

    load();
    return () => { cancelled = true; };
  }, [fileId, googleAccessToken]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
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

  if (!googleAccessToken) {
    return (
      <p className="small text-secondary mt-2 mb-0">
        Inicia sesión con Google para reproducir archivos de Drive.
      </p>
    );
  }

  return (
    <div
      className="mt-2 p-2 rounded"
      style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}
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

      {loading && (
        <div className="d-flex align-items-center gap-2 py-1">
          <Spinner size="sm" variant="secondary" />
          <span className="small text-secondary">Descargando audio...</span>
        </div>
      )}

      {error && (
        <p className="small text-danger mb-0">
          Error: {error}
        </p>
      )}

      {blobUrl && !loading && (
        <>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Button
              size="sm"
              variant="outline-secondary"
              className="d-flex align-items-center gap-1 px-2"
              style={{ fontSize: 11, borderRadius: 20 }}
              onClick={() => skip(-5)}
            >
              <BsArrowCounterclockwise size={12} /> 5s
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="d-flex align-items-center justify-content-center p-1"
              style={{ width: 30, height: 30, borderRadius: '50%' }}
              onClick={togglePlay}
            >
              {playing ? <BsPauseFill size={14} /> : <BsPlayFill size={14} />}
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              className="d-flex align-items-center gap-1 px-2"
              style={{ fontSize: 11, borderRadius: 20 }}
              onClick={() => skip(5)}
            >
              5s <BsArrowClockwise size={12} />
            </Button>
            <span className="small text-secondary ms-1" style={{ minWidth: 80, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <input
            type="range"
            className="form-range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            style={{ height: 4 }}
          />
        </>
      )}
    </div>
  );
}
