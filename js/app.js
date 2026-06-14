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
      const [aiSuggestion, places] = await Promise.all([
        this.getAISuggestion(),
        this.getNearbyPlaces(),
      ]);

      UI.hideLoading();
      UI.displayResults(aiSuggestion, places);
    } catch (error) {
      UI.hideLoading();
      alert("Sorry, there was an error getting your recommendations.");
      console.error(error);
    }
  }

  async getAISuggestion() {
    const currentHour = new Date().getHours();

    let timeOfDay = "morning";

    if (currentHour >= 12 && currentHour < 17) {
      timeOfDay = "afternoon";
    } else if (currentHour >= 17) {
      timeOfDay = "evening";
    }

    const suggestions = {
      bored: `Since you're feeling bored and have ${this.selectedTime} to spare during this ${timeOfDay}, I recommend visiting an entertainment venue, shopping area, or activity center.`,

      anxious: `Since you're feeling anxious and have ${this.selectedTime} during this ${timeOfDay}, I recommend a peaceful park, cozy café, or quiet library.`,

      curious: `Your curious mood is perfect for a museum, gallery, cultural center, or bookstore during this ${timeOfDay}.`,

      energetic: `With all that energy and ${this.selectedTime} available, try a gym, sports center, park, or recreation area.`,

      hungry: `Since you're hungry and have ${this.selectedTime}, explore restaurants, cafés, bakeries, or local food markets.`,

      social: `Since you're feeling social, restaurants, cafés, community spaces, or live music places would be great.`,

      peaceful: `For a peaceful mood, try a park, library, spa, meditation center, or quiet café.`,

      adventurous: `Your adventurous mood is perfect for hiking trails, outdoor activities, tourist attractions, or unique local spots.`,
    };

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return suggestions[this.selectedMood];
  }

  async getNearbyPlaces() {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return window.placesData[this.selectedMood] || window.placesData.curious;
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
    document.getElementById("aiSuggestionCard").style.display = "none";

    this.updateUI();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new WhereToGoApp();
});
