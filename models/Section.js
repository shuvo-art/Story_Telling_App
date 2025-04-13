const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true }, // English name
    es: { type: String, required: true }  // Spanish name
  },
  numberOfQuestions: { type: Number, required: true, default: 0 },
  published: { type: Boolean, default: false },
  episodeIndex: { type: Number }, // Optional field
}, { timestamps: true });

module.exports = mongoose.model("Section", sectionSchema);