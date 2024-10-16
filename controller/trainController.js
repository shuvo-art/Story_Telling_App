const Train = require("../models/trainModel");
const asyncHandler = require("express-async-handler");

// Create a new train and its stops
const createTrain = asyncHandler(async (req, res) => {
  const train = await Train.create(req.body);
  res.status(201).json(train);
});

// Update train schedule and stops
const updateTrain = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const train = await Train.findByIdAndUpdate(id, req.body, { new: true });
  if (!train) {
    res.status(404);
    throw new Error("Train not found");
  }
  res.json(train);
});

// Retrieve all train schedules
const getTrains = asyncHandler(async (req, res) => {
  const trains = await Train.find().populate("stops.station");
  res.json(trains);
});

// Retrieve a single train by ID
const getTrainById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const train = await Train.findById(id).populate("stops.station");
  if (!train) {
    res.status(404);
    throw new Error("Train not found");
  }
  res.json(train);
});

module.exports = {
  createTrain,
  updateTrain,
  getTrains,
  getTrainById,
};
