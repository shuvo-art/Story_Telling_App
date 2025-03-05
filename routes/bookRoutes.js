const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Question = require("../models/Question");
const Section = require("../models/Section");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { cloudinaryStorage } = require("../config/cloudinary");
const multer = require("multer");
const axios = require("axios");

const upload = multer({ storage: cloudinaryStorage });

// Create a new book with episodes from existing sections
router.post("/create", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    const title = req.body.title ? req.body.title.trim() : "";
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const coverImage = req.file ? req.file.path : "";
    const sections = await Section.find(); // Fetch all sections
    const episodes = sections.map((section) => ({
      title: section.name,
      coverImage: "",
      percentage: 0,
      conversations: [],
    }));

    const book = await Book.create({
      userId: req.user._id,
      title,
      episodes,
      coverImage,
      percentage: 0,
      status: "draft",
    });

    res.status(201).json({ message: "Book created successfully", book });
  } catch (error) {
    console.error("Error Creating Book:", error);
    res.status(500).json({ error: "Error creating book", details: error.message });
  }
});

// Get all books for a specific user
router.get("/user-books", authMiddleware, async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user._id });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: "Error fetching books", details: error.message });
  }
});

// Get a single book by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: "Error fetching book", details: error.message });
  }
});

// Update a book
router.put("/:id", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, percentage } = req.body;
    let updateData = {};
    if (title) updateData.title = title;
    if (percentage !== undefined) updateData.percentage = parseInt(percentage);
    if (req.file) updateData.coverImage = req.file.path;

    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "Book updated successfully", book });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Error updating book", details: error.message });
  }
});

// Delete a book
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting book", details: error.message });
  }
});

// Get all episodes of a book
router.get("/:bookId/episodes", authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.bookId, userId: req.user._id }).populate(
      "episodes.conversations"
    );
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const episodesWithConversations = book.episodes.map((episode, index) => ({
      episodeIndex: index,
      title: episode.title,
      coverImage: episode.coverImage,
      percentage: episode.percentage,
      _id: episode._id,
      conversations: episode.conversations,
    }));

    res.json(episodesWithConversations);
  } catch (error) {
    console.error("Error fetching episodes:", error);
    res.status(500).json({ error: "Error fetching episodes", details: error.message });
  }
});

// Get a specific episode by index
router.get("/:bookId/episode/:episodeIndex", authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.bookId, userId: req.user._id }).populate(
      "episodes.conversations"
    );
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const episodeIndex = parseInt(req.params.episodeIndex);
    if (!book.episodes || episodeIndex < 0 || episodeIndex >= book.episodes.length) {
      return res.status(404).json({ error: "Episode not found" });
    }

    const episode = book.episodes[episodeIndex];
    res.json({
      episodeIndex,
      title: episode.title,
      coverImage: episode.coverImage,
      percentage: episode.percentage,
      _id: episode._id,
      conversations: episode.conversations,
    });
  } catch (error) {
    console.error("Error fetching episode:", error);
    res.status(500).json({ error: "Error fetching episode", details: error.message });
  }
});

// Update an episode (only coverImage and percentage)
router.put("/:bookId/episode/:episodeIndex", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    const { percentage } = req.body;
    const bookId = req.params.bookId;
    const episodeIndex = parseInt(req.params.episodeIndex);

    const book = await Book.findOne({ _id: bookId, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (!book.episodes || episodeIndex < 0 || episodeIndex >= book.episodes.length) {
      return res.status(404).json({ error: "Episode not found" });
    }

    const episode = book.episodes[episodeIndex];
    let updateFields = {};

    if (percentage !== undefined) {
      const parsedPercentage = parseInt(percentage);
      if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
        return res.status(400).json({ error: "Percentage must be a number between 0 and 100" });
      }
      updateFields["episodes.$.percentage"] = parsedPercentage;
    }

    if (req.file) {
      updateFields["episodes.$.coverImage"] = req.file.path;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No valid fields provided to update" });
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, userId: req.user._id, "episodes._id": episode._id },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ error: "Book or episode not found during update" });
    }

    const updatedEpisode = updatedBook.episodes[episodeIndex];
    res.json({
      message: "Episode updated successfully",
      episodeIndex,
      episode: {
        title: updatedEpisode.title,
        coverImage: updatedEpisode.coverImage,
        percentage: updatedEpisode.percentage,
        _id: updatedEpisode._id,
        conversations: updatedEpisode.conversations,
      },
    });
  } catch (error) {
    console.error("Error updating episode:", error);
    res.status(500).json({ error: "Error updating episode", details: error.message });
  }
});

// Delete an episode (optional, might not be needed since episodes are tied to sections)
router.delete("/:bookId/episode/:episodeIndex", authMiddleware, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const episodeIndex = parseInt(req.params.episodeIndex);

    const book = await Book.findOne({ _id: bookId, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (!book.episodes || episodeIndex < 0 || episodeIndex >= book.episodes.length) {
      return res.status(404).json({ error: "Episode not found" });
    }

    book.episodes.splice(episodeIndex, 1);
    await book.save();

    const updatedEpisodes = book.episodes.map((episode, index) => ({
      episodeIndex: index,
      title: episode.title,
      coverImage: episode.coverImage,
      percentage: episode.percentage,
      _id: episode._id,
    }));

    res.json({
      message: "Episode deleted successfully",
      book: { ...book.toObject(), episodes: updatedEpisodes },
    });
  } catch (error) {
    console.error("Error deleting episode:", error);
    res.status(500).json({ error: "Error deleting episode", details: error.message });
  }
});

