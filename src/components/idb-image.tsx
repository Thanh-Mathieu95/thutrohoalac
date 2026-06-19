'use client';
// src/components/idb-image.tsx
// A drop-in <img> replacement that resolves "idb:key" references from IndexedDB.

import React, { useState, useEffect } from 'react';
import { getImageFromIDB, isIDBRef } from '@/lib/image-store';

interface IDBImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export function IDBImage({ src, alt, ...props }: IDBImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>(isIDBRef(src) ? '' : src);

  useEffect(() => {
    if (!isIDBRef(src)) {
      setResolvedSrc(src);
      return;
    }
    let cancelled = false;
    getImageFromIDB(src).then((data) => {
      if (!cancelled) setResolvedSrc(data || '');
    });
    return () => { cancelled = true; };
  }, [src]);

  if (!resolvedSrc) {
    return (
      <div
        {...(props as any)}
        className={`bg-gray-100 animate-pulse flex items-center justify-center text-gray-300 text-xs ${props.className ?? ''}`}
      >
        📷
      </div>
    );
  }

  return <img src={resolvedSrc} alt={alt ?? ''} {...props} />;
}
