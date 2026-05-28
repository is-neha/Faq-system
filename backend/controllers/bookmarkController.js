const Bookmark = require("../models/Bookmark");
const Question = require("../models/Question");

// POST /bookmarks — Bookmark a question
const addBookmark = async (req, res) => {
  try {
    const { questionId } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const existing = await Bookmark.findOne({
      userId: req.user._id,
      questionId,
    });

    if (existing) {
      return res.status(400).json({ message: "Already bookmarked" });
    }

    const bookmark = new Bookmark({
      userId: req.user._id,
      questionId,
    });

    await bookmark.save();
    res.status(201).json(bookmark);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /bookmarks — Get current user's bookmarks
const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user._id })
      .populate({
        path: "questionId",
        populate: [
          { path: "author", select: "name email reputation badges" },
          { path: "category", select: "name" },
        ],
      })
      .sort({ createdAt: -1 });

    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /bookmarks/:questionId — Remove bookmark
const removeBookmark = async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({
      userId: req.user._id,
      questionId: req.params.questionId,
    });

    res.json({ message: "Bookmark removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addBookmark, getBookmarks, removeBookmark };