// Start a conversation (fetch first question)
router.get("/:bookId/episode/:episodeIndex/start-conversation", authMiddleware, async (req, res) => {
  try {
    const { bookId, episodeIndex } = req.params;
    const book = await Book.findOne({ _id: bookId, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const epIndex = parseInt(episodeIndex);
    if (!book.episodes || epIndex < 0 || epIndex >= book.episodes.length) {
      return res.status(404).json({ error: "Episode not found" });
    }

    const episode = book.episodes[epIndex];
    const section = await Section.findOne({ name: episode.title });
    if (!section) {
      return res.status(404).json({ error: "Corresponding section not found" });
    }

    const firstQuestion = await Question.findOne({ sectionId: section._id }).sort({ createdAt: 1 });
    if (!firstQuestion) {
      return res.status(404).json({ error: "No questions found for this episode" });
    }

    res.json({ question: firstQuestion.text, questionId: firstQuestion._id });
  } catch (error) {
    console.error("Error starting conversation:", error);
    res.status(500).json({ error: "Error starting conversation", details: error.message });
  }
});

// Process user answer
router.post("/:bookId/episode/:episodeIndex/answer", authMiddleware, async (req, res) => {
  try {
    const { question, userAnswer, questionId } = req.body;
    const { bookId, episodeIndex } = req.params;

    const book = await Book.findOne({ _id: bookId, userId: req.user._id }).populate(
      "episodes.conversations"
    );
    if (!book || !book.episodes || episodeIndex < 0 || episodeIndex >= book.episodes.length) {
      return res.status(404).json({ error: "Book or Episode not found" });
    }

    const episode = book.episodes[episodeIndex];
    if (!episode.conversations) episode.conversations = [];

    let botResponse = "Thank you! Let's move to the next question.";
    let isSubQuestion = false;

    // Check relevancy with AI
    try {
      const aiResponse = await axios.post("http://144.126.209.250/CQ_relevancy_check/", {
        C_Q: question,
        C_Q_A: userAnswer,
      });

      if (aiResponse.data.status !== "success") {
        const subQuestionResponse = await axios.post("http://144.126.209.250/generate_sub_question/", {
          M_Q: question,
          M_Q_A: userAnswer,
        });

        botResponse = subQuestionResponse.data.content[0] || "Could you clarify your answer?";
        isSubQuestion = true;
      }
    } catch (aiError) {
      botResponse = "AI processing failed. Please try again.";
    }

    episode.conversations.push({
      question,
      userAnswer,
      botResponse,
      isSubQuestion,
    });

    await book.save();

    res.json({ message: "Answer processed", botResponse, isSubQuestion });
  } catch (error) {
    console.error("Error processing answer:", error);
    res.status(500).json({ error: "Error processing answer", details: error.message });
  }
});

// Fetch next question
router.get("/:bookId/episode/:episodeIndex/next-question", authMiddleware, async (req, res) => {
  try {
    const { bookId, episodeIndex } = req.params;
    const book = await Book.findOne({ _id: bookId, userId: req.user._id });
    if (!book || !book.episodes || episodeIndex < 0 || episodeIndex >= book.episodes.length) {
      return res.status(404).json({ error: "Book or Episode not found" });
    }

    const episode = book.episodes[episodeIndex];
    const section = await Section.findOne({ name: episode.title });
    if (!section) {
      return res.status(404).json({ error: "Corresponding section not found" });
    }

    // Count non-subquestions in conversations to determine the next pre-added question
    const answeredPreQuestions = episode.conversations.filter((conv) => !conv.isSubQuestion).length;
    const questions = await Question.find({ sectionId: section._id }).sort({ createdAt: 1 });

    if (answeredPreQuestions >= questions.length) {
      return res.status(404).json({ message: "No more pre-added questions available" });
    }

    const nextQuestion = questions[answeredPreQuestions];
    res.json({ question: nextQuestion.text, questionId: nextQuestion._id });
  } catch (error) {
    console.error("Error fetching next question:", error);
    res.status(500).json({ error: "Error fetching next question", details: error.message });
  }
});

// Generate story
router.post("/:bookId/episode/:episodeIndex/generate-story", authMiddleware, async (req, res) => {
  try {
    const { bookId, episodeIndex } = req.params;
    const book = await Book.findOne({ _id: bookId, userId: req.user._id });
    if (!book || !book.episodes || episodeIndex < 0 || episodeIndex >= book.episodes.length) {
      return res.status(404).json({ error: "Book or Episode not found" });
    }

    const episode = book.episodes[episodeIndex];
    if (!episode.conversations || episode.conversations.length === 0) {
      return res.status(400).json({ error: "No conversation history to generate a story" });
    }

    const questions = episode.conversations.map((conv) => conv.question);
    const answers = episode.conversations.map((conv) => conv.userAnswer);

    let generatedStory = "Story generation failed.";
    try {
      const storyResponse = await axios.post("http://144.126.209.250/story_generator/", {
        questions,
        answers,
      });
      generatedStory = storyResponse.data.refined_story || "Story could not be generated.";
    } catch (aiError) {
      console.error("Story generation API error:", aiError.message);
    }

    episode.conversations.push({
      question: "Generated Story",
      userAnswer: "", // This is now valid since userAnswer is optional
      botResponse: generatedStory,
      storyGenerated: true,
    });

    await book.save();

    res.json({ message: "Story generated successfully", story: generatedStory });
  } catch (error) {
    console.error("Error generating story:", error);
    res.status(500).json({ error: "Error generating story", details: error.message });
  }
});

module.exports = router;