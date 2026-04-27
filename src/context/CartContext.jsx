import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import api from "../api/axios";
import { toast } from 'react-toastify';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const prevUserRef = useRef(undefined);
  const isRehydratingRef = useRef(false);
  const reconcileVersionRef = useRef(0);

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // No longer needed: LoginRequiredPopup state removed in favor of toasts

  // Refs to hold latest cart/wishlist values for use inside flushToServer
  const cartRef = useRef([]);
  const wishlistRef = useRef([]);

  // These refs track the last stringified version of what we know is on the server.
  // We only sync if the current local state DIFFERENT from these.
  const lastSyncedCart = useRef(null);
  const lastSyncedWishlist = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { wishlistRef.current = wishlist; }, [wishlist]);

  // Debounce timers
  const cartTimer = useRef(null);
  const wishlistTimer = useRef(null);

  const getVariantIdFromItem = useCallback((item) => (
    item?.selectedVariantId
    || item?.selected_variant_id
    || item?.variant_id
    || item?.variantId
    || item?.selectedVariant?.id
    || item?.selected_variant?.id
    || null
  ), []);

  const getVariantInfoFromItem = useCallback((item) => {
    const sourceVariant = item?.selectedVariant || item?.selected_variant || null;
    const variantId = getVariantIdFromItem(item);
    const variantName = sourceVariant?.variant_name || sourceVariant?.name || sourceVariant?.option_name || item?.selectedVariantName || item?.selected_variant_name || item?.variant_name || "";
    const variantValue = sourceVariant?.variant_value || sourceVariant?.value || sourceVariant?.option_value || item?.selectedVariantValue || item?.selected_variant_value || item?.variant_value || "";
    const variantSalePrice = Number((sourceVariant?.sale_price ?? sourceVariant?.selling_price ?? sourceVariant?.final_price) || 0);
    const variantMrp = Number((sourceVariant?.mrp ?? sourceVariant?.price ?? sourceVariant?.variant_price ?? item?.variant_price ?? item?.selectedVariantPrice ?? item?.selected_variant_price) || 0);
    const variantPrice = variantSalePrice > 0 ? variantSalePrice : variantMrp;

    if (!variantId) {
      return null;
    }

    return {
      id: variantId,
      variant_name: variantName,
      variant_value: variantValue,
      price: variantPrice,
      sale_price: variantSalePrice,
      mrp: variantMrp,
      stock: sourceVariant?.stock ?? sourceVariant?.variant_stock,
    };
  }, [getVariantIdFromItem]);

  const readStoredArray = useCallback((key) => {
    try {
      const rawValue = localStorage.getItem(key);
      const parsedValue = rawValue ? JSON.parse(rawValue) : [];
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch (err) {
      console.warn(`[CartContext] Failed to read ${key} from storage:`, err);
      return [];
    }
  }, []);

  const hasStoredKey = useCallback((key) => {
    try {
      return localStorage.getItem(key) !== null;
    } catch (err) {
      console.warn(`[CartContext] Failed to check ${key} existence:`, err);
      return false;
    }
  }, []);

  const normalizeCartItems = useCallback((items) => {
    if (!Array.isArray(items)) return [];

    return items
      .filter(Boolean)
      .map((item) => {
        const baseProductId = item.productId || item.id || item._id;
        const variantId = getVariantIdFromItem(item) || "base";
        const cartItemId = item.cartItemId || `${baseProductId}-${variantId}`;
        const parsedQty = Number(item.qty);
        const normalizedQty = Number.isFinite(parsedQty) && parsedQty > 0
          ? Math.max(1, Math.floor(parsedQty))
          : 1;

        return {
          ...item,
          id: baseProductId,
          productId: baseProductId,
          cartItemId,
          qty: normalizedQty,
        };
      });
  }, [getVariantIdFromItem]);

  const getUserMergeKey = useCallback((currentUser) => {
    if (!currentUser) return "guest";
    return String(
      currentUser.id
      || currentUser._id
      || currentUser.user_id
      || currentUser.email
      || "user"
    );
  }, []);

  const getGuestCartSignature = useCallback((items) => {
    const normalized = normalizeCartItems(items)
      .map((item) => ({
        cartItemId: item.cartItemId,
        qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
      }))
      .sort((a, b) => a.cartItemId.localeCompare(b.cartItemId));

    return JSON.stringify(normalized);
  }, [normalizeCartItems]);

  const hasCartCoverage = useCallback((baseItems, compareItems) => {
    const baseMap = normalizeCartItems(baseItems).reduce((acc, item) => {
      acc.set(item.cartItemId, (acc.get(item.cartItemId) || 0) + Math.max(1, Math.floor(Number(item.qty) || 1)));
      return acc;
    }, new Map());

    const compareMap = normalizeCartItems(compareItems).reduce((acc, item) => {
      acc.set(item.cartItemId, (acc.get(item.cartItemId) || 0) + Math.max(1, Math.floor(Number(item.qty) || 1)));
      return acc;
    }, new Map());

    for (const [cartItemId, qty] of compareMap.entries()) {
      if ((baseMap.get(cartItemId) || 0) < qty) {
        return false;
      }
    }

    return true;
  }, [normalizeCartItems]);

  const applyGuestCartUpdates = useCallback((baseItems, currentGuestItems, previousGuestItems = []) => {
    const normalizedBaseItems = normalizeCartItems(baseItems);
    const normalizedCurrentGuestItems = normalizeCartItems(currentGuestItems);
    const normalizedPreviousGuestItems = normalizeCartItems(previousGuestItems);

    const baseMap = new Map(normalizedBaseItems.map((item) => [item.cartItemId, item]));
    const currentGuestMap = new Map(normalizedCurrentGuestItems.map((item) => [item.cartItemId, item]));
    const previousGuestMap = new Map(normalizedPreviousGuestItems.map((item) => [item.cartItemId, item]));

    const changedIds = new Set();

    for (const [cartItemId, currentItem] of currentGuestMap.entries()) {
      const previousItem = previousGuestMap.get(cartItemId);
      if (!previousItem || Number(previousItem.qty) !== Number(currentItem.qty)) {
        changedIds.add(cartItemId);
      }
    }

    for (const cartItemId of previousGuestMap.keys()) {
      if (!currentGuestMap.has(cartItemId)) {
        changedIds.add(cartItemId);
      }
    }

    if (changedIds.size === 0) {
      return normalizedBaseItems;
    }

    const nextMap = new Map(baseMap);

    for (const cartItemId of changedIds) {
      const currentGuestItem = currentGuestMap.get(cartItemId);

      if (currentGuestItem) {
        const existingItem = nextMap.get(cartItemId);
        nextMap.set(cartItemId, {
          ...(existingItem || {}),
          ...currentGuestItem,
          qty: Math.max(1, Math.floor(Number(currentGuestItem.qty) || 1)),
        });
      } else {
        nextMap.delete(cartItemId);
      }
    }

    return Array.from(nextMap.values());
  }, [normalizeCartItems]);

  // Helper to sync cart items with latest product data (price, tax, etc.)
  const refreshCartItems = useCallback(async (currentItems) => {
    if (!currentItems || currentItems.length === 0) return currentItems;
    try {
      const res = await api.get("/users/products");
      if (res.data.success) {
        const latestProducts = res.data.products;
        return currentItems.map(item => {
          const baseProductId = item.productId || item.id;
          const latest = latestProducts.find(p => p.id === baseProductId);
          const existingVariant = getVariantInfoFromItem(item);

          if (latest) {
            const selectedVariantId = existingVariant?.id || null;
            const latestVariant = selectedVariantId
              ? (latest.variants || []).find(v => String(v.id) === String(selectedVariantId))
              : null;
            const resolvedVariant = latestVariant || existingVariant || null;
            const normalizedVariant = resolvedVariant
              ? {
                  id: resolvedVariant.id,
                  variant_name: resolvedVariant.variant_name || existingVariant?.variant_name || "",
                  variant_value: resolvedVariant.variant_value || existingVariant?.variant_value || "",
                  price: Number((resolvedVariant.sale_price ?? resolvedVariant.selling_price ?? resolvedVariant.final_price ?? resolvedVariant.price ?? existingVariant?.price) || 0),
                  sale_price: Number((resolvedVariant.sale_price ?? resolvedVariant.selling_price ?? resolvedVariant.final_price ?? existingVariant?.sale_price) || 0),
                  mrp: Number((resolvedVariant.mrp ?? resolvedVariant.price ?? resolvedVariant.variant_price ?? existingVariant?.mrp ?? existingVariant?.price) || 0),
                  stock: resolvedVariant.stock,
                }
              : null;

            return {
              ...item,
              price: normalizedVariant ? normalizedVariant.price : latest.price,
              sale_price: normalizedVariant ? 0 : latest.sale_price,
              gst_percent: latest.gst_percent,
              gst_id: latest.gst_id,
              discount_percent: normalizedVariant ? 0 : (latest.discount_percent || 0),
              product_name: latest.product_name || item.product_name,
              product_image: latest.product_image || item.product_image,
              selectedVariantId: normalizedVariant ? normalizedVariant.id : null,
              selectedVariant: normalizedVariant,
              selectedVariantName: normalizedVariant?.variant_name || null,
              selectedVariantValue: normalizedVariant?.variant_value || null,
              selectedVariantPrice: normalizedVariant ? Number(normalizedVariant.price) || 0 : null,
              variant_price: normalizedVariant ? normalizedVariant.price : null,
            };
          }

          if (existingVariant) {
            return {
              ...item,
              selectedVariantId: existingVariant.id,
              selectedVariant: existingVariant,
              selectedVariantName: existingVariant.variant_name || null,
              selectedVariantValue: existingVariant.variant_value || null,
              selectedVariantPrice: Number(existingVariant.price || 0),
              variant_price: Number(existingVariant.price || 0),
              sale_price: 0,
              discount_percent: 0,
            };
          }

          return item;
        });
      }
    } catch (err) {
      console.error("[CartContext] Failed to refresh cart items:", err);
    }
    return currentItems;
  }, [getVariantInfoFromItem]);

  // 1. Authentication & Initial Data Reconciliation
  useEffect(() => {
    if (authLoading) return;

    const reconcile = async () => {
      const currentVersion = ++reconcileVersionRef.current;
      const isStaleReconcile = () => currentVersion !== reconcileVersionRef.current;

      setIsInitialized(false);
      isRehydratingRef.current = true;

      if (cartTimer.current) clearTimeout(cartTimer.current);
      if (wishlistTimer.current) clearTimeout(wishlistTimer.current);

      const scopeChanged = prevUserRef.current !== user;
      if (scopeChanged) {
        setAppliedCoupon(null);
        lastSyncedCart.current = null;
        lastSyncedWishlist.current = null;
      }

      if (user) {
        console.log("[CartContext] AUTH: User logged in. Reconciling & Refreshing state...");
        
        const serverCart = Array.isArray(user.cart_data) ? user.cart_data : [];
        const serverWishlist = Array.isArray(user.wishlist_data) ? user.wishlist_data : [];
        const localCart = readStoredArray("cart");
        const guestCart = readStoredArray("guestCart");
        const localWishlist = readStoredArray("wishlist");
        const guestWishlist = readStoredArray("guestWishlist");
        const hasLocalCartSnapshot = hasStoredKey("cart");
        const hasLocalWishlistSnapshot = hasStoredKey("wishlist");

        const normalizedServerCart = normalizeCartItems(serverCart);
        const normalizedGuestCart = normalizeCartItems(guestCart);
        const normalizedLocalCart = normalizeCartItems(localCart);

        const userMergeKey = getUserMergeKey(user);
        const guestMergeKey = `guestCartMergedSignature:${userMergeKey}`;
        const guestMergeDataKey = `guestCartMergedData:${userMergeKey}`;
        const previousMergedGuestCart = readStoredArray(guestMergeDataKey);
        const previousGuestMergeSignature = localStorage.getItem(guestMergeKey) || "[]";
        const currentGuestSignature = getGuestCartSignature(normalizedGuestCart);

        // If we already have a local authenticated snapshot, trust it over stale profile payload.
        const baseAuthCart = hasLocalCartSnapshot
          ? normalizedLocalCart
          : normalizedServerCart;

        const authAlreadyContainsGuestCart = hasCartCoverage(baseAuthCart, normalizedGuestCart);
        const guestCartChanged = currentGuestSignature !== previousGuestMergeSignature;
        const shouldMergeGuestCart = guestCartChanged
          || (!hasLocalCartSnapshot && normalizedGuestCart.length > 0 && !authAlreadyContainsGuestCart);

        // Apply only guest cart deltas so unrelated authenticated items remain untouched.
        const mergedCart = shouldMergeGuestCart
          ? applyGuestCartUpdates(baseAuthCart, normalizedGuestCart, previousMergedGuestCart)
          : baseAuthCart;

        const initialWishlist = hasLocalWishlistSnapshot
          ? localWishlist
          : (serverWishlist.length > 0 ? serverWishlist : guestWishlist);

        if (isStaleReconcile()) return;

        setCart(mergedCart);
        setWishlist(initialWishlist);

        // Sync items with latest backend data
        const finalCart = await refreshCartItems(mergedCart);

        if (isStaleReconcile()) return;
        
        setCart(finalCart);
        setWishlist(initialWishlist);

        // Keep synced baselines anchored to server payload so guest merges trigger one sync.
        lastSyncedCart.current = JSON.stringify(normalizedServerCart);
        lastSyncedWishlist.current = JSON.stringify(serverWishlist);

        if (shouldMergeGuestCart) {
          localStorage.setItem(guestMergeKey, currentGuestSignature);
          localStorage.setItem(guestMergeDataKey, JSON.stringify(normalizedGuestCart));
        }

        // Keep guest cart/wishlist in storage so users can get their guest cart back after logout.
        
        isRehydratingRef.current = false;
        setIsInitialized(true);
      } else {
        console.log("[CartContext] AUTH: No user (Guest).");
        
        // For guest users, use guestCart from localStorage
        const guestCart = readStoredArray("guestCart");
        const guestWishlist = readStoredArray("guestWishlist");
        
        // Sync items with latest backend data (though unlikely for guests)
        const normalizedGuestCart = normalizeCartItems(guestCart);

        if (isStaleReconcile()) return;

        setCart(normalizedGuestCart);
        setWishlist(guestWishlist);

        const finalCart = await refreshCartItems(normalizedGuestCart);

        if (isStaleReconcile()) return;

        setCart(finalCart);

        lastSyncedCart.current = null;
        lastSyncedWishlist.current = null;
        
        isRehydratingRef.current = false;
        setIsInitialized(true);
      }
      prevUserRef.current = user;
    };

    reconcile();
  }, [
    user,
    authLoading,
    getGuestCartSignature,
    hasCartCoverage,
    hasStoredKey,
    getUserMergeKey,
    applyGuestCartUpdates,
    normalizeCartItems,
    refreshCartItems,
    readStoredArray,
  ]);

  // 2. Persist to LocalStorage (Always once initialized)
  useEffect(() => {
    if (isInitialized && !isRehydratingRef.current) {
      const cartKey = user ? "cart" : "guestCart";
      const wishlistKey = user ? "wishlist" : "guestWishlist";
      
      localStorage.setItem(cartKey, JSON.stringify(cart));
      localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    }
  }, [cart, wishlist, isInitialized, user]);

  // 3. Sync to Server (Debounced & Comparison-based)
  useEffect(() => {
    if (isInitialized && user && !isRehydratingRef.current) {
      const currentCartStr = JSON.stringify(cart);
      
      // Only sync if the local state has actually changed from what's on the server.
      if (currentCartStr === lastSyncedCart.current) {
        // console.log("[CartContext] Cart matches server. Skipping sync.");
        return;
      }

      if (cartTimer.current) clearTimeout(cartTimer.current);
      const cartPayload = cart;
      const cartPayloadStr = currentCartStr;
      cartTimer.current = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          console.log("[CartContext] Syncing cart to server...");
          const res = await api.post("/users/profile/cart", { cart: cartPayload }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            lastSyncedCart.current = cartPayloadStr;
            console.log("[CartContext] Server cart sync SUCCESS.");
          }
        } catch (err) {
          console.error("[CartContext] Server cart sync ERROR:", err.response?.data || err.message);
        }
      }, 2000); 
    }
  }, [cart, user, isInitialized]);

  useEffect(() => {
    if (isInitialized && user && !isRehydratingRef.current) {
      const currentWishlistStr = JSON.stringify(wishlist);
      
      if (currentWishlistStr === lastSyncedWishlist.current) {
        // console.log("[CartContext] Wishlist matches server. Skipping sync.");
        return;
      }

      if (wishlistTimer.current) clearTimeout(wishlistTimer.current);
      const wishlistPayload = wishlist;
      const wishlistPayloadStr = currentWishlistStr;
      wishlistTimer.current = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          console.log("[CartContext] Syncing wishlist to server...");
          const res = await api.post("/users/profile/wishlist", { wishlist: wishlistPayload }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            lastSyncedWishlist.current = wishlistPayloadStr;
            console.log("[CartContext] Server wishlist sync SUCCESS.");
          }
        } catch (err) {
          console.error("[CartContext] Server wishlist sync ERROR:", err.response?.data || err.message);
        }
      }, 2000);
    }
  }, [wishlist, user, isInitialized]);

  // 4. Immediate flush — called BEFORE logout to guarantee data is saved to server
  const flushToServer = async () => {
    // Cancel any pending debounce timers immediately
    if (cartTimer.current) clearTimeout(cartTimer.current);
    if (wishlistTimer.current) clearTimeout(wishlistTimer.current);

    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const currentCart = cartRef.current;
    const currentWishlist = wishlistRef.current;

    try {
      console.log("[CartContext] PRE-LOGOUT: Flushing cart to server...", currentCart);
      await api.post("/users/profile/cart", { cart: currentCart }, { headers });
      lastSyncedCart.current = JSON.stringify(currentCart);
      console.log("[CartContext] PRE-LOGOUT: Cart flushed OK.");
    } catch (err) {
      console.error("[CartContext] PRE-LOGOUT: Cart flush ERROR:", err.response?.data || err.message);
    }

    try {
      console.log("[CartContext] PRE-LOGOUT: Flushing wishlist to server...", currentWishlist);
      await api.post("/users/profile/wishlist", { wishlist: currentWishlist }, { headers });
      lastSyncedWishlist.current = JSON.stringify(currentWishlist);
      console.log("[CartContext] PRE-LOGOUT: Wishlist flushed OK.");
    } catch (err) {
      console.error("[CartContext] PRE-LOGOUT: Wishlist flush ERROR:", err.response?.data || err.message);
    }
  };

  const addToCart = (product, qty = 1) => {
    // Allow both authenticated and guest users to add to cart
    
    // Create a unique cart ID: productID-variantID (or "base" if no variant)
    const baseProductId = product.id || product._id;
    const sourceVariant = product.selectedVariant || product.selected_variant || null;
    const variantSalePrice = Number((
      sourceVariant?.sale_price
      ?? sourceVariant?.selling_price
      ?? sourceVariant?.final_price
      ?? product?.selectedVariantSalePrice
      ?? product?.selected_variant_sale_price
      ?? product?.variant_sale_price
    ) || 0);
    const variantMrp = Number((
      sourceVariant?.mrp
      ?? sourceVariant?.price
      ?? sourceVariant?.variant_price
      ?? sourceVariant?.regular_price
      ?? product?.selectedVariantMrp
      ?? product?.selected_variant_mrp
      ?? product?.variant_mrp
      ?? product?.selectedVariantPrice
      ?? product?.selected_variant_price
      ?? product?.variant_price
    ) || 0);
    const variantDisplayPrice = variantSalePrice > 0 ? variantSalePrice : variantMrp;
    const normalizedVariant = sourceVariant
      ? {
          id: sourceVariant.id || sourceVariant.variant_id || sourceVariant.product_variant_id || sourceVariant.variantId || product.selectedVariantId || product.selected_variant_id || null,
          variant_name: sourceVariant.variant_name || sourceVariant.name || sourceVariant.option_name || sourceVariant.attribute_name || sourceVariant.type || product.selectedVariantName || product.selected_variant_name || product.variant_name || "Variant",
          variant_value: sourceVariant.variant_value || sourceVariant.value || sourceVariant.option_value || sourceVariant.attribute_value || sourceVariant.option || sourceVariant.size || sourceVariant.color || product.selectedVariantValue || product.selected_variant_value || product.variant_value || "",
          price: variantDisplayPrice,
          sale_price: variantSalePrice,
          mrp: variantMrp,
          stock: sourceVariant.stock ?? sourceVariant.variant_stock,
        }
      : null;
    const variantId = normalizedVariant?.id || product.selectedVariantId || "base";
    const cartItemId = `${baseProductId}-${variantId}`;
    
    const alreadyInCart = cartRef.current.find(item => item.cartItemId === cartItemId);
    const normalizedQty = Math.max(1, Math.floor(Number(qty) || 1));
    const availableStock = Number(normalizedVariant?.stock ?? product?.stock ?? 0);
    const currentCartQty = alreadyInCart ? Number(alreadyInCart.qty) : 0;

    if (currentCartQty + normalizedQty > availableStock) {
      toast.error(`Cannot add more. Only ${availableStock} left in stock.`, { position: "top-right", autoClose: 3000 });
      return;
    }
    
    if (alreadyInCart) {
      toast.info("Updating cart item quantity", { position: "top-right", autoClose: 1000 });
      setCart((prev) => 
        prev.map(item => 
          item.cartItemId === cartItemId ? { ...item, qty: Number(item.qty || 0) + normalizedQty } : item
        )
      );
    } else {
      toast.success("Product added to cart!", { position: "top-right" });
      const resolvedImage = product.product_image || product.image || product.image_url || product.imageUrl || null;
      const newItem = { 
        ...product, 
        id: baseProductId, // Keep original ID for reference
        productId: baseProductId,
        product_image: product.product_image || resolvedImage,
        image: product.image || resolvedImage,
        selectedVariantId: normalizedVariant?.id || null,
        selectedVariant: normalizedVariant,
          selectedVariantName: normalizedVariant?.variant_name || null,
          selectedVariantValue: normalizedVariant?.variant_value || null,
          selectedVariantPrice: normalizedVariant ? Number(normalizedVariant.price) || 0 : null,
        variant_price: normalizedVariant ? normalizedVariant.price : null,
        cartItemId: cartItemId, 
        qty: normalizedQty 
      };
      setCart((prev) => [...prev, newItem]);
    }
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    toast.error("Removed from cart", { position: "top-right", autoClose: 2000 });
  };

  const updateQty = (cartItemId, qty) => {
    const parsedQty = Number(qty);
    const normalizedQty = Number.isFinite(parsedQty)
      ? Math.max(0, Math.floor(parsedQty))
      : 0;

    if (normalizedQty < 1) return removeFromCart(cartItemId);

    const itemToUpdate = cartRef.current.find(item => item.cartItemId === cartItemId);
    if (itemToUpdate) {
      const availableStock = Number(itemToUpdate.selectedVariant?.stock ?? itemToUpdate.stock ?? 0);
      if (normalizedQty > availableStock) {
        toast.error(`Cannot update. Only ${availableStock} left in stock.`, { position: "top-right", autoClose: 3000 });
        return;
      }
    }

    setCart((prev) => {
      let didChange = false;
      const next = prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        if (Number(item.qty) === normalizedQty) return item;
        didChange = true;
        return { ...item, qty: normalizedQty };
      });

      return didChange ? next : prev;
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    lastSyncedCart.current = JSON.stringify([]);

    // Immediately persist clear action for authenticated users to avoid stale cart on reload.
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        if (cartTimer.current) clearTimeout(cartTimer.current);
        api.post("/users/profile/cart", { cart: [] }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch((err) => {
          console.error("[CartContext] Immediate clear cart sync ERROR:", err.response?.data || err.message);
        });
      }
    }

    toast.success("Cart cleared", { position: "top-right" });
  };

  const applyCoupon = async (coupon_code) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login to apply coupon");
        return;
      }

      const res = await api.post("/users/coupons/validate", { coupon_code, amount: rawSubtotal }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        toast.success(`Coupon "${coupon_code}" applied!`);
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon");
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed");
  };

  const toggleWishlist = (product) => {
    if (!user) { 
      toast.error("Please login to add items to wishlist", { position: "top-right" });
      return; 
    }
    const pid = product.id || product._id;
    const fallbackVariant = Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants[0]
      : null;
    const sourceVariant = product.selectedVariant || product.selected_variant || fallbackVariant;
    const normalizedVariant = sourceVariant
      ? {
          id: sourceVariant.id,
          variant_name: sourceVariant.variant_name,
          variant_value: sourceVariant.variant_value,
          price: Number(sourceVariant.price) || 0,
          stock: sourceVariant.stock,
        }
      : null;

    const variantId = normalizedVariant?.id || product.selectedVariantId || product.selected_variant_id || "base";
    const wishlistItemId = `${pid}-${variantId}`;
    const exists = wishlist.some((item) => (item.wishlistItemId || `${item.id || item._id}-${item.selectedVariantId || item.selected_variant_id || item.selectedVariant?.id || "base"}`) === wishlistItemId);

    if (exists) {
      toast.error("Product already added to wishlist", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setWishlist((prev) => [...prev, {
      ...product,
      id: pid,
      wishlistItemId,
      selectedVariantId: normalizedVariant?.id || null,
      selectedVariant: normalizedVariant,
      selectedVariantName: normalizedVariant?.variant_name || null,
      selectedVariantValue: normalizedVariant?.variant_value || null,
      selectedVariantPrice: normalizedVariant ? Number(normalizedVariant.price) || 0 : null,
      variant_price: normalizedVariant ? Number(normalizedVariant.price) || 0 : null,
    }]);
    toast.success("Product added to wishlist!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const removeFromWishlist = (identifier) => {
    setWishlist((prev) => prev.filter((item) => {
      const itemId = item.id || item._id;
      const variantId = item.selectedVariantId || item.selected_variant_id || item.selectedVariant?.id || "base";
      const itemWishlistId = item.wishlistItemId || `${itemId}-${variantId}`;
      return itemWishlistId !== identifier && itemId !== identifier;
    }));
    toast.error("Removed from wishlist", {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const isWishlisted = (id, variantId = null) => wishlist.some((item) => {
    const itemId = item.id || item._id;
    const itemVariantId = item.selectedVariantId || item.selected_variant_id || item.selectedVariant?.id || "base";

    if (variantId) {
      return itemId === id && itemVariantId === variantId;
    }

    return itemId === id;
  });

  const totalItems = cart.reduce((acc, item) => acc + (Math.max(0, Number(item.qty)) || 0), 0);

  const hasVariantSelection = (item) => Boolean(getVariantIdFromItem(item));

  const getUnitPrice = (item) => {
    if (hasVariantSelection(item)) {
      return Number((item.selectedVariant?.price ?? item.variant_price ?? item.selectedVariantPrice ?? item.selected_variant_price ?? item.price) || 0);
    }

    const basePrice = Number(item.price || 0);
    const salePrice = Number(item.sale_price || 0);
    if (salePrice > 0) {
      return salePrice;
    }

    const discountPercent = Number(item.discount_percent || 0);
    if (discountPercent > 0) {
      return basePrice - (basePrice * discountPercent / 100);
    }

    return basePrice;
  };
  
  // 1. Raw Subtotal (based on product prices and their own discounts)
  const rawSubtotal = cart.reduce((acc, item) => {
    const unitPrice = getUnitPrice(item);
    return acc + (unitPrice * Number(item.qty));
  }, 0);

  // 2. Coupon Discount
  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discount_amount) : 0;

  // 3. Taxable Amount
  const taxableSubtotal = Math.max(0, rawSubtotal - couponDiscount);

  // 4. GST Calculation (Dynamic per product)
  const totalGst = 0;
  // Temporarily disabled GST calculation
  // const totalGst = cart.reduce((acc, item) => {
  //   const unitPrice = getUnitPrice(item);
  //   const itemSubtotal = unitPrice * Number(item.qty);
  //   
  //   // Pro-rate the coupon discount to calculation GST on the actual paid amount? 
  //   // Usually GST is on the amount after discount.
  //   const itemRatio = rawSubtotal > 0 ? (itemSubtotal / rawSubtotal) : 0;
  //   const itemTaxableAmount = Math.max(0, itemSubtotal - (couponDiscount * itemRatio));
  //   
  //   const gstPercent = Number(item.gst_percent || 0);
  //   return acc + (itemTaxableAmount * gstPercent / 100);
  // }, 0);

  const totalPrice = taxableSubtotal + totalGst;
  const subtotalInclGst = rawSubtotal + totalGst;

  return (
    <CartContext.Provider value={{
      cart, 
      addToCart, removeFromCart, updateQty, clearCart,
      wishlist, 
      toggleWishlist, removeFromWishlist, isWishlisted,
      totalItems, totalPrice,
      rawSubtotal, subtotalInclGst, couponDiscount, totalGst,
      appliedCoupon, applyCoupon, removeCoupon,
      flushToServer,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);