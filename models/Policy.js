const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
  termsAndConditions: { type: String, required: true },
  privacyPolicy: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Policy", policySchema);
