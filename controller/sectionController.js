const Section = require("../models/Section");
const Question = require("../models/Question");
const asyncHandler = require("express-async-handler");

const addSection = asyncHandler(async (req, res) => {
  const { name, numberOfQuestions, episodeIndex } = req.body;

  // Validate the name object
  if (!name || !name.en || !name.es) {
    return res.status(400).json({ message: "Name must include both English (en) and Spanish (es) versions." });
  }

  if (episodeIndex !== undefined && episodeIndex < 0) {
    return res.status(400).json({ message: "episodeIndex must be a non-negative number if provided." });
  }

  const section = await Section.create({ name, numberOfQuestions, episodeIndex });
  res.status(201).json({ message: "Section added successfully", section });
});

const editSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, numberOfQuestions, published, episodeIndex } = req.body;

  // Validate the name object if provided
  if (name && (!name.en || !name.es)) {
    return res.status(400).json({ message: "Name must include both English (en) and Spanish (es) versions." });
  }

  const section = await Section.findByIdAndUpdate(
    id,
    { name, numberOfQuestions, published, episodeIndex },
    { new: true }
  );
  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }

  res.json({ message: "Section updated successfully", section });
});

const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const section = await Section.findById(id);
  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }

  await Question.deleteMany({ sectionId: id });
  await Section.findByIdAndDelete(id);

  res.json({ message: "Section deleted successfully", section });
});

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