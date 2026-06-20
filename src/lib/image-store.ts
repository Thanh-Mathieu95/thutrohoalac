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

/** Compress an image file or base64 string using Canvas (resizes long-edge to 1600px and compresses quality to 80%) */
export function compressImage(
  fileOrBase64: File | string,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If running on server side, return original directly
    if (typeof window === 'undefined') {
      if (typeof fileOrBase64 === 'string') {
        resolve(fileOrBase64);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(fileOrBase64);
      }
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions preserving aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2d context from canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => reject(err);

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        img.src = ev.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
