import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuthContext } from './useAuth';
import { validateFile } from '../utils/validators';

export function useFiles(albumId, songId) {
  const { user } = useAuthContext();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!albumId || !songId) return;

    const q = query(
      collection(db, 'albums', albumId, 'songs', songId, 'files'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFiles(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [albumId, songId]);

  function getFilesByStage(stageKey) {
    if (!stageKey) return files;
    return files.filter((f) => f.stageKey === stageKey);
  }

  async function uploadFile(file, stageKey = null) {
    const validation = validateFile(file);
    if (!validation.valid) throw new Error(validation.error);

    setUploading(true);
    try {
      const fileId = crypto.randomUUID();
      const storagePath = `albums/${albumId}/songs/${songId}/${fileId}/${file.name}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'albums', albumId, 'songs', songId, 'files'), {
        name: file.name,
        url,
        storagePath,
        stageKey,
        type: validation.type,
        mimeType: file.type,
        size: file.size,
        uploadedBy: user.uid,
        createdAt: serverTimestamp(),
      });
    } finally {
      setUploading(false);
    }
  }

  async function deleteFile(fileId, storagePath) {
    try {
      await deleteObject(ref(storage, storagePath));
    } catch {
      // File may already be deleted from storage
    }
    await deleteDoc(doc(db, 'albums', albumId, 'songs', songId, 'files', fileId));
  }

  return { files, loading, uploading, getFilesByStage, uploadFile, deleteFile };
}
