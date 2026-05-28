const express = require("express");
const Report = require("../models/Report");
const Notification = require("../models/Notification");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();

/* ── Submit a report ── */
router.post("/", auth, async (req, res) => {
  try {
    const { targetId, targetType, reason, details } = req.body;
    if (!targetId || !targetType || !reason) {
      return res
        .status(400)
        .json({ error: "targetId, targetType, and reason are required" });
    }
    if (!["question", "answer", "oaq"].includes(targetType)) {
      return res.status(400).json({ error: "Invalid targetType" });
    }
    if (!["spam", "harassment", "inappropriate", "irrelevant", "duplicate", "other"].includes(reason)) {
      return res.status(400).json({ error: "Invalid reason" });
    }

    const existing = await Report.findOne({
      reporter: req.user._id,
      targetId,
      targetType,
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "You have already reported this content" });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetId,
      targetType,
      reason,
      details: details || "",
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Get all reports (admin) ── */
router.get("/", auth, admin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reports = await Report.find(filter)
      .populate("reporter", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Resolve a report (admin) ── */
router.put("/:id/resolve", auth, admin, async (req, res) => {
  try {
    const { status, resolution } = req.body;
    if (!["reviewed", "actioned", "dismissed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        resolution: resolution || "",
        resolvedBy: req.user._id,
      },
      { new: true }
    ).populate("reporter", "name");
    if (!report) return res.status(404).json({ error: "Report not found" });

    if (status === "actioned") {
      await Notification.create({
        user: report.reporter,
        type: "report_resolved",
        message: `Your report was reviewed and action was taken.`,
        link: "/admin/reports",
      });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;