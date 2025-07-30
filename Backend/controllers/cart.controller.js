import Product from "../model/product.model.js";
import User from "../model/user.model.js";
import mongoose from "mongoose";

// Get all products in the user's cart, with quantity
export const getCartProducts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const cartItems = user.cartItems || [];
    const productIds = cartItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const cartProducts = products.map((product) => {
      const item = cartItems.find(
        (ci) => ci.product.toString() === product._id.toString()
      );
      return {
        ...product,
        quantity: item ? item.quantity : 0,
      };
    });

    return res.status(200).json(cartProducts);
  } catch (error) {
    console.error("Error fetching cart products:", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Add a product to the cart or update its quantity
export const addToCart = async (req, res) => {
  let { productId, quantity } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }
    productId = new mongoose.Types.ObjectId(productId);
    quantity = Number(quantity);
    if (isNaN(quantity) || quantity <= 0) {
      quantity = 1; // Default to 1 if not provided or invalid
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const cartItem = user.cartItems.find(
      (item) => item.product.toString() === productId.toString()
    );
    if (cartItem) {
      cartItem.quantity = Number(cartItem.quantity) + quantity;
    } else {
      user.cartItems.push({ product: productId, quantity });
    }
    await user.save();
    return res.status(200).json(user.cartItems);
  } catch (error) {
    console.error("Error adding to cart:", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Remove a single product from the cart, or clear all if no productId
export const removeAllFromCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { productId } = req.body;
    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter(
        (item) => item.product.toString() !== productId
      );
    }
    await user.save();
    return res.status(200).json(user.cartItems);
  } catch (error) {
    console.error("Error removing items from cart:", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update the quantity of a specific product in the cart
export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const cartItem = user.cartItems.find(
      (item) => item.product && item.product.toString() === productId.toString()
    );
    if (cartItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter(
          (item) => item.product.toString() !== productId
        );
      } else {
        cartItem.quantity = quantity;
      }
      await user.save();
      return res.status(200).json(user.cartItems);
    } else {
      return res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Error updating cart item:", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
