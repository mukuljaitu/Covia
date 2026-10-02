document.addEventListener("DOMContentLoaded", function () {
  const flightCodeEl = document.getElementById("cp-flight-code");
  const routeEl = document.getElementById("cp-route");
  const destinationEl = document.getElementById("cp-destination");
  const createPoolForm = document.getElementById("create-pool-form");
  const sizePills = document.querySelectorAll('#create-pool-form [data-size]');
  const poolPills = document.querySelectorAll('#create-pool-form [data-pool]');
  const cpError = document.getElementById("cp-error");
  const submitBtn = createPoolForm.querySelector('button[type="submit"]');

  let selectedSize = "4";
  let selectedPool = "everyone";

  let profile = null;
  try {
    const raw = sessionStorage.getItem("flightpoolUser");
    profile = raw ? JSON.parse(raw) : {};
  } catch (e) {
    profile = {};
  }

  const userGender = profile && profile.gender ? profile.gender : null;
  const isFemale = userGender === "female";

  if (!isFemale) {
    poolPills.forEach(function (pill) {
      if (pill.dataset.pool === "women") {
        pill.disabled = true;
        pill.style.opacity = "0.45";
        pill.style.cursor = "not-allowed";
        pill.title = "Women-only pools are available for female travelers only.";
      }
    });
  }

  if (profile && profile.flight) {
    const f = profile.flight;
    flightCodeEl.textContent = f.code;
    routeEl.textContent = `${f.from} → ${f.to}`;
  }
  if (profile && profile.destination) {
    destinationEl.textContent = `Going to: ${profile.destination}`;
  }

  function showError(message) {
    cpError.textContent = message;
    cpError.hidden = !message;
  }

  sizePills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      selectedSize = pill.dataset.size;
      sizePills.forEach(function (p) {
        const active = p.dataset.size === selectedSize;
        p.classList.toggle("is-active", active);
        p.setAttribute("aria-checked", String(active));
      });
      showError("");
    });
  });

  poolPills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      if (!isFemale && pill.dataset.pool === "women") {
        showError("Women-only pools are available for female travelers only.");
        return;
      }
      selectedPool = pill.dataset.pool;
      poolPills.forEach(function (p) {
        const active = p.dataset.pool === selectedPool;
        p.classList.toggle("is-active", active);
        p.setAttribute("aria-checked", String(active));
      });
      showError("");
    });
  });

  createPoolForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!selectedSize) {
      showError("Please choose a group size.");
      return;
    }
    if (!selectedPool) {
      showError("Please choose a pool type.");
      return;
    }
    if (!isFemale && selectedPool === "women") {
      showError("Women-only pools are available for female travelers only.");
      return;
    }
    showError("");

    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Creating pool…";
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.75";

    setTimeout(function () {
      try {
        let userProfile = null;
        const raw = sessionStorage.getItem("flightpoolUser");
        userProfile = raw ? JSON.parse(raw) : {};
        userProfile.createdPool = {
          size: Number(selectedSize),
          type: selectedPool,
          createdAt: Date.now(),
        };
        sessionStorage.setItem("flightpoolUser", JSON.stringify(userProfile));
      } catch (e) { }

      window.location.href = "pool.html";
    }, 500);
  });
});
