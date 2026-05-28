const mongoose = require("mongoose");

// Tracks user votes to enforce one-user-one-vote per question or answer
const VoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Question or Answer ID
    targetType: {
      type: String,
      enum: ["Question", "Answer"],
      required: true,
    },
    voteType: {
      type: String,
      enum: ["upvote", "downvote"],
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate votes: one user, one target, one vote type
VoteSchema.index(
  { userId: 1, targetId: 1, targetType: 1, voteType: 1 },
  { unique: true }
);

module.exports = mongoose.model("Vote", VoteSchema);