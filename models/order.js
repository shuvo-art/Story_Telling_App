const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookTitle: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
    paymentId: { type: String }, // Stripe payment ID
    shippingAddress: {
      city: { type: String },
      country: { type: String },
      line1: { type: String },
      line2: { type: String },
      postal_code: { type: String },
      state: { type: String },
    },
    shippingMethod: {
      type: String,
      enum: ["free", "next-day"],
      default: "free",
    },
    email: { type: String }, // Customer email, populated from Stripe
    phone: { type: String }, // Customer phone, populated from Stripe
    name: { type: String }, // Customer name, populated from Stripe
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
