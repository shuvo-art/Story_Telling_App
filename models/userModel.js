const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    profilePicture: { type: String, default: "" },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true, default: "N/A" },
    location: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other", "Not specified"], required: true },
    dateOfBirth: { type: Date, required: true, default: "2000-01-01" },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBlocked: { type: Boolean, default: false },
    refreshToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    preferredLanguage: { type: String, default: "English" },
    subscriptionType: { type: String, enum: ["Free", "Premium"], default: "Free" },
    income: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Middleware to hash passwords before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    console.log("Password not modified, skipping hash.");
    return next();
  }

  console.log("Hashing password...");
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log("Hashed Password:", this.password);
  next();
});


userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  try {
    console.log("Password Comparison Inputs:", {
      enteredPassword,
      storedPassword: this.password,
    });

    const isMatch = await bcrypt.compare(enteredPassword, this.password);

    console.log("Password Comparison Result:", {
      enteredPassword,
      storedPassword: this.password,
      isMatch,
    });

    return isMatch;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};


module.exports = mongoose.model("User", userSchema);
