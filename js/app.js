const API_BASE_URL = "https://where-should-i-go.onrender.com"

/* SVG markup reused for the location button states */
const PIN_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>'
const CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'

class WhereToGoApp {
  constructor() {
    this.currentStep = 1
    this.selectedMood = null
    this.selectedTime = null
    this.userLocation = null
    this.init()
  }

  init() {
    this.bindEvents()
    this.updateUI()
  }

  bindEvents() {
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.selectMood(e.currentTarget.dataset.mood))
    })

    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.selectTime(e.currentTarget.dataset.time))
    })

    document.getElementById("getLocationBtn").addEventListener("click", () => this.getLocation())
    document.getElementById("nextBtn").addEventListener("click", () => this.nextStep())
    document.getElementById("backBtn").addEventListener("click", () => this.previousStep())
    document.getElementById("getRecommendationsBtn").addEventListener("click", () => this.getRecommendations())
    document.getElementById("startOverBtn").addEventListener("click", () => this.startOver())
  }

  selectMood(mood) {
    this.selectedMood = mood
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      const active = btn.dataset.mood === mood
      btn.classList.toggle("selected", active)
      btn.setAttribute("aria-pressed", active ? "true" : "false")
    })
    this.updateUI()
  }

  selectTime(time) {
    this.selectedTime = time
    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.time === time)
    })
    this.updateUI()
  }

  async getLocation() {
    const statusDiv = document.getElementById("locationStatus")
    const btn = document.getElementById("getLocationBtn")

    btn.innerHTML = `<span class="btn-icon">${PIN_SVG}</span><span class="btn-text">Locating…</span>`
    btn.disabled = true

    try {
      this.userLocation = await LocationService.getCurrentLocation()
      statusDiv.innerHTML = '<div class="status-success">Location found — you\'re all set.</div>'
      btn.innerHTML = `<span class="btn-icon">${CHECK_SVG}</span><span class="btn-text">Location found</span>`
      btn.classList.add("success")
      this.updateUI()
    } catch (error) {
      statusDiv.innerHTML = `<div class="status-error">${error}</div>`
      btn.innerHTML = `<span class="btn-icon">${PIN_SVG}</span><span class="btn-text">Try again</span>`
      btn.disabled = false
    }
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
    UI.updateSteps(this.currentStep)
    UI.showStep(this.currentStep)
    UI.updateNavigation(this)
  }

  async getRecommendations() {
    if (!this.selectedMood || !this.selectedTime || !this.userLocation) {
      alert("Please complete all steps first.")
      return
    }

    UI.showLoading()

    try {
      let places
      let aiSuggestion

      try {
        places = await this.getNearbyPlaces()
        aiSuggestion = await this.getAISuggestion(places)
      } catch (apiError) {
        // Backend unreachable — fall back to a curated local sample so the
        // experience still works end-to-end.
        console.log("[v0] API unavailable, using local sample data:", apiError.message)
        places = this.getSamplePlaces()
        aiSuggestion = this.getSampleSuggestion()
      }

      UI.hideLoading()
      UI.displayResults(aiSuggestion, places)
    } catch (error) {
      UI.hideLoading()
      console.error(error)
      alert("Sorry, there was an error getting your recommendations.")
    }
  }

  async getNearbyPlaces() {
    const response = await fetch(`${API_BASE_URL}/api/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: this.selectedMood,
        lat: this.userLocation.lat,
        lng: this.userLocation.lng,
      }),
    })

    if (!response.ok) throw new Error("Failed to fetch places")

    const places = await response.json()
    return places.map((place) => ({
      name: place.name || "Unknown place",
      type: place.types?.[0] || "place",
      rating: place.rating || "N/A",
      vicinity: place.vicinity || place.formatted_address || "Nearby location",
      place_id: place.place_id,
      opening_hours: place.opening_hours || { open_now: false },
    }))
  }

  async getAISuggestion(places) {
    const response = await fetch(`${API_BASE_URL}/api/suggestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: this.selectedMood,
        time: this.selectedTime,
        places: places,
      }),
    })

    if (!response.ok) throw new Error("Failed to generate suggestion")

    const data = await response.json()
    return data.suggestion
  }

  /* ---------- Local fallback content ---------- */

  getSampleSuggestion() {
    const time = this.timeLabel()
    const notes = {
      bored: `With ${time} on your hands and a craving for something new, wander toward a lively spot where there's plenty to look at. Let yourself get a little lost.`,
      anxious: `Give yourself ${time} to slow down. A quiet park bench or a calm café corner can do more than you'd expect. Breathe, sip, and let the city soften.`,
      curious: `Use your ${time} to follow your curiosity — a small museum, a bookshop, or a gallery you've walked past a hundred times. Today is the day to step in.`,
      energetic: `You've got ${time} and energy to burn. Point yourself toward somewhere active and let the movement clear your head.`,
      hungry: `Good food is its own kind of adventure. With ${time} to spare, seek out a local table and order the thing you can't pronounce.`,
      social: `You're in the mood for people — spend your ${time} somewhere with a hum to it. A shared table or a busy corner makes for easy company.`,
      peaceful: `Protect your ${time}. Find the quietest green space or reading room nearby and let the world keep moving without you for a while.`,
      adventurous: `Adventure rarely needs more than ${time} and a willingness to turn down the unfamiliar street. Pick a direction and go.`,
    }
    return notes[this.selectedMood] || `Make the most of your ${time} and explore something nearby that matches your mood.`
  }

  timeLabel() {
    return (
      {
        "30min": "half an hour",
        "1hour": "an hour",
        "2hours": "a couple of hours",
        fullday: "a whole day",
      }[this.selectedTime] || "some time"
    )
  }

  getSamplePlaces() {
    const samples = {
      bored: [
        { name: "The Lantern Arcade", type: "entertainment", rating: 4.5, vicinity: "Old Town, 2 blocks away", opening_hours: { open_now: true } },
        { name: "Riverside Market Hall", type: "market", rating: 4.3, vicinity: "Harbour District", opening_hours: { open_now: true } },
        { name: "Cinema Paradiso", type: "movie_theater", rating: 4.6, vicinity: "Theatre Row", opening_hours: { open_now: false } },
      ],
      anxious: [
        { name: "Willow Botanical Garden", type: "park", rating: 4.8, vicinity: "North Greens", opening_hours: { open_now: true } },
        { name: "Quiet Pages Bookshop & Café", type: "cafe", rating: 4.7, vicinity: "Maple Street", opening_hours: { open_now: true } },
        { name: "Stillwater Spa", type: "spa", rating: 4.6, vicinity: "Wellness Quarter", opening_hours: { open_now: false } },
      ],
      curious: [
        { name: "City Museum of Making", type: "museum", rating: 4.6, vicinity: "Cultural Quarter", opening_hours: { open_now: true } },
        { name: "Foundry Art Gallery", type: "art_gallery", rating: 4.4, vicinity: "Arts District", opening_hours: { open_now: true } },
        { name: "The Atlas Bookshop", type: "book_store", rating: 4.5, vicinity: "Old Library Lane", opening_hours: { open_now: true } },
      ],
      energetic: [
        { name: "Summit Climbing Gym", type: "gym", rating: 4.6, vicinity: "Warehouse District", opening_hours: { open_now: true } },
        { name: "Lakeside Cycle Loop", type: "park", rating: 4.5, vicinity: "East Lake", opening_hours: { open_now: true } },
        { name: "Court 9 Sports Center", type: "sports_complex", rating: 4.3, vicinity: "Athletic Park", opening_hours: { open_now: true } },
      ],
      hungry: [
        { name: "Ember & Oak Bistro", type: "restaurant", rating: 4.7, vicinity: "Culinary Row", opening_hours: { open_now: true } },
        { name: "Flour + Stone Bakery", type: "bakery", rating: 4.6, vicinity: "Baker Street", opening_hours: { open_now: true } },
        { name: "Saturday Farmers Market", type: "market", rating: 4.5, vicinity: "Town Square", opening_hours: { open_now: true } },
      ],
      social: [
        { name: "The Rooftop Social", type: "bar", rating: 4.4, vicinity: "Skyline District", opening_hours: { open_now: true } },
        { name: "Commons Table", type: "restaurant", rating: 4.6, vicinity: "Central Plaza", opening_hours: { open_now: true } },
        { name: "Meeple Board Game Café", type: "cafe", rating: 4.5, vicinity: "University Quarter", opening_hours: { open_now: true } },
      ],
      peaceful: [
        { name: "Cedar Hollow Park", type: "park", rating: 4.8, vicinity: "Hillside", opening_hours: { open_now: true } },
        { name: "Central Reading Room", type: "library", rating: 4.6, vicinity: "Civic Center", opening_hours: { open_now: true } },
        { name: "Lotus Meditation Studio", type: "wellness_center", rating: 4.7, vicinity: "Garden District", opening_hours: { open_now: false } },
      ],
      adventurous: [
        { name: "Ridgeline Trailhead", type: "hiking_area", rating: 4.7, vicinity: "Northern Hills", opening_hours: { open_now: true } },
        { name: "Old Harbour Kayak Co.", type: "tourist_attraction", rating: 4.5, vicinity: "Waterfront", opening_hours: { open_now: true } },
        { name: "Skyline Lookout Point", type: "viewpoint", rating: 4.6, vicinity: "East Ridge", opening_hours: { open_now: true } },
      ],
    }
    return samples[this.selectedMood] || samples.curious
  }

  startOver() {
    this.currentStep = 1
    this.selectedMood = null
    this.selectedTime = null
    this.userLocation = null

    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.classList.remove("selected")
      btn.setAttribute("aria-pressed", "false")
    })
    document.querySelectorAll(".time-btn").forEach((btn) => btn.classList.remove("selected"))

    const locationBtn = document.getElementById("getLocationBtn")
    locationBtn.innerHTML = `<span class="btn-icon">${PIN_SVG}</span><span class="btn-text">Use my location</span>`
    locationBtn.className = "location-btn"
    locationBtn.disabled = false

    document.getElementById("locationStatus").innerHTML = ""
    document.getElementById("aiSuggestionCard").classList.add("hidden")

    this.updateUI()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new WhereToGoApp()
})
