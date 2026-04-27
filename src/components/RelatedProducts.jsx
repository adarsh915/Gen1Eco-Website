import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaStar,
} from "react-icons/fa";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import CompactVariantSelector from "./CompactVariantSelector";

const IMG_BASE_URL = `${process.env.REACT_APP_API_URL}/uploads/products/`;

const toAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getVariantPricing = (variant = {}) => {
  const salePrice = toAmount(
    variant.sale_price
    ?? variant.selling_price
    ?? variant.final_price
  );
  const mrp = toAmount(
    variant.mrp
    ?? variant.price
    ?? variant.variant_price
    ?? variant.regular_price
    ?? variant.amount
  );
  const displayPrice = salePrice > 0 ? salePrice : mrp;
  const oldPrice = salePrice > 0 && mrp > salePrice ? mrp : 0;
  return { displayPrice, oldPrice };
};

const getProductRatingStars = (product) => Math.max(0, Math.min(5, Math.round(Number(product?.rating_stars ?? product?.rating ?? 0) || 0)));
const getProductReviewCount = (product) => Number(product?.review_count ?? product?.reviews ?? 0) || 0;

/* ─── Single Product Card (Consistency) ───────────────────────────────────────── */
const ProductCard = ({ product }) => {
  const [hovered, setHovered] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { toggleWishlist, isWishlisted, addToCart } = useCart();
  const productLink = `/${product.product_slug || product.slug}`;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const firstVariant = variants.length > 0 ? variants[0] : null;
  const activeVariant = selectedVariant || firstVariant;
  const wishlisted = isWishlisted(product.id, activeVariant?.id || null);
  const variantPrices = variants
    .map((variant) => getVariantPricing(variant).displayPrice)
    .filter((price) => price > 0);
  const hasVariantPriceRange = variantPrices.length > 0;
  const minVariantPrice = hasVariantPriceRange ? Math.min(...variantPrices) : 0;
  const maxVariantPrice = hasVariantPriceRange ? Math.max(...variantPrices) : 0;
  const selectedVariantStock = activeVariant?.stock ?? activeVariant?.variant_stock;
  const productStock = Number(product.stock ?? 0);
  const canAddToCart = Number(selectedVariantStock ?? productStock) > 0;

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
      selectedVariantPrice: activeVariant ? Number(getVariantPricing(activeVariant).displayPrice) || 0 : null,
    }, 1);
  };

  const productImg = product.product_image
    ? `${IMG_BASE_URL}${product.product_image}`
    : "https://via.placeholder.com/260x300?text=No+Image";

  const rawPrice = Number(product.price) || 0;
  const rawSalePrice = Number(product.sale_price) || 0;

  const displayPrice = rawSalePrice > 0 ? rawSalePrice : rawPrice;
  const displayOldPrice = rawSalePrice > 0 ? rawPrice : null;
  const { displayPrice: activeVariantPrice, oldPrice: activeVariantOldPrice } = getVariantPricing(activeVariant || {});

  const discountPerc = rawSalePrice > 0
    ? Math.round(((rawPrice - rawSalePrice) / rawPrice) * 100)
    : 0;

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
            alt={product.product_name || product.name}
            className={`fpc-img${hovered ? " fpc-img--zoom" : ""}`}
          />
        </Link>
        <ul className="fpc-badges">
          {discountPerc > 0 && <li className="fpc-badge">-{discountPerc}%</li>}
          {canAddToCart && <li className="fpc-badge">In Stock</li>}
        </ul>
        <ul className={`fpc-icons${hovered ? " fpc-icons--show" : ""}`}>
          <li>
            <button
              className="fpc-icon-btn"
              style={wishlisted ? { background: "#e53935", color: "#fff" } : {}}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist({
                  ...product,
                  selectedVariant: activeVariant,
                  selectedVariantId: activeVariant?.id || null,
                  selectedVariantName: activeVariant?.variant_name || null,
                  selectedVariantValue: activeVariant?.variant_value || null,
                  selectedVariantPrice: activeVariant ? Number(getVariantPricing(activeVariant).displayPrice) || 0 : null,
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
            {product.product_name || product.name}
          </Link>
        </h3>
        <p className="fpc-price">
          <Link to={productLink} style={{ color: "inherit", textDecoration: "none" }}>
            {hasVariantPriceRange && maxVariantPrice > minVariantPrice ? (
              maxVariantPrice > minVariantPrice
                ? `₹${minVariantPrice.toFixed(2)} - ₹${maxVariantPrice.toFixed(2)}`
                : `₹${minVariantPrice.toFixed(2)}`
            ) : (
              <>
                ₹{(activeVariant ? activeVariantPrice : displayPrice).toFixed(2)}&nbsp;&nbsp;
                {(activeVariant
                  ? activeVariantOldPrice > 0
                  : Number(displayOldPrice || 0) > 0) && (
                  <del>
                    ₹{(activeVariant ? activeVariantOldPrice : Number(displayOldPrice || 0)).toFixed(2)}
                  </del>
                )}
              </>
            )}
          </Link>
        </p>
        <div className="fpc-stars">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} size={14} color={i < getProductRatingStars(product) ? "#f5a623" : "#ddd"} />
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

const RelatedProducts = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchRelatedProducts();
    }
  }, [productId]);

  const fetchRelatedProducts = async () => {
    try {
      const response = await api.get(`/users/products/related/${productId}`);
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (err) {
      console.error("Failed to fetch related products:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="rp-section">
      <div className="rp-container">
        <div className="rp-header">
          <h3 className="rp-title">Related Products</h3>
        </div>
        <div className="rp-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      <style>{`
        .rp-section {
          padding: 60px 0;
          background: #fff;
          border-top: 1px solid #eee;
        }
        .rp-container {
          max-width: 1415px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .rp-header {
          margin-bottom: 30px;
          text-align: left;
        }
        .rp-title {
          font-size: 28px;
          font-weight: 700;
          color: #222;
        }
        .rp-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
          align-items: stretch;
        }

        .fpc-card {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          text-decoration: none;
          height: 100%;
          width: 100%;
          min-width: 0;
          cursor: pointer;
        }
        .fpc-card--hovered {
          border-color: transparent;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .fpc-img-wrap {
          background: #f5f6f8;
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .fpc-img { max-height: 100%; max-width: 100%; object-fit: contain; mix-blend-mode: multiply; transition: transform 0.4s ease; }
        .fpc-img--zoom { transform: scale(1.07); }
        .fpc-badges { position: absolute; top: 9px; left: 9px; list-style: none; padding: 0; display: flex; flex-direction: column; gap: 5px; }
        .fpc-badge { background: rgba(39, 88, 184, 1); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
        .fpc-icons { position: absolute; top: 10px; right: 10px; list-style: none; padding: 0; opacity: 1; transition: opacity 0.3s; }
        .fpc-icon-btn { width: 34px; height: 34px; border-radius: 50%; border: none; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 5px; cursor: pointer; }
        .fpc-info { padding-top: 15px; flex: 1; display: flex; flex-direction: column; }
        .fpc-name { font-size: 16px; font-weight: 700; color: #333; text-decoration: none; display: block; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
        .fpc-price { font-size: 15px; font-weight: 700; color: #111; margin: 0; flex-shrink: 0; }
        .fpc-stars { display: flex; align-items: center; gap: 4px; margin-top: 5px; flex-shrink: 0; }
        .fpc-reviews { font-size: 12px; color: #777; margin-left: 5px; }
        .fpc-actions { margin-top: auto; padding-top: 10px; }
        .fpc-add-btn { width: 100%; border: none; border-radius: 8px; padding: 10px 12px; font-size: 14px; font-weight: 700; background: #111; color: #fff; transition: background 0.2s; }
        .fpc-add-btn:hover { background: #2a2a2a; }

        @media (max-width: 1024px) {
          .rp-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .rp-section { padding: 50px 0; }
          .rp-title { font-size: 24px; }
          .fpc-card { padding: 12px; }
          .fpc-img-wrap { height: 240px; }
          .fpc-name { font-size: 14px; }
          .fpc-add-btn { font-size: 13px; padding: 9px 10px; }
        }
        @media (max-width: 768px) {
          .rp-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .rp-section { padding: 40px 0; }
          .fpc-badge {font-size: 6px;}
        }
        @media (max-width: 480px) {
          .rp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .fpc-img-wrap { height: 190px; }
          .fpc-card { padding: 8px; border-radius: 12px; }
          .fpc-name { font-size: 13px; margin-bottom: 4px; }
          .fpc-price { font-size: 14px; }
          .rp-container { padding: 0 10px; }
           .fpc-badge {font-size: 6px;}
        }
      `}</style>
    </section>
  );
};

export default RelatedProducts;

