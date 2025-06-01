const express = require("express");
const CommunicationLog = require("../models/CommunicationLog");
const router = express.Router();

// Update delivery status
router.post("/receipt", async (req, res) => {
  try {
    const { customerId, status } = req.body;

    await CommunicationLog.findOneAndUpdate(
      { customerId },
      { status, deliveredAt: status === "SENT" ? new Date() : null }
    );

    res.json({ message: "Delivery status updated!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;