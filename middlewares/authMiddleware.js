const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

// Middleware for authenticating the user using JWT token
const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  // Check if the Authorization header contains a Bearer token
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]; // Extract the token
    try {
      if (token) {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find the user by ID decoded from the token
        const user = await User.findById(decoded?.id);
        if (!user) {
          throw new Error("User not found");
        }
        // Attach the user object to the request for future middleware/routes
        req.user = user;
        next();
      }
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("No token attached to the header");
  }
});

// Middleware for checking if the user has admin privileges
const isAdmin = asyncHandler(async (req, res, next) => {
  const { role } = req.user;
  // Ensure the user is an admin
  if (role !== "admin") {
    res.status(403);
    throw new Error("You are not an Admin");
  } else {
    next();
  }
});

module.exports = {
  authMiddleware,
  isAdmin,
};
