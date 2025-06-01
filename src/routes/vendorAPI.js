const express = require("express");
const router = express.Router();

// Simulated delivery API
router.post("/send", async (req, res) => {
  const { customerId, message } = req.body;

  // Simulate 90% success, 10% failure
  const success = Math.random() < 0.9;

  setTimeout(() => {
    res.json({
      status: success ? "SENT" : "FAILED",
      customerId,
      message
    });
  }, 500); // Simulate slight delay
});

module.exports = router;