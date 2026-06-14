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

app.post("/api/places", async (req, res) => {
  try {
    const { mood, lat, lng } = req.body;

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

    res.json(response.data.results.slice(0, 8));
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch places",
    });
  }
});

app.post("/api/suggestion", async (req, res) => {
  try {
    const { mood, time, places } = req.body;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a recommendation assistant."
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
      suggestion:
        response.data.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to generate suggestion",
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(
    `Server running on port ${process.env.PORT}`
  );
});
