import { useRef, useState, useCallback } from 'react';

/**
 * Product gallery editor with drag-to-reorder.
 *
 * Uses Pointer Events rather than HTML5 drag-and-drop, which never fires on
 * touch — reordering on a phone previously meant tapping arrow buttons over
 * and over. With a mouse the whole tile is draggable; on touch the grip is the
 * drag surface, so the gallery can still be scrolled past with a finger.
 *
 * Items are `{ id, kind: 'existing' | 'new', url?, file?, preview }` and are
 * kept in one ordered list, so a freshly picked photo can be dragged in front
 * of a saved one. Position 1 is the cover.
 */
export default function ImageManager({ items, onChange, max = 20, onNotice, busy }) {
  const [dragIndex, setDragIndex] = useState(null);
  const containerRef = useRef(null);
  const originRef = useRef(null);

  const move = useCallback(
    (from, to) => {
      if (from === to || to < 0 || to >= items.length) return;
      const next = [...items];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onChange(next);
    },
    [items, onChange]
  );

  // Which tile is under the pointer right now.
  const indexAtPoint = (x, y) => {
    const tiles = containerRef.current?.querySelectorAll('[data-tile]');
    if (!tiles) return -1;
    for (let i = 0; i < tiles.length; i += 1) {
      const r = tiles[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return -1;
  };

  const startDrag = (index) => (e) => {
    // Buttons inside the tile keep their own clicks.
    if (e.target.closest('button[data-action]')) return;
    // A touch drag must begin on the grip, or the page can't be scrolled.
    if (e.pointerType !== 'mouse' && !e.target.closest('[data-grip]')) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    originRef.current = { x: e.clientX, y: e.clientY, index, engaged: false };
  };

  const onMove = (e) => {
    const origin = originRef.current;
    if (!origin) return;

    if (!origin.engaged) {
      // A few pixels of slop so a tap is never read as a drag.
      const moved = Math.hypot(e.clientX - origin.x, e.clientY - origin.y);
      if (moved < 6) return;
      origin.engaged = true;
      setDragIndex(origin.index);
    }

    const over = indexAtPoint(e.clientX, e.clientY);
    if (over !== -1 && over !== origin.index) {
      move(origin.index, over);
      origin.index = over;
      setDragIndex(over);
    }
  };

  const endDrag = (e) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    originRef.current = null;
    setDragIndex(null);
  };

  const remove = (index) => {
    const item = items[index];
    if (item.kind === 'new' && item.preview) URL.revokeObjectURL(item.preview);
    onChange(items.filter((_, i) => i !== index));
  };

  const makeCover = (index) => move(index, 0);

  if (items.length === 0) {
    return (
      <div className="admin-image-empty">
        No images yet. Add photos below — the first one becomes the cover.
      </div>
    );
  }

  return (
    <>
      <div className="admin-image-grid" ref={containerRef}>
        {items.map((item, index) => (
          <div
            key={item.id}
            data-tile
            className={[
              'admin-image-tile',
              index === 0 ? 'is-cover' : '',
              item.kind === 'new' ? 'is-new' : '',
              dragIndex === index ? 'is-dragging' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onPointerDown={busy ? undefined : startDrag(index)}
            onPointerMove={busy ? undefined : onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <img src={item.preview || item.url} alt="" draggable="false" />

            <span data-grip className="admin-image-grip" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
              </svg>
            </span>

            {index === 0 && <span className="admin-image-cover-tag">Cover</span>}
            {item.kind === 'new' && <span className="admin-image-new-tag">New</span>}

            <div className="admin-image-tile-actions">
              {index !== 0 && (
                <button
                  type="button"
                  data-action
                  title="Make cover"
                  aria-label="Make cover image"
                  onClick={() => makeCover(index)}
                >
                  ★
                </button>
              )}
              <button
                type="button"
                data-action
                className="is-danger"
                title="Remove"
                aria-label="Remove image"
                onClick={() => remove(index)}
              >
                ×
              </button>
            </div>

            {/* Keyboard path, since a pointer drag can't be done from a keyboard. */}
            <div className="admin-image-nudge">
              <button type="button" data-action aria-label="Move earlier" disabled={index === 0} onClick={() => move(index, index - 1)}>‹</button>
              <button type="button" data-action aria-label="Move later" disabled={index === items.length - 1} onClick={() => move(index, index + 1)}>›</button>
            </div>
          </div>
        ))}
      </div>

      <p className="admin-image-hint">
        Drag to reorder — the first image is the cover. {items.length} of {max} used.
        {onNotice ? '' : ''}
      </p>
    </>
  );
}
