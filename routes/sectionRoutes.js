const express = require("express");
const router = express.Router();
const { addSection, editSection, deleteSection, getAllSections } = require("../controller/sectionController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/section", authMiddleware, addSection);
router.put("/section/:id", authMiddleware, editSection);
router.delete("/section/:id", authMiddleware, isAdmin, deleteSection);
router.get("/sections", authMiddleware, getAllSections);

module.exports = router;
