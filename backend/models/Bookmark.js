const mongoose = require("mongoose");

// Bookmarks for the user dashboard
const BookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  },
  { timestamps: true }
);

BookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", BookmarkSchema);