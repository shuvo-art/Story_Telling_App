const Station = require("../models/stationModel");
const asyncHandler = require("express-async-handler");

// Create a new station
const createStation = asyncHandler(async (req, res) => {
  const station = await Station.create(req.body);
  res.status(201).json(station);
});

// Update station information
const updateStation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const station = await Station.findByIdAndUpdate(id, req.body, { new: true });
  if (!station) {
    res.status(404);
    throw new Error("Station not found");
  }
  res.json(station);
});

// Retrieve all stations
const getStations = asyncHandler(async (req, res) => {
  const stations = await Station.find();
  res.json(stations);
});

// Retrieve a single station by ID
const getStationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const station = await Station.findById(id);
  if (!station) {
    res.status(404);
    throw new Error("Station not found");
  }
  res.json(station);
});

module.exports = {
  createStation,
  updateStation,
  getStations,
  getStationById,
};
