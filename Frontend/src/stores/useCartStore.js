import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      coupon: null,
      total: 0,
      subtotal: 0,
      isCouponApplied: false,

      getMyCoupon: async () => {
        try {
          const response = await axios.get("/coupons");
          set({ coupon: response.data });
        } catch (error) {
          console.error("Error fetching coupon:", error);
        }
      },

      applyCoupon: async (code) => {
        try {
          const response = await axios.post("/coupons/validate", { code });
          set({ coupon: response.data, isCouponApplied: true });
          get().calculateTotals();
          toast.success("Coupon applied successfully");
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to apply coupon");
        }
      },

      removeCoupon: () => {
        set({ coupon: null, isCouponApplied: false });
        get().calculateTotals();
        toast.success("Coupon removed");
      },

      getCartItems: async () => {
        try {
          const res = await axios.get("/cart");
          set({ cart: res.data });
          get().calculateTotals();
        } catch (error) {
          set({ cart: [] });
          toast.error(error.response?.data?.message || "An error occurred");
        }
      },

      addToCart: async (product) => {
        try {
          await axios.post("/cart", { productId: product._id, quantity: 1 });
          toast.success("Product added to cart");

          const existingItem = get().cart.find((item) => item._id === product._id);
          const newCart = existingItem
            ? get().cart.map((item) =>
                item._id === product._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            : [...get().cart, { ...product, quantity: 1 }];

          set({ cart: newCart });
          get().calculateTotals();
        } catch (error) {
          toast.error(error.response?.data?.message || "An error occurred");
        }
      },

      removeFromCart: async (productId) => {
        await axios.delete(`/cart`, { data: { productId } });
        set({ cart: get().cart.filter((item) => item._id !== productId) });
        get().calculateTotals();
      },

      updateQuantity: async (productId, quantity) => {
        if (quantity === 0) return get().removeFromCart(productId);
        await axios.put(`/cart/${productId}`, { quantity });
        set({
          cart: get().cart.map((item) =>
            item._id === productId ? { ...item, quantity } : item
          ),
        });
        get().calculateTotals();
      },

      calculateTotals: () => {
        const { cart, coupon } = get();
        const subtotal = cart.reduce((sum, item) => {
          return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
        }, 0);

        let total = subtotal;
        if (coupon?.discountPercentage) {
          total -= subtotal * (coupon.discountPercentage / 100);
        }

        set({ subtotal, total });
      },

      clearCart: () => {
        set({
          cart: [],
          total: 0,
          subtotal: 0,
          coupon: null,
          isCouponApplied: false,
        });
        localStorage.removeItem("cart-storage");
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);