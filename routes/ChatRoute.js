const express = require("express");
const router = express.Router();
const ChatHistory = require("../models/ChatHistory");
const Book = require("../models/Book");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Save messy chat data
router.post("/save-chat", authMiddleware, async (req, res) => {
  const { prompts } = req.body;

  try {
    const chat = await ChatHistory.create({
      userId: req.user._id,
      prompts,
    });
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: "Error saving chat data" });
  }
});

// Fetch categorized chat data for engineers
router.get("/categorized-chats", async (req, res) => {
  try {
    const chats = await ChatHistory.find({ status: "categorized" });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

// Update categorized data
router.put("/categorize/:id", async (req, res) => {
  const { id } = req.params;
  const { categorizedData } = req.body;

  try {
    const chat = await ChatHistory.findByIdAndUpdate(
      id,
      { categorizedData, status: "categorized" },
      { new: true }
    );
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Error categorizing data" });
  }
});

// Generate a book
router.post("/generate-book", authMiddleware, async (req, res) => {
  const { title, chapters, coverImage } = req.body;

  try {
    const book = await Book.create({
      userId: req.user._id,
      title,
      chapters,
      coverImage,
    });
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: "Error generating book" });
  }
});

module.exports = router;
