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

export function useNotes(albumId, songId) {
  const { user } = useAuthContext();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!albumId || !songId) return;

    const q = query(
      collection(db, 'albums', albumId, 'songs', songId, 'notes'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotes(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [albumId, songId]);

  function getNotesByStage(stageKey) {
    if (!stageKey) return notes;
    return notes.filter((n) => n.stageKey === stageKey);
  }

  async function addNote(content, stageKey = null) {
    if (!user) return;
    await addDoc(collection(db, 'albums', albumId, 'songs', songId, 'notes'), {
      content,
      stageKey,
      authorId: user.uid,
      authorName: user.displayName || user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function updateNote(noteId, content) {
    await updateDoc(doc(db, 'albums', albumId, 'songs', songId, 'notes', noteId), {
      content,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteNote(noteId) {
    await deleteDoc(doc(db, 'albums', albumId, 'songs', songId, 'notes', noteId));
  }

  return { notes, loading, getNotesByStage, addNote, updateNote, deleteNote };
}
