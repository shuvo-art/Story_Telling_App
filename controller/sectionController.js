const Section = require("../models/Section");
const asyncHandler = require("express-async-handler");

// Add a new section
const addSection = asyncHandler(async (req, res) => {
  const { name, numberOfQuestions } = req.body;

  const section = await Section.create({ name, numberOfQuestions });
  res.status(201).json({ message: "Section added successfully", section });
});

// Edit an existing section
const editSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, numberOfQuestions, published } = req.body;

  const section = await Section.findByIdAndUpdate(id, { name, numberOfQuestions, published }, { new: true });
  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }

  res.json({ message: "Section updated successfully", section });
});

// Get all sections
const getAllSections = asyncHandler(async (req, res) => {
  const sections = await Section.find();
  res.json(sections);
});

module.exports = { addSection, editSection, getAllSections };
