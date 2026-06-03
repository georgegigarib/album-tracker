import { useEffect, useRef } from 'react';
import { BsXLg, BsMusicNoteBeamed, BsPlayFill, BsPauseFill } from 'react-icons/bs';
import WaveformScrubber from './WaveformScrubber';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Full-screen karaoke overlay. Renders lyrics with Apple Music-style
 * progressive opacity and auto-scrolls to keep the active line visible.
 *
 * Props:
 *   lines         [{text, timestamp}]   — synced lyric lines
 *   currentTime   number                — audio currentTime in seconds
 *   duration      number                — audio duration in seconds
 *   playing       boolean               — is audio playing
 *   songTitle     string                — displayed in the header
 *   onClose       () => void            — called when user closes the overlay
 *   onTogglePlay  () => void            — play/pause toggle
 *   onSeek        (value) => void       — seek to position
 *   onSkip        (seconds) => void     — skip ±N seconds
 */
export default function KaraokeView({
  lines = [], currentTime = 0, duration = 0, playing = false,
  songTitle = '', onClose, onTogglePlay, onSeek, onSkip, blobUrl = null,
}) {
  const containerRef = useRef(null);
  const lineRefs = useRef([]);

  const hasSomeSync = lines.some((l) => l.timestamp !== null);
  const hasControls = onTogglePlay || onSeek;

  // Last line whose timestamp is ≤ currentTime
  const activeIndex = lines.reduce((active, line, i) => {
    if (line.timestamp !== null && line.timestamp <= currentTime) return i;
    return active;
  }, -1);

  // Scroll active line to ~35 % from the top of the container
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = lineRefs.current[activeIndex];
    const container = containerRef.current;
    if (!el || !container) return;
    const target = el.offsetTop - container.clientHeight * 0.35 + el.offsetHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [activeIndex]);

  // Prevent body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1060,
        background: 'linear-gradient(180deg, #06060f 0%, #0d0921 45%, #12082a 100%)',
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BsMusicNoteBeamed size={15} style={{ opacity: 0.45 }} />
          <span style={{ fontSize: 12, opacity: 0.45, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Letra
          </span>
          {songTitle && (
            <>
              <span style={{ opacity: 0.25, fontSize: 12 }}>·</span>
              <span style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>{songTitle}</span>
            </>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: 34,
              height: 34,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <BsXLg size={13} />
          </button>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {!hasSomeSync ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            opacity: 0.35,
          }}
        >
          <BsMusicNoteBeamed size={52} />
          <p style={{ margin: 0, fontSize: 15 }}>Letra sin sincronizar</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="hide-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '8vh clamp(24px, 8vw, 80px) 45vh',
          }}
        >
          {lines.map((line, i) => {
            const isActive = i === activeIndex;
            const dist = i - activeIndex;

            // Progressive opacity: active=1, ±1=0.4, ±2=0.18, further=0.08
            let opacity;
            if (activeIndex < 0) {
              opacity = i === 0 ? 0.65 : Math.max(0.08, 0.65 - i * 0.12);
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
                ref={(el) => { lineRefs.current[i] = el; }}
                onClick={() => {
                  if (line.timestamp !== null && onSeek) onSeek(line.timestamp);
                }}
                style={{
                  fontSize: isActive
                    ? 'clamp(24px, 4.5vw, 38px)'
                    : 'clamp(16px, 2.8vw, 24px)',
                  fontWeight: isActive ? 800 : 500,
                  lineHeight: 1.35,
                  marginBottom: isActive
                    ? 'clamp(22px, 3.5vw, 36px)'
                    : 'clamp(14px, 2vw, 22px)',
                  opacity,
                  transition: 'opacity 0.45s ease, font-size 0.35s ease',
                  color: 'white',
                  letterSpacing: isActive ? 0.4 : 0,
                  userSelect: 'none',
                  cursor: line.timestamp !== null && onSeek ? 'pointer' : 'default',
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Audio controls bar ──────────────────────────────────────────── */}
      {hasControls && (
        <div
          style={{
            flexShrink: 0,
            padding: '14px 20px 20px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Waveform scrubber */}
          <div style={{ marginBottom: 14 }}>
            <WaveformScrubber
              blobUrl={blobUrl}
              currentTime={currentTime}
              duration={duration}
              playing={playing}
              onSeek={onSeek}
              height={40}
              colorPlayed="#1DB954"
              colorUnplayed="rgba(255,255,255,0.2)"
            />
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
            <button
              onClick={() => onSkip && onSkip(-10)}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.65)',
                fontSize: 13, cursor: 'pointer', padding: '4px 8px',
              }}
            >
              −10s
            </button>

            <button
              onClick={onTogglePlay}
              style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#1DB954', border: 'none', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(29,185,84,0.4)',
                transition: 'transform 0.1s',
                flexShrink: 0,
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {playing ? <BsPauseFill size={22} /> : <BsPlayFill size={22} style={{ marginLeft: 2 }} />}
            </button>

            <button
              onClick={() => onSkip && onSkip(10)}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.65)',
                fontSize: 13, cursor: 'pointer', padding: '4px 8px',
              }}
            >
              +10s
            </button>
          </div>

          {/* Time display */}
          <div
            style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 10,
              fontSize: 11, opacity: 0.4, fontVariantNumeric: 'tabular-nums',
              color: 'white',
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
