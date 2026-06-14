const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const moodMap = {
  bored: "tourist_attraction",
  anxious: "park",
  curious: "museum",
  energetic: "gym",
  hungry: "restaurant",
  social: "cafe",
  peaceful: "park",
  adventurous: "tourist_attraction",
};

app.get("/", (req, res) => {
  res.json({
    status: "Backend Running",
    googleKey: !!process.env.GOOGLE_PLACES_API_KEY,
    openrouterKey: !!process.env.OPENROUTER_API_KEY,
  });
});

app.get("/api/places", (req, res) => {
  res.json({
    message: "Places endpoint is working. Use POST to get real places.",
  });
});

app.post("/api/places", async (req, res) => {
  try {
    console.log("PLACES REQUEST BODY:", req.body);

    const { mood, lat, lng } = req.body;

    if (!mood || !lat || !lng) {
      return res.status(400).json({
        error: "Missing mood, lat, or lng",
      });
    }

    const type = moodMap[mood] || "restaurant";

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${lat},${lng}`,
          radius: 5000,
          type,
          key: process.env.GOOGLE_PLACES_API_KEY,
        },
      }
    );

    console.log("GOOGLE STATUS:", response.data.status);
    console.log("GOOGLE ERROR:", response.data.error_message || "No error");

    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      return res.status(500).json({
        error: response.data.status,
        message: response.data.error_message,
      });
    }

    res.json(response.data.results.slice(0, 8));
  } catch (err) {
    console.error("PLACES ERROR:", err.response?.data || err.message);

    res.status(500).json({
      error: "Failed to fetch places",
      details: err.response?.data || err.message,
    });
  }
});

app.post("/api/suggestion", async (req, res) => {
  try {
    console.log("SUGGESTION REQUEST BODY:", req.body);

    const { mood, time, places } = req.body;

    if (!mood || !time || !Array.isArray(places)) {
      return res.status(400).json({
        error: "Missing mood, time, or places",
      });
    }

    if (places.length === 0) {
      return res.json({
        suggestion: "I could not find nearby places for this mood, but try changing your mood or expanding your search area.",
      });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a friendly recommendation assistant.",
          },
          {
            role: "user",
            content: `
Mood: ${mood}
Available Time: ${time}

Nearby Places:
${places.map((p) => p.name).join(", ")}

Give one short recommendation.
            `,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      suggestion: response.data.choices[0].message.content,
    });
  } catch (err) {
    console.error("OPENROUTER ERROR:", err.response?.data || err.message);

    res.status(500).json({
      error: "Failed to generate suggestion",
      details: err.response?.data || err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
