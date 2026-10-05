const overlay = document.getElementById("overlay");
const findBtn = document.getElementById("find-group-btn");
const closeBtn = document.getElementById("close-sheet");
const form = document.getElementById("group-form");
const groupsList = document.getElementById("groups-list");
const resultsLede = document.getElementById("results-lede");
const joinedCard = document.getElementById("joined-card");
const joinedLede = document.getElementById("joined-lede");
const poolStatusWrap = document.getElementById("pool-status-wrap");

const POOL_LABELS = {
  gachibowli: "Gachibowli Group",
  hitech: "Hitech City + Gachibowli",
  "female-gachi": "Gachibowli · Women only",
};

function renderPoolStatus(userProfile) {
  if (!poolStatusWrap) return;
  if (!userProfile) return;

  const joined = userProfile.joinedPool;
  const created = userProfile.createdPool;
  const hasFlight = userProfile.flight && userProfile.flight.code;
  const hasDest = !!userProfile.destination;

  const sections = [];

  if (joined) {
    const label = POOL_LABELS[joined] || "Your ride group";
    sections.push(`
      <div class="pool-status-card pool-status-joined">
        <p class="pool-status-eyebrow">✓ Pool joined</p>
        <h3 class="pool-status-title">${label}</h3>
        <p class="pool-status-sub">
          ${hasFlight ? `${userProfile.flight.code} · ` : ""}${hasDest ? `Heading to ${userProfile.destination}` : ""}
        </p>
        <div class="pool-status-actions">
          <button type="button" class="pool-status-btn pool-status-btn-primary" id="ps-continue">
            Continue setup
          </button>
          <button type="button" class="pool-status-btn pool-status-btn-ghost" id="ps-leave">
            Leave pool
          </button>
        </div>
      </div>
    `);
  }

  if (created && !joined) {
    const sizeText = created.size ? `Up to ${created.size} people` : "";
    const typeText = created.type === "women" ? "Women only" : "Everyone";
    const metaText = [sizeText, typeText].filter(Boolean).join(" · ");
    sections.push(`
      <div class="pool-status-card pool-status-created">
        <p class="pool-status-eyebrow">★ Pool created</p>
        <h3 class="pool-status-title">Your ride group</h3>
        <p class="pool-status-sub">
          ${hasFlight ? `${userProfile.flight.code} · ` : ""}${hasDest ? `Heading to ${userProfile.destination}. ` : ""}${metaText}
        </p>
        <div class="pool-status-actions">
          <button type="button" class="pool-status-btn pool-status-btn-primary" id="ps-invite">
            Invite others
          </button>
          <button type="button" class="pool-status-btn pool-status-btn-ghost" id="ps-cancel">
            Cancel pool
          </button>
        </div>
      </div>
    `);
  }

  if (!sections.length && (hasFlight || hasDest)) {
    const bits = [];
    if (hasFlight) bits.push(`${userProfile.flight.code} (${userProfile.flight.from} → ${userProfile.flight.to})`);
    if (hasDest) bits.push(`to ${userProfile.destination}`);
    sections.push(`
      <div class="pool-status-card pool-status-progress">
        <p class="pool-status-eyebrow">Setup in progress</p>
        <h3 class="pool-status-title">Almost there</h3>
        <p class="pool-status-sub">${bits.join(" · ")}</p>
        <div class="pool-status-actions">
          <a class="pool-status-btn pool-status-btn-primary" href="matches">
            View matches
          </a>
        </div>
      </div>
    `);
  }

  if (!sections.length) return;

  poolStatusWrap.innerHTML = sections.join("");
  poolStatusWrap.hidden = false;

  const leaveBtn = document.getElementById("ps-leave");
  if (leaveBtn) {
    leaveBtn.addEventListener("click", function () {
      try {
        const raw = sessionStorage.getItem("flightpoolUser");
        const p = raw ? JSON.parse(raw) : {};
        delete p.joinedPool;
        sessionStorage.setItem("flightpoolUser", JSON.stringify(p));
      } catch (e) {}
      poolStatusWrap.innerHTML = "";
      poolStatusWrap.hidden = true;
      renderPoolStatus(loadProfile());
    });
  }

  const cancelBtn = document.getElementById("ps-cancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      try {
        const raw = sessionStorage.getItem("flightpoolUser");
        const p = raw ? JSON.parse(raw) : {};
        delete p.createdPool;
        sessionStorage.setItem("flightpoolUser", JSON.stringify(p));
      } catch (e) {}
      poolStatusWrap.innerHTML = "";
      poolStatusWrap.hidden = true;
      renderPoolStatus(loadProfile());
    });
  }

  const continueBtn = document.getElementById("ps-continue");
  if (continueBtn) {
    continueBtn.addEventListener("click", function () {
      window.location.href = "matches";
    });
  }

  const inviteBtn = document.getElementById("ps-invite");
  if (inviteBtn) {
    inviteBtn.addEventListener("click", function () {
      const text = "I created a FlightPool ride group. Join me to split the cab fare!";
      try {
        if (navigator.share) {
          navigator.share({ title: "FlightPool", text }).catch(function () {});
        } else {
          navigator.clipboard && navigator.clipboard.writeText(text);
          inviteBtn.textContent = "Link copied ✓";
          setTimeout(function () {
            inviteBtn.textContent = "Invite others";
          }, 1500);
        }
      } catch (e) {}
    });
  }
}

