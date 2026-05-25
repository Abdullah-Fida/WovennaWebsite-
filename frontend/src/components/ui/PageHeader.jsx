import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
  right,
}) {
  return (
    <header className="page-header">
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}

      {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}

      {title ? <h1 className="page-title">{title}</h1> : null}

      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}

      {right ? <div style={{ marginTop: 22 }}>{right}</div> : null}
    </header>
  );
}

