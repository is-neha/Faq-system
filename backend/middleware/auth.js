const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT and attach user to request
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Require admin role
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

// Require moderator or admin role
const moderatorOrAbove = (req, res, next) => {
  if (req.user && (req.user.role === "moderator" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Moderator access required" });
  }
};

module.exports = { auth, adminOnly, moderatorOrAbove };