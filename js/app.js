const API_BASE_URL = "https://where-should-i-go.onrender.com";

class WhereToGoApp {
  constructor() {
    this.currentStep = 1;
    this.selectedMood = null;
    this.selectedTime = null;
    this.userLocation = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectMood(e.currentTarget.dataset.mood);
      });
    });

    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectTime(e.currentTarget.dataset.time);
      });
    });

    document.getElementById("getLocationBtn").addEventListener("click", () => {
      this.getLocation();
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
      this.nextStep();
    });

    document.getElementById("backBtn").addEventListener("click", () => {
      this.previousStep();
    });

    document.getElementById("getRecommendationsBtn").addEventListener("click", () => {
      this.getRecommendations();
    });

    document.getElementById("startOverBtn").addEventListener("click", () => {
      this.startOver();
    });
  }

  selectMood(mood) {
    this.selectedMood = mood;

    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    document.querySelector(`[data-mood="${mood}"]`).classList.add("selected");

    this.updateUI();
  }

  selectTime(time) {
    this.selectedTime = time;

    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    document.querySelector(`[data-time="${time}"]`).classList.add("selected");

    this.updateUI();
  }

  async getLocation() {
    const statusDiv = document.getElementById("locationStatus");
    const btn = document.getElementById("getLocationBtn");

    btn.innerHTML = "📍 Getting Location...";
    btn.disabled = true;

    try {
      this.userLocation = await LocationService.getCurrentLocation();

      statusDiv.innerHTML =
        '<div class="status-success">✅ Location detected successfully!</div>';

      btn.innerHTML = "✅ Location Found";
      btn.classList.add("success");

      this.updateUI();
    } catch (error) {
      statusDiv.innerHTML = `<div class="status-error">❌ ${error}</div>`;

      btn.innerHTML = "📍 Try Again";
      btn.disabled = false;
    }
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
      this.updateUI();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateUI();
    }
  }

  updateUI() {
    UI.updateSteps(this.currentStep);
    UI.showStep(this.currentStep);
    UI.updateNavigation(this);
  }

  async getRecommendations() {
    if (!this.selectedMood || !this.selectedTime || !this.userLocation) {
      alert("Please complete all steps first.");
      return;
    }

    UI.showLoading();

    try {
      const places = await this.getNearbyPlaces();
      const aiSuggestion = await this.getAISuggestion(places);

      UI.hideLoading();
      UI.displayResults(aiSuggestion, places);
    } catch (error) {
      UI.hideLoading();
      console.error(error);
      alert("Sorry, there was an error getting your recommendations.");
    }
  }

  async getNearbyPlaces() {
    const response = await fetch(`${API_BASE_URL}/api/places`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mood: this.selectedMood,
        lat: this.userLocation.lat,
        lng: this.userLocation.lng,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch places");
    }

    return await response.json();
  }

  async getAISuggestion(places) {
    const response = await fetch(`${API_BASE_URL}/api/suggestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mood: this.selectedMood,
        time: this.selectedTime,
        places: places,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate suggestion");
    }

    const data = await response.json();
    return data.suggestion;
  }

  startOver() {
    this.currentStep = 1;
    this.selectedMood = null;
    this.selectedTime = null;
    this.userLocation = null;

    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    document.querySelectorAll(".time-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    const locationBtn = document.getElementById("getLocationBtn");
    locationBtn.innerHTML = "📍 Get My Location";
    locationBtn.className = "location-btn";
    locationBtn.disabled = false;

    document.getElementById("locationStatus").innerHTML = "";
    document.getElementById("aiSuggestionCard").classList.add("hidden");

    this.updateUI();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new WhereToGoApp();
});
