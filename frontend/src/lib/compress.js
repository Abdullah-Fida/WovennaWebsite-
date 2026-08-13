/**
 * Shrink an image in the browser before it is uploaded.
 *
 * A photo straight off a phone is commonly 3–6 MB. Sending five of those was
 * most of the ten seconds a product save used to take, and on a weak
 * connection it was also what made saves fail outright. Nothing on the site
 * renders above ~1600px, so downscaling first costs no visible quality.
 */

const MAX_EDGE = 1800;
const QUALITY = 0.82;
// Below this a re-encode usually makes the file bigger, not smaller.
const SKIP_UNDER_BYTES = 300 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

export async function compressImage(file) {
  if (!file.type.startsWith('image/')) return file;
  // Leave vector and animated formats alone — a canvas would flatten them.
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  if (file.size < SKIP_UNDER_BYTES) return file;

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    );

    // If the re-encode didn't actually help, keep the original.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    // Any failure here should never block a save — send the original.
    return file;
  }
}

export async function compressImages(files, onProgress) {
  const list = Array.from(files || []);
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    out.push(await compressImage(list[i]));
    if (onProgress) onProgress(i + 1, list.length);
  }
  return out;
}
