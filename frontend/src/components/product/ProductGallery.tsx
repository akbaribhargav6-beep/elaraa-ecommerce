'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { ProductImageDTO } from '@elaraa/shared';
import { getUploadUrl } from '@/lib/api-client';

const AUTOPLAY_DURATION_MS = 3500;

export function ProductGallery({ images, productName }: { images: ProductImageDTO[]; productName: string }) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [index, setIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(0);

  const active = sorted[index] ?? sorted[0];

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % sorted.length) + sorted.length) % sorted.length);
      setProgress(0);
    },
    [sorted.length]
  );

  // Autoplay progress bar: advances the fill every 50ms, then moves to the
  // next slide once it reaches 100% — restarts whenever the slide changes.
  useEffect(() => {
    if (!isAutoplay || sorted.length <= 1) return;
    const tickMs = 50;
    const step = (tickMs / AUTOPLAY_DURATION_MS) * 100;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p + step >= 100) {
          goTo(index + 1);
          return 0;
        }
        return p + step;
      });
    }, tickMs);
    return () => clearInterval(interval);
  }, [isAutoplay, index, sorted.length, goTo]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') goTo(index - 1);
      if (e.key === 'ArrowRight') goTo(index + 1);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, index, goTo]);

  if (!active) return null;

  return (
    <div className="space-y-4">
      <div
        className="relative bg-cream border rounded-sm overflow-hidden group aspect-square shadow-lg"
        style={{ borderColor: 'rgba(43,38,32,.1)' }}
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0].screenX;
        }}
        onTouchEnd={(e) => {
          const dx = touchStartX.current - e.changedTouches[0].screenX;
          if (dx > 50) goTo(index + 1);
          if (dx < -50) goTo(index - 1);
        }}
      >
        <Image
          src={getUploadUrl(active.url)}
          alt={active.altText ?? productName}
          fill
          className="object-cover transition-opacity duration-300"
          priority
          sizes="(min-width:768px) 50vw, 100vw"
        />

        {/* Autoplay progress bar */}
        {sorted.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 z-20">
            <div className="h-full transition-[width] duration-75" style={{ width: `${progress}%`, background: 'var(--gold-deep)' }} />
          </div>
        )}

        {/* Autoplay + expand controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          {sorted.length > 1 && (
            <button
              onClick={() => setIsAutoplay((a) => !a)}
              aria-label={isAutoplay ? 'Pause slideshow' : 'Play slideshow'}
              className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-xs shadow-md hover:scale-110 transition-transform"
            >
              {isAutoplay ? '⏸' : '▶'}
            </button>
          )}
          <button
            onClick={() => setLightboxOpen(true)}
            aria-label="View fullscreen"
            className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-xs shadow-md hover:scale-110 transition-transform"
          >
            ⤢
          </button>
        </div>

        {sorted.length > 1 && (
          <>
            <button
              onClick={() => goTo(index - 1)}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              ‹
            </button>
            <button
              onClick={() => goTo(index + 1)}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              ›
            </button>
            <div className="absolute bottom-4 left-4 bg-black/75 text-white text-[10px] tracking-widest px-3 py-1 rounded-full z-20 uppercase font-medium">
              {index + 1} / {sorted.length}
            </div>
          </>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => goTo(i)}
              className="aspect-square border-2 rounded-sm overflow-hidden relative transition-all"
              style={{ borderColor: i === index ? 'var(--gold-deep)' : 'transparent' }}
            >
              <Image src={getUploadUrl(img.url)} alt={img.altText ?? productName} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-between p-6" onClick={() => setLightboxOpen(false)}>
          <div className="w-full flex items-center justify-between text-white text-xs tracking-widest">
            <span className="uppercase opacity-70">Fullscreen Gallery</span>
            <button onClick={() => setLightboxOpen(false)} aria-label="Close fullscreen" className="text-2xl hover:opacity-70 p-2">
              ✕
            </button>
          </div>

          <div className="relative w-full max-w-4xl h-[70vh] flex items-center justify-center my-auto" onClick={(e) => e.stopPropagation()}>
            <Image src={getUploadUrl(active.url)} alt={active.altText ?? productName} fill className="object-contain" sizes="90vw" />
            {sorted.length > 1 && (
              <>
                <button onClick={() => goTo(index - 1)} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white text-2xl flex items-center justify-center">
                  ‹
                </button>
                <button onClick={() => goTo(index + 1)} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white text-2xl flex items-center justify-center">
                  ›
                </button>
              </>
            )}
          </div>

          {sorted.length > 1 && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {sorted.map((img, i) => (
                <button key={img.id} onClick={() => goTo(i)} className="w-12 h-12 relative border-2 rounded-sm overflow-hidden" style={{ borderColor: i === index ? 'var(--gold)' : 'transparent', opacity: i === index ? 1 : 0.6 }}>
                  <Image src={getUploadUrl(img.url)} alt="" fill className="object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
