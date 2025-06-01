const express = require("express");
const Campaign = require("../models/Campaign");
const axios = require("axios");
const CommunicationLog = require("../models/CommunicationLog");
const Customer = require("../models/Customer");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { recommendSendTime } = require("../services/aiScheduler");

// Create a new campaign
router.post("/", async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json({ message: "Campaign created successfully", campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Smart Scheduling API
router.post("/schedule", authenticate, async (req, res) => {
  try {
    const { audience, pastData } = req.body;
    if (!audience || !pastData) return res.status(400).json({ error: "Audience and past data required." });

    const recommendation = await recommendSendTime(audience, pastData);
    res.status(200).json({ bestTimeToSend: recommendation });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate scheduling suggestion." });
  }
});


// Send campaign messages
router.post("/:campaignId/send", async (req, res) => {
  try {
    const { campaignId } = req.params;
    const customers = await Customer.find(); // Fetch all customers

    const logs = customers.map(async (customer) => {
      const message = `Hi ${customer.name}, here’s 10% off on your next order!`;

      // Call vendor API
      const response = await axios.post("http://localhost:5000/api/vendor/send", {
        customerId: customer._id,
        message,
      });

      // Create communication log
      return CommunicationLog.create({
        campaignId,
        customerId: customer._id,
        message,
        status: response.data.status,
        deliveredAt: response.data.status === "SENT" ? new Date() : null,
      });
    });

    await Promise.all(logs);
    res.json({ message: "Campaign messages sent!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch all campaigns with delivery stats
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Error retrieving campaigns." });
  }
});


router.post("/", authenticate, async (req, res) => {
  // Only authenticated users can create a campaign
});

router.get("/", authenticate, async (req, res) => {
  // Only authenticated users can view campaigns
});


module.exports = router;