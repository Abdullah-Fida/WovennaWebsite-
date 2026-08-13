import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { priceRange } from '../lib/variants';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'oldest', label: 'Oldest first' },
];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('q') || '';
  // Sort lives in the URL so a filtered, sorted view can be shared or bookmarked.
  const sort = searchParams.get('sort') || 'newest';
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      setError('');
      let query = [];
      if (category) query.push(`category=${category}`);
      if (search) query.push(`q=${search}`);
      const data = await getProducts(query.length ? query.join('&') : '');
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput) {
      searchParams.set('q', searchInput);
    } else {
      searchParams.delete('q');
    }
    setSearchParams(searchParams);
  };

  const categories = ['All', 'Tote', 'Crossbody'];

  // Sold-out and placeholder pieces move to their own section below the
  // buyable range so the top of the page is always shoppable.
  const isSoldOut = (p) => p.stock === 0 || p.showInSoldOutRow;

  // Sorting compares the lowest live price so variant products sit where a
  // shopper expects rather than where their base price happens to be.
  const lowestPrice = (p) => priceRange(p).min;

  const sortProducts = (list) => {
    const out = [...list];
    switch (sort) {
      case 'price-asc':
        return out.sort((a, b) => lowestPrice(a) - lowestPrice(b));
      case 'price-desc':
        return out.sort((a, b) => lowestPrice(b) - lowestPrice(a));
      case 'name-asc':
        return out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'oldest':
        return out.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      case 'newest':
      default:
        return out.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  };

  const available = sortProducts(products.filter((p) => !isSoldOut(p)));
  const soldOut = sortProducts(products.filter(isSoldOut));

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Shop' },
          ]}
          eyebrow="Our Collection"
          title={
            <>
              The <em>Complete</em> Range
            </>
          }
        />

        <div className="shop-controls reveal visible" style={{ marginBottom: 34 }}>
          <div className="shop-categories">
            {categories.map((c) => {
              const isActive = c === 'All' ? !category : category === c;
              return (
                <button
                  key={c}
                  className={`shop-cat-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (c === 'All') searchParams.delete('category');
                    else searchParams.set('category', c);
                    setSearchParams(searchParams);
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div className="shop-controls-right">
            <form className="shop-search" onSubmit={handleSearch} aria-label="Search products">
              <input
                type="text"
                placeholder="Search by name, category..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Search">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>

            <label className="shop-sort">
              <span className="shop-sort-label">Sort</span>
              <select
                value={sort}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === 'newest') searchParams.delete('sort');
                  else searchParams.set('sort', next);
                  setSearchParams(searchParams);
                }}
                aria-label="Sort products"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="shop-sort-caret">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="page-loader">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <EmptyState
            title="Can’t load products right now"
            description={`${error}. If the server is offline, you can still browse the design pages (Our Story, Care Guide) and try again later.`}
            actions={
              <>
                <button className="btn-gold" onClick={fetchProducts}>
                  Try Again
                </button>
              </>
            }
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try removing filters, clearing search, or switching category."
            actions={
              <>
                <button
                  className="btn-ghost"
                  style={{ color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)' }}
                  onClick={() => {
                    searchParams.delete('q');
                    searchParams.delete('category');
                    setSearchInput('');
                    setSearchParams(searchParams);
                  }}
                >
                  Clear Filters
                </button>
              </>
            }
          />
        ) : (
          <>
            {available.length > 0 && (
              <div className="shop-grid">
                {available.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {soldOut.length > 0 && (
              <section className="shop-soldout-section">
                <div className="shop-soldout-header">
                  <h2 className="shop-soldout-title">Sold <em>Out</em></h2>
                  <p className="shop-soldout-sub">
                    These pieces are currently unavailable. Restocks are announced first to our newsletter.
                  </p>
                </div>
                <div className="shop-grid">
                  {soldOut.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
