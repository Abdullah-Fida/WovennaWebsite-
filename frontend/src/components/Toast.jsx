import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for transition
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast ${show ? 'show' : ''}`} style={{ borderColor: type === 'error' ? '#ef4444' : 'var(--gold)' }}>
      {message}
    </div>
  );
}
