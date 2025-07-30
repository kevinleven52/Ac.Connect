import Coupon from "../model/coupon.model.js";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    if (!coupon) {
      return res.status(404).json({ message: "No coupons found" });
    }
    res.status(200).json({
      code: coupon.code,
      discountPercentage: coupon.discount, // <-- use discountPercentage key
      // add other properties if needed
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  const { code } = req.body; // <-- changed from req.query to req.body
  try {
    const coupon = await Coupon.findOne({
      code: code,
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon) {
      // coupon.isActive = false; // This line will throw if coupon is null, so remove it
      // await coupon.save();
      return res.status(404).json({ message: "Coupon not found or expired" });
    }

    if (coupon.expirationDate < new Date()) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    res.status(200).json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discount,
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};
