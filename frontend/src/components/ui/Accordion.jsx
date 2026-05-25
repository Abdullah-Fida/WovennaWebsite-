import { useState } from 'react';

export default function Accordion({ items = [], defaultOpenIndex = 0 }) {
  const [openIndex, setOpenIndex] = useState(
    typeof defaultOpenIndex === 'number' ? defaultOpenIndex : -1
  );

  if (!items.length) return null;

  return (
    <div className="accordion">
      {items.map((item, idx) => {
        const isOpen = idx === openIndex;
        return (
          <div key={`${item.title}-${idx}`} className="accordion-item">
            <button
              type="button"
              className="accordion-btn"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex((cur) => (cur === idx ? -1 : idx))}
            >
              <span className="accordion-title">{item.title}</span>
              <span className="accordion-icon" aria-hidden="true">
                +
              </span>
            </button>
            {isOpen ? <div className="accordion-panel">{item.content}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

