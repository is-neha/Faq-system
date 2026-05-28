const mongoose = require("mongoose");

const faqItemSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true },
  views: { type: Number, default: 0 },
  source: { type: String, enum: ["official", "community"], default: "official" },
  resolved: { type: Boolean, default: false },
}, { _id: true });

const faqSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  icon: { type: String, default: "📁" },
  questions: [faqItemSchema],
}, { timestamps: true });

module.exports = mongoose.model("FAQ", faqSchema);