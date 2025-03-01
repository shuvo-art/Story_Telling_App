const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  chapters: [{
    title: { type: String },
    content: { type: String },
    image: { type: String }, // Image URL
  }],
  coverImage: { type: String },
  finalizedAt: { type: Date },
  status: { type: String, enum: ["draft", "final"], default: "draft" },
  percentage: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema);
