const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Vote = require("../models/Vote");
const Bookmark = require("../models/Bookmark");
const User = require("../models/User");

// Helper: Award reputation points
const awardReputation = async (userId, points) => {
  await User.findByIdAndUpdate(userId, { $inc: { reputation: points } });
};

// Build a fuzzy regex from a search query string.
// Matches all words anywhere in the text, in any order.
// e.g. "how do I"  →  /how.*do.*i/i
const buildFuzzyRegex = (search) => {
  const words = search.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const pattern = words.map((w) => `(?=.*${w})`).join("") + ".*";
  return new RegExp(pattern, "i");
};

// GET /questions — Search + filter by state
const getQuestions = async (req, res) => {
  try {
    const { search, state, category, sort } = req.query;

    let query = {};

    // Fuzzy search: matches all words anywhere in title/description, in any order
    if (search) {
      const fuzzyRegex = buildFuzzyRegex(search);
      if (fuzzyRegex) {
        query.$or = [
          { title: fuzzyRegex },
          { description: fuzzyRegex },
        ];
      }
    }

    // Filter by lifecycle state
    if (state && ["URQ", "PAQ", "FAQ"].includes(state)) {
      query.state = state;
    }

    if (category) {
      query.category = category;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "urgency") {
      sortOption = { upvotes: -1, createdAt: -1 };
    } else if (sort === "views") {
      sortOption = { views: -1 };
    }

    const questions = await Question.find(query)
      .populate("author", "name email reputation badges")
      .populate("category", "name")
      .sort(sortOption);

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /questions/:id
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("author", "name email reputation badges")
      .populate("category", "name");

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Increment view count
    question.views += 1;
    await question.save();

    // Get answers
    const answers = await Answer.find({ questionId: question._id })
      .populate("author", "name email reputation badges")
      .sort({ upvotes: -1, createdAt: 1 });

    res.json({ question, answers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /questions — Submit new URQ
const addQuestion = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    const question = new Question({
      title,
      description,
      category,
      tags: tags || [],
      state: "URQ", // Always starts as Unresolved
      author: req.user._id,
    });

    await question.save();

    // Award reputation for asking
    await awardReputation(req.user._id, 5);

    await question.populate("author", "name email reputation badges");
    await question.populate("category", "name");

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /questions/:id/upvote — Upvote question (urgency)
const upvoteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check for existing vote
    const existingVote = await Vote.findOne({
      userId: req.user._id,
      targetId: question._id,
      targetType: "Question",
      voteType: "upvote",
    });

    if (existingVote) {
      return res.status(400).json({ message: "Already upvoted this question" });
    }

    // Record the vote
    await new Vote({
      userId: req.user._id,
      targetId: question._id,
      targetType: "Question",
      voteType: "upvote",
    }).save();

    question.upvotes += 1;
    await question.save();

    res.json({ message: "Question upvoted", upvotes: question.upvotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /questions/:id
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Only author or admin can delete
    if (
      question.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Question.findByIdAndDelete(req.params.id);
    await Answer.deleteMany({ questionId: req.params.id });
    await Vote.deleteMany({ targetId: req.params.id });
    await Bookmark.deleteMany({ questionId: req.params.id });

    res.json({ message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /questions/state/:state — Get questions by lifecycle state
const getQuestionsByState = async (req, res) => {
  try {
    const { state } = req.params;
    if (!["URQ", "PAQ", "FAQ"].includes(state)) {
      return res.status(400).json({ message: "Invalid state" });
    }

    const questions = await Question.find({ state })
      .populate("author", "name email reputation badges")
      .populate("category", "name")
      .sort({ upvotes: -1, createdAt: -1 });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  addQuestion,
  upvoteQuestion,
  deleteQuestion,
  getQuestionsByState,
};