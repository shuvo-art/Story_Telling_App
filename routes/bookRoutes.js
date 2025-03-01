const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { cloudinaryStorage } = require("../config/cloudinary");
const multer = require("multer");

const upload = multer({ storage: cloudinaryStorage });

// Create a new book
router.post("/create", authMiddleware, upload.single("coverImage"), async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Cover image is required" });
    }

    const coverImage = req.file.path;
    console.log("Book Creation: ", { title: req.body.title, coverImage });

    const book = await Book.create({
      userId: req.user._id,
      title: req.body.title,
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

module.exports = router;
