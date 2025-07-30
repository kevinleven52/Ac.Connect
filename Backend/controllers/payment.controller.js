import Coupon from "../model/coupon.model.js";
import Order from "../model/order.model.js";
import { stripe } from "../lib/stripe.js";

// Create Stripe Checkout Session
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid products array" });
    }

    let totalAmount = 0;
    const line_items = products.map((product) => {
      const amount = Math.round(product.price * 100);
      totalAmount += product.price * product.quantity;

      return {
        price_data: {
          currency: "ngn",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });

      if (!coupon) {
        return res.status(400).json({ error: "Invalid coupon code" });
      }

      totalAmount -= Math.round((totalAmount * coupon.discount) / 100);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts:
        coupon && totalAmount >= 20000
          ? [{ coupon: await createStripeCoupon(coupon.discount) }]
          : [],

      metadata: {
        userId: req.user._id.toString(),
        couponCode: coupon ? coupon.code : "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p.id, // ✅ This field is missing in your current payload
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    if (totalAmount >= 1000) {
      await createNewCoupon(req.user._id);
    }

    res.status(200).json({
      sessionId: session.id,
      totalAmount: totalAmount / 100,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Handle Checkout Success
export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Deactivate used coupon
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      // Retrieve product metadata
      const products = JSON.parse(session.metadata.products);

      // Optional: Get detailed Stripe line items
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

      // Create order document
      const newOrder = new Order({
        userId: session.metadata.userId,
        products: products.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
        paymentStatus: session.payment_status, // Optional but useful
        itemsPurchased: lineItems.data.map((line) => ({
          name: line.description,
          quantity: line.quantity,
          amount: line.amount_subtotal / 100, // Converting from kobo
        })),
      });

      await newOrder.save();
      console.log("🧾 Order saved:", newOrder);

      res.status(200).json({
        success: true,
        orderId: newOrder._id,
        message: "Payment successful, order created, coupon deactivated.",
      });
    } else {
      console.warn("⚠️ Session not paid:", sessionId);
      res.status(400).json({ error: "Payment not completed." });
    }
  } catch (error) {
    console.error("🔥 Error in checkout success:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Helpers
async function createStripeCoupon(discount) {
  try {
    const coupon = await stripe.coupons.create({
      percent_off: discount,
      duration: "once",
    });
    return coupon.id;
  } catch (error) {
    console.error("Error creating Stripe coupon:", error);
    throw new Error("Failed to create Stripe coupon");
  }
}

async function createNewCoupon(userId) {
  await Coupon.findOneAndDelete({ userId });

  const newCoupon = new Coupon({
    code:
      "ACconnectGift" +
      Math.random().toString(36).substring(2, 8).toUpperCase(),
    discount: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userId: userId,
  });

  await newCoupon.save();
  return newCoupon;
}
