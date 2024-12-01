const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 5000;
const dbConnect = require("./config/dbConnect");
const authRouter = require("./routes/authRoute");
const subscriptionRouter = require("./routes/subscriptionRoute");
const couponRouter = require("./routes/couponRoute");
const chatRouter = require("./routes/ChatRoute");
const sectionRoutes = require("./routes/sectionRoutes");
const questionRoutes = require("./routes/questionRoutes");
const policyRoutes = require("./routes/policyRoutes");
const orderRouter = require("./routes/orderRoute");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const bodyParser = require('body-parser');
const { handleStripeWebhook } = require('./controller/webhookController');

const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const passport = require("passport");

dbConnect();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(morgan("dev"));
app.use(cookieParser());

// Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "public/images/profiles")));

// Raw body parser for Stripe webhook signature verification
app.post('/api/subscription/webhook', bodyParser.raw({ type: 'application/json' }), handleStripeWebhook);

// Order-specific webhook route (raw body)
app.use("/api/order/webhook", express.raw({ type: "application/json" }));
//app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));
  // For general routes
app.use(express.json());
// Route middlewares
app.use("/api/user", authRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/chat", chatRouter);
app.use("/api/section", sectionRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/order", orderRouter);

// Error Handling
app.use(notFound);
app.use(errorHandler);
app.use(passport.initialize());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
