document.addEventListener("DOMContentLoaded", function () {
  const chatTitleEl = document.getElementById("chat-title");
  const chatCountEl = document.getElementById("chat-count");
  const chatFlightEl = document.getElementById("chat-flight");
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const quickChips = document.querySelectorAll(".chat-quick-chip");
  const cabOpts = document.querySelectorAll(".cab-opt");
  const chatBodyScroll = document.querySelector(".chat-body-scroll");

  const POOL_TITLE_MAP = {
    gachibowli: "Gachibowli Ride Group",
    hitech: "Hitech City Ride Group",
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

  if (chatTitleEl) {
    if (joinedId && POOL_TITLE_MAP[joinedId]) {
      chatTitleEl.textContent = POOL_TITLE_MAP[joinedId];
    } else if (profile && profile.destination) {
      chatTitleEl.textContent = `${profile.destination} Ride Group`;
    }
  }

  if (profile && profile.flight) {
    chatFlightEl.textContent = profile.flight.code;
  }

  if (createdPool && createdPool.size) {
    chatCountEl.textContent = "1 / " + createdPool.size;
  } else if (profile && profile.joinedPool) {
    chatCountEl.textContent = "4";
  }

  function nowTime() {
    const d = new Date();
    let h = d.getHours();
    const m = d.getMinutes();
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  function appendMessage(text, fromMe) {
    if (!text || !text.trim()) return;
    const msgWrap = document.createElement("div");
    msgWrap.className = "msg " + (fromMe ? "msg-me" : "msg-other");

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble " + (fromMe ? "msg-bubble-me" : "msg-bubble-other");

    const p = document.createElement("p");
    p.className = "msg-text";
    p.textContent = text.trim();
    bubble.appendChild(p);

    const time = document.createElement("p");
    time.className = "msg-time";
    time.textContent = nowTime();

    msgWrap.appendChild(bubble);
    msgWrap.appendChild(time);
    chatMessages.appendChild(msgWrap);

    setTimeout(function () {
      if (chatBodyScroll) {
        chatBodyScroll.scrollTop = chatBodyScroll.scrollHeight;
      }
    }, 20);
  }

  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = chatInput.value;
    if (!value.trim()) return;
    appendMessage(value, true);
    chatInput.value = "";
    chatInput.focus();
  });

  chatInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  quickChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      const text = chip.dataset.quick || chip.textContent.trim();
      appendMessage(text, true);
    });
  });

  cabOpts.forEach(function (opt) {
    opt.addEventListener("click", function () {
      cabOpts.forEach(function (o) {
        o.classList.remove("is-active");
      });
      opt.classList.add("is-active");
      const provider = opt.dataset.cab;
      appendMessage(`Let's go with ${provider}. I'll book if nobody else has.`, true);
      setTimeout(function () {
        alert(`Opening ${provider}…`);
      }, 450);
    });
  });

  setTimeout(function () {
    if (chatBodyScroll) {
      chatBodyScroll.scrollTop = chatBodyScroll.scrollHeight;
    }
  }, 60);
});
