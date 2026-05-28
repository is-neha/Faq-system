const express = require("express");
const router = express.Router();
const {
  addBookmark,
  getBookmarks,
  removeBookmark,
} = require("../controllers/bookmarkController");
const { auth } = require("../middleware/auth");

router.post("/", auth, addBookmark);
router.get("/", auth, getBookmarks);
router.delete("/:questionId", auth, removeBookmark);

module.exports = router;