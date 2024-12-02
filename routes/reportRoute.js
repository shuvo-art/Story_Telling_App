const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const User = require("../models/userModel");
const moment = require("moment");  // Use moment.js for date manipulation

// **Income Report**: Calculate income by month
router.get("/income-report", async (req, res) => {
  try {
    // Find all orders and group them by month
    const orders = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" }, // Group orders by month
          totalIncome: { $sum: "$total" },  // Sum the total amount of each order
        },
      },
      {
        $sort: { _id: 1 },  // Sort by month
      },
    ]);

    // Find all users' income per month
    const users = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalIncome: { $sum: "$income" }, // Sum the income field of users
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({ orders, users });
  } catch (error) {
    console.error("Error calculating income report:", error);
    res.status(500).json({ message: "Error calculating income report", error });
  }
});

// **Subscriber Growth**: Calculate growth of Premium users per month
router.get("/subscriber-growth", async (req, res) => {
  try {
    // Get all users grouped by month, filter by Premium users
    const premiumUsersGrowth = await User.aggregate([
      { $match: { subscriptionType: "Premium" } },  // Only Premium users
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalPremium: { $sum: 1 },  // Count Premium users
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get total users each month for comparison
    const totalUsers = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalUsers: { $sum: 1 },  // Count total users
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Calculate growth percentage
    const growthData = premiumUsersGrowth.map((growthMonth, index) => {
      const totalUsersMonth = totalUsers[index];
      if (totalUsersMonth) {
        const growthPercentage = ((growthMonth.totalPremium / totalUsersMonth.totalUsers) * 100).toFixed(2);
        return { month: growthMonth._id, growthPercentage };
      }
      return { month: growthMonth._id, growthPercentage: 0 };
    });

    res.status(200).json({ growthData });
  } catch (error) {
    console.error("Error calculating subscriber growth:", error);
    res.status(500).json({ message: "Error calculating subscriber growth", error });
  }
});

// **User Growth**: Calculate the number of new users added each month
router.get("/user-growth", async (req, res) => {
  try {
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalUsers: { $sum: 1 },  // Count total users per month
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({ userGrowth });
  } catch (error) {
    console.error("Error calculating user growth:", error);
    res.status(500).json({ message: "Error calculating user growth", error });
  }
});

module.exports = router;
