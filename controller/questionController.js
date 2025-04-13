const Book = require("../models/Book");
const Section = require("../models/Section");
const Question = require("../models/Question");
const asyncHandler = require("express-async-handler");

const addQuestion = asyncHandler(async (req, res) => {
  const { sectionId, questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "Questions must be an array and not empty." });
  }

  let section = await Section.findById(sectionId);
  if (!section) {
    return res.status(404).json({ message: "Section not found." });
  }

  // Validate each question's text object
  for (const q of questions) {
    if (!q || !q.en || !q.es) {
      return res.status(400).json({ message: "Each question must include both English (en) and Spanish (es) text." });
    }
  }

  const questionDocs = questions.map((text) => ({ sectionId: section._id, text }));
  const savedQuestions = await Question.insertMany(questionDocs);

  section.numberOfQuestions += savedQuestions.length;
  await section.save();

  res.status(201).json({ message: "Questions added successfully", savedQuestions });
});

const editQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.en || !text.es) {
    return res.status(400).json({ message: "Question text must include both English (en) and Spanish (es) versions." });
  }

  const question = await Question.findByIdAndUpdate(id, { text }, { new: true });
  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  res.json({ message: "Question updated successfully", question });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findByIdAndDelete(id);
  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  const section = await Section.findById(question.sectionId);
  if (section) {
    section.numberOfQuestions -= 1;
    await section.save();
  }

  res.json({ message: "Question deleted successfully", question });
});

const getQuestionsBySection = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;
  const questions = await Question.find({ sectionId });
  res.json(questions);
});

module.exports = { addQuestion, editQuestion, deleteQuestion, getQuestionsBySection };