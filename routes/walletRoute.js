const express = require("express");
const { addFunds, getWallet } = require("../controller/walletController");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/add", authMiddleware, addFunds);
router.get("/", authMiddleware, getWallet);

module.exports = router;
