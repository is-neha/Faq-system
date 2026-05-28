const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: String }],
    state: {
      type: String,
      enum: ["URQ", "PAQ", "FAQ"],
      default: "URQ",
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    flaggedForReview: { type: Boolean, default: false },
    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer" }],
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
QuestionSchema.index({ state: 1, createdAt: -1 });          // main list (URQ+PAQ by date)
QuestionSchema.index({ state: 1, upvotes: -1 });             // urgency sort
QuestionSchema.index({ state: 1, flaggedForReview: 1 });    // admin review queue
QuestionSchema.index({ author: 1 });                         // user's questions
QuestionSchema.index({ category: 1 });                       // category filter

// Text index for future full-text search (not currently used — fuzzy regex used instead)
QuestionSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Question", QuestionSchema);