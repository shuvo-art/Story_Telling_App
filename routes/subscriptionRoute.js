const express = require("express");
const router = express.Router();
const Subscription = require("../models/subscription");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const { createSubscription } = require("../controller/subscriptionController");


// Create a new subscription
router.post("/create", authMiddleware, isAdmin, async (req, res) => {
  const { title, description, price, discount, benefits, startDate, endDate } = req.body;

  try {
    const newSubscription = new Subscription({
      title,
      description,
      price,
      discount,
      benefits,
      startDate,
      endDate,
    });
    await newSubscription.save();

    res.status(201).json({ message: "Subscription created successfully", subscription: newSubscription });
  } catch (error) {
    res.status(500).json({ message: "Error creating subscription", error });
  }
});

// Update an existing subscription
router.put("/update/:id", authMiddleware, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, price, discount, benefits, startDate, endDate } = req.body;

  try {
    const subscription = await Subscription.findByIdAndUpdate(
      id,
      { title, description, price, discount, benefits, startDate, endDate },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({ message: "Subscription updated successfully", subscription });
  } catch (error) {
    res.status(500).json({ message: "Error updating subscription", error });
  }
});

// Delete a subscription
router.delete("/delete/:id", authMiddleware, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const subscription = await Subscription.findByIdAndDelete(id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({ message: "Subscription deleted successfully", subscription });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subscription", error });
  }
});

// Get all subscriptions
router.get("/list", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ status: "active" });
    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching subscriptions", error });
  }
});


// POST: Create Subscription (Upgrade)
router.post("/create-subscription", authMiddleware, createSubscription);


module.exports = router;

