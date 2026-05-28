const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    isOfficial: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
AnswerSchema.index({ questionId: 1 });          // fetch answers for a question
AnswerSchema.index({ questionId: 1, isOfficial: 1 }); // official answers for a question
AnswerSchema.index({ author: 1 });              // user's answers
AnswerSchema.index({ upvotes: -1 });            // best answers first

module.exports = mongoose.model("Answer", AnswerSchema);