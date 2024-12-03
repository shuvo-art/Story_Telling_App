const User = require("../models/userModel");
const { generateToken } = require("../config/jwtToken");
const { generateRefreshToken } = require("../config/refreshToken");
const { OAuth2Client } = require("google-auth-library");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sharp = require("sharp");
const fs = require("fs-extra");
const path = require("path");
const { sendEmail } = require("../controller/emailCtrl");
const validateMongodbId = require("../utils/validateMongodbId");

const createUser = asyncHandler(async (req, res) => {
  let userData;
  try {
    userData = JSON.parse(req.body.userData);
  } catch (error) {
    return res.status(400).json({ message: "Invalid JSON data format" });
  }

  const { email } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  let profilePictureUrl = "";
  if (req.resizedImagePath) {
    profilePictureUrl = `${process.env.BASE_URL}/${req.resizedImagePath}`;
  }

  const newUser = await User.create({ ...userData, profilePicture: profilePictureUrl });
  res.status(201).json(newUser);
});


// Login user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.isPasswordMatched(password))) {
    const refreshToken = generateRefreshToken(user._id);
    await User.findByIdAndUpdate(user.id, { refreshToken }, { new: true });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: user._id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400).json({ message: "Invalid credentials" });
  }
});



const editUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id; // User ID from authenticated session
  let userData;
  
  try {
    userData = JSON.parse(req.body.userData); // Parse `userData` JSON from request body
  } catch (error) {
    return res.status(400).json({ message: "Invalid JSON data format" });
  }

  const { password } = userData;
  const updateData = { ...userData }; // Spread user data into updateData object

  // Update password if provided
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  // Handle profile picture if uploaded
  if (req.resizedImagePath) {
    updateData.profilePicture = `${process.env.BASE_URL}/${req.resizedImagePath}`;
  }

  try {
    // Update user profile with new data and profile picture URL
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(400).json({ message: "Error updating profile", error });
  }
});


// Forgot password - send verification code
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) return res.status(404).json({ message: "User not found" });

  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  user.passwordResetToken = crypto.createHash("sha256").update(verificationCode).digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  const emailData = {
    to: email,
    subject: "Password Reset Code",
    text: `Your verification code is ${verificationCode}`,
  };
  await sendEmail(emailData);
  res.json({ message: "Verification code sent to email" });
});


// Verify code for normal users
const verifyCodeUser = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  // Validate input
  if (!email || !code) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  // Find the user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if the code has expired
  if (Date.now() > user.passwordResetExpires) {
    return res.status(400).json({ message: "Verification code has expired" });
  }

  // Compare the provided code with the hashed token
  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
  if (hashedCode !== user.passwordResetToken) {
    return res.status(400).json({ message: "Invalid verification code" });
  }

  // Success response
  res.json({ message: "Code verified successfully" });
});

// Verify code and set new password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;
  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  const user = await User.findOne({
    email,
    passwordResetToken: hashedCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired code" });

  user.password = password; // This will trigger the `pre("save")` middleware to hash the password
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.json({ message: "Password reset successfully" });
});


// Set preferred language
const setPreferredLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { preferredLanguage: language }, { new: true });
  res.json({ message: `Preferred language set to ${language}`, user });
});

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Authentication
const googleAuth = asyncHandler(async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Check if user exists or create a new user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstname: name?.split(" ")[0] || "GoogleUser",
        lastname: name?.split(" ")[1] || "",
        email,
        password: "OAuthGoogleUser", // Default password for OAuth users
        dateOfBirth: "2000-01-01",   // Default date of birth if none is provided
        gender: "Not specified",     // Default gender if none is provided
        mobile: "N/A"                // Default mobile if none is provided
      });
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id, user.role);

    // Send response
    res.json({ message: "User authenticated successfully", token: jwtToken });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(400).json({ message: "Error authenticating with Google", error });
  }
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate the ID format
  if (!validateMongodbId(id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(id).select("-password -refreshToken -passwordResetToken -passwordResetExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user data", error });
  }
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Remove refresh token from user in database
  await User.findByIdAndUpdate(userId, { refreshToken: null });

  // Clear refreshToken cookie
  res.clearCookie("refreshToken", { httpOnly: true, secure: true });
  res.status(200).json({ message: "Logout successful" });
});


// Delete user by ID
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Delete the user from the database
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
});

// Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    // Fetch all users from the database excluding sensitive fields (e.g., password)
    const users = await User.find({}, "-password -refreshToken -passwordResetToken -passwordResetExpires");

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error });
  }
});

module.exports = {
  createUser,
  loginUserCtrl,
  editUserProfile,
  forgotPassword,
  verifyCodeUser,
  resetPassword,
  setPreferredLanguage,
  googleAuth,
  getUserById,
  logoutUser,
  deleteUser,
  getAllUsers,
};
