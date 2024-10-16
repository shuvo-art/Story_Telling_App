const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Database connection failed: ", error);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = dbConnect;
