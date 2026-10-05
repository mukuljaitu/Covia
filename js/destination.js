document.addEventListener("DOMContentLoaded", function () {
    const destForm = document.getElementById("destination-form");
    const destInput = document.getElementById("destination-input");
    const destError = document.getElementById("dest-error");
    const airportNameEl = document.getElementById("airport-name");
    const suggestionChips = document.querySelectorAll(".suggestion-chip");

    const AIRPORT_LOOKUP = {
        Hyderabad: "Hyderabad International Airport",
        Bengaluru: "Kempegowda International Airport",
        "Bangalore": "Kempegowda International Airport",
        Chennai: "Chennai International Airport",
        Delhi: "Indira Gandhi International Airport",
        Mumbai: "Chhatrapati Shivaji Maharaj International Airport",
        Pune: "Pune International Airport",
    };

    let profile = null;
    try {
        const raw = sessionStorage.getItem("flightpoolUser");
        profile = raw ? JSON.parse(raw) : {};
    } catch (e) {
        profile = {};
    }

    const arrivalCity = profile && profile.arrivalAirport ? profile.arrivalAirport : "Hyderabad";
    airportNameEl.textContent = AIRPORT_LOOKUP[arrivalCity] || `${arrivalCity} International Airport`;

    suggestionChips.forEach(function (chip) {
        chip.addEventListener("click", function () {
            const value = chip.dataset.suggest;
            if (!value) return;
            destInput.value = value;
            destInput.focus();
            showDestError("");
        });
    });

    function showDestError(message) {
        destError.textContent = message;
        destError.hidden = !message;
    }

    destInput.addEventListener("input", function () {
        if (destError.textContent) showDestError("");
    });

    destForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const value = destInput.value.trim();
        if (!value) {
            showDestError("Please enter your destination.");
            destInput.focus();
            return;
        }
        if (value.length < 3) {
            showDestError("Please enter a destination with at least 3 characters.");
            destInput.focus();
            return;
        }

        try {
            let userProfile = null;
            const raw = sessionStorage.getItem("flightpoolUser");
            userProfile = raw ? JSON.parse(raw) : {};
            userProfile.destination = value;
            userProfile.arrivalAirportName = airportNameEl.textContent;
            sessionStorage.setItem("flightpoolUser", JSON.stringify(userProfile));
        } catch (e) { }

        window.location.href = "matches";
    });
});
