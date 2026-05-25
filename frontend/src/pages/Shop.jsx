import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import PageHeader from '../components/ui/PageHeader';
import InfoTip from '../components/ui/InfoTip';
import EmptyState from '../components/ui/EmptyState';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('q') || '';
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
          subtitle="Use category filters and search to quickly find the right bag. Open any product to see full details and photos."
          right={<div className="shop-count">{products.length} Products</div>}
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

          <form className="shop-search" onSubmit={handleSearch} aria-label="Search products">
            <input
              type="text"
              placeholder="Search by name, category..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <InfoTip tip="Example: try searching “tote” or filter by category buttons." ariaLabel="Search help" />
            <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Search">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
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
          <div className="shop-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
