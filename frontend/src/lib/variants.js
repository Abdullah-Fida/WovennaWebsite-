// Shared variant logic.
//
// A variant is one buyable combination (colour × size). It may carry its own
// price and photo; anything it leaves unset falls back to the product. Older
// products stored variants with only { color, size, stock }, so every helper
// here tolerates missing fields rather than assuming the newer shape.

export function variantList(product) {
  return Array.isArray(product?.variants) ? product.variants : [];
}

export function hasVariants(product) {
  return variantList(product).length > 0;
}

export function variantLabel(v) {
  if (!v) return '';
  return [v.color, v.size].filter(Boolean).join(' / ');
}

export function variantKey(v) {
  return `${v?.color || ''}::${v?.size || ''}`;
}

export function variantPrice(product, v) {
  const p = Number(v?.price);
  return Number.isFinite(p) && p > 0 ? p : Number(product?.price) || 0;
}

export function variantOriginalPrice(product, v) {
  const p = Number(v?.originalPrice);
  if (Number.isFinite(p) && p > 0) return p;
  const base = Number(product?.originalPrice);
  return Number.isFinite(base) && base > 0 ? base : 0;
}

/** A variant's photo, falling back to the product's cover image. */
export function variantImage(product, v) {
  return v?.image || product?.images?.[0] || '';
}

export function variantStock(product, v) {
  if (v && Number.isFinite(Number(v.stock))) return Number(v.stock);
  return Number(product?.stock) || 0;
}

export function findVariant(product, { color = '', size = '' } = {}) {
  return variantList(product).find(
    (v) => (v.color || '') === (color || '') && (v.size || '') === (size || '')
  );
}

/** First variant with stock; falls back to the first defined variant. */
export function defaultVariant(product) {
  const list = variantList(product);
  if (list.length === 0) return null;
  return list.find((v) => variantStock(product, v) > 0) || list[0];
}

/** Lowest/highest buyable price, so cards can show "From Rs. X". */
export function priceRange(product) {
  const list = variantList(product);
  const base = Number(product?.price) || 0;
  if (list.length === 0) return { min: base, max: base };

  const prices = list.map((v) => variantPrice(product, v)).filter((n) => n > 0);
  if (prices.length === 0) return { min: base, max: base };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Total sellable units — used for the sold-out state on cards. */
export function totalStock(product) {
  const list = variantList(product);
  if (list.length === 0) return Number(product?.stock) || 0;
  return list.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}

/** Distinct colours/sizes in declaration order, for building selectors. */
export function variantAxes(product) {
  const list = variantList(product);
  const colors = [];
  const sizes = [];
  for (const v of list) {
    if (v.color && !colors.includes(v.color)) colors.push(v.color);
    if (v.size && !sizes.includes(v.size)) sizes.push(v.size);
  }
  return { colors, sizes };
}