function loadProfile() {
  try {
    const raw = sessionStorage.getItem("flightpoolUser");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

renderPoolStatus(loadProfile());

const views = {
  form: document.getElementById("view-form"),
  results: document.getElementById("view-results"),
  joined: document.getElementById("view-joined"),
};

const sampleGroups = [
  {
    id: "g1",
    title: "Terminal 1 · City center",
    people: ["Aarav", "Meera", "Noah"],
    seats: 1,
    window: "±20 min",
    fare: "Split 4 ways",
  },
  {
    id: "g2",
    title: "Arrivals · Same neighborhood",
    people: ["Priya", "Leo"],
    seats: 2,
    window: "±12 min",
    fare: "Split 3 ways",
  },
  {
    id: "g3",
    title: "New group forming",
    people: ["Sam"],
    seats: 3,
    window: "±25 min",
    fare: "Start a pool",
  },
];

function showView(name) {
  Object.entries(views).forEach(([key, view]) => {
    const active = key === name;
    view.classList.toggle("is-active", active);
    view.hidden = !active;
  });
}

function openSheet() {
  overlay.hidden = false;
  showView("form");
  document.body.style.overflow = "hidden";
}

function closeSheet() {
  overlay.hidden = true;
  document.body.style.overflow = "";
}

if (findBtn && findBtn.tagName === "BUTTON") {
  findBtn.addEventListener("click", openSheet);
}
closeBtn.addEventListener("click", closeSheet);
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) closeSheet();
});
document.getElementById("done-join").addEventListener("click", closeSheet);
document.getElementById("back-to-form").addEventListener("click", () => {
  showView("form");
});

document.querySelectorAll(".pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".pill").forEach((item) => item.classList.remove("is-active"));
    pill.classList.add("is-active");
    const step = document.getElementById(`step-${pill.dataset.step}`);
    document.querySelectorAll(".step").forEach((item) => item.classList.remove("is-active"));
    if (step) {
      step.classList.add("is-active");
      step.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const airport = data.get("airport");
  const time = data.get("time");
  const destination = data.get("destination");

  resultsLede.textContent = `${airport} around ${formatTime(time)} · heading to ${destination}.`;
  groupsList.innerHTML = sampleGroups
    .map(
      (group) => `
        <article class="group-card">
          <div>
            <h3>${group.title}</h3>
            <p>${group.window} · ${group.fare} · ${group.seats} seat${group.seats === 1 ? "" : "s"} left</p>
            <div class="avatars">
              ${group.people.map((name) => `<span title="${name}">${name[0]}</span>`).join("")}
            </div>
          </div>
          <button type="button" data-join="${group.id}">Join</button>
        </article>
      `
    )
    .join("");

  showView("results");
});

groupsList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-join]");
  if (!button) return;
  const group = sampleGroups.find((item) => item.id === button.dataset.join);
  const data = new FormData(form);
  joinedLede.textContent = `You’re grouped for a shared cab after landing at ${data.get("airport")}.`;
  joinedCard.innerHTML = `
    <h3>${group.title}</h3>
    <p>Pickup: Arrivals curb, 10 minutes after landing</p>
    <p>Going to: ${data.get("destination")}</p>
    <p>Travelers: ${group.people.join(", ")} + you</p>
    <p>Fare: ${group.fare}</p>
  `;
  showView("joined");
});

function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !overlay.hidden) closeSheet();
});
