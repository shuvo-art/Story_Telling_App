const Section = require("../models/Section");
const Question = require("../models/Question");
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

// Delete a section
const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the section
  const section = await Section.findById(id);
  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }

  // Delete associated questions
  await Question.deleteMany({ sectionId: id });

  // Delete the section
  await Section.findByIdAndDelete(id);

  res.json({ message: "Section deleted successfully", section });
});

// Get all sections
const getAllSections = asyncHandler(async (req, res) => {
  const sections = await Section.find();
  const sectionsWithCounts = await Promise.all(
    sections.map(async (section) => {
      const questionsCount = await Question.countDocuments({ sectionId: section._id });
      return { ...section.toObject(), questionsCount };
    })
  );

  res.json(sectionsWithCounts);
});

module.exports = { addSection, editSection, deleteSection, getAllSections };
