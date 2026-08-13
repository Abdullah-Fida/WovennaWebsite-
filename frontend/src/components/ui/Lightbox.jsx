import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { imgUrl } from '../../lib/img';

/**
 * Full-screen viewer for the lookbook. Opens on a single tap, closes on
 * Escape / backdrop / the close button, and steps with the arrow keys.
 *
 * Saving is discouraged the only ways a browser allows: the context menu and
 * dragging are blocked, and a transparent layer sits over the photo so a long
 * press on mobile grabs that instead of the image. None of this is real
 * protection — anyone can still screenshot — but it stops casual downloads.
 */
export default function Lightbox({ items, index, onClose, onIndex }) {
  const open = index !== null && index >= 0 && index < items.length;

  const step = useCallback(
    (delta) => {
      if (!open) return;
      onIndex((index + delta + items.length) % items.length);
    },
    [open, index, items.length, onIndex]
  );

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };

    // Freeze the page behind the overlay without losing scroll position.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, step]);

  if (!open) return null;

  const item = items[index];

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.caption || 'Lookbook image'}
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>

      {items.length > 1 && (
        <>
          <button
            className="lightbox-nav lightbox-nav--prev"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Previous image"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="lightbox-nav lightbox-nav--next"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Next image"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-frame">
          <img
            src={imgUrl(item.src, { w: 1600, crop: 'limit' })}
            alt={item.caption || ''}
            draggable="false"
            onDragStart={(e) => e.preventDefault()}
          />
          {/* Catches long-press and right-click before they reach the image. */}
          <span className="lightbox-shield" aria-hidden="true" />
        </div>
        {(item.caption || item.credit) && (
          <figcaption className="lightbox-caption">
            {item.caption}
            {item.credit && <span className="lightbox-credit">{item.credit}</span>}
          </figcaption>
        )}
        {items.length > 1 && (
          <div className="lightbox-counter">{index + 1} / {items.length}</div>
        )}
      </figure>
    </div>,
    document.body
  );
}
