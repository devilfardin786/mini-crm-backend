const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Campaign = require("../models/Campaign");

dotenv.config(); // Load .env file

// Ensure MONGODB_URI is properly loaded
if (!process.env.MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is not defined. Check your .env file.");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully.");
    return Campaign.updateMany({}, { $set: { sent: 0, failed: 0, audienceSize: 0 } });
  })
  .then(() => {
    console.log("✅ Updated campaigns with default stats.");
    mongoose.disconnect();
  })
  .catch((error) => {
    console.error("❌ Error updating campaigns:", error);
    mongoose.disconnect();
  });