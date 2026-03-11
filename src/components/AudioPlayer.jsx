export default function AudioPlayer({ url }) {
  return (
    <audio controls preload="none" className="w-100 mt-1" style={{ height: 32 }}>
      <source src={url} />
      Tu navegador no soporta el reproductor de audio.
    </audio>
  );
}
