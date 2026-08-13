// Wovenaa monogram. Both files are generated straight from the supplied
// master artwork (see public/brand), so this is the mark as drawn — no
// redrawing, no tracing. Two colourways ship together and CSS decides which
// one shows, because the navbar flips between a dark hero and a light bar
// mid-scroll and a single tinted asset can't follow that.
export default function Logo({ className = '' }) {
  return (
    <span className={`brand-mark ${className}`} role="img" aria-label="Wovenaa">
      <img src="/brand/logo-black.png" alt="" className="brand-mark-dark" draggable="false" />
      <img src="/brand/logo-white.png" alt="" className="brand-mark-light" draggable="false" />
    </span>
  );
}
