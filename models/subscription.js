const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., "Premium", "Order Hard Copy"
    description: { type: String, required: true }, // Detailed info
    price: { type: Number, required: true }, // Base price
    discount: { type: Number, default: 0 }, // Discount percentage
    discountedPrice: { type: Number }, // Calculated discounted price
    benefits: { type: Array, default: [] }, // List of benefits
    startDate: { type: Date }, // Discount start
    endDate: { type: Date }, // Discount end
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate discounted price
subscriptionSchema.pre("save", function (next) {
  if (this.discount > 0) {
    this.discountedPrice = this.price - (this.price * this.discount) / 100;
  } else {
    this.discountedPrice = this.price;
  }
  next();
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
