// Where Should I Go - JavaScript Application

class WhereToGoApp {
  constructor() {
    this.currentStep = 1
    this.selectedMood = null
    this.selectedTime = null
    this.userLocation = null
    this.apiKeys = {
      openai: "your-openai-api-key-here", // Replace with your API key
      googlePlaces: "your-google-places-api-key-here", // Replace with your API key
    }

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
      statusDiv.innerHTML = '<div class="alert alert-danger">Geolocation is not supported by this browser.</div>'
      return
    }

    btn.innerHTML = '<i class="bi bi-geo-alt-fill me-2"></i>Getting Location...'
    btn.disabled = true

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        statusDiv.innerHTML =
          '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>Location detected successfully!</div>'
        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Location Found'
        btn.classList.replace("btn-warning", "btn-success")

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

        statusDiv.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>${errorMessage}</div>`
        btn.innerHTML = '<i class="bi bi-geo-alt-fill me-2"></i>Try Again'
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
    const loadingModal = document.getElementById("loadingModal")
    loadingModal.style.display = "block"

    try {
      // Get AI suggestion and nearby places
      const [aiSuggestion, places] = await Promise.all([this.getAISuggestion(), this.getNearbyPlaces()])

      // Hide loading modal
      loadingModal.style.display = "none"

      // Display results
      this.displayResults(aiSuggestion, places)

      // Show results step
      document.querySelectorAll(".step-content").forEach((content) => {
        content.classList.remove("active")
      })
      document.getElementById("results").classList.add("active")
    } catch (error) {
      loadingModal.style.display = "none"
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
- Location: Current location
- Time of day: ${timeOfDay}

Instruction:
Suggest a fun activity for this user, based on their mood and available time. Recommend a type of place (like a park, gallery, café) that fits their mood. Use a warm, encouraging tone. Keep it to 2-3 sentences.`

    // Note: In a real application, you would make this API call from your backend
    // to keep your API key secure. This is for demonstration purposes.

    // Mock AI response for demo
    const mockResponses = {
      bored:
        "Since you're feeling bored and have some time to spare, I'd recommend visiting a local entertainment venue or shopping area! These places offer variety and excitement that can quickly lift your spirits and give you plenty to explore.",
      anxious:
        "When feeling anxious, a peaceful park or cozy café would be perfect for you. These calming environments can help you relax and unwind, giving you the mental space you need to feel better.",
      curious:
        "Your curious mood is perfect for exploring a museum, art gallery, or cultural center! These places will feed your desire to learn and discover something new and interesting.",
      energetic:
        "With all that energy, you should head to a gym, sports facility, or active recreation area! It's the perfect way to channel your enthusiasm into something fun and rewarding.",
      hungry:
        "Time to satisfy that appetite! I'd suggest exploring local restaurants, cafés, or food markets where you can discover delicious meals and treats.",
      social:
        "Since you're in a social mood, bars, restaurants, or community spaces would be ideal! These venues are great for meeting people and enjoying good company.",
      peaceful:
        "For a peaceful experience, consider visiting a park, library, or spa. These tranquil spaces will help you find the calm and serenity you're seeking.",
      adventurous:
        "Your adventurous spirit calls for tourist attractions, outdoor activities, or unique local spots! It's time to explore something new and exciting in your area.",
    }

    return (
      mockResponses[this.selectedMood] ||
      "I'd recommend exploring your local area to find something that matches your current mood and available time!"
    )
  }

  async getNearbyPlaces() {
    // Map moods to place types
    const moodToPlaceTypes = {
      bored: ["shopping_mall", "movie_theater", "amusement_park"],
      anxious: ["park", "spa", "cafe"],
      curious: ["museum", "art_gallery", "tourist_attraction"],
      energetic: ["gym", "stadium", "sports_complex"],
      hungry: ["restaurant", "cafe", "bakery"],
      social: ["bar", "restaurant", "night_club"],
      peaceful: ["park", "spa", "library"],
      adventurous: ["tourist_attraction", "amusement_park", "zoo"],
    }

    // Mock places data for demo
    const mockPlaces = [
      {
        name: "Central Park Café",
        type: "cafe",
        rating: 4.5,
        vicinity: "Downtown area, 0.3 miles away",
        place_id: "mock_1",
        opening_hours: { open_now: true },
      },
      {
        name: "Art Gallery Modern",
        type: "art_gallery",
        rating: 4.2,
        vicinity: "Arts district, 0.7 miles away",
        place_id: "mock_2",
        opening_hours: { open_now: true },
      },
      {
        name: "Riverside Park",
        type: "park",
        rating: 4.7,
        vicinity: "Near river, 0.5 miles away",
        place_id: "mock_3",
        opening_hours: { open_now: true },
      },
      {
        name: "City Sports Complex",
        type: "gym",
        rating: 4.3,
        vicinity: "Sports district, 1.2 miles away",
        place_id: "mock_4",
        opening_hours: { open_now: false },
      },
      {
        name: "Local History Museum",
        type: "museum",
        rating: 4.4,
        vicinity: "Cultural quarter, 0.9 miles away",
        place_id: "mock_5",
        opening_hours: { open_now: true },
      },
      {
        name: "Cozy Corner Restaurant",
        type: "restaurant",
        rating: 4.6,
        vicinity: "Main street, 0.4 miles away",
        place_id: "mock_6",
        opening_hours: { open_now: true },
      },
    ]

    // Filter places based on mood
    const relevantTypes = moodToPlaceTypes[this.selectedMood] || ["tourist_attraction"]
    return mockPlaces
      .filter((place) => relevantTypes.some((type) => place.type.includes(type.replace("_", ""))))
      .slice(0, 6)
  }

  displayResults(aiSuggestion, places) {
    // Display AI suggestion
    document.getElementById("aiSuggestionText").textContent = aiSuggestion

    // Display places
    const placesGrid = document.getElementById("placesGrid")
    placesGrid.innerHTML = ""

    places.forEach((place) => {
      const placeCard = this.createPlaceCard(place)
      placesGrid.appendChild(placeCard)
    })
  }

  createPlaceCard(place) {
    const col = document.createElement("div")
    col.className = "col-md-6 col-lg-4"

    const formatType = (type) => {
      return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }

    col.innerHTML = `
            <div class="card place-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">${place.name}</h5>
                        <span class="place-rating">
                            <i class="bi bi-star-fill"></i> ${place.rating}
                        </span>
                    </div>
                    <p class="text-muted small mb-2">
                        <i class="bi bi-geo-alt"></i> ${place.vicinity}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="place-type">${formatType(place.type)}</span>
                        ${
                          place.opening_hours?.open_now
                            ? '<span class="place-status"><i class="bi bi-clock"></i> Open now</span>'
                            : '<span class="text-muted small"><i class="bi bi-clock"></i> Closed</span>'
                        }
                    </div>
                    <button class="btn btn-primary w-100" onclick="app.openInMaps('${place.name}', '${place.vicinity}')">
                        <i class="bi bi-map"></i> View on Maps
                    </button>
                </div>
            </div>
        `

    return col
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
    locationBtn.innerHTML = '<i class="bi bi-geo-alt-fill me-2"></i>Get My Location'
    locationBtn.className = "btn btn-warning btn-lg"
    locationBtn.disabled = false

    document.getElementById("locationStatus").innerHTML = ""

    this.updateUI()
  }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.app = new WhereToGoApp()
})
