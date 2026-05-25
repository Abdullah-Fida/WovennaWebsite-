export default function EmptyState({ title, description, actions }) {
  return (
    <div className="state-panel">
      {title ? <h3>{title}</h3> : null}
      {description ? <p>{description}</p> : null}
      {actions ? <div className="state-actions">{actions}</div> : null}
    </div>
  );
}

