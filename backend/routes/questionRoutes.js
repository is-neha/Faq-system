const express = require("express");
const router = express.Router();
const {
  getQuestions,
  getQuestionById,
  addQuestion,
  upvoteQuestion,
  deleteQuestion,
  getQuestionsByState,
} = require("../controllers/questionController");
const { auth } = require("../middleware/auth");

// Public: list + search all questions
router.get("/", getQuestions);

// Public: get questions by lifecycle state
router.get("/state/:state", getQuestionsByState);

// Public: get single question with answers
router.get("/:id", getQuestionById);

// Protected: submit new URQ
router.post("/", auth, addQuestion);

// Protected: upvote question (urgency)
router.put("/:id/upvote", auth, upvoteQuestion);

// Protected: delete question
router.delete("/:id", auth, deleteQuestion);

module.exports = router;