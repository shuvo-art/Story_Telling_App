const stripe = require("stripe")(process.env.STRIPE_KEY);
const User = require("../models/userModel");

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      //console.log("Session:", session);

      const userId = session.metadata.userId;
      console.log(`User ${userId} completed a checkout session`);
      const subscriptionType = session.metadata.subscriptionType;
      console.log(`Subscription type: ${subscriptionType}`);

      // Update the user's subscription status
      try {
        const user = await User.findById(userId);
        console.log("User:", user);
        if (user) {
          user.subscriptionType = subscriptionType; // Update to Premium
          user.income = subscriptionType === "Premium" ? 20 : 0; // Set income based on subscription type
          await user.save();
          console.log(`User ${userId} upgraded to ${subscriptionType}`);
        }
      } catch (error) {
        console.error("Error updating user subscription:", error);
      }

      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};

module.exports = { handleStripeWebhook };
