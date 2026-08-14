import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // A hash means "take me to this section" — jumping to the top instead
    // would throw away the destination. The section may still be mounting,
    // so retry briefly before giving up.
    if (hash) {
      let tries = 0;
      const find = () => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        if (tries++ < 20) setTimeout(find, 100);
      };
      find();
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
