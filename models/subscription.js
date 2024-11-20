const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subscriptionType: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    status: { type: String, default: "active" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    benefits: { type: Array, default: [] }, // List of benefits
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
