const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Vote = require("../models/Vote");
const Bookmark = require("../models/Bookmark");
const User = require("../models/User");

const awardReputation = async (userId, points) => {
  await User.findByIdAndUpdate(userId, { $inc: { reputation: points } });
};

// Builds a fuzzy regex: all words must match, in any order, anywhere in text.
// e.g. "NOC deadline" → /(?=.*NOC)(?=.*deadline).*/i
const buildFuzzyRegex = (search) => {
  const words = search.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const pattern = words.map((w) => `(?=.*${w})`).join("") + ".*";
  return new RegExp(pattern, "i");
};

// GET /questions  — search + filter + paginate
// Query params: ?search=&state=URQ,PAQ&category=&sort=urgency&page=1&limit=20
const getQuestions = async (req, res) => {
  try {
    const { search, state, category, sort, page = 1, limit = 20 } = req.query;
    let query = {};

    if (search) {
      const fuzzy = buildFuzzyRegex(search);
      if (fuzzy) query.$or = [{ title: fuzzy }, { description: fuzzy }];
    }

    if (state) {
      const states = state.split(",").map((s) => s.trim().toUpperCase())
        .filter((s) => ["URQ", "PAQ", "FAQ"].includes(s));
      query.state = states.length === 1 ? states[0] : { $in: states };
    }

    if (category) query.category = category;

    let sortOption = { createdAt: -1 };
    if (sort === "urgency") sortOption = { upvotes: -1, createdAt: -1 };
    else if (sort === "views") sortOption = { views: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate("author", "name email reputation badges")
        .populate("category", "name")
        .populate({
          path: "answers",
          options: { sort: { upvotes: -1, createdAt: 1 } },
          populate: { path: "author", select: "name email reputation badges" },
        })
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Question.countDocuments(query),
    ]);

    res.json({
      data: questions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /questions/:id — single question with sorted answers
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("author", "name email reputation badges")
      .populate("category", "name")
      .populate({
        path: "answers",
        options: { sort: { upvotes: -1, createdAt: 1 } },
        populate: { path: "author", select: "name email reputation badges" },
      })
      .lean();

    if (!question) return res.status(404).json({ message: "Question not found" });

    await Question.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /questions — Submit new URQ
const addQuestion = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    const question = new Question({
      title, description, category,
      tags: tags || [],
      state: "URQ",
      author: req.user._id,
    });

    await question.save();
    await awardReputation(req.user._id, 5);

    await question.populate("author", "name email reputation badges");
    await question.populate("category", "name");

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /questions/:id/upvote — Urgency signal
const upvoteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const existing = await Vote.findOne({
      userId: req.user._id, targetId: question._id, targetType: "Question", voteType: "upvote",
    });
    if (existing) return res.status(400).json({ message: "Already upvoted this question" });

    await new Vote({ userId: req.user._id, targetId: question._id, targetType: "Question", voteType: "upvote" }).save();
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
    if (!question) return res.status(404).json({ message: "Question not found" });

    if (question.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
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

// GET /questions/state/:state — bulk fetch by state (used internally; prefer ?state= query param)
const getQuestionsByState = async (req, res) => {
  try {
    const { state } = req.params;
    if (!["URQ", "PAQ", "FAQ"].includes(state)) {
      return res.status(400).json({ message: "Invalid state" });
    }

    const questions = await Question.find({ state })
      .populate("author", "name email reputation badges")
      .populate("category", "name")
      .populate({
        path: "answers",
        options: { sort: { upvotes: -1, createdAt: 1 } },
        populate: { path: "author", select: "name email reputation badges" },
      })
      .sort({ upvotes: -1, createdAt: -1 })
      .lean();

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getQuestions, getQuestionById, addQuestion,
  upvoteQuestion, deleteQuestion, getQuestionsByState,
};