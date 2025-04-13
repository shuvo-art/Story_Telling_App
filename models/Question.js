const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
  text: {
    en: { type: String, required: true }, // English text
    es: { type: String, required: true }  // Spanish text
  },
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);