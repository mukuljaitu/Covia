document.addEventListener("DOMContentLoaded", function () {
    const flightForm = document.getElementById("flight-form");
    const flightInput = document.getElementById("flight-number");
    const flightResult = document.getElementById("flight-result");
    const changeFlightBtn = document.getElementById("change-flight-btn");
    const frCode = document.getElementById("fr-code");
    const frRoute = document.getElementById("fr-route");
    const frArrival = document.getElementById("fr-arrival");
    const flightError = document.getElementById("flight-error");
    const submitBtn = document.getElementById("flight-submit");

    const API_KEY = "2634f30838698ebf6ec6e25bb1e9f2aa";
    const API_BASE_URL = "https://api.aviationstack.com/v1/flights";

    function normalize(val) {
        return String(val || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    }

    // Format flight number for API (e.g., "E123" -> "E 123")
    function formatFlightNumber(raw) {
        const normalized = normalize(raw);
        if (!normalized) return null;

        // Try to match airline code and flight number
        const match = normalized.match(/^([A-Z]{1,2})([0-9]{1,4})$/);
        if (match) {
            return match[1] + match[2]; // Return as "E123" format for API
        }
        return normalized;
    }

    // Fetch flight data from AviationStack API
    async function fetchFlightData(flightNumber) {
        try {
            const url = `${API_BASE_URL}?access_key=${API_KEY}&flight_number=${flightNumber}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("API Error:", data.error);
                return null;
            }

            if (!data.data || data.data.length === 0) {
                return null;
            }

            // Get the first flight result
            const flight = data.data[0];

            // Format the flight data
            return {
                code: flight.flight?.iata || flight.flight?.icao || flightNumber,
                from: flight.departure?.airport || flight.departure?.iata || "Unknown",
                to: flight.arrival?.airport || flight.arrival?.iata || "Unknown",
                arrival: formatArrivalTime(flight.arrival?.scheduled),
                fromCity: flight.departure?.city || flight.departure?.iata || "Unknown",
                toCity: flight.arrival?.city || flight.arrival?.iata || "Unknown"
            };
        } catch (error) {
            console.error("Error fetching flight data:", error);
            return null;
        }
    }

    // Format arrival time from API response
    function formatArrivalTime(scheduledTime) {
        if (!scheduledTime) return "Time unknown";

        try {
            const date = new Date(scheduledTime);
            const time = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            const day = date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short'
            });
            return `${time} · ${day}`;
        } catch (error) {
            return scheduledTime;
        }
    }

    // Fallback sample flights for testing
    const SAMPLE_FLIGHTS = {
        "e123": { code: "GE 123", from: "Delhi", to: "Hyderabad", fromCity: "Delhi", toCity: "Hyderabad", arrival: "7:25 PM · 21 Sep" },
        "ge123": { code: "GE 123", from: "Delhi", to: "Hyderabad", fromCity: "Delhi", toCity: "Hyderabad", arrival: "7:25 PM · 21 Sep" },
        "6e234": { code: "6E 234", from: "Mumbai", to: "Bengaluru", fromCity: "Mumbai", toCity: "Bengaluru", arrival: "6:10 PM · 21 Sep" },
        "ai401": { code: "AI 401", from: "Delhi", to: "Chennai", fromCity: "Delhi", toCity: "Chennai", arrival: "9:40 PM · 21 Sep" },
        "sg889": { code: "SG 889", from: "Pune", to: "Hyderabad", fromCity: "Pune", toCity: "Hyderabad", arrival: "5:05 PM · 21 Sep" },
    };

    async function findMatch(raw) {
        const formattedFlightNumber = formatFlightNumber(raw);
        if (!formattedFlightNumber) return null;

        // Try to fetch from API first
        const apiData = await fetchFlightData(formattedFlightNumber);
        if (apiData) {
            return apiData;
        }

        // Fallback to sample flights if API fails
        const key = normalize(raw);
        if (SAMPLE_FLIGHTS[key.toLowerCase()]) {
            return SAMPLE_FLIGHTS[key.toLowerCase()];
        }

        // Default fallback for any valid flight number format
        const airline = key.match(/^([A-Z]{1,2})([0-9]{1,4})$/);
        if (airline) {
            const code = airline[1] + " " + airline[2];
            return {
                code: code,
                from: "Delhi",
                to: "Hyderabad",
                fromCity: "Delhi",
                toCity: "Hyderabad",
                arrival: "7:25 PM · 21 Sep",
            };
        }
        return null;
    }

    function showResult(match) {
        frCode.textContent = match.code;
        // Use city names if available, otherwise use airport codes
        const fromText = match.fromCity || match.from;
        const toText = match.toCity || match.to;
        frRoute.innerHTML = `${fromText} &rarr; ${toText}`;
        frArrival.textContent = `Arrival: ${match.arrival}`;
        flightResult.hidden = false;
        changeFlightBtn.hidden = false;
        flightInput.readOnly = true;
        flightInput.classList.add("is-locked");
        submitBtn.disabled = false;
        showFlightError("");
    }

    function hideResult() {
        flightResult.hidden = true;
        changeFlightBtn.hidden = true;
        flightInput.readOnly = false;
        flightInput.classList.remove("is-locked");
    }

    function showFlightError(message) {
        flightError.textContent = message;
        flightError.hidden = !message;
    }

    let typeTimer = null;
    flightInput.addEventListener("input", function () {
        clearTimeout(typeTimer);
        showFlightError("");
        const value = flightInput.value.trim();
        if (!value) {
            hideResult();
            return;
        }

        // Show loading indicator
        showFlightError("Searching flight...");

        typeTimer = setTimeout(async function () {
            const match = await findMatch(value);
            if (match) {
                showResult(match);
            } else if (normalize(value).length >= 3) {
                hideResult();
                showFlightError("Flight not found. Try a different flight number.");
            } else {
                hideResult();
                showFlightError("");
            }
        }, 280);
    });

    changeFlightBtn.addEventListener("click", function () {
        flightInput.value = "";
        hideResult();
        flightInput.focus();
    });

    flightForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const value = flightInput.value.trim();

        if (!value) {
            showFlightError("Please enter a flight number.");
            flightInput.focus();
            return;
        }

        // Show loading state
        showFlightError("Verifying flight...");

        const match = await findMatch(value);

        if (!match) {
            showFlightError("No flight found. Try a different flight number.");
            flightInput.focus();
            return;
        }

        let profile = null;
        try {
            const raw = sessionStorage.getItem("flightpoolUser");
            profile = raw ? JSON.parse(raw) : {};
        } catch (e) {
            profile = {};
        }
        profile.flight = {
            code: match.code,
            from: match.fromCity || match.from,
            to: match.toCity || match.to,
            arrival: match.arrival,
        };
        profile.arrivalAirport = match.toCity || match.to;
        sessionStorage.setItem("flightpoolUser", JSON.stringify(profile));

        window.location.href = "destination";
    });
});
