const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Name of the coupon
    code: { type: String, required: true, unique: true }, // Unique coupon code
    discount: { type: Number, required: true }, // Discount percentage
    startDate: { type: Date, required: true }, // Valid from
    endDate: { type: Date, required: true }, // Valid until
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
