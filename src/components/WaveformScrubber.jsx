import { useEffect, useRef, useState } from 'react';

const NUM_BARS = 180;
const peaksCache = new Map();

async function computePeaks(blobUrl) {
  if (peaksCache.has(blobUrl)) return peaksCache.get(blobUrl);

  const response = await fetch(blobUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();

  const data = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(data.length / NUM_BARS);
  const peaks = new Float32Array(NUM_BARS);

  for (let i = 0; i < NUM_BARS; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j++) {
      const abs = Math.abs(data[start + j]);
      if (abs > max) max = abs;
    }
    peaks[i] = max;
  }

  // Normalize to [0, 1]
  let globalMax = 0;
  for (let i = 0; i < NUM_BARS; i++) {
    if (peaks[i] > globalMax) globalMax = peaks[i];
  }
  if (globalMax > 0) {
    for (let i = 0; i < NUM_BARS; i++) peaks[i] /= globalMax;
  }

  const result = Array.from(peaks);
  peaksCache.set(blobUrl, result);
  return result;
}

function drawWaveform(canvas, peaks, progress, colors) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const barW = w / peaks.length;
  const gap = barW > 3 ? 1 : 0.5;
  const progressX = progress * w;

  ctx.clearRect(0, 0, w, h);

  peaks.forEach((peak, i) => {
    const barHeight = Math.max(2, peak * h * 0.9);
    const x = i * barW;
    const y = (h - barHeight) / 2;
    const isPlayed = x + barW <= progressX;
    const isCurrent = x <= progressX && progressX < x + barW;

    if (isCurrent) {
      // Split bar at exact progress point
      const playedFrac = (progressX - x) / barW;
      ctx.fillStyle = colors.played;
      ctx.fillRect(x, y, Math.max(0, (barW - gap) * playedFrac), barHeight);
      ctx.fillStyle = colors.unplayed;
      ctx.fillRect(x + (barW - gap) * playedFrac, y, (barW - gap) * (1 - playedFrac), barHeight);
    } else {
      ctx.fillStyle = isPlayed ? colors.played : colors.unplayed;
      ctx.fillRect(x, y, Math.max(1, barW - gap), barHeight);
    }
  });
}

/**
 * SoundCloud-style waveform scrubber.
 *
 * Props:
 *   blobUrl      string | null  — audio blob URL (from driveAudioCache)
 *   currentTime  number         — audio currentTime in seconds
 *   duration     number         — audio duration in seconds
 *   playing      boolean        — used to animate the progress transition
 *   onSeek       (t) => void    — called with new time when user seeks
 *   colorPlayed  string         — bar color for played portion (default: #1DB954)
 *   colorUnplayed string        — bar color for unplayed portion (default: rgba(255,255,255,0.25))
 *   height       number         — canvas height in px (default: 56)
 */
export default function WaveformScrubber({
  blobUrl,
  currentTime,
  duration,
  onSeek,
  colorPlayed = '#1DB954',
  colorUnplayed = 'rgba(255,255,255,0.25)',
  height = 56,
}) {
  const canvasRef = useRef(null);
  const [peaks, setPeaks] = useState(null);
  const [decoding, setDecoding] = useState(false);
  const draggingRef = useRef(false);

  // Decode audio and compute peaks when blobUrl changes
  useEffect(() => {
    if (!blobUrl) { setPeaks(null); return; }
    let cancelled = false;
    setDecoding(true);
    computePeaks(blobUrl)
      .then((p) => { if (!cancelled) setPeaks(p); })
      .catch(() => { if (!cancelled) setPeaks(null); })
      .finally(() => { if (!cancelled) setDecoding(false); });
    return () => { cancelled = true; };
  }, [blobUrl]);

  // Redraw whenever peaks or progress changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;
    const progress = duration > 0 ? currentTime / duration : 0;
    drawWaveform(canvas, peaks, progress, { played: colorPlayed, unplayed: colorUnplayed });
  }, [peaks, currentTime, duration, colorPlayed, colorUnplayed]);

  // Also redraw on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;
    const ro = new ResizeObserver(() => {
      const progress = duration > 0 ? currentTime / duration : 0;
      drawWaveform(canvas, peaks, progress, { played: colorPlayed, unplayed: colorUnplayed });
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [peaks, currentTime, duration, colorPlayed, colorUnplayed]);

  function seekFromEvent(e) {
    if (!onSeek || !duration) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }

  function onMouseDown(e) {
    draggingRef.current = true;
    seekFromEvent(e);
  }

  function onMouseMove(e) {
    if (!draggingRef.current) return;
    seekFromEvent(e);
  }

  function onMouseUp() { draggingRef.current = false; }

  return (
    <div style={{ position: 'relative', width: '100%', height, cursor: onSeek ? 'pointer' : 'default' }}>
      {/* Placeholder bars shown while decoding or no peaks */}
      {!peaks && (
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', gap: 1,
            opacity: decoding ? 0.35 : 0.15,
            transition: 'opacity 0.3s',
          }}
        >
          {Array.from({ length: NUM_BARS }).map((_, i) => {
            // Fake bars using a simple sine wave pattern
            const fakeH = Math.max(8, Math.abs(Math.sin(i * 0.18 + 1) * 0.6 + Math.sin(i * 0.07) * 0.4) * height * 0.85);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: fakeH,
                  background: colorUnplayed,
                  borderRadius: 1,
                  alignSelf: 'center',
                }}
              />
            );
          })}
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          opacity: peaks ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={(e) => { e.preventDefault(); seekFromEvent(e); }}
        onTouchMove={(e) => { e.preventDefault(); seekFromEvent(e); }}
      />
    </div>
  );
}
