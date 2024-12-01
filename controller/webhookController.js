const stripe = require("stripe")(process.env.STRIPE_KEY);
const User = require("../models/userModel");
const Order = require("../models/order");

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    // Construct the event object from the Stripe webhook payload
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;

      // Handle User Subscription Update
      if (session.metadata.userId && session.metadata.subscriptionType) {
        const userId = session.metadata.userId;
        const subscriptionType = session.metadata.subscriptionType;
        console.log(`User ${userId} completed a checkout session for ${subscriptionType} subscription`);

        try {
          const user = await User.findById(userId);
          if (user) {
            user.subscriptionType = subscriptionType; // Set the subscription type
            user.income = subscriptionType === "Premium" ? 20 : 0; // Set the income based on subscription type
            await user.save();
            console.log(`User ${userId} upgraded to ${subscriptionType}`);
            return res.status(200).json({ received: true }); // Ensure early return
          }
        } catch (error) {
          console.error("Error updating user subscription:", error);
          return res.status(500).send('Error updating user subscription');
        }
      }

      // Handle Order Update
      if (session.metadata.orderId) {
        const orderId = session.metadata.orderId;
        console.log(`Processing order update for Order ID: ${orderId}`);

        try {
          const order = await Order.findById(orderId);
          if (order) {
            const shippingAmount = session.total_details?.amount_shipping || 0;
            const shippingMethod = shippingAmount === 0 ? "free" : "next-day";
            const shippingAddress = session.shipping_details?.address || {};

            // Update the order with the payment information and shipping details
            await Order.findByIdAndUpdate(orderId, {
              paymentId: session.id,
              status: "confirmed",
              shippingAddress,
              shippingMethod,
              email: session.customer_details?.email,
              phone: session.customer_details?.phone,
              name: session.customer_details?.name,
            });

            console.log(`Order ${orderId} updated successfully`);
            return res.status(200).json({ received: true }); // Ensure early return
          } else {
            console.log(`Order ${orderId} not found`);
            return res.status(404).json({ message: "Order not found" }); // Ensure early return
          }
        } catch (error) {
          console.error("Error updating order:", error);
          return res.status(500).json({ message: "Error updating order", error }); // Ensure early return
        }
      }

      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return res.status(400).json({ message: "Event type not handled" });
  }

  // Return default if no early response was sent
  return res.status(200).send('Webhook processed successfully');
};

module.exports = { handleStripeWebhook };
