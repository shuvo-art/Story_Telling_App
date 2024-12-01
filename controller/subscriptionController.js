const stripe = require("stripe")(process.env.STRIPE_KEY);
const User = require("../models/userModel");

const createSubscription = async (req, res) => {
  const { subscriptionType, price } = req.body;
  const userId = req.user._id.toString(); // Convert the userId to a string

  try {
    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Upgrade to ${subscriptionType}`,
            },
            unit_amount: price * 100, // Stripe requires the amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/order-cancel`,
      metadata: {
        userId: userId, // Ensure the userId is a string
        subscriptionType: subscriptionType,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createSubscription };
