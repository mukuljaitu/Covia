document.addEventListener("DOMContentLoaded", function () {
  const verifyForm = document.getElementById("verify-form");
  const verifyError = document.getElementById("verify-error");
  const verifyLede = document.getElementById("verify-lede");
  const otpBoxes = [...document.querySelectorAll(".otp-box-rounded")];
  const countdownEl = document.getElementById("countdown");
  const resendBtn = document.getElementById("resend-otp-btn");

  const RESEND_DELAY = 24;
  let countdownTimer;
  let timeLeft = RESEND_DELAY;

  function loadPendingAuth() {
    try {
      const raw = sessionStorage.getItem("flightpoolPendingAuth");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  const pending = loadPendingAuth();
  if (pending && pending.displayContact) {
    if (pending.method === "phone") {
      verifyLede.textContent = `Enter the 6-digit OTP sent to ${pending.displayContact}`;
    } else {
      verifyLede.textContent = `Enter the 6-digit OTP sent to ${pending.displayContact}`;
    }
  } else if (pending && pending.contact) {
    verifyLede.textContent = `Enter the 6-digit OTP sent to ${pending.contact}`;
  }

  function showError(el, message) {
    el.textContent = message;
    el.hidden = !message;
  }

  function startCountdown() {
    timeLeft = RESEND_DELAY;
    countdownEl.textContent = String(timeLeft);
    resendBtn.disabled = true;
    resendBtn.classList.remove("is-active");

    clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      timeLeft -= 1;
      countdownEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(countdownTimer);
        resendBtn.disabled = false;
        resendBtn.classList.add("is-active");
      }
    }, 1000);
  }

  startCountdown();

  otpBoxes.forEach(function (box, index) {
    box.addEventListener("input", function () {
      box.value = box.value.replace(/\D/g, "").slice(0, 1);
      if (box.value && otpBoxes[index + 1]) otpBoxes[index + 1].focus();
    });

    box.addEventListener("keydown", function (event) {
      if (event.key === "Backspace" && !box.value && otpBoxes[index - 1]) {
        otpBoxes[index - 1].focus();
      }
    });

    box.addEventListener("paste", function (event) {
      event.preventDefault();
      const pasted = (event.clipboardData.getData("text") || "")
        .replace(/\D/g, "")
        .slice(0, 6);
      pasted.split("").forEach(function (digit, i) {
        if (otpBoxes[i]) otpBoxes[i].value = digit;
      });
      const next = otpBoxes[Math.min(pasted.length, otpBoxes.length - 1)];
      if (next) next.focus();
    });
  });

  async function verifyFirebaseOTP(code) {
    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
        throw new Error("No pending OTP verification. Please start over.");
      }

      const result = await confirmationResult.confirm(code);
      const user = result.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      return {
        success: true,
        uid: user.uid,
        idToken: idToken,
        phoneNumber: user.phoneNumber
      };
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  }

  verifyForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const code = otpBoxes.map(function (box) { return box.value; }).join("");
    
    if (code.length !== 6) {
      showError(verifyError, "Enter all 6 digits.");
      return;
    }

    // Show loading state
    const submitBtn = verifyForm.querySelector('.auth-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Verifying...";
    submitBtn.disabled = true;

    try {
      const result = await verifyFirebaseOTP(code);
      
      showError(verifyError, "");
      clearInterval(countdownTimer);

      const authData = {
        method: pending ? pending.method : "phone",
        contact: pending ? pending.contact : result.phoneNumber,
        displayContact: pending ? pending.displayContact : result.phoneNumber,
        uid: result.uid,
        idToken: result.idToken
      };

      sessionStorage.setItem("flightpoolUser", JSON.stringify(authData));
      sessionStorage.removeItem("flightpoolPendingAuth");
      window.location.href = "profile.html";
    } catch (error) {
      let errorMessage = "Invalid OTP. Please try again.";
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (error.code === 'auth/code-expired') {
        errorMessage = "Code has expired. Please request a new one.";
      }
      showError(verifyError, errorMessage);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  resendBtn.addEventListener("click", function () {
    if (resendBtn.disabled) return;
    showError(verifyError, "");
    otpBoxes.forEach(function (box) {
      box.value = "";
    });
    otpBoxes[0].focus();
    startCountdown();
    
    // Redirect back to signin to resend OTP
    window.location.href = "signin.html";
  });

  if (otpBoxes[0]) otpBoxes[0].focus();
});
