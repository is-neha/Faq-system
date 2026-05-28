const express = require("express");
const router = express.Router();
const {
  addAnswer,
  upvoteAnswer,
  downvoteAnswer,
  verifyAnswer,
  deleteAnswer,
} = require("../controllers/answerController");
const { auth, adminOnly } = require("../middleware/auth");

// Protected: submit an answer to a question (triggers URQ→PAQ)
router.post("/:questionId/answers", auth, addAnswer);

// Protected: upvote answer (accuracy signal)
router.put("/:id/upvote", auth, upvoteAnswer);

// Protected: downvote answer
router.put("/:id/downvote", auth, downvoteAnswer);

// Admin only: verify answer → promote to FAQ
router.put("/:id/verify", auth, adminOnly, verifyAnswer);

// Protected: delete answer
router.delete("/:id", auth, deleteAnswer);

module.exports = router;