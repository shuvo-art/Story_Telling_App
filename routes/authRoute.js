const express = require("express");
const router = express.Router();
const {
  createUser,
  loginUserCtrl,
  loginAdmin,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
} = require("../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

// User Registration and Authentication
router.post("/register", createUser); // User registration
router.post("/login", loginUserCtrl); // User login
router.post("/admin-login", loginAdmin); // Admin login
router.post("/forgot-password-token", forgotPasswordToken); // Forgot password token
router.put("/reset-password/:token", resetPassword); // Reset password
router.put("/password", authMiddleware, updatePassword); // Update user password

// User Profile and Management
router.get("/all-users", authMiddleware, isAdmin, getallUser); // Get all users (Admin only)
router.get("/profile/:id", authMiddleware, getaUser); // Get a single user's profile
router.put("/edit-user", authMiddleware, updatedUser); // Edit user profile
router.delete("/:id", authMiddleware, isAdmin, deleteaUser); // Delete a user (Admin only)

// Token Handling and Logout
router.get("/refresh", handleRefreshToken); // Refresh token handling
router.get("/logout", logout); // Logout

module.exports = router;
