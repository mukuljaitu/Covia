document.addEventListener("DOMContentLoaded", function () {
  const flightCodeEl = document.getElementById("m-flight-code");
  const flightArrivalEl = document.getElementById("m-flight-arrival");
  const destinationEl = document.getElementById("m-destination");
  const femaleToggle = document.getElementById("female-toggle");
  const groupsStack = document.getElementById("groups-stack");
  const createOwnBtn = document.getElementById("goto-create-pool");
  const joinButtons = groupsStack.querySelectorAll(".join-pool-btn");
  const filterRow = document.querySelector(".filter-toggle-row");

  let profile = null;
  try {
    const raw = sessionStorage.getItem("flightpoolUser");
    profile = raw ? JSON.parse(raw) : {};
  } catch (e) {
    profile = {};
  }

  const userGender = profile && profile.gender ? profile.gender : null;
  const isFemale = userGender === "female";

  if (filterRow && !isFemale) {
    filterRow.style.display = "none";
  }

  if (profile && profile.flight) {
    const f = profile.flight;
    flightCodeEl.textContent = `${f.code} · ${f.from} → ${f.to}`;
    const arrivalTime = (f.arrival || "").split("·")[0];
    if (arrivalTime) flightArrivalEl.textContent = arrivalTime.trim();
  }
  if (profile && profile.destination) {
    destinationEl.textContent = profile.destination;
  }

  function applyFilter() {
    const onlyFemale = femaleToggle.checked;
    const cards = groupsStack.querySelectorAll(".group-card-group");
    cards.forEach(function (card) {
      if (card.dataset.gender === "female" && !isFemale) {
        card.hidden = true;
        return;
      }
      if (onlyFemale) {
        card.hidden = card.dataset.gender !== "female";
      } else {
        card.hidden = card.dataset.gender === "female";
      }
    });
  }

  femaleToggle.addEventListener("change", applyFilter);
  applyFilter();

  joinButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const poolId = btn.dataset.join;
      const originalText = btn.textContent;
      btn.textContent = "Joining…";
      btn.disabled = true;
      btn.style.opacity = "0.7";
      setTimeout(function () {
        try {
          let userProfile = null;
          const raw = sessionStorage.getItem("flightpoolUser");
          userProfile = raw ? JSON.parse(raw) : {};
          userProfile.joinedPool = poolId;
          sessionStorage.setItem("flightpoolUser", JSON.stringify(userProfile));
        } catch (e) { }
        window.location.href = "pool.html";
      }, 450);
    });
  });

  createOwnBtn.addEventListener("click", function () {
    window.location.href = "create-pool.html";
  });
});
