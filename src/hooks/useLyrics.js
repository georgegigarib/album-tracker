import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useLyrics(albumId, songId) {
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!albumId || !songId) return;
    const ref = doc(db, 'albums', albumId, 'songs', songId, 'lyrics', 'main');
    return onSnapshot(ref, (snap) => {
      setLyrics(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
  }, [albumId, songId]);

  async function saveLyrics({ rawText, lines, linkedLinkId, linkedLinkDuration }) {
    const ref = doc(db, 'albums', albumId, 'songs', songId, 'lyrics', 'main');
    await setDoc(ref, {
      rawText,
      lines,
      linkedLinkId: linkedLinkId || null,
      linkedLinkDuration: linkedLinkDuration || null,
      updatedAt: serverTimestamp(),
    });
  }

  return { lyrics, loading, saveLyrics };
}
