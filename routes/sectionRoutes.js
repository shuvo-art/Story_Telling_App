const express = require("express");
const router = express.Router();
const { addSection, editSection, deleteSection, getAllSections } = require("../controller/sectionController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/section", authMiddleware, isAdmin, addSection);
router.put("/section/:id", authMiddleware, isAdmin, editSection);
router.delete("/section/:id", authMiddleware, isAdmin, deleteSection);
router.get("/sections", authMiddleware, isAdmin, getAllSections);

module.exports = router;
