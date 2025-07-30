import express from 'express';
import { addToCart, removeAllFromCart, updateQuantity, getCartProducts} from '../controllers/cart.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
const router = express.Router();
// Route to create a new product
router.get('/', protectRoute, getCartProducts);
router.post('/', protectRoute, addToCart);
router.delete("/", protectRoute, removeAllFromCart);
router.put("/:id", protectRoute, updateQuantity);


export default router;