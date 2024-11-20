const express = require("express");
const router = express.Router();
const { addQuestion, editQuestion, getQuestionsBySection } = require("../controller/questionController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/question", authMiddleware, isAdmin, addQuestion);
router.put("/question/:id", authMiddleware, isAdmin, editQuestion);
router.get("/questions/:sectionId", authMiddleware, isAdmin, getQuestionsBySection);

module.exports = router;
