const express = require("express");
const router = express.Router();
const Coupon = require("../models/coupon");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

// Create a new coupon
router.post("/create", authMiddleware, isAdmin, async (req, res) => {
  const { name, code, discount, startDate, endDate } = req.body;

  try {
    const newCoupon = new Coupon({ name, code, discount, startDate, endDate });
    await newCoupon.save();
    res.status(201).json({ message: "Coupon created successfully", coupon: newCoupon });
  } catch (error) {
    res.status(500).json({ message: "Error creating coupon", error });
  }
});

// Update an existing coupon
router.put("/update/:id", authMiddleware, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, code, discount, startDate, endDate } = req.body;

  try {
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { name, code, discount, startDate, endDate },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json({ message: "Coupon updated successfully", coupon });
  } catch (error) {
    res.status(500).json({ message: "Error updating coupon", error });
  }
});

// Delete a coupon
router.delete("/delete/:id", authMiddleware, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json({ message: "Coupon deleted successfully", coupon });
  } catch (error) {
    res.status(500).json({ message: "Error deleting coupon", error });
  }
});

// Apply a coupon
router.post("/apply", authMiddleware, async (req, res) => {
  const { code, totalPrice } = req.body;

  try {
    const coupon = await Coupon.findOne({ code, status: "active" });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid or expired coupon code" });
    }

    const currentDate = new Date();
    if (currentDate < coupon.startDate || currentDate > coupon.endDate) {
      return res.status(400).json({ message: "Coupon is not valid at this time" });
    }

    const discountAmount = (totalPrice * coupon.discount) / 100;
    const finalPrice = totalPrice - discountAmount;

    res.json({
      message: "Coupon applied successfully",
      discountAmount,
      finalPrice,
    });
  } catch (error) {
    res.status(500).json({ message: "Error applying coupon", error });
  }
});

// Get all coupons
router.get("/list", authMiddleware, isAdmin, async (req, res) => {
  const { status } = req.query; // Optional filter by status

  try {
    const query = status ? { status } : {}; // Build query if status is provided
    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    res.json({ message: "Coupons retrieved successfully", coupons });
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons", error });
  }
});

module.exports = router;
