const express = require("express");
const router = express.Router();
const { getPolicies, updatePolicies } = require("../controller/policyController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

// Fetch Policies
router.get("/policies", getPolicies);

// Update Policies (Admin Only)
router.put("/policies", authMiddleware, isAdmin, updatePolicies);

module.exports = router;
