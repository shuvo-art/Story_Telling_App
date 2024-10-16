const User = require("../models/userModel");
const { generateToken } = require("../config/jwtToken");
const { generateRefreshToken } = require("../config/refreshToken");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("../controller/emailCtrl");
const validateMongodbId = require("../utils/validateMongodbId");

// Create new user
const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const findUser = await User.findOne({ email });
  if (!findUser) {
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    res.status(400).json({ message: "User already exists" });
  }
});

// Login user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser._id);
    await User.findByIdAndUpdate(findUser.id, { refreshToken }, { new: true });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser._id,
      email: findUser.email,
      firstname: findUser.firstname,
      lastname: findUser.lastname,
      token: generateToken(findUser._id),
    });
  } else {
    res.status(400).json({ message: "Invalid credentials" });
  }
});

// Admin Login
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const findAdmin = await User.findOne({ email });
  if (!findAdmin) {
    return res.status(404).json({ message: "Admin not found" });
  }
  if (findAdmin.role !== "admin") {
    return res.status(403).json({ message: "Not authorized as Admin" });
  }
  if (await findAdmin.isPasswordMatched(password)) {
    const refreshToken = await generateRefreshToken(findAdmin._id);
    await User.findByIdAndUpdate(findAdmin.id, { refreshToken }, { new: true });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin._id,
      email: findAdmin.email,
      firstname: findAdmin.firstname,
      lastname: findAdmin.lastname,
      token: generateToken(findAdmin._id),
    });
  } else {
    res.status(400).json({ message: "Invalid credentials" });
  }
});

// Handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken)
    return res.status(403).json({ message: "No token provided" });

  const user = await User.findOne({ refreshToken });
  if (!user) return res.status(403).json({ message: "Token not valid" });

  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      return res.status(403).json({ message: "Token error" });
    }
    const accessToken = generateToken(user._id);
    res.json({ accessToken });
  });
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  await User.findOneAndUpdate({ refreshToken }, { refreshToken: "" });
  res.clearCookie("refreshToken", { httpOnly: true, secure: true });
  res.sendStatus(204);
});

// Forgot password token generation
const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins
  await user.save();

  const resetURL = `<a href='http://localhost:3000/reset-password/${token}'>Reset Password</a>`;
  const emailData = {
    to: user.email,
    subject: "Password Reset",
    text: "You requested a password reset",
    htm: resetURL,
  };

  await sendEmail(emailData, req, res);
  res.json({ message: "Password reset email sent" });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successfully" });
});

// Update user password
const updatePassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { _id } = req.user;
  const user = await User.findById(_id);
  if (password) {
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: "Password updated successfully" });
  } else {
    res.status(400).json({ message: "Password is required" });
  }
});

// Get all users (Admin only)
const getallUser = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Get a single user
const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// Update user profile
const updatedUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongodbId(_id);
  const updatedUser = await User.findByIdAndUpdate(_id, req.body, {
    new: true,
  });
  res.json(updatedUser);
});

// Delete a user (Admin only)
const deleteaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted successfully" });
});

module.exports = {
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
};
