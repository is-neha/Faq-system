const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    // Answer upvotes = Accuracy / Verification progress
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    // Set to true by Admin upon FAQ promotion
    isOfficial: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Answer", AnswerSchema);