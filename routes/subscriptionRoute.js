const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const stripe = Stripe(process.env.STRIPE_KEY);
const Subscription = require("../models/subscription");
const User = require("../models/userModel");
const { sendEmail } = require("../controller/emailCtrl");

const subscriptionBenefits = {
  premium: [
    "Unlimited chat with the AI Chat Bot.",
    "Access Full Book.",
    "200 images in Book.",
    "Downloadable soft copy PDF book.",
    "$10 off on physical book.",
  ],
  lifetime_20: [
    "Unlimited chat with the AI Chat Bot.",
    "Access Full Book.",
    "200 images in Book.",
    "Downloadable soft copy PDF book.",
    "$10 off on physical book.",
    "Lifetime Access",
  ],
  lifetime_70: [
    "Unlimited chat with the AI Chat Bot.",
    "Access Full Book.",
    "200 images in Book.",
    "Downloadable soft copy PDF book.",
    "$10 off on physical book.",
    "Lifetime Access (Extended)",
  ],
};

// Create Subscription Route
router.post("/create-subscription", async (req, res) => {
  const { userId, subscriptionType } = req.body;

  try {
    const priceIdMapping = {
      premium: process.env.STRIPE_PREMIUM_PRICE_ID,
      lifetime_20: process.env.STRIPE_LIFETIME_20_PRICE_ID,
      lifetime_70: process.env.STRIPE_LIFETIME_70_PRICE_ID,
    };

    const priceId = priceIdMapping[subscriptionType];
    if (!priceId) {
      return res.status(400).json({ message: "Invalid subscription type." });
    }

    const customer = await stripe.customers.create({ metadata: { userId } });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const newSubscription = await Subscription.create({
      userId,
      subscriptionType,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      startDate: new Date(),
      endDate: subscriptionType === "premium" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      benefits: subscriptionBenefits[subscriptionType],
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      benefits: subscriptionBenefits[subscriptionType],
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Error creating subscription" });
  }
});

// Webhook Route
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const webhookSecret = process.env.STRIPE_WEB_HOOK;
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const { type, data } = event;

    switch (type) {
      case "customer.subscription.created":
        console.log("Subscription created:", data.object);
        break;
      case "customer.subscription.updated":
        console.log("Subscription updated:", data.object);
        break;
      case "customer.subscription.deleted":
        console.log("Subscription canceled:", data.object);
        break;
      default:
        console.log(`Unhandled event type ${type}`);
    }

    res.json({ received: true });
  }
);

module.exports = router;
