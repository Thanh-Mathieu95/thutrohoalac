// src/lib/image-store.ts
// IndexedDB store for large base64 image data.
// localStorage only stores a short reference key like "idb:img_123".

const DB_NAME = 'thuetro_images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save a base64 data-URL to IndexedDB and return a reference key like "idb:img_1717..." */
export async function saveImageToIDB(base64DataUrl: string): Promise<string> {
  const key = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(base64DataUrl, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return `idb:${key}`;
}

/** Retrieve the actual base64 data-URL from IndexedDB using a reference key. */
export async function getImageFromIDB(refKey: string): Promise<string | null> {
  if (!refKey.startsWith('idb:')) return refKey; // already a real URL
  const key = refKey.slice(4);
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
    req.onerror = () => { db.close(); resolve(null); };
  });
}

/** Delete an image from IndexedDB. */
export async function deleteImageFromIDB(refKey: string): Promise<void> {
  if (!refKey.startsWith('idb:')) return;
  const key = refKey.slice(4);
  const db = await openDB();
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); resolve(); };
  });
}

/** Check if a URL is an IDB reference key */
export function isIDBRef(url: string): boolean {
  return url.startsWith('idb:');
}
