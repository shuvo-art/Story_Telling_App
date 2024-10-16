const express = require("express");
const {
  createTrain,
  updateTrain,
  getTrains,
  getTrainById,
} = require("../controller/trainController");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, isAdmin, createTrain);
router.put("/:id", authMiddleware, isAdmin, updateTrain);
router.get("/", getTrains);
router.get("/:id", getTrainById);

module.exports = router;
