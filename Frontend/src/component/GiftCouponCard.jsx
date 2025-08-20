import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";

const GiftCouponCard = () => {
  const [userInputCode, setUserInputCode] = useState("");
  const {
    coupon,
    isCouponApplied,
    applyCoupon,
    getMyCoupon,
    removeCoupon,
    cart,
  } = useCartStore();

  useEffect(() => {
    getMyCoupon();
  }, [getMyCoupon]);

  useEffect(() => {
    if (coupon) setUserInputCode(coupon.code);
  }, [coupon]);

  // Helper to check eligibility
  const isEligibleForCoupon = () => {
    const total = cart.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );
    return total >= 20000;
  };

  const handleApplyCoupon = () => {
    if (!userInputCode) return;
    if (!isEligibleForCoupon()) {
      toast.error("Coupon can only be used if cart total is above ₦20,000.");
      return;
    }
    applyCoupon(userInputCode);
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setUserInputCode("");
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="voucher"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Do you have a voucher or gift card?
          </label>
          <input
            type="text"
            id="voucher"
            className="block w-full rounded-lg border border-gray-600 bg-gray-700 
            p-2.5 text-sm text-white placeholder-gray-400 focus:border-yellow-900 
            focus:ring-yellow-900"
            placeholder="Enter code here"
            value={userInputCode}
            onChange={(e) => setUserInputCode(e.target.value)}
            required
            disabled={!isEligibleForCoupon()}
          />
        </div>

        <motion.button
          type="button"
          className={`flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition ${
            isEligibleForCoupon()
              ? "bg-yellow-900 hover:bg-yellow-800 focus:ring-yellow-800"
              : "bg-gray-600 cursor-not-allowed"
          }`}
          whileHover={{ scale: isEligibleForCoupon() ? 1.05 : 1 }}
          whileTap={{ scale: isEligibleForCoupon() ? 0.95 : 1 }}
          onClick={handleApplyCoupon}
          disabled={!isEligibleForCoupon()}
        >
          Apply Code
        </motion.button>
      </div>
      {isCouponApplied && coupon && isEligibleForCoupon() && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-300">Applied Coupon</h3>
          <p className="mt-2 text-sm text-gray-400">
            {coupon.code} - {coupon.discountPercentage}% off
          </p>
          <motion.button
            type="button"
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-red-600 
            px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none
             focus:ring-4 focus:ring-red-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRemoveCoupon}
          >
            Remove Coupon
          </motion.button>
        </div>
      )}

      {coupon && isEligibleForCoupon() && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-300">
            Your Available Coupon:
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            {coupon.code} - {coupon.discountPercentage}% off
          </p>
        </div>
      )}
      {!isEligibleForCoupon() && (
        <div className="mt-4 text-sm text-red-400">
          Cart total must be above ₦20,000 to use a coupon.
        </div>
      )}
    </motion.div>
  );
};
export default GiftCouponCard;
