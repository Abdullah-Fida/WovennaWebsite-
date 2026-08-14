import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

const CATEGORIES = ['All', 'Tote', 'Crossbody'];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      setError('');
      const query = [];
      if (category) query.push(`category=${encodeURIComponent(category)}`);
      if (search) query.push(`q=${encodeURIComponent(search)}`);
      // The server returns them in the order set in the admin panel, so the
      // arrangement here is a merchandising decision rather than a shopper one.
      setProducts(await getProducts(query.join('&')));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput) searchParams.set('q', searchInput);
    else searchParams.delete('q');
    setSearchParams(searchParams);
  };

  // Sold-out pieces sit below the buyable range so the top of the page is
  // always shoppable.
  const isSoldOut = (p) => p.stock === 0 || p.showInSoldOutRow;
  const available = products.filter((p) => !isSoldOut(p));
  const soldOut = products.filter(isSoldOut);

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Shop' }]}
          eyebrow="Our Collection"
          title={<>The <em>Complete</em> Range</>}
        />

        <div className="shop-controls reveal visible" style={{ marginBottom: 34 }}>
          <div className="shop-categories">
            {CATEGORIES.map((c) => {
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
            <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Search">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner"></div></div>
        ) : error ? (
          <EmptyState
            title="Can’t load products right now"
            description={error}
            actions={<button className="btn-gold" onClick={fetchProducts}>Try Again</button>}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try removing filters, clearing search, or switching category."
            actions={
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
            }
          />
        ) : (
          <>
            {available.length > 0 && (
              <div className="shop-grid">
                {available.map((product, i) => (
                  <ProductCard key={product._id} product={product} priority={i < 3} />
                ))}
              </div>
            )}

            {soldOut.length > 0 && (
              <section className="shop-soldout-section">
                <div className="shop-soldout-header">
                  <h2 className="shop-soldout-title">Sold <em>Out</em></h2>
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
