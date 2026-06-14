/* Inline SVG icons (Lucide-style) used in dynamically rendered markup */
const ICONS = {
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.382V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>',
}

class UI {
  static showElement(element) {
    element.classList.remove("hidden")
  }

  static hideElement(element) {
    element.classList.add("hidden")
  }

  static updateSteps(currentStep) {
    document.querySelectorAll(".step-indicator").forEach((indicator, index) => {
      const stepNum = index + 1
      indicator.classList.remove("active", "completed")

      if (stepNum === currentStep) {
        indicator.classList.add("active")
      } else if (stepNum < currentStep) {
        indicator.classList.add("completed")
      }
    })

    document.querySelectorAll(".step-line").forEach((line, index) => {
      line.classList.remove("active")
      if (index + 1 < currentStep) {
        line.classList.add("active")
      }
    })
  }

  static showStep(currentStep) {
    document.querySelectorAll(".step-content").forEach((content) => {
      content.classList.remove("active")
    })
    document.getElementById(`step${currentStep}`)?.classList.add("active")
  }

  static updateNavigation(app) {
    const backBtn = document.getElementById("backBtn")
    const nextBtn = document.getElementById("nextBtn")
    const recommendationsBtn = document.getElementById("getRecommendationsBtn")

    if (app.currentStep > 1) {
      UI.showElement(backBtn)
    } else {
      UI.hideElement(backBtn)
    }

    if (app.currentStep < 3) {
      UI.showElement(nextBtn)
      UI.hideElement(recommendationsBtn)

      let canProceed = false
      if (app.currentStep === 1 && app.selectedMood) canProceed = true
      if (app.currentStep === 2 && app.selectedTime) canProceed = true

      nextBtn.disabled = !canProceed
    } else {
      UI.hideElement(nextBtn)

      if (app.userLocation) {
        UI.showElement(recommendationsBtn)
      } else {
        UI.hideElement(recommendationsBtn)
      }
    }
  }

  static showLoading() {
    document.getElementById("loadingModal").classList.remove("hidden")
  }

  static hideLoading() {
    document.getElementById("loadingModal").classList.add("hidden")
  }

  static displayResults(aiSuggestion, places) {
    const aiCard = document.getElementById("aiSuggestionCard")
    const aiText = document.getElementById("aiSuggestionText")
    const placesGrid = document.getElementById("placesGrid")

    aiText.textContent = aiSuggestion
    aiCard.classList.remove("hidden")

    placesGrid.innerHTML = ""
    places.forEach((place) => {
      placesGrid.appendChild(UI.createPlaceCard(place))
    })

    document.querySelectorAll(".step-content").forEach((content) => {
      content.classList.remove("active")
    })
    document.getElementById("results").classList.add("active")

    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" })
  }

  static createPlaceCard(place) {
    const card = document.createElement("div")
    card.className = "place-card"

    const formatType = (type) => type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

    const isOpen = place.opening_hours?.open_now

    card.innerHTML = `
      <div class="place-header">
        <h3 class="place-name">${place.name}</h3>
        ${place.rating && place.rating !== "N/A" ? `<span class="place-rating">${ICONS.star} ${place.rating}</span>` : ""}
      </div>

      <p class="place-address">${ICONS.pin} ${place.vicinity}</p>

      <div class="place-info">
        <span class="place-type">${formatType(place.type)}</span>
        <span class="place-status ${isOpen ? "open" : "closed"}">${isOpen ? "Open now" : "Closed"}</span>
      </div>

      <button class="place-btn">${ICONS.map}<span>View on map</span></button>
    `

    card.querySelector(".place-btn").addEventListener("click", () => {
      UI.openInMaps(place.name, place.vicinity)
    })

    return card
  }

  static openInMaps(name, vicinity) {
    const query = encodeURIComponent(`${name} ${vicinity}`)
    window.open(`https://www.google.com/maps/search/${query}`, "_blank")
  }
}

window.UI = UI
