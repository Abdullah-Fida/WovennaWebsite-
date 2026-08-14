/**
 * Star rating display.
 *
 * Supports fractional values — an average of 4.3 shows four full stars and a
 * 30% filled fifth, rather than rounding away the difference. The fill is a
 * clipped overlay so the two layers always line up whatever the font size.
 */
export default function Stars({ value = 0, size = 'md', className = '' }) {
  const clamped = Math.max(0, Math.min(5, Number(value) || 0));
  const percent = (clamped / 5) * 100;

  return (
    <span
      className={`stars stars--${size} ${className}`}
      role="img"
      aria-label={`${clamped} out of 5 stars`}
    >
      <span className="stars-track" aria-hidden="true">★★★★★</span>
      <span className="stars-fill" style={{ width: `${percent}%` }} aria-hidden="true">
        ★★★★★
      </span>
    </span>
  );
}
