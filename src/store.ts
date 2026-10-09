import { get, set, del } from 'idb-keyval';
import type { BoardState, Tier } from './types';
import { v4 as uuidv4 } from 'uuid';
import { db, storage, isFirebaseConfigured } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'bambai-bites-state';

export const DEFAULT_TIERS: Tier[] = [
  { id: uuidv4(), name: 'Aai Shappath!', color: '#f97316', textColor: '#ffffff' }, // Warm saffron
  { id: uuidv4(), name: 'Ek Number', color: '#14b8a6', textColor: '#ffffff' }, // Teal
  { id: uuidv4(), name: 'Paisa Vasool', color: '#eab308', textColor: '#ffffff' }, // Mustard yellow
  { id: uuidv4(), name: 'Chalega Re', color: '#64748b', textColor: '#ffffff' }, // Muted blue
  { id: uuidv4(), name: 'Bhai, Vada Pav Hi Theek Tha', color: '#ef4444', textColor: '#ffffff' }, // Soft red
];

const DEFAULT_STATE: BoardState = {
  title: 'Mumbai Food Tier List',
  tiers: DEFAULT_TIERS,
  places: [],
};

export const useBoardSync = (): [BoardState, (state: BoardState) => void, boolean] => {
  const [board, setBoard] = useState<BoardState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onSnapshot(doc(db, 'boards', 'shared'), (docSnap) => {
        if (docSnap.exists()) {
          setBoard(docSnap.data() as BoardState);
        } else {
          setDoc(doc(db, 'boards', 'shared'), DEFAULT_STATE);
          setBoard(DEFAULT_STATE);
        }
        setIsLoaded(true);
      }, (error) => {
        console.error("Firestore sync error (check rules?):", error);
        setIsLoaded(true); // Stop loading if error
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setBoard(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved state', e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  const saveBoard = (newState: BoardState) => {
    setBoard(newState); // Optimistic UI update
    if (isFirebaseConfigured) {
      setDoc(doc(db, 'boards', 'shared'), newState).catch(console.error);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    }
  };

  return [board, saveBoard, isLoaded];
};

export const saveImage = async (file: File): Promise<string> => {
  const id = uuidv4();
  if (isFirebaseConfigured) {
    const storageRef = ref(storage, `images/${id}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } else {
    await set(`img-${id}`, file);
    return id;
  }
};

export const loadImage = async (id: string): Promise<string | null> => {
  if (id.startsWith('https://')) return id; // It's already a Firebase URL
  const file = await get<File>(`img-${id}`);
  return file ? URL.createObjectURL(file) : null;
};

export const deleteImage = async (id: string) => {
  if (id.startsWith('https://')) {
    if (isFirebaseConfigured) {
      const storageRef = ref(storage, id); // Works if it's the full URL
      await deleteObject(storageRef).catch(console.error);
    }
  } else {
    await del(`img-${id}`);
  }
};

// ... keep exportData and importData for local backups if needed
export const exportData = async (state: BoardState) => {
  const blob = new Blob([JSON.stringify({version: 2, state})], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bambai-bites-backup.json';
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = async (file: File): Promise<BoardState | null> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return data.state || null;
  } catch (e) {
    console.error('Import failed', e);
    return null;
  }
};
