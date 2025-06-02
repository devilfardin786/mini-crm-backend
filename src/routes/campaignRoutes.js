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
// Fetch all campaigns (basic version)
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "Error fetching campaigns" });
  }
});



// Fetch all campaigns with full details
router.get("/history", async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });

    const campaignDetails = await Promise.all(
      campaigns.map(async (campaign) => {
        const sentCount = await CommunicationLog.countDocuments({ campaignId: campaign._id, status: "SENT" });
        const failedCount = await CommunicationLog.countDocuments({ campaignId: campaign._id, status: "FAILED" });
        const audienceSize = await Customer.countDocuments();

        return {
          _id: campaign._id,
          name: campaign.name,
          message: campaign.message,
          createdAt: campaign.createdAt,
          sent: sentCount || 0,   // ✅ Default to 0 if not set
          failed: failedCount || 0,  // ✅ Default to 0 if not set
          audienceSize: audienceSize || 0,  // ✅ Ensure segment size is included
        };
      })
    );

    res.json(campaignDetails);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Error retrieving campaigns." });
  }
});

// Calculate audience size
router.post("/audience-size", async (req, res) => {
  const { rules, logic } = req.body;

  if (!rules || rules.length === 0) return res.json({ size: 0 });

  const parsedRules = rules.map((rule) => {
    const [field, operator, value] = rule.split(" ");

    if (field === "spend") {
      return operator === ">" ? { spend: { $gt: Number(value) } } : { spend: { $lt: Number(value) } };
    }

    if (field === "visits") {
      return operator === ">" ? { visits: { $gt: Number(value) } } : { visits: { $lt: Number(value) } };
    }

    if (field === "inactive") {
      const cutoff = new Date(Date.now() - Number(value) * 24 * 60 * 60 * 1000);
      return { lastActive: { $lt: cutoff } };
    }

    return {};
  });

  const mongoOperator = logic === "AND" ? "$and" : "$or";
  const query = { [mongoOperator]: parsedRules };

  try {
    const audienceSize = await Customer.countDocuments(query);
    res.json({ size: audienceSize });
  } catch (error) {
    console.error("Error calculating audience size:", error);
    res.status(500).json({ error: "Failed to calculate audience size" });
  }
});


module.exports = router;