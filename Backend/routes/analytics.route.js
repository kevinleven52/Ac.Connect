import express from 'express';
import {adminRoute, protectRoute} from '../middleware/auth.middleware.js';

import { getAnalyticsData, getDailySalesData } from '../controllers/analytics.controller.js';

const router = express.Router();


router.get("/", protectRoute, adminRoute, async(req, res) => {
  // Simulate analytics data
  try{
  const analyticsData = await getAnalyticsData();


  const endDate = new Date();
     const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const dailySalesData = await getDailySalesData(startDate, endDate);
    res.status(200).json({analyticsData, dailySalesData});
  
  
} catch (error) {
  console.error("Error retrieving analytics data:", error);
  res.status(500).json({
    success: false,
    message: "Failed to retrieve analytics data",
    error: error.message
  });
}
});




export default router;