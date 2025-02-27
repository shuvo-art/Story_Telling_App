const express = require("express");
const router = express.Router();
const {
  addQuestion,
  editQuestion,
  deleteQuestion,
  getQuestionsBySection,
} = require("../controller/questionController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/question", authMiddleware, addQuestion);
router.put("/question/:id", authMiddleware, editQuestion); // Edit a single question
router.delete("/question/:id", authMiddleware, isAdmin, deleteQuestion);
router.get("/questions/:sectionId", authMiddleware, getQuestionsBySection);

module.exports = router;
