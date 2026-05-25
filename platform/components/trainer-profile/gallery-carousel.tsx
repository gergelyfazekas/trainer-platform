"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  photos: string[];
}

export function GalleryCarousel({ photos }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (photos.length === 0) return null;

  function scroll(dir: number) {
    ref.current?.scrollBy({ left: dir * 600, behavior: "smooth" });
  }

  function openLightbox(i: number) {
    setLightbox(i);
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    setLightbox(null);
    document.body.style.overflow = "";
  }

  function prev() {
    setLightbox((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }

  function next() {
    setLightbox((i) => (i === null ? null : (i + 1) % photos.length));
  }

  return (
    <>
      <div className="relative -mx-6 md:mx-0">
        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto px-6 md:px-0 pb-3 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openLightbox(i)}
              className="snap-start shrink-0 w-[78%] sm:w-[55%] md:w-[42%] lg:w-[36%] aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--th-muted)] cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--th-accent)]"
            >
              <img
                src={p}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
            </button>
          ))}
        </div>
        <button
          onClick={() => scroll(-1)}
          aria-label="Előző"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[var(--th-border)] shadow-md items-center justify-center hover:scale-105 transition-transform"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label="Következő"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[var(--th-border)] shadow-md items-center justify-center hover:scale-105 transition-transform"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={photos}
          index={lightbox}
          onClose={closeLightbox}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/92"
      onClick={onClose}
    >
      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-[13px] font-medium tabular-nums pointer-events-none">
        {index + 1} / {photos.length}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Bezárás"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Image */}
      <img
        src={photos[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl select-none"
        draggable={false}
      />

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Előző"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Következő"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
