/**
 * Seed script — creates initial data so the app is usable out of the box.
 * Run with:  node seed.js
 *
 * Creates:
 *   - Admin user
 *   - Student user
 *   - Default categories
 */

require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Category = require("./models/Category");
const Question = require("./models/Question");
const Answer = require("./models/Answer");

const MONGO_URI = process.env.MONGODB_URI;

const ADMIN = {
  name: "Admin User",
  email: "admin@vic.edu",
  password: "admin123",
  role: "admin",
};

const STUDENT = {
  name: "Demo Student",
  email: "student@vic.edu",
  password: "student123",
  role: "student",
};

const CATEGORIES = [
  "Onboarding & Admin",
  "Tech Support",
  "Internship Queries",
  "Placements",
  "Academics",
  "Certificates",
  "NOC",
  "Rosetta Journal",
  "Coursework",
  "Communication Tools",
  "Team Formation",
  "ViBe Platform",
];

async function seed() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected\n");

  // ── Users ────────────────────────────────────────────────────────────
  for (const userData of [ADMIN, STUDENT]) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`⏭  User already exists: ${userData.email}`);
    } else {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({ ...userData, password: hashedPassword });
      console.log(`✅ Created user: ${userData.email} / ${userData.password}`);
    }
  }

  // ── Categories ──────────────────────────────────────────────────────
  for (const name of CATEGORIES) {
    const existing = await Category.findOne({ name });
    if (existing) {
      console.log(`⏭  Category already exists: ${name}`);
    } else {
      await Category.create({ name, description: name });
      console.log(`✅ Created category: ${name}`);
    }
  }

  // ── Sample questions in various states ──────────────────────────────
  const adminUser = await User.findOne({ email: ADMIN.email });
  const studentUser = await User.findOne({ email: STUDENT.email });
  const cat = await Category.findOne({ name: "Internship Queries" });

  const sampleQuestions = [
    {
      title: "How do I apply for NOC?",
      description: "I need an NOC for my internship but don't know the process.",
      state: "URQ",
      author: studentUser._id,
      category: cat._id,
    },
    {
      title: "What is the deadline for Phase 1 completion?",
      description: "I am confused about the Phase 1 deadline and want to plan accordingly.",
      state: "PAQ",
      author: studentUser._id,
      category: cat._id,
    },
    {
      title: "When will I receive my internship certificate?",
      description: "I completed all phases but haven't received the certificate yet.",
      state: "FAQ",
      author: studentUser._id,
      category: cat._id,
    },
  ];

  for (const qData of sampleQuestions) {
    const existing = await Question.findOne({ title: qData.title });
    if (existing) {
      console.log(`⏭  Question already exists: ${qData.title}`);
    } else {
      const q = await Question.create(qData);
      console.log(`✅ Created question (${q.state}): ${qData.title}`);

      // Attach a sample answer if PAQ or FAQ
      if (qData.state === "PAQ") {
        const answer = await Answer.create({
          questionId: q._id,
          author: adminUser._id,
          content: "The deadline for Phase 1 is typically two weeks after your start date. Please check the Vibe LMS for exact dates.",
        });
        q.answers = [answer._id];
        await q.save();
      }

      if (qData.state === "FAQ") {
        const answer = await Answer.create({
          questionId: q._id,
          author: adminUser._id,
          content: "Certificates are issued within 2 weeks of completing all phases. If you haven't received it after that, email support@vic.edu.",
          upvotes: 12,
          isOfficial: true,
        });
        q.answers = [answer._id];
        await q.save();
      }
    }
  }

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});