const Question = require("../models/Question");
const asyncHandler = require("express-async-handler");

// Add a new question
const addQuestion = asyncHandler(async (req, res) => {
  const { sectionId, text } = req.body;

  const question = await Question.create({ sectionId, text });
  res.status(201).json({ message: "Question added successfully", question });
});

// Edit an existing question
const editQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  const question = await Question.findByIdAndUpdate(id, { text }, { new: true });
  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  res.json({ message: "Question updated successfully", question });
});

// Get questions by section
const getQuestionsBySection = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;

  const questions = await Question.find({ sectionId });
  res.json(questions);
});

module.exports = { addQuestion, editQuestion, getQuestionsBySection };
