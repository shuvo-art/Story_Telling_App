const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { cloudinaryStorage } = require("../config/cloudinary");
const multer = require("multer");

const upload = multer({ storage: cloudinaryStorage });

// Create a new book (coverImage is now optional)
router.post("/create", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    console.log("Received Body:", req.body);
    console.log("Received File:", req.file);

    // Trim title to remove extra spaces
    const title = req.body.title ? req.body.title.trim() : "";

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // If a file is uploaded, use its path; otherwise, use an empty string
    const coverImage = req.file ? req.file.path : "";

    const book = await Book.create({
      userId: req.user._id,
      title,
      coverImage,
      percentage: 0,
      status: "draft",
    });

    res.status(201).json({ message: "Book created successfully", book });
  } catch (error) {
    console.error("Error Creating Book: ", error);
    res.status(500).json({ error: "Error creating book", details: error.message });
  }
});

// Get all books for a specific user
router.get("/user-books", authMiddleware, async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user._id });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: "Error fetching books" });
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
    res.status(500).json({ error: "Error fetching book" });
  }
});

// Update a book
router.put("/:id", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, percentage } = req.body;
    let updateData = { title, percentage };

    if (req.file) {
      updateData.coverImage = req.file.path;
    }

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
    res.status(500).json({ error: "Error updating book" });
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
    res.status(500).json({ error: "Error deleting book" });
  }
});


/**
 * Add an episode to a book
 */
router.post("/:bookId/episode", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    const { title } = req.body;
    const bookId = req.params.bookId;

    if (!title) {
      return res.status(400).json({ error: "Episode title is required" });
    }

    const coverImage = req.file ? req.file.path : "";
    const newEpisode = { title, coverImage, percentage: 0 };

    const book = await Book.findOneAndUpdate(
      { _id: bookId, userId: req.user._id },
      { $push: { chapters: newEpisode } },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Add episodeIndex for tracking
    const updatedEpisodes = book.chapters.map((episode, index) => ({
      episodeIndex: index,
      ...episode.toObject(),
    }));

    res.status(201).json({
      message: "Episode added successfully",
      book: { ...book.toObject(), chapters: updatedEpisodes },
    });
  } catch (error) {
    console.error("Error Adding Episode:", error);
    res.status(500).json({ error: "Error adding episode", details: error.message });
  }
});

/**
 * Get all episodes of a book with episodeIndex
 */
router.get("/:bookId/episodes", authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.bookId, userId: req.user._id });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Add episodeIndex
    const episodesWithIndex = book.chapters.map((episode, index) => ({
      episodeIndex: index,
      ...episode.toObject(),
    }));

    res.json(episodesWithIndex);
  } catch (error) {
    res.status(500).json({ error: "Error fetching episodes" });
  }
});

/**
 * Get a specific episode by index
 */
router.get("/:bookId/episode/:episodeIndex", authMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.bookId, userId: req.user._id });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const episodeIndex = parseInt(req.params.episodeIndex);
    const episode = book.chapters[episodeIndex];

    if (!episode) {
      return res.status(404).json({ error: "Episode not found" });
    }

    res.json({ episodeIndex, ...episode.toObject() });
  } catch (error) {
    res.status(500).json({ error: "Error fetching episode" });
  }
});

/**
 * Update an episode in a book
 */
router.put("/:bookId/episode/:episodeIndex", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, percentage } = req.body;
    const bookId = req.params.bookId;
    const episodeIndex = parseInt(req.params.episodeIndex);

    const book = await Book.findOne({ _id: bookId, userId: req.user._id });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (!book.chapters[episodeIndex]) {
      return res.status(404).json({ error: "Episode not found" });
    }

    if (title) book.chapters[episodeIndex].title = title;
    if (percentage !== undefined) book.chapters[episodeIndex].percentage = percentage;
    if (req.file) book.chapters[episodeIndex].coverImage = req.file.path;

    await book.save();

    res.json({ message: "Episode updated successfully", episodeIndex, book });
  } catch (error) {
    res.status(500).json({ error: "Error updating episode" });
  }
});

/**
 * Delete an episode from a book
 */
router.delete("/:bookId/episode/:episodeIndex", authMiddleware, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const episodeIndex = parseInt(req.params.episodeIndex);

    const book = await Book.findOne({ _id: bookId, userId: req.user._id });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (!book.chapters[episodeIndex]) {
      return res.status(404).json({ error: "Episode not found" });
    }

    book.chapters.splice(episodeIndex, 1);
    await book.save();

    // Add updated episode indexes
    const updatedEpisodes = book.chapters.map((episode, index) => ({
      episodeIndex: index,
      ...episode.toObject(),
    }));

    res.json({ message: "Episode deleted successfully", book: { ...book.toObject(), chapters: updatedEpisodes } });
  } catch (error) {
    res.status(500).json({ error: "Error deleting episode" });
  }
});

module.exports = router;
