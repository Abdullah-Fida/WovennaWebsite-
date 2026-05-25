export default function InfoTip({ tip, ariaLabel = 'More info' }) {
  if (!tip) return null;
  return (
    <span
      className="info-tip"
      tabIndex={0}
      role="note"
      aria-label={ariaLabel}
      data-tip={tip}
      title={tip}
    >
      i
    </span>
  );
}

