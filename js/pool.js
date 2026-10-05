document.addEventListener("DOMContentLoaded", function () {
  const flightCodeEl = document.getElementById("pool-flight-code");
  const routeEl = document.getElementById("pool-route");
  const destinationEl = document.getElementById("pool-destination");
  const arrivalEl = document.getElementById("pool-arrival");
  const openChatBtn = document.getElementById("open-chat-btn");
  const leavePoolBtn = document.getElementById("leave-pool-btn");
  const reportBtn = document.getElementById("report-btn");
  const blockBtn = document.getElementById("block-btn");
  const countCurrEl = document.getElementById("pool-count-curr");
  const countMaxEl = document.getElementById("pool-count-max");
  const bannerTitleEl = document.getElementById("pool-banner-title");
  const travelersGrid = document.getElementById("pool-travelers-grid");

  const JOINED_POOL_NAMES = {
    gachibowli: "Gachibowli Group",
    hitech: "Hitech City + Gachibowli",
    "female-gachi": "Gachibowli · Women only",
  };

  let profile = null;
  try {
    const raw = sessionStorage.getItem("flightpoolUser");
    profile = raw ? JSON.parse(raw) : {};
  } catch (e) {
    profile = {};
  }

  const joinedId = profile && profile.joinedPool ? profile.joinedPool : null;
  const createdPool = profile && profile.createdPool ? profile.createdPool : null;
  const hasJoined = !!joinedId;
  const hasCreated = !!createdPool && !hasJoined;

  if (profile && profile.flight) {
    const f = profile.flight;
    flightCodeEl.textContent = f.code;
    routeEl.textContent = `${f.from} → ${f.to}`;
    const arrivalTime = (f.arrival || "").split("·")[0];
    if (arrivalTime) arrivalEl.textContent = arrivalTime.trim();
  }
  if (profile && profile.destination) {
    destinationEl.textContent = profile.destination;
  }

  const maxSize = hasCreated && createdPool.size ? createdPool.size : 4;
  countMaxEl.textContent = String(maxSize);
  if (hasCreated) {
    countCurrEl.textContent = "1";
  } else {
    countCurrEl.textContent = "4";
  }

  if (hasJoined) {
    bannerTitleEl.textContent = "You're in the group! Ready to ride.";
  } else if (hasCreated) {
    bannerTitleEl.textContent = "Your pool is live! Looking for travelers";
    countCurrEl.textContent = "1";
    countMaxEl.textContent = String(createdPool.size || 4);
    if (travelersGrid) {
      const cards = travelersGrid.querySelectorAll(".traveler-card");
      cards.forEach(function (card, idx) {
        if (idx > 0) {
          card.style.opacity = "0.35";
          card.style.filter = "blur(0.5px)";
        }
      });
    }
  }

  openChatBtn.addEventListener("click", function () {
    const originalText = openChatBtn.textContent;
    openChatBtn.textContent = "Opening chat…";
    openChatBtn.disabled = true;
    openChatBtn.style.opacity = "0.75";
    setTimeout(function () {
      window.location.href = "chat";
    }, 350);
  });

  leavePoolBtn.addEventListener("click", function () {
    const confirmLeave = confirm("Leave this pool? You'll need to join or create a new pool later.");
    if (!confirmLeave) return;
    try {
      const raw = sessionStorage.getItem("flightpoolUser");
      const p = raw ? JSON.parse(raw) : {};
      delete p.joinedPool;
      delete p.createdPool;
      sessionStorage.setItem("flightpoolUser", JSON.stringify(p));
    } catch (e) {}
    window.location.href = "matches";
  });

  reportBtn.addEventListener("click", function () {
    alert("Thanks for letting us know. Our team will review this and get back to you.");
  });

  blockBtn.addEventListener("click", function () {
    alert("User blocked. You won't see them in future pool suggestions.");
  });
});
