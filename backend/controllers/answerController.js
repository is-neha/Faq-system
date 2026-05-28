const Answer = require("../models/Answer");
const Question = require("../models/Question");
const Vote = require("../models/Vote");
const User = require("../models/User");

const FAQ_UPVOTE_THRESHOLD = parseInt(process.env.FAQ_UPVOTE_THRESHOLD || "10", 10);

const awardReputation = async (userId, points) => {
  await User.findByIdAndUpdate(userId, { $inc: { reputation: points } });
};

// POST /questions/:questionId/answers — Submit an answer (triggers URQ→PAQ)
const addAnswer = async (req, res) => {
  try {
    const { content } = req.body;
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const answer = new Answer({
      questionId,
      author: req.user._id,
      content,
    });

    await answer.save();

    // Transition question state: URQ → PAQ
    if (question.state === "URQ") {
      question.state = "PAQ";
      await question.save();
    }

    await answer.populate("author", "name email reputation badges");

    res.status(201).json(answer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /answers/:id/upvote — Upvote answer (accuracy signal)
const upvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check for existing upvote
    const existingVote = await Vote.findOne({
      userId: req.user._id,
      targetId: answer._id,
      targetType: "Answer",
      voteType: "upvote",
    });

    if (existingVote) {
      return res.status(400).json({ message: "Already upvoted this answer" });
    }

    // Record the vote
    await new Vote({
      userId: req.user._id,
      targetId: answer._id,
      targetType: "Answer",
      voteType: "upvote",
    }).save();

    answer.upvotes += 1;
    await answer.save();

    // Check if answer crosses threshold → flag question for admin review
    if (answer.upvotes >= FAQ_UPVOTE_THRESHOLD) {
      await Question.findByIdAndUpdate(answer.questionId, { flaggedForReview: true });
    }

    // Award reputation to answer author
    await awardReputation(answer.author, 10);

    res.json({ message: "Answer upvoted", upvotes: answer.upvotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /answers/:id/downvote
const downvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const existingVote = await Vote.findOne({
      userId: req.user._id,
      targetId: answer._id,
      targetType: "Answer",
      voteType: "downvote",
    });

    if (existingVote) {
      return res.status(400).json({ message: "Already downvoted this answer" });
    }

    await new Vote({
      userId: req.user._id,
      targetId: answer._id,
      targetType: "Answer",
      voteType: "downvote",
    }).save();

    answer.downvotes += 1;
    await answer.save();

    res.json({ message: "Answer downvoted", downvotes: answer.downvotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /answers/:id/verify — Admin verifies answer → promotes to FAQ
const verifyAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const question = await Question.findById(answer.questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Mark answer as official
    answer.isOfficial = true;
    await answer.save();

    // Promote question state: PAQ → FAQ
    question.state = "FAQ";
    question.flaggedForReview = false;
    await question.save();

    // Award big reputation boost for verified answer
    await awardReputation(answer.author, 50);

    await answer.populate("author", "name email reputation badges");

    res.json({
      message: "Answer verified and promoted to FAQ",
      answer,
      questionState: question.state,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /answers/:id
const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    if (
      answer.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Answer.findByIdAndDelete(req.params.id);
    await Vote.deleteMany({ targetId: req.params.id });

    res.json({ message: "Answer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addAnswer,
  upvoteAnswer,
  downvoteAnswer,
  verifyAnswer,
  deleteAnswer,
};