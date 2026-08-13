import { Link } from 'react-router-dom';

// One list, so a new admin section is a single edit here rather than a copy
// into every page.
const TABS = [
  { key: 'overview', to: '/admin', label: 'Overview' },
  { key: 'orders', to: '/admin/orders', label: 'Orders' },
  { key: 'products', to: '/admin/products', label: 'Products' },
  { key: 'users', to: '/admin/users', label: 'Users' },
  { key: 'promos', to: '/admin/promos', label: 'Promos' },
  { key: 'influencers', to: '/admin/influencers', label: 'Influencers' },
  { key: 'gallery', to: '/admin/gallery', label: 'Gallery' },
];

export default function AdminNav({ active }) {
  return (
    <div className="admin-nav">
      {TABS.map((t) => (
        <Link key={t.key} to={t.to} className={active === t.key ? 'active' : undefined}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
