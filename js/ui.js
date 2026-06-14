class UI {
  static updateSteps(currentStep) {
    document.querySelectorAll(".step-indicator").forEach((indicator, index) => {
      const stepNum = index + 1;

      indicator.classList.remove("active", "completed");

      if (stepNum === currentStep) {
        indicator.classList.add("active");
      } else if (stepNum < currentStep) {
        indicator.classList.add("completed");
      }
    });

    document.querySelectorAll(".step-line").forEach((line, index) => {
      line.classList.remove("active");

      if (index + 1 < currentStep) {
        line.classList.add("active");
      }
    });
  }

  static showStep(currentStep) {
    document.querySelectorAll(".step-content").forEach((content) => {
      content.classList.remove("active");
    });

    document.getElementById(`step${currentStep}`)?.classList.add("active");
  }

  static updateNavigation(app) {
    const backBtn = document.getElementById("backBtn");
    const nextBtn = document.getElementById("nextBtn");
    const recommendationsBtn = document.getElementById("getRecommendationsBtn");

    backBtn.style.display =
      app.currentStep > 1 ? "block" : "none";

    if (app.currentStep < 3) {
      nextBtn.style.display = "block";
      recommendationsBtn.style.display = "none";

      let canProceed = false;

      if (app.currentStep === 1 && app.selectedMood) {
        canProceed = true;
      }

      if (app.currentStep === 2 && app.selectedTime) {
        canProceed = true;
      }

      nextBtn.disabled = !canProceed;
    } else {
      nextBtn.style.display = "none";

      recommendationsBtn.style.display =
        app.userLocation ? "block" : "none";
    }
  }

static showLoading() {
  document.getElementById("loadingModal").classList.remove("hidden");
}

static hideLoading() {
  document.getElementById("loadingModal").classList.add("hidden");
}

  static displayResults(aiSuggestion, places) {
    const aiCard = document.getElementById("aiSuggestionCard");
    const aiText = document.getElementById("aiSuggestionText");

    aiText.textContent = aiSuggestion;
aiCard.classList.remove("hidden");
    const placesGrid = document.getElementById("placesGrid");
    placesGrid.innerHTML = "";

    places.forEach((place) => {
      placesGrid.appendChild(UI.createPlaceCard(place));
    });

    document.querySelectorAll(".step-content").forEach((content) => {
      content.classList.remove("active");
    });

    document.getElementById("results").classList.add("active");
  }

  static createPlaceCard(place) {
    const card = document.createElement("div");

    card.className = "place-card";

    const formatType = (type) => {
      return type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    card.innerHTML = `
      <div class="place-header">
        <h3 class="place-name">${place.name}</h3>
        ${
          place.rating
            ? `<span class="place-rating">⭐ ${place.rating}</span>`
            : ""
        }
      </div>

      <p class="place-address">
        📍 ${place.vicinity}
      </p>

      <div class="place-info">
        <span class="place-type">
          ${formatType(place.type)}
        </span>

        <span class="place-status ${
          place.opening_hours?.open_now
            ? "open"
            : "closed"
        }">
          🕐 ${
            place.opening_hours?.open_now
              ? "Open Now"
              : "Closed"
          }
        </span>
      </div>

      <button class="place-btn">
        🗺️ View on Maps
      </button>
    `;

    card.querySelector(".place-btn").addEventListener("click", () => {
      UI.openInMaps(place.name, place.vicinity);
    });

    return card;
  }

  static openInMaps(name, vicinity) {
    const query = encodeURIComponent(
      `${name} ${vicinity}`
    );

    window.open(
      `https://www.google.com/maps/search/${query}`,
      "_blank"
    );
  }
}

window.UI = UI;
