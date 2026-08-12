import { useState } from 'react';
import { imgUrl, imgSrcSet, PLACEHOLDER } from '../../lib/img';

/**
 * Image with sane defaults for a storefront:
 *  - serves a right-sized, modern-format file (see lib/img)
 *  - reserves space via `ratio` so nothing jumps as images arrive
 *  - lazy-loads below-the-fold images, eager-loads the ones marked priority
 *  - fades in, and falls back to a placeholder rather than a broken icon
 *
 * `ratio` is a CSS aspect-ratio string ("3 / 4"). Pass `fill` when the parent
 * already establishes the box.
 */
export default function SmartImage({
  src,
  alt = '',
  ratio,
  fill = false,
  width,
  sizes = '100vw',
  priority = false,
  className = '',
  imgClassName = '',
  objectFit = 'cover',
  style,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const source = failed || !src ? PLACEHOLDER : src;
  const optimized = imgUrl(source, { w: width || 1000 });
  const srcSet = failed ? undefined : imgSrcSet(source);

  const wrapStyle = {
    ...(ratio ? { aspectRatio: ratio } : null),
    ...(fill ? { position: 'absolute', inset: 0 } : null),
    ...style,
  };

  return (
    <span className={`smart-img ${loaded ? 'is-loaded' : ''} ${className}`} style={wrapStyle}>
      <img
        src={optimized}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        // Decoding async keeps a long product gallery from blocking paint.
        decoding={priority ? 'sync' : 'async'}
        // React 18 passes unknown camelCase props straight through and warns;
        // the DOM attribute is all-lowercase.
        {...(priority ? { fetchpriority: 'high' } : null)}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) setFailed(true);
          setLoaded(true);
        }}
        className={imgClassName}
        style={{ objectFit }}
        {...rest}
      />
    </span>
  );
}
