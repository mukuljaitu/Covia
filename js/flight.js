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

    const SAMPLE_FLIGHTS = {
        "e123": { code: "GE 123", from: "Delhi", to: "Hyderabad", arrival: "7:25 PM · 21 Sep" },
        "ge123": { code: "GE 123", from: "Delhi", to: "Hyderabad", arrival: "7:25 PM · 21 Sep" },
        "6e234": { code: "6E 234", from: "Mumbai", to: "Bengaluru", arrival: "6:10 PM · 21 Sep" },
        "ai401": { code: "AI 401", from: "Delhi", to: "Chennai", arrival: "9:40 PM · 21 Sep" },
        "sg889": { code: "SG 889", from: "Pune", to: "Hyderabad", arrival: "5:05 PM · 21 Sep" },
    };

    function normalize(val) {
        return String(val || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    }

    function findMatch(raw) {
        const key = normalize(raw);
        if (!key) return null;
        if (SAMPLE_FLIGHTS[key.toLowerCase()]) return SAMPLE_FLIGHTS[key.toLowerCase()];
        const airline = key.match(/^([A-Z]{1,2})([0-9]{1,4})$/);
        if (airline) {
            const code = airline[1] + " " + airline[2];
            return {
                code: code,
                from: "Delhi",
                to: "Hyderabad",
                arrival: "7:25 PM · 21 Sep",
            };
        }
        return null;
    }

    function showResult(match) {
        frCode.textContent = match.code;
        frRoute.innerHTML = `${match.from} &rarr; ${match.to}`;
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
        typeTimer = setTimeout(function () {
            const match = findMatch(value);
            if (match) {
                showResult(match);
            } else if (normalize(value).length >= 3) {
                hideResult();
            }
        }, 280);
    });

    changeFlightBtn.addEventListener("click", function () {
        flightInput.value = "";
        hideResult();
        flightInput.focus();
    });

    flightForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const value = flightInput.value.trim();
        const match = findMatch(value);
        if (!value) {
            showFlightError("Please enter a flight number.");
            flightInput.focus();
            return;
        }
        if (!match) {
            showFlightError("No flight found. Try E 123.");
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
            from: match.from,
            to: match.to,
            arrival: match.arrival,
        };
        profile.arrivalAirport = match.to;
        sessionStorage.setItem("flightpoolUser", JSON.stringify(profile));

        window.location.href = "destination.html";
    });
});
