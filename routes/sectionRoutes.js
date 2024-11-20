const express = require("express");
const router = express.Router();
const { addSection, editSection, getAllSections } = require("../controller/sectionController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/section", authMiddleware, isAdmin, addSection);
router.put("/section/:id", authMiddleware, isAdmin, editSection);
router.get("/sections", authMiddleware, isAdmin, getAllSections);

module.exports = router;
