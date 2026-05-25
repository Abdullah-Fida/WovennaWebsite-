import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const content = item.to && !isLast ? (
          <Link to={item.to}>{item.label}</Link>
        ) : (
          <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
        );

        return (
          <span key={`${item.label}-${idx}`} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            {content}
            {!isLast && <span className="sep">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

