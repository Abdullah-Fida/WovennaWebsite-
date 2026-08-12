// Image delivery helpers.
//
// Cloudinary stores the original upload (often 1.5–5 MB PNGs straight from a
// phone). Requesting those raw costs seconds per image. Inserting transform
// flags after /upload/ makes Cloudinary render and cache a right-sized,
// modern-format copy — typically a 20–30x smaller file for the same on-screen
// result. Non-Cloudinary URLs (local /Images/... paths) pass through unchanged.

const CLOUDINARY_UPLOAD = '/image/upload/';

export const PLACEHOLDER = '/premium/flatlay-marble.jpg';

/**
 * @param {string} url    original image URL
 * @param {object} opts   w = target width in CSS px, q = quality, blur = LQIP
 */
export function imgUrl(url, { w, h, q = 'auto', crop = 'fill', blur = false } = {}) {
  if (!url || typeof url !== 'string') return PLACEHOLDER;

  const at = url.indexOf(CLOUDINARY_UPLOAD);
  if (at === -1) return url; // local/static asset — nothing to transform

  const parts = ['f_auto', `q_${blur ? 'auto:low' : q}`];
  if (w) parts.push(`w_${Math.round(w)}`);
  if (h) parts.push(`h_${Math.round(h)}`, `c_${crop}`);
  else if (w) parts.push('c_limit');
  parts.push('dpr_auto');
  if (blur) parts.push('e_blur:400');

  const head = url.slice(0, at + CLOUDINARY_UPLOAD.length);
  const tail = url.slice(at + CLOUDINARY_UPLOAD.length);
  return `${head}${parts.join(',')}/${tail}`;
}

/** Build a srcset so phones never download desktop-sized files. */
export function imgSrcSet(url, widths = [400, 700, 1000, 1400]) {
  if (!url || !url.includes(CLOUDINARY_UPLOAD)) return undefined;
  return widths.map((w) => `${imgUrl(url, { w })} ${w}w`).join(', ');
}

/** Tiny blurred version used as a placeholder while the real file loads. */
export function imgLqip(url) {
  if (!url || !url.includes(CLOUDINARY_UPLOAD)) return undefined;
  return imgUrl(url, { w: 24, blur: true });
}
