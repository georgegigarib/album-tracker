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

export function useSubtasks(albumId, songId) {
  const { user } = useAuthContext();
  const [allSubtasks, setAllSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!albumId || !songId) return;

    const q = query(
      collection(db, 'albums', albumId, 'songs', songId, 'subtasks'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllSubtasks(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [albumId, songId]);

  function getSubtasksByStage(stageKey) {
    return allSubtasks.filter((s) => s.stageKey === stageKey);
  }

  async function addSubtask(title, stageKey) {
    if (!user) return;
    await addDoc(collection(db, 'albums', albumId, 'songs', songId, 'subtasks'), {
      title,
      completed: false,
      stageKey,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    });
  }

  async function toggleSubtask(subtaskId, currentCompleted) {
    await updateDoc(doc(db, 'albums', albumId, 'songs', songId, 'subtasks', subtaskId), {
      completed: !currentCompleted,
    });
  }

  async function deleteSubtask(subtaskId) {
    await deleteDoc(doc(db, 'albums', albumId, 'songs', songId, 'subtasks', subtaskId));
  }

  return { allSubtasks, loading, getSubtasksByStage, addSubtask, toggleSubtask, deleteSubtask };
}
