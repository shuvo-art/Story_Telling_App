const Book = require("../models/Book");
const Section = require("../models/Section");
const Question = require("../models/Question");
const asyncHandler = require("express-async-handler");

const addQuestion = asyncHandler(async (req, res) => {
  const { bookId, episodeIndex, questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "Questions must be an array and not empty." });
  }

  const book = await Book.findOne({ _id: bookId });
  if (!book) {
    return res.status(404).json({ message: "Book not found." });
  }

  if (!book.episodes || episodeIndex < 0 || episodeIndex >= book.episodes.length) {
    return res.status(404).json({ message: "Episode not found." });
  }

  const episode = book.episodes[episodeIndex];
  let section = await Section.findOne({ _id: episode._id });
  if (!section) {
    section = await Section.create({
      _id: episode._id,
      name: episode.title,
      numberOfQuestions: 0,
    });
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

  if (!text) {
    return res.status(400).json({ message: "Question text is required." });
  }

  const question = await Question.findByIdAndUpdate(id, { text }, { new: true });
  if (!question) {
    return res.status(404).json({ message: "Question not found." });
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