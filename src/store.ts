import { get, set, del } from 'idb-keyval';
import type { BoardState, Tier } from './types';
import { v4 as uuidv4 } from 'uuid';

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

export const loadState = (): BoardState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved state', e);
    }
  }
  return DEFAULT_STATE;
};

export const saveState = (state: BoardState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const saveImage = async (file: File): Promise<string> => {
  const id = uuidv4();
  await set(`img-${id}`, file);
  return id;
};

export const loadImage = async (id: string): Promise<string | null> => {
  const file = await get<File>(`img-${id}`);
  if (file) {
    return URL.createObjectURL(file);
  }
  return null;
};

export const deleteImage = async (id: string) => {
  await del(`img-${id}`);
};

export const exportData = async (state: BoardState) => {
  const exportObject: any = {
    version: 1,
    state,
    images: {}
  };
  
  // Extract all photo IDs
  const photoIds = state.places.filter(p => p.type === 'photo' && p.photoId).map(p => p.photoId!);
  
  // Read all photos into base64
  for (const id of photoIds) {
    const file = await get<File>(`img-${id}`);
    if (file) {
      const base64 = await fileToBase64(file);
      exportObject.images[id] = base64;
    }
  }
  
  const blob = new Blob([JSON.stringify(exportObject)], { type: 'application/json' });
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
    if (!data.state) return null;
    
    // Restore images
    if (data.images) {
      for (const [id, base64] of Object.entries(data.images)) {
        const imgFile = await base64ToFile(base64 as string, id);
        await set(`img-${id}`, imgFile);
      }
    }
    
    return data.state;
  } catch (e) {
    console.error('Import failed', e);
    return null;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const base64ToFile = async (base64: string, filename: string): Promise<File> => {
  const res = await fetch(base64);
  const buf = await res.arrayBuffer();
  // We don't have the original mimetype easily without parsing, so we just assume a generic one or read it from data url
  const mimeType = base64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
  return new File([buf], filename, { type: mimeType });
};
