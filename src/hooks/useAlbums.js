import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthContext } from './useAuth';

export function useAlbums() {
  const { user } = useAuthContext();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'albums'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAlbums(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  async function createAlbum(title) {
    const albumRef = await addDoc(collection(db, 'albums'), {
      title,
      ownerId: user.uid,
      collaborators: [],
      members: [user.uid],
      coverURL: null,
      createdAt: serverTimestamp(),
      songOrder: [],
    });
    return albumRef.id;
  }

  async function updateAlbum(albumId, data) {
    await updateDoc(doc(db, 'albums', albumId), data);
  }

  async function deleteAlbum(albumId) {
    const songsSnap = await getDocs(collection(db, 'albums', albumId, 'songs'));
    const batch = [];
    for (const songDoc of songsSnap.docs) {
      const notesSnap = await getDocs(collection(db, 'albums', albumId, 'songs', songDoc.id, 'notes'));
      notesSnap.docs.forEach((n) => batch.push(deleteDoc(n.ref)));
      const filesSnap = await getDocs(collection(db, 'albums', albumId, 'songs', songDoc.id, 'files'));
      filesSnap.docs.forEach((f) => batch.push(deleteDoc(f.ref)));
      batch.push(deleteDoc(songDoc.ref));
    }
    await Promise.all(batch);
    await deleteDoc(doc(db, 'albums', albumId));
  }

  async function addCollaborator(albumId, collaboratorUid) {
    await updateDoc(doc(db, 'albums', albumId), {
      collaborators: arrayUnion(collaboratorUid),
      members: arrayUnion(collaboratorUid),
    });
  }

  async function removeCollaborator(albumId, collaboratorUid) {
    await updateDoc(doc(db, 'albums', albumId), {
      collaborators: arrayRemove(collaboratorUid),
      members: arrayRemove(collaboratorUid),
    });
  }

  return { albums, loading, createAlbum, updateAlbum, deleteAlbum, addCollaborator, removeCollaborator };
}
