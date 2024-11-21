const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const passport = require("passport");

const {
  googleAuth,
  createUser,
  loginUserCtrl,
  forgotPassword,
  resetPassword,
  setPreferredLanguage,
  editUserProfile,
  getUserById,
  logoutUser,
  deleteUser,
} = require("../controller/userCtrl");

const {
  adminLogin,
  sendVerificationCode,
  verifyCode,
  setNewPassword,
  makeAdmin,
  getAllAdmins,
  deleteAdmin,
} = require("../controller/adminCtrl");

const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { profileUpload, profileImgResize } = require("../middlewares/uploadImages");

// Initialize Passport for OAuth
require("../passportConfig");

// Set up multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* // Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    const token = generateToken(req.user._id);
    console.log(token);
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  }
); */

// *** User Authentication and Profile Routes ***
router.post("/register", profileUpload.single("profilePicture"), profileImgResize, createUser);
router.post("/login", loginUserCtrl);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.put(
  "/edit-profile",
  authMiddleware,
  profileUpload.single("profilePicture"),
  profileImgResize,
  editUserProfile
);
router.put("/set-preferred-language", authMiddleware, setPreferredLanguage);
router.get("/profile/:id", authMiddleware, getUserById);
router.post("/logout", authMiddleware, logoutUser);
router.delete("/delete-user", authMiddleware, deleteUser);

// *** Admin Authentication and Management Routes ***
// Admin login and password reset routes (removed authMiddleware and isAdmin)
router.post("/admin/login", adminLogin);
router.post("/admin/forgot-password", sendVerificationCode);
router.post("/verify-code", verifyCode);
router.post("/admin/set-new-password", setNewPassword);

// Admin management routes
router.post("/make-admin", authMiddleware, isAdmin, makeAdmin); // Make an existing user or new user admin
router.get("/get-all-admins", authMiddleware, isAdmin, getAllAdmins); // Retrieve all admins
router.delete("/delete-admin/:id", authMiddleware, isAdmin, deleteAdmin); // Delete an admin by ID

// *** OAuth Routes ***
router.post("/google-auth", googleAuth);

// Apple OAuth (optional example for future use)
router.get(
  "/apple",
  passport.authenticate("apple", { scope: ["name", "email"] })
);
router.get(
  "/apple/callback",
  passport.authenticate("apple", { failureRedirect: "/login", session: false }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  }
);

module.exports = router;
