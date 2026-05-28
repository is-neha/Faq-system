const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    tags: [{ type: String }],
    // 3-state lifecycle: URQ → PAQ → FAQ
    state: {
      type: String,
      enum: ["URQ", "PAQ", "FAQ"],
      default: "URQ",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Question upvotes = Urgency signal
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    // Flagged when an answer crosses FAQ_UPVOTE_THRESHOLD
    flaggedForReview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text index for real-time search
QuestionSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Question", QuestionSchema);