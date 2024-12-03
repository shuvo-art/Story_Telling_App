const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Notification = require("../models/notificationModel"); 
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_KEY);

// Create Order and Process Payment
router.post("/create-order", authMiddleware, async (req, res) => {
  const { bookTitle, quantity, price } = req.body;
  const total = quantity * price;

  try {
    // Create the order in the database
    const order = new Order({
      userId: req.user._id,
      bookTitle,
      quantity,
      price,
      total,
      status: "pending",
    });
    await order.save();

    // Create a notification for the admin about the new order
    const adminNotification = new Notification({
      message: `${req.user.firstname} ${req.user.lastname} ordered ${bookTitle} (${quantity} copies)`,
      userId: req.user._id,
      orderId: order._id,
    });

    // Save the notification
    await adminNotification.save();

    // You can add code here to notify admins through email, websockets, etc.

    // Create a Stripe session for the payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: bookTitle },
            unit_amount: price * 100, // Stripe requires the amount in cents
          },
          quantity,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Free shipping",
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 1500, currency: "usd" },
            display_name: "Next day air",
          },
        },
      ],
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        orderId: order._id.toString(),
      },
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/order-success/${order._id}`,
      cancel_url: `${process.env.CLIENT_URL}/order-cancel/${order._id}`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Error creating order", error });
  }
});

// Get All Orders (Admin)
router.get("/all-orders", authMiddleware, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "profilePicture firstname lastname email");
    res.json({ message: "Orders fetched successfully", orders });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

// Get Order Details
router.get("/order-details/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id).populate("userId", "firstname lastname email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order details fetched successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order details", error });
  }
});

// Update Order Status (Admin)
router.put("/update-status/:id", authMiddleware, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Error updating order status", error });
  }
});


module.exports = router;
