const express = require("express");
const { purchaseTicket } = require("../controller/ticketController");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/purchase", authMiddleware, purchaseTicket);

module.exports = router;
