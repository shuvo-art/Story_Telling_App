const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../controller/emailCtrl");

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log("Admin Login Attempt:", { email, password });

  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) {
    console.error("Admin not found or role mismatch for email:", email);
    return res.status(401).json({ message: "Invalid email or not an admin" });
  }

  console.log("Admin Found:", { email: admin.email, role: admin.role, storedPassword: admin.password });

  const isMatched = await admin.isPasswordMatched(password);

  console.log("Password Comparison Result During Login:", {
    enteredPassword: password,
    storedPassword: admin.password,
    isMatched,
  });

  if (isMatched) {
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log("Admin Login: Token generated successfully for admin:", admin.email);
    return res.json({
      _id: admin._id,
      email: admin.email,
      role: admin.role,
      token,
    });
  } else {
    console.error("Invalid password for admin email:", email);
    return res.status(401).json({ message: "Invalid password" });
  }
});


// Send verification code
const sendVerificationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  console.log("Sending Verification Code to:", email);

  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) {
    console.error("Admin not found:", email);
    return res.status(404).json({ message: "Admin not found" });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  admin.passwordResetToken = bcrypt.hashSync(verificationCode, 10);
  admin.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await admin.save();

  console.log("Verification Code Generated:", verificationCode);

  await sendEmail({
    to: admin.email,
    subject: "Password Reset Code",
    text: `Your password reset code is ${verificationCode}`,
  });

  res.json({ message: "Verification code sent to email" });
});


// Verify the code only
const verifyCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  const isCodeMatched = bcrypt.compareSync(code, admin.passwordResetToken);
  if (!isCodeMatched || Date.now() > admin.passwordResetExpires) {
    return res.status(400).json({ message: "Invalid or expired verification code" });
  }

  res.json({ message: "Code verified successfully" });
});



const setNewPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  console.log("Resetting Password for:", { email, code, newPassword });

  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) {
    console.error("Admin not found during password reset:", email);
    return res.status(404).json({ message: "Admin not found" });
  }

  console.log("Fetched Admin for Reset:", { email: admin.email, role: admin.role });

  const isCodeMatched = bcrypt.compareSync(code, admin.passwordResetToken);
  console.log("Verification Code Matched:", isCodeMatched);

  if (!isCodeMatched || Date.now() > admin.passwordResetExpires) {
    console.error("Invalid or expired verification code");
    return res.status(400).json({ message: "Invalid or expired verification code" });
  }

  // Check if the new password is already hashed
  const isHashed = /^\$2[aby]\$\d{2}\$/.test(newPassword);
  let hashedPassword;
  if (!isHashed) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(newPassword, salt);
  } else {
    hashedPassword = newPassword;
  }

  // Update password and clear reset tokens
  await User.updateOne(
    { email, role: "admin" },
    {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    }
  );

  console.log("Password Reset Successfully for Admin:", email);

  res.json({ message: "Password updated successfully" });
});



// Make admin
const makeAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields (name, email, password) are required." });
  }

  console.log("Make Admin: Incoming Data:", { name, email, password });

  let user = await User.findOne({ email });

  if (user) {
    // Update existing user to admin
    user.firstname = name.split(" ")[0];
    user.lastname = name.split(" ")[1] || "";
    user.role = "admin";

    // Only set the plain text password, hashing is handled by the pre-save hook
    user.password = password;

    await user.save();
    console.log("Make Admin: Updated user to admin:", user);
    return res.status(200).json({ message: "User updated to admin successfully.", user });
  } else {
    // Create a new admin
    const newAdmin = await User.create({
      firstname: name.split(" ")[0],
      lastname: name.split(" ")[1] || "",
      email,
      password, // Save plain text password; it will be hashed by the pre-save hook
      role: "admin",
      gender: "Not specified",
      dateOfBirth: "2000-01-01",
      mobile: "N/A",
    });

    console.log("Make Admin: Created new admin:", newAdmin);
    return res.status(201).json({ message: "New admin created successfully.", user: newAdmin });
  }
});




// Retrieve all admins
const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: "admin" }).select("-password"); // Exclude password field
  res.status(200).json({ message: "Admins retrieved successfully.", admins });
});

// Delete an admin
const deleteAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("Deleting Admin with ID:", id);

  const admin = await User.findById(id);

  if (!admin || admin.role !== "admin") {
    console.error("Admin not found or invalid admin ID.");
    return res.status(404).json({ message: "Admin not found or invalid admin ID." });
  }

  // Use deleteOne instead of remove
  await User.deleteOne({ _id: id });

  console.log("Admin deleted successfully:", id);

  res.status(200).json({ message: "Admin deleted successfully." });
});


module.exports = {
  adminLogin,
  sendVerificationCode,
  verifyCode,
  setNewPassword,
  makeAdmin,
  getAllAdmins,
  deleteAdmin,
};
