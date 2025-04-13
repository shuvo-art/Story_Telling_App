const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  question: { type: String, required: true },
  userAnswer: { type: String, required: false, default: "" },
  botResponse: { type: String },
  isSubQuestion: { type: Boolean, default: false },
  storyGenerated: { type: Boolean, default: false },
});

const episodeSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true }, // English title
    es: { type: String, required: true }, // Spanish title
  },
  coverImage: { type: String, default: "" },
  percentage: { type: Number, default: 0 },
  conversations: [ conversationSchema ],
});

const bookSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    episodes: [episodeSchema],
    coverImage: { type: String, default: "" },
    finalizedAt: { type: Date },
    status: { type: String, enum: ["draft", "final"], default: "draft" },
    percentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);