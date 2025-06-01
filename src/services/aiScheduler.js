const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function recommendSendTime(audience, pastData) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI that analyzes customer behavior patterns and recommends the best time/day to send marketing campaigns."
        },
        {
          role: "user",
          content: `Based on past customer engagement data: ${pastData}, recommend the best time/day to send a campaign for ${audience}.`
        }
      ]
    });

    return response.choices[0]?.message?.content || "AI scheduling suggestion unavailable.";
  } catch (error) {
    console.error("Error generating scheduling suggestion:", error);
    return "Error generating suggestion.";
  }
}

module.exports = { recommendSendTime };