const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "Backend Running",
    geoapifyKey: !!process.env.GEOAPIFY_API_KEY,
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

    const categories = {
  bored: "entertainment,commercial.shopping_mall",

  anxious: "leisure.park,catering.cafe",

  curious: "tourism.sights,entertainment.culture,museum",

  energetic: "sport.fitness,sport",

  hungry: "catering.restaurant,catering.fast_food,catering.cafe",

  social: "catering.cafe,catering.restaurant,entertainment",

  peaceful: "leisure.park,natural,entertainment.culture",

  adventurous: "tourism.sights,natural,sport",
};

    const category = categories[mood] || "catering.restaurant";

    const response = await axios.get("https://api.geoapify.com/v2/places", {
      params: {
        categories: category,
        filter: `circle:${lng},${lat},5000`,
        bias: `proximity:${lng},${lat}`,
        limit: 8,
        apiKey: process.env.GEOAPIFY_API_KEY,
      },
    });

    console.log("GEOAPIFY RESULTS:", response.data.features.length);

    const places = response.data.features.map((place) => ({
      name: place.properties.name || "Unknown Place",
      vicinity: place.properties.formatted || "Nearby location",
      rating: 4.5,
      type: place.properties.categories?.[0] || "place",
      opening_hours: {
        open_now: true,
      },
      place_id: place.properties.place_id,
    }));

    res.json(places);
  } catch (err) {
    console.error("GEOAPIFY ERROR:", err.response?.data || err.message);

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
        suggestion:
          "I could not find nearby places for this mood, but try changing your mood or expanding your search area.",
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
