const Ticket = require("../models/ticketModel");
const Wallet = require("../models/walletModel");
const asyncHandler = require("express-async-handler");

// Purchase a ticket using wallet balance
const purchaseTicket = asyncHandler(async (req, res) => {
  const { train, fromStation, toStation, fare } = req.body;
  const wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet || wallet.balance < fare) {
    res.status(400);
    throw new Error("Insufficient balance");
  }

  // Deduct fare from wallet
  wallet.balance -= fare;
  wallet.transactions.push({ type: "Debit", amount: fare });
  await wallet.save();

  // Create a new ticket
  const ticket = await Ticket.create({
    user: req.user._id,
    train,
    fromStation,
    toStation,
    fare,
  });

  res.status(201).json(ticket);
});

module.exports = {
  purchaseTicket,
};
