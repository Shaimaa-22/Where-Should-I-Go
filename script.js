class WhereToGoApp {
  constructor() {
    this.currentStep = 1
    this.selectedMood = null
    this.selectedTime = null
    this.userLocation = null

    // API Configuration - IMPORTANT: Keep your API keys secure!
    // In production, these should come from environment variables or a secure backend
    this.OPENAI_API_KEY = null // Set this securely - don't hardcode it!

    this.init()
  }

  init() {
    this.bindEvents()
    this.updateUI()
  }

  bindEvents() {
    // Mood selection
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectMood(e.currentTarget.dataset.mood)
      })
    })

    // Time selection
    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectTime(e.currentTarget.dataset.time)
      })
    })

    // Location button
    document.getElementById("getLocationBtn").addEventListener("click", () => {
      this.getCurrentLocation()
    })

    // Navigation buttons
    document.getElementById("nextBtn").addEventListener("click", () => {
      this.nextStep()
    })

    document.getElementById("backBtn").addEventListener("click", () => {
      this.previousStep()
    })

    document.getElementById("getRecommendationsBtn").addEventListener("click", () => {
      this.getRecommendations()
    })

    document.getElementById("startOverBtn").addEventListener("click", () => {
      this.startOver()
    })
  }

  selectMood(mood) {
    this.selectedMood = mood

    // Update UI
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })
    document.querySelector(`[data-mood="${mood}"]`).classList.add("selected")

    this.updateUI()
  }

  selectTime(time) {
    this.selectedTime = time

    // Update UI
    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })
    document.querySelector(`[data-time="${time}"]`).classList.add("selected")

    this.updateUI()
  }

  getCurrentLocation() {
    const statusDiv = document.getElementById("locationStatus")
    const btn = document.getElementById("getLocationBtn")

    if (!navigator.geolocation) {
      statusDiv.innerHTML = '<div class="status-error">❌ Geolocation is not supported by this browser.</div>'
      return
    }

    btn.innerHTML = "📍 Getting Location..."
    btn.disabled = true

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        statusDiv.innerHTML = '<div class="status-success">✅ Location detected successfully!</div>'
        btn.innerHTML = "✅ Location Found"
        btn.classList.add("success")

        this.updateUI()
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location."
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }

        statusDiv.innerHTML = `<div class="status-error">❌ ${errorMessage}</div>`
        btn.innerHTML = "📍 Try Again"
        btn.disabled = false
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    )
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++
      this.updateUI()
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--
      this.updateUI()
    }
  }

  updateUI() {
    // Update step indicators
    document.querySelectorAll(".step-indicator").forEach((indicator, index) => {
      const stepNum = index + 1
      indicator.classList.remove("active", "completed")

      if (stepNum === this.currentStep) {
        indicator.classList.add("active")
      } else if (stepNum < this.currentStep) {
        indicator.classList.add("completed")
      }
    })

    // Update step lines
    document.querySelectorAll(".step-line").forEach((line, index) => {
      line.classList.remove("active")
      if (index + 1 < this.currentStep) {
        line.classList.add("active")
      }
    })

    // Show/hide step content
    document.querySelectorAll(".step-content").forEach((content, index) => {
      content.classList.remove("active")
      if (index + 1 === this.currentStep) {
        content.classList.add("active")
      }
    })

    // Update navigation buttons
    const backBtn = document.getElementById("backBtn")
    const nextBtn = document.getElementById("nextBtn")
    const getRecommendationsBtn = document.getElementById("getRecommendationsBtn")

    // Back button
    backBtn.style.display = this.currentStep > 1 ? "block" : "none"

    // Next button
    if (this.currentStep < 3) {
      nextBtn.style.display = "block"
      getRecommendationsBtn.style.display = "none"

      // Enable/disable based on selections
      let canProceed = false
      if (this.currentStep === 1 && this.selectedMood) canProceed = true
      if (this.currentStep === 2 && this.selectedTime) canProceed = true

      nextBtn.disabled = !canProceed
    } else {
      nextBtn.style.display = "none"
      getRecommendationsBtn.style.display = this.userLocation ? "block" : "none"
    }
  }

  async getRecommendations() {
    if (!this.selectedMood || !this.selectedTime || !this.userLocation) {
      alert("Please complete all steps first.")
      return
    }

    // Show loading modal
    document.getElementById("loadingModal").style.display = "flex"

    try {
      // Get AI suggestion and nearby places
      const [aiSuggestion, places] = await Promise.all([this.getAISuggestion(), this.getNearbyPlaces()])

      // Hide loading modal
      document.getElementById("loadingModal").style.display = "none"

      // Display results
      this.displayResults(aiSuggestion, places)

      // Show results step
      document.querySelectorAll(".step-content").forEach((content) => {
        content.classList.remove("active")
      })
      document.getElementById("results").classList.add("active")
    } catch (error) {
      document.getElementById("loadingModal").style.display = "none"
      alert("Sorry, there was an error getting your recommendations. Please try again.")
      console.error("Error:", error)
    }
  }

  async getAISuggestion() {
    const currentHour = new Date().getHours()
    let timeOfDay = "morning"
    if (currentHour >= 12 && currentHour < 17) timeOfDay = "afternoon"
    else if (currentHour >= 17) timeOfDay = "evening"

    const prompt = `User details:
- Mood: ${this.selectedMood}
- Time available: ${this.selectedTime}
- Time of day: ${timeOfDay}

Based on the user's mood and available time, suggest a fun activity or type of place they should visit. Be encouraging and warm in your tone. Keep it to 2-3 sentences and focus on how the suggested activity will help with their current mood.

Examples:
- If bored: suggest entertainment venues, shopping areas, or activity centers
- If anxious: suggest peaceful parks, cozy cafés, or relaxing spaces
- If curious: suggest museums, galleries, or cultural centers
- If energetic: suggest gyms, sports facilities, or active recreation
- If hungry: suggest restaurants, cafés, or food markets
- If social: suggest bars, restaurants, or community spaces
- If peaceful: suggest parks, libraries, or spas
- If adventurous: suggest tourist attractions, outdoor activities, or unique spots`

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.OPENAI_API_KEY}`, // You'll need to set this securely
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI suggestion")
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error("Error getting AI suggestion:", error)
      // Fallback to enhanced mock suggestions
      const suggestions = {
        bored: `Since you're feeling bored and have ${this.selectedTime} to spare, I'd recommend visiting a local entertainment venue, shopping area, or activity center! These places offer variety and excitement that can quickly lift your spirits and give you plenty to explore.`,

        anxious: `When feeling anxious, a peaceful park, cozy café, or quiet library would be perfect for you with your ${this.selectedTime} available. These calming environments can help you relax and unwind, giving you the mental space you need to feel better.`,

        curious: `Your curious mood is perfect for exploring a museum, art gallery, cultural center, or bookstore with your ${this.selectedTime}! These places will feed your desire to learn and discover something new and interesting.`,

        energetic: `With all that energy and ${this.selectedTime} to use it, you should head to a gym, sports facility, park for activities, or recreation center! It's the perfect way to channel your enthusiasm into something fun and rewarding.`,

        hungry: `Time to satisfy that appetite! With ${this.selectedTime} available, I'd suggest exploring local restaurants, cafés, food markets, or even cooking classes where you can discover delicious meals and treats.`,

        social: `Since you're in a social mood and have ${this.selectedTime}, bars, restaurants, community centers, or social clubs would be ideal! These venues are great for meeting people and enjoying good company.`,

        peaceful: `For a peaceful experience with your ${this.selectedTime}, consider visiting a park, library, spa, meditation center, or quiet café. These tranquil spaces will help you find the calm and serenity you're seeking.`,

        adventurous: `Your adventurous spirit calls for tourist attractions, outdoor activities, hiking trails, or unique local spots with your ${this.selectedTime}! It's time to explore something new and exciting in your area.`,
      }

      return (
        suggestions[this.selectedMood] ||
        `I'd recommend exploring your local area to find something that matches your current ${this.selectedMood} mood and your available ${this.selectedTime}!`
      )
    }
  }

  async getNearbyPlaces() {
    // Mock places data - in a real app, you'd call a backend API
    const mockPlaces = {
      bored: [
        {
          name: "City Entertainment Center",
          type: "entertainment",
          rating: 4.3,
          vicinity: "Downtown District",
          place_id: "1",
          opening_hours: { open_now: true },
        },
        {
          name: "Grand Shopping Mall",
          type: "shopping_mall",
          rating: 4.1,
          vicinity: "Commercial Area",
          place_id: "2",
          opening_hours: { open_now: true },
        },
        {
          name: "Adventure Zone",
          type: "amusement_park",
          rating: 4.5,
          vicinity: "Recreation District",
          place_id: "3",
          opening_hours: { open_now: true },
        },
      ],
      anxious: [
        {
          name: "Serenity Park",
          type: "park",
          rating: 4.7,
          vicinity: "Green District",
          place_id: "4",
          opening_hours: { open_now: true },
        },
        {
          name: "Tranquil Spa & Wellness",
          type: "spa",
          rating: 4.8,
          vicinity: "Wellness Quarter",
          place_id: "5",
          opening_hours: { open_now: false },
        },
        {
          name: "Peaceful Café",
          type: "cafe",
          rating: 4.4,
          vicinity: "Quiet Street",
          place_id: "6",
          opening_hours: { open_now: true },
        },
      ],
      curious: [
        {
          name: "Metropolitan Art Museum",
          type: "museum",
          rating: 4.6,
          vicinity: "Cultural Quarter",
          place_id: "7",
          opening_hours: { open_now: true },
        },
        {
          name: "Modern Art Gallery",
          type: "art_gallery",
          rating: 4.4,
          vicinity: "Arts District",
          place_id: "8",
          opening_hours: { open_now: true },
        },
        {
          name: "Science Discovery Center",
          type: "museum",
          rating: 4.5,
          vicinity: "Education Hub",
          place_id: "9",
          opening_hours: { open_now: true },
        },
      ],
      energetic: [
        {
          name: "PowerFit Gym",
          type: "gym",
          rating: 4.3,
          vicinity: "Sports Complex",
          place_id: "10",
          opening_hours: { open_now: true },
        },
        {
          name: "City Sports Center",
          type: "sports_complex",
          rating: 4.5,
          vicinity: "Athletic District",
          place_id: "11",
          opening_hours: { open_now: true },
        },
        {
          name: "Adventure Park",
          type: "park",
          rating: 4.4,
          vicinity: "Recreation Area",
          place_id: "12",
          opening_hours: { open_now: true },
        },
      ],
      hungry: [
        {
          name: "Gourmet Bistro",
          type: "restaurant",
          rating: 4.7,
          vicinity: "Culinary District",
          place_id: "13",
          opening_hours: { open_now: true },
        },
        {
          name: "Artisan Bakery",
          type: "bakery",
          rating: 4.6,
          vicinity: "Food Street",
          place_id: "14",
          opening_hours: { open_now: true },
        },
        {
          name: "Local Food Market",
          type: "market",
          rating: 4.4,
          vicinity: "Market Square",
          place_id: "15",
          opening_hours: { open_now: true },
        },
      ],
      social: [
        {
          name: "Social Hub Bar",
          type: "bar",
          rating: 4.2,
          vicinity: "Nightlife District",
          place_id: "16",
          opening_hours: { open_now: true },
        },
        {
          name: "Community Restaurant",
          type: "restaurant",
          rating: 4.6,
          vicinity: "Social Quarter",
          place_id: "17",
          opening_hours: { open_now: true },
        },
        {
          name: "Events Center",
          type: "event_venue",
          rating: 4.3,
          vicinity: "Entertainment Hub",
          place_id: "18",
          opening_hours: { open_now: true },
        },
      ],
      peaceful: [
        {
          name: "Zen Garden Park",
          type: "park",
          rating: 4.8,
          vicinity: "Peaceful District",
          place_id: "19",
          opening_hours: { open_now: true },
        },
        {
          name: "Central Library",
          type: "library",
          rating: 4.5,
          vicinity: "Knowledge Quarter",
          place_id: "20",
          opening_hours: { open_now: true },
        },
        {
          name: "Meditation Center",
          type: "wellness_center",
          rating: 4.7,
          vicinity: "Spiritual District",
          place_id: "21",
          opening_hours: { open_now: true },
        },
      ],
      adventurous: [
        {
          name: "Adventure Tours",
          type: "tourist_attraction",
          rating: 4.6,
          vicinity: "Adventure Zone",
          place_id: "22",
          opening_hours: { open_now: true },
        },
        {
          name: "Exploration Park",
          type: "amusement_park",
          rating: 4.4,
          vicinity: "Adventure District",
          place_id: "23",
          opening_hours: { open_now: true },
        },
        {
          name: "Discovery Trail",
          type: "hiking_area",
          rating: 4.5,
          vicinity: "Nature Reserve",
          place_id: "24",
          opening_hours: { open_now: true },
        },
      ],
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return mockPlaces[this.selectedMood] || mockPlaces.curious
  }

  displayResults(aiSuggestion, places) {
    // Display AI suggestion
    const aiCard = document.getElementById("aiSuggestionCard")
    const aiText = document.getElementById("aiSuggestionText")

    aiText.textContent = aiSuggestion
    aiCard.style.display = "flex"

    // Display places
    const placesGrid = document.getElementById("placesGrid")
    placesGrid.innerHTML = ""

    places.forEach((place) => {
      const placeCard = this.createPlaceCard(place)
      placesGrid.appendChild(placeCard)
    })
  }

  createPlaceCard(place) {
    const card = document.createElement("div")
    card.className = "place-card"

    const formatType = (type) => {
      return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }

    card.innerHTML = `
      <div class="place-header">
        <h3 class="place-name">${place.name}</h3>
        ${place.rating !== "N/A" ? `<span class="place-rating">⭐ ${place.rating}</span>` : ""}
      </div>
      <p class="place-address">📍 ${place.vicinity}</p>
      <div class="place-info">
        <span class="place-type">${formatType(place.type)}</span>
        <span class="place-status ${place.opening_hours?.open_now ? "open" : "closed"}">
          🕐 ${place.opening_hours?.open_now ? "Open now" : "Closed"}
        </span>
      </div>
      <button class="place-btn" onclick="app.openInMaps('${place.name}', '${place.vicinity}')">
        🗺️ View on Maps
      </button>
    `

    return card
  }

  openInMaps(name, vicinity) {
    const query = encodeURIComponent(`${name} ${vicinity}`)
    window.open(`https://www.google.com/maps/search/${query}`, "_blank")
  }

  startOver() {
    this.currentStep = 1
    this.selectedMood = null
    this.selectedTime = null
    this.userLocation = null

    // Reset UI
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })
    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })

    // Reset location button
    const locationBtn = document.getElementById("getLocationBtn")
    locationBtn.innerHTML = "📍 Get My Location"
    locationBtn.className = "location-btn"
    locationBtn.disabled = false

    document.getElementById("locationStatus").innerHTML = ""
    document.getElementById("aiSuggestionCard").style.display = "none"

    this.updateUI()
  }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.app = new WhereToGoApp()
})
 
