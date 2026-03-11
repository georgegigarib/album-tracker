import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { calcOverallProgress } from '../utils/formatters';
import { ALL_INSTRUMENTS } from '../utils/instruments';

const INSTRUMENT_STAGES = ['recording', 'editing', 'mixing_stage'];

const DEFAULT_INSTRUMENTS = {
  guitars: 'Guitarras',
  bass: 'Bajo',
  drums: 'Batería',
  vocals: 'Voces',
};

function buildDefaultStageProgress() {
  const stageProgress = {};
  for (const stage of INSTRUMENT_STAGES) {
    stageProgress[stage] = {};
    for (const [key, label] of Object.entries(DEFAULT_INSTRUMENTS)) {
      stageProgress[stage][key] = { completed: false, label };
    }
  }
  return stageProgress;
}

/** Migrate legacy `progress` field to per-stage `stageProgress` */
function migrateProgress(song) {
  if (song.stageProgress) return song;
  if (!song.progress) return { ...song, stageProgress: buildDefaultStageProgress() };
  const stageProgress = {};
  for (const stage of INSTRUMENT_STAGES) {
    stageProgress[stage] = {};
    for (const [key, val] of Object.entries(song.progress)) {
      stageProgress[stage][key] = { completed: false, label: val.label };
    }
  }
  return { ...song, stageProgress };
}

const DEFAULT_STAGES = {
  recording: { completed: false, label: 'Grabación' },
  editing: { completed: false, label: 'Edición' },
  mixing_stage: { completed: false, label: 'Mezcla' },
  mastering: { completed: false, label: 'Masterización' },
};

export function useSongs(albumId) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!albumId) return;

    const q = query(
      collection(db, 'albums', albumId, 'songs'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => migrateProgress({ id: d.id, ...d.data() }));
      setSongs(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [albumId]);

  async function createSong(title, estimatedEndDate = null) {
    const stageProgress = buildDefaultStageProgress();
    const stages = structuredClone(DEFAULT_STAGES);
    const songRef = await addDoc(collection(db, 'albums', albumId, 'songs'), {
      title,
      createdAt: serverTimestamp(),
      estimatedEndDate,
      status: 'not_started',
      stageProgress,
      stages,
      completionPercent: 0,
      assignedTo: [],
      updatedAt: serverTimestamp(),
    });
    return songRef.id;
  }

  async function updateSong(songId, data) {
    const updateData = { ...data, updatedAt: serverTimestamp() };
    if (data.stageProgress || data.stages) {
      const song = songs.find((s) => s.id === songId);
      const currentStageProgress = data.stageProgress || song?.stageProgress;
      const currentStages = data.stages || song?.stages;
      updateData.completionPercent = calcOverallProgress(currentStages, currentStageProgress);
    }
    await updateDoc(doc(db, 'albums', albumId, 'songs', songId), updateData);
  }

  async function toggleInstrument(songId, stageKey, instrumentKey, currentStageProgress) {
    const newStageProgress = structuredClone(currentStageProgress);
    newStageProgress[stageKey][instrumentKey] = {
      ...newStageProgress[stageKey][instrumentKey],
      completed: !newStageProgress[stageKey][instrumentKey].completed,
    };
    await updateSong(songId, { stageProgress: newStageProgress });
  }

  async function addInstrument(songId, instrumentKey, currentStageProgress) {
    const newStageProgress = structuredClone(currentStageProgress);
    for (const stage of INSTRUMENT_STAGES) {
      newStageProgress[stage][instrumentKey] = {
        completed: false,
        label: ALL_INSTRUMENTS[instrumentKey] || instrumentKey,
      };
    }
    await updateSong(songId, { stageProgress: newStageProgress });
  }

  async function removeInstrument(songId, instrumentKey, currentStageProgress) {
    const newStageProgress = structuredClone(currentStageProgress);
    for (const stage of INSTRUMENT_STAGES) {
      delete newStageProgress[stage][instrumentKey];
    }
    await updateSong(songId, { stageProgress: newStageProgress });
  }

  async function toggleStage(songId, stageKey, currentStages) {
    const newStages = structuredClone(currentStages);
    newStages[stageKey] = {
      ...newStages[stageKey],
      completed: !newStages[stageKey].completed,
    };
    await updateSong(songId, { stages: newStages });
  }

  async function deleteSong(songId) {
    const notesSnap = await getDocs(collection(db, 'albums', albumId, 'songs', songId, 'notes'));
    const filesSnap = await getDocs(collection(db, 'albums', albumId, 'songs', songId, 'files'));
    const subtasksSnap = await getDocs(collection(db, 'albums', albumId, 'songs', songId, 'subtasks'));
    const deletes = [
      ...notesSnap.docs.map((d) => deleteDoc(d.ref)),
      ...filesSnap.docs.map((d) => deleteDoc(d.ref)),
      ...subtasksSnap.docs.map((d) => deleteDoc(d.ref)),
    ];
    await Promise.all(deletes);
    await deleteDoc(doc(db, 'albums', albumId, 'songs', songId));
  }

  return {
    songs, loading, createSong, updateSong,
    toggleInstrument, addInstrument, removeInstrument,
    toggleStage, deleteSong,
  };
}

export { DEFAULT_STAGES };
