import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthContext } from './useAuth';

export function useLinks(albumId, songId) {
  const { user } = useAuthContext();
  const [allLinks, setAllLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!albumId || !songId) return;

    const q = query(
      collection(db, 'albums', albumId, 'songs', songId, 'links'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllLinks(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [albumId, songId]);

  function getLinksByStage(stageKey) {
    if (!stageKey) return allLinks;
    return allLinks.filter((l) => l.stageKey === stageKey);
  }

  async function addLink(title, url, stageKey = null) {
    if (!user) return;
    await addDoc(collection(db, 'albums', albumId, 'songs', songId, 'links'), {
      title,
      url,
      stageKey,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  }

  async function updateLink(linkId, data) {
    await updateDoc(doc(db, 'albums', albumId, 'songs', songId, 'links', linkId), data);
  }

  async function deleteLink(linkId) {
    await deleteDoc(doc(db, 'albums', albumId, 'songs', songId, 'links', linkId));
  }

  return { allLinks, loading, getLinksByStage, addLink, updateLink, deleteLink };
}
