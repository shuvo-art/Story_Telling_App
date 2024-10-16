const express = require("express");
const {
  createStation,
  updateStation,
  getStations,
  getStationById,
} = require("../controller/stationController");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, isAdmin, createStation);
router.put("/:id", authMiddleware, isAdmin, updateStation);
router.get("/", getStations);
router.get("/:id", getStationById);

module.exports = router;
