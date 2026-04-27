import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaStar } from "react-icons/fa";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import CompactVariantSelector from "./CompactVariantSelector";

const IMG_BASE_URL = process.env.REACT_APP_API_URL;
const IMG_PRODUCTS_URL = `${process.env.REACT_APP_API_URL}/uploads/products/`;
const IMG_BANNER_URL = `${process.env.REACT_APP_API_URL}/uploads/banner/`;

const toAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseRangeFromString = (value) => {
  const source = String(value ?? "");
  const parts = source.match(/[0-9]+(?:\.[0-9]+)?/g);
  if (!parts || parts.length === 0) return { min: 0, max: 0 };
  const numbers = parts.map((part) => toAmount(part)).filter((num) => num > 0);
  if (numbers.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
};

const extractVariants = (product) => {
  const rawVariants = product?.variants
    || product?.product_variants
    || product?.variant_options
    || product?.productVariants
    || product?.variations
    || product?.product_variation
    || [];
  const parsedVariants = typeof rawVariants === "string"
    ? (() => {
      try {
        const json = JSON.parse(rawVariants);
        return Array.isArray(json) ? json : [];
      } catch {
        return [];
      }
    })()
    : (Array.isArray(rawVariants) ? rawVariants : []);

  return parsedVariants.map((variant, index) => {
    const variantSalePrice = toAmount(
      variant.sale_price
      ?? variant.selling_price
      ?? variant.final_price
    );
    const variantMrp = toAmount(
      variant.mrp
      ?? variant.price
      ?? variant.variant_price
      ?? variant.regular_price
      ?? variant.amount
    );
    const variantDisplayPrice = variantSalePrice > 0 ? variantSalePrice : variantMrp;
    const variantOldPrice = variantSalePrice > 0 && variantMrp > variantSalePrice ? variantMrp : 0;

    return {
      id: variant.id || variant.variant_id || variant.product_variant_id || variant.variantId || `${product?.id || product?._id || "product"}-variant-${index}`,
      variant_name: variant.variant_name || variant.name || variant.option_name || variant.attribute_name || variant.type || "Variant",
      variant_value: variant.variant_value || variant.value || variant.option_value || variant.attribute_value || variant.option || variant.size || variant.color || "",
      price: variantDisplayPrice,
      sale_price: variantSalePrice,
      mrp: variantMrp,
      oldPrice: variantOldPrice,
      stock: variant.stock ?? variant.variant_stock,
    };
  });
};

const getFallbackVariant = (product) => {
  const variantId = product?.selectedVariantId
    || product?.selected_variant_id
    || product?.variant_id
    || product?.product_variant_id
    || product?.default_variant_id
    || null;
  const variantName = product?.selectedVariantName
    || product?.selected_variant_name
    || product?.variant_name
    || product?.option_name
    || product?.attribute_name
    || product?.type
    || "";
  const variantValue = product?.selectedVariantValue
    || product?.selected_variant_value
    || product?.variant_value
    || product?.option_value
    || product?.attribute_value
    || product?.option
    || product?.size
    || product?.color
    || "";
  const variantPrice = toAmount(
    product?.selected_variant_sale_price
    ?? product?.variant_sale_price
    ?? product?.selectedVariantPrice
    ?? product?.selected_variant_price
    ?? product?.variant_price
    ?? product?.selling_price
    ?? product?.sale_price
  );

  const hasVariantSignal = Boolean(variantId || variantName || variantValue || variantPrice > 0);
  if (!hasVariantSignal) return null;

  return {
    id: variantId,
    variant_name: variantName || "Variant",
    variant_value: variantValue,
    price: variantPrice,
    stock: product?.variant_stock ?? product?.stock,
  };
};

const getProductRatingStars = (product) => Math.max(0, Math.min(5, Math.round(Number(product?.rating_stars ?? product?.rating ?? 0) || 0)));
const getProductReviewCount = (product) => Number(product?.review_count ?? product?.reviews ?? 0) || 0;

const ProductCard = ({ product }) => {
  const [hovered, setHovered] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { toggleWishlist, isWishlisted, addToCart } = useCart();

  const productLink = `/${product.slug || product.product_slug}`;
  const variants = extractVariants(product);
  const firstVariant = variants.length > 0 ? variants[0] : getFallbackVariant(product);
  const activeVariant = selectedVariant || firstVariant;
  const wishlisted = isWishlisted(product.id, activeVariant?.id || null);
  const variantPrices = variants.map((variant) => toAmount(variant.price)).filter((price) => price > 0);
  const hasVariantPriceRange = variantPrices.length > 0;
  const stringRange = parseRangeFromString(
    product.priceRange
    ?? product.price_range
    ?? product.variantPriceRange
    ?? product.variant_price_range
  );
  const minVariantPrice = hasVariantPriceRange
    ? Math.min(...variantPrices)
    : (toAmount(product.variantMinPrice) || stringRange.min);
  const maxVariantPrice = hasVariantPriceRange
    ? Math.max(...variantPrices)
    : (toAmount(product.variantMaxPrice) || stringRange.max);
  const hasRange = maxVariantPrice > 0;
  const activeVariantPrice = Number(activeVariant?.price) || 0;
  const activeVariantOldPrice = Number(activeVariant?.oldPrice) || 0;
  const canAddToCart = Number(activeVariant?.stock ?? product.stock ?? 0) > 0;

  useEffect(() => {
    setSelectedVariant(firstVariant || null);
  }, [product.id, firstVariant?.id]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAddToCart) return;

    addToCart({
      ...product,
      selectedVariant: activeVariant,
      selectedVariantId: activeVariant?.id || null,
      selectedVariantName: activeVariant?.variant_name || null,
      selectedVariantValue: activeVariant?.variant_value || null,
      selectedVariantPrice: activeVariant
        ? Number(activeVariant.sale_price ?? activeVariant.selling_price ?? activeVariant.final_price ?? activeVariant.price) || 0
        : null,
    }, 1);
  };

  const productImg = product.image || "https://via.placeholder.com/260x300?text=No+Image";

  return (
    <div
      className={`fpc-card${hovered ? " fpc-card--hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "default" }}
    >
      <div className="fpc-img-wrap">
        <Link to={productLink} style={{ display: "block" }}>
          <img
            src={productImg}
            alt={product.name}
            className={`fpc-img${hovered ? " fpc-img--zoom" : ""}`}
            onError={(e) => {
              e.target.src = "/images/placeholder.jpg";
            }}
          />
        </Link>

        <ul className="fpc-badges">
          {product.discount > 0 && <li className="fpc-badge">-{product.discount}%</li>}
          {canAddToCart && <li className="fpc-badge">In Stock</li>}
        </ul>

        <ul className={`fpc-icons${hovered ? " fpc-icons--show" : ""}`}>
          <li>
            <button
              className="fpc-icon-btn"
              style={wishlisted ? { background: "#e53935", color: "#fff" } : {}}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleWishlist({
                  ...product,
                  selectedVariant: activeVariant,
                  selectedVariantId: activeVariant?.id || null,
                  selectedVariantName: activeVariant?.variant_name || null,
                  selectedVariantValue: activeVariant?.variant_value || null,
                  selectedVariantPrice: activeVariant
                    ? Number(activeVariant.sale_price ?? activeVariant.selling_price ?? activeVariant.final_price ?? activeVariant.price) || 0
                    : null,
                });
              }}
              title="Wishlist"
            >
              <FaHeart size={13} />
            </button>
          </li>
        </ul>
      </div>

      <div className="fpc-info">
        <h3 className="fpc-name">
          <Link to={productLink} style={{ color: "inherit", textDecoration: "none" }}>
            {product.name}
          </Link>
        </h3>
        <p className="fpc-price">
          <Link to={productLink} style={{ color: "inherit", textDecoration: "none" }}>
            {hasRange && maxVariantPrice > minVariantPrice ? (
              maxVariantPrice > minVariantPrice
                ? `₹${minVariantPrice.toFixed(2)} - ₹${maxVariantPrice.toFixed(2)}`
                : `₹${minVariantPrice.toFixed(2)}`
            ) : (
              <>
                ₹{(activeVariant ? activeVariantPrice : Number(product.price || 0)).toFixed(2)}&nbsp;&nbsp;
                {(activeVariant
                  ? activeVariantOldPrice > 0
                  : Number(product.oldPrice || 0) > 0) && (
                    <del>
                      ₹{(activeVariant ? activeVariantOldPrice : Number(product.oldPrice || 0)).toFixed(2)}
                    </del>
                  )}
              </>
            )}
          </Link>
        </p>
        <div className="fpc-stars">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} size={16} color={i < getProductRatingStars(product) ? "#ffc107" : "#ddd"} />
          ))}
          <span className="fpc-reviews">({getProductReviewCount(product)} Reviews)</span>
        </div>
        <CompactVariantSelector
          variants={variants}
          selectedVariantId={activeVariant?.id || null}
          onSelectVariant={setSelectedVariant}
        />
        <div className="fpc-actions">
          <button
            type="button"
            className="fpc-add-btn"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
          >
            {canAddToCart ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Added: banner state (same as old code)
  const [banner, setBanner] = useState(null);

  const getBannerImageUrl = (fileName) => (
    fileName ? `${IMG_BANNER_URL}${fileName}` : "../images/banner_GEN-1.jpg"
  );

  useEffect(() => {
    api.get("/users/featured")
      .then((res) => {
        if (res.data.success && res.data.products.length > 0) {
          const mapped = res.data.products.map((p) => {
            const rawPrice = Number(p.price) || 0;
            const salePrice = Number(p.sale_price) || 0;
            const discountPerc = Number(p.discount) > 0
              ? Number(p.discount)
              : (rawPrice > 0 && salePrice > 0 && rawPrice > salePrice)
                ? Math.round(((rawPrice - salePrice) / rawPrice) * 100)
                : 0;

            return {
              ...p,
              id: p.id,
              name: p.product_name || p.name || "Product",
              price: salePrice > 0 ? salePrice : rawPrice,
              oldPrice: salePrice > 0 ? rawPrice : null,
              discount: discountPerc,
              image: p.product_image ? `${IMG_PRODUCTS_URL}${p.product_image}` : p.image || "/images/placeholder.jpg",
              inStock: Number(p.stock) > 0 || Number(p.status) === 1,
              stock: Number(p.stock) || 0,
              rating_stars: Number(p.rating_stars ?? p.rating) || 0,
              review_count: Number(p.review_count ?? p.reviews) || 0,
              rating: Number(p.rating_stars ?? p.rating) || 0,
              reviews: Number(p.review_count ?? p.reviews) || 0,
              slug: p.product_slug || p.slug,
              variants: extractVariants(p),
              priceRange: p.priceRange || p.price_range,
              variantMinPrice: p.variantMinPrice,
              variantMaxPrice: p.variantMaxPrice,
              selectedVariantId: p.selected_variant_id ?? p.variant_id ?? p.product_variant_id ?? p.default_variant_id ?? null,
              selectedVariantName: p.selected_variant_name ?? p.variant_name ?? p.option_name ?? p.attribute_name ?? p.type ?? null,
              selectedVariantValue: p.selected_variant_value ?? p.variant_value ?? p.option_value ?? p.attribute_value ?? p.option ?? p.size ?? p.color ?? null,
              selectedVariantPrice: toAmount(p.selected_variant_sale_price ?? p.selected_variant_price ?? p.variant_sale_price ?? p.variant_price ?? p.selling_price),
            };
          });
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch featured products:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Added: fetch banner (same as old code)
  useEffect(() => {
    api.get('/single-banner/api')
      .then(res => {
        if (res.data.success) setBanner(res.data.data);
      })
      .catch(err => console.error('Banner Error:', err.message));
  }, []);

  return (
    <>
      <style>{`
        .fp-section {
          padding: 60px 0;
          background: #fff;
          overflow: hidden;
        }

        .fpc-card {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 16px;
          padding: 14px;
          cursor: pointer;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          box-sizing: border-box;
        }
        .fpc-card--hovered {
          border-color: transparent;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        .fpc-img-wrap {
          background: #f5f6f8;
          position: relative;
          overflow: hidden;
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .fpc-img {
          max-height: 270px;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.4s ease;
          mix-blend-mode: multiply;
        }
        .fpc-img--zoom { transform: scale(1.07); }

        .fpc-badges {
          position: absolute;
          top: 9px; left: 9px;
          list-style: none;
          padding: 0; margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 3;
        }
        .fpc-badge {
          background: rgba(39, 88, 184, 1);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          padding: 5px 14px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .fpc-icons {
          position: absolute;
          top: 14px;
          right: 14px;
          list-style: none;
          padding: 0; margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          opacity: 1;
          transition: opacity 0.3s ease, top 0.3s ease;
          z-index: 4;
        }

        .fpc-actions {
          margin-top: auto;
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fpc-add-btn {
          width: 100%;
          border: none;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          font-weight: 700;
          background: #111;
          color: #fff;
          transition: background 0.2s ease, opacity 0.2s ease;
          cursor: pointer;
        }
        .fpc-add-btn:hover:not(:disabled) { background: #2a2a2a; }
        .fpc-add-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .fpc-icon-btn {
          width: 38px; height: 38px;
          border-radius: 50%;
          border: none;
          background: #fff;
          color: #333;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.13);
          transition: background 0.2s, color 0.2s;
        }
        .fpc-icon-btn:hover { background: #111; color: #fff; }

        .fpc-info {
          padding: 16px 4px 0;
          flex: 1;
          text-align: left;
          display: flex;
          flex-direction: column;
        }
        .fpc-name {
          display: block;
          font-size: 17px;
          font-weight: 700;
          color: #2b3035;
          text-decoration: none;
          margin-bottom: 8px;
          transition: color 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
        }
        .fpc-name:hover { color: #AB9774; }

        .fpc-price {
          font-size: 16px;
          font-weight: 600;
          color: #0d2c17;
          margin: 0 0 10px;
          flex-shrink: 0;
        }
        .fpc-price del {
          font-size: 14px;
          font-weight: 400;
          color: #8c8c8c;
          margin-left: 6px;
        }

        .fpc-stars {
          display: flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
        }
        .fpc-reviews {
          font-size: 13px;
          color: #777;
          margin-left: 6px;
        }

        /* ── Wrapper ── */
        .fp-container {
          width: 100%;
          max-width: 1415px;
          margin: 0 auto;
          padding: 0 20px;
          box-sizing: border-box;
        }

        .fp-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .fp-title {
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 700;
          color: #222;
          margin: 0;
          line-height: 1.1;
        }

        /* ── Row layout (banner + grid) ── */
        .fp-row {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          align-items: stretch;
        }

        /* ── LEFT BANNER (~33%) ── */
        .fp-banner-col {
          flex: 0 0 calc(33.333% - 16px);
          max-width: calc(33.333% - 16px);
          display: flex;
        }

        .fp-banner {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          width: 100%;
          min-height: 520px;
          background: #000;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 40px 30px;
          box-sizing: border-box;
        }
        .fp-banner-img {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          z-index: 0;
          opacity: 0.9;
        }
        .fp-banner-picture {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }
        .fp-banner-picture img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .fp-banner-content {
          position: relative;
          z-index: 2;
        }
        .fp-banner-content h6 {
          font-size: 14px;
          font-weight: 400;
          color: rgba(255,255,255,0.8);
          margin: 0 0 8px;
        }
        .fp-banner-content h2 {
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 24px;
          letter-spacing: 0.5px;
        }
        .fp-banner-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 12px 28px;
          background: #b19361;
          color: #fff;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.3s;
        }
        .fp-banner-btn:hover {
          background: #8b7355;
          color: #fff;
        }

        /* ── RIGHT GRID (~67%) ── */
        .fp-grid-col {
          flex: 0 0 calc(66.666% - 8px);
          max-width: calc(66.666% - 8px);
        }

        .fp-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          align-items: stretch;
          width: 100%;
        }

        .fp-loading {
          text-align: center;
          padding: 20px 0;
          color: #555;
        }

        /* ── Skeleton ── */
        .fp-skeleton-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          height: 100%;
        }
        .fp-skeleton-card {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 12px;
          min-height: 400px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 834px) {
          .fp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
          .fp-skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .fpc-img-wrap { height: 190px; }
          .fp-section { padding: 40px 0; }
          .fp-banner { min-height: 560px; }
        }
        @media (max-width: 1024px) {
          .fp-banner-col,
          .fp-grid-col {
            flex: 0 0 100%;
            max-width: 100%;
          }
          .fp-banner { min-height: 560px; }
          .fp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
          .fp-skeleton-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
          .fp-section { padding: 40px 0; }
          .fpc-img-wrap { height: 240px; }
          .fpc-card { padding: 12px; }
          .fpc-name { font-size: 14px; }
          .fpc-price { font-size: 14px; }
          .fpc-add-btn { padding: 9px 10px; font-size: 13px; }
        }
        @media (max-width: 767px) {
          .fpc-badge { font-size: 6px; padding: 4px 10px; }
          .fpc-icon-btn { width: 34px; height: 34px; }
        }
        @media (max-width: 480px) {
          .fp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .fp-skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .fpc-img-wrap { height: 190px; }
          .fpc-card { padding: 10px; border-radius: 12px; }
          .fpc-info { padding: 10px 2px 4px; }
          .fpc-name { font-size: 13px; margin-bottom: 4px; }
          .fpc-price { font-size: 14px; margin-bottom: 6px; }
          .fp-banner { min-height: 280px; }
          .fp-container { padding: 0 10px; }
        }
      `}</style>

      <section className="fp-section">
        <div className="fp-container">
          <div className="fp-header">
            <h2 className="fp-title">Featured Products</h2>
            <Link
              to="/products"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: "500", color: "#1a1a1a", textDecoration: "none", paddingBottom: "2px", borderBottom: "1.5px solid #1a1a1a", transition: "color 0.2s, border-color 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#b5956a"; e.currentTarget.style.borderColor = "#b5956a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#1a1a1a"; e.currentTarget.style.borderColor = "#1a1a1a"; }}
            >
              View All
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 8 16 12 12 16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </Link>
          </div>

          <div className="fp-row">
            {/* ── LEFT BANNER (from old code) ── */}
            <div className="fp-banner-col">
              <div className="fp-banner">
                <picture className="fp-banner-picture">
                  <source media="(max-width: 767px)" srcSet={getBannerImageUrl(banner?.mobile_image || banner?.image)} />
                  <source media="(max-width: 1024px)" srcSet={getBannerImageUrl(banner?.tablet_image || banner?.image)} />
                  <img
                    className="fp-banner-img"
                    src={getBannerImageUrl(banner?.image)}
                    alt={banner?.title_big || 'Banner'}
                    onError={(e) => { e.currentTarget.src = '../images/banner_GEN-1.jpg'; }}
                  />
                </picture>
                <div className="fp-banner-content">
                  <h6>{banner?.title_small || 'Cleaning Items'}</h6>
                  <h2>{banner?.title_big || 'Gen-1 Eco'}</h2>
                  <Link className="fp-banner-btn" to="/products">
                    {banner?.button_text || 'Shop Now'}
                  </Link>
                </div>
              </div>
            </div>

            {/* ── RIGHT GRID ── */}
            <div className="fp-grid-col">
              {loading ? (
                <div className="fp-skeleton-grid">
                  {[1, 2, 3, 4].map(i => <div key={i} className="fp-skeleton-card" />)}
                </div>
              ) : (
                <div className="fp-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default FeaturedProducts;
