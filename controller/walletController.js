const Wallet = require("../models/walletModel");
const asyncHandler = require("express-async-handler");

// Add funds to the wallet
const addFunds = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const wallet = await Wallet.findOneAndUpdate(
    { user: req.user._id },
    {
      $inc: { balance: amount },
      $push: { transactions: { type: "Credit", amount } }, // No changes needed here
    },
    { new: true, upsert: true }
  );
  res.json(wallet);
});

// Retrieve wallet balance and transaction history
const getWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet) {
    res.status(404);
    throw new Error("Wallet not found");
  }
  res.json(wallet);
});

module.exports = {
  addFunds,
  getWallet,
};
