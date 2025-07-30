import User from "../model/user.model.js";
import Product from "../model/product.model.js";
import Order from "../model/order.model.js";

export const getAnalyticsData = async () => {
  const totalUsers = await User.countDocuments({ role: "customer" });
  const totalProducts = await Product.countDocuments();

  const salesData = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" }, // <-- fix: add $
      },
    },
  ]);

  const { totalSales, totalRevenue } = salesData[0] || {
    totalSales: 0,
    totalRevenue: 0,
  };
  return {
    users: totalUsers,
    products: totalProducts,
    totalSales,
    totalRevenue,
  };
};

export const getDailySalesData = async (startDate, endDate) => {
  try {
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date
      },
    ]);
    const datesArry = getDatesInRange(startDate, endDate);

    return datesArry.map((date) => {
      const dailyData = dailySalesData.find((data) => data._id === date);
      return {
        date,
        sales: dailyData ? dailyData.sales : 0,
        revenue: dailyData ? dailyData.revenue : 0,
      };
    });
  } catch (error) {
    console.error("Error retrieving daily sales data:", error);
    throw error;
  }
};

// Helper function to get all dates in the range
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};
