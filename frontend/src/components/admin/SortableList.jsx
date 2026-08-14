import { useRef, useState } from 'react';

/**
 * A vertical list that reorders by dragging.
 *
 * Same approach as the product image manager: Pointer Events, because HTML5
 * drag-and-drop never fires on touch and the admin panel is used from a phone.
 * A mouse can grab anywhere on the row; a finger must start on the grip, so
 * the page can still be scrolled past a long list.
 *
 * Buttons inside a row need `data-action` so a tap on them isn't read as a drag.
 */
export default function SortableList({
  items,
  onReorder,
  renderItem,
  getKey,
  className = '',
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const containerRef = useRef(null);
  const originRef = useRef(null);

  const move = (from, to) => {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onReorder(next);
  };

  const indexAtPoint = (y) => {
    const rows = containerRef.current?.querySelectorAll('[data-row]');
    if (!rows) return -1;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i].getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) return i;
    }
    return -1;
  };

  const startDrag = (index) => (e) => {
    if (e.target.closest('[data-action]')) return;
    if (e.pointerType !== 'mouse' && !e.target.closest('[data-grip]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    originRef.current = { y: e.clientY, index, engaged: false };
  };

  const onMove = (e) => {
    const origin = originRef.current;
    if (!origin) return;

    if (!origin.engaged) {
      if (Math.abs(e.clientY - origin.y) < 6) return;
      origin.engaged = true;
      setDragIndex(origin.index);
    }

    const over = indexAtPoint(e.clientY);
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

  return (
    <div className={`sortable-list ${className}`} ref={containerRef}>
      {items.map((item, index) => (
        <div
          key={getKey(item)}
          data-row
          className={`sortable-row ${dragIndex === index ? 'is-dragging' : ''}`}
          onPointerDown={startDrag(index)}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span data-grip className="sortable-grip" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
              <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
              <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
            </svg>
          </span>

          <div className="sortable-content">{renderItem(item, index)}</div>

          {/* Keyboard path, since a pointer drag can't be done from a keyboard. */}
          <div className="sortable-nudge">
            <button type="button" data-action aria-label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)}>↑</button>
            <button type="button" data-action aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, index + 1)}>↓</button>
          </div>
        </div>
      ))}
    </div>
  );
}
