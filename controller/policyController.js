const Policy = require("../models/Policy");
const asyncHandler = require("express-async-handler");

// Get Terms and Privacy Policy
const getPolicies = asyncHandler(async (req, res) => {
  const policies = await Policy.findOne();
  if (!policies) {
    return res.status(404).json({ message: "Policies not found" });
  }
  res.json(policies);
});

// Update Terms and Privacy Policy
const updatePolicies = asyncHandler(async (req, res) => {
  const { termsAndConditions, privacyPolicy } = req.body;

  let policies = await Policy.findOne();
  if (!policies) {
    // If no record exists, create one
    policies = await Policy.create({ termsAndConditions, privacyPolicy });
    return res.status(201).json({ message: "Policies created successfully", policies });
  }

  // Update existing record
  policies.termsAndConditions = termsAndConditions || policies.termsAndConditions;
  policies.privacyPolicy = privacyPolicy || policies.privacyPolicy;
  await policies.save();

  res.json({ message: "Policies updated successfully", policies });
});

module.exports = { getPolicies, updatePolicies };
