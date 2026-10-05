document.addEventListener("DOMContentLoaded", function () {
  const verifyForm = document.getElementById("verify-form");
  const verifyError = document.getElementById("verify-error");
  const verifyLede = document.getElementById("verify-lede");
  const verifyTitle = document.getElementById("verify-title");
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

  // For phone OTP, automatically re-send OTP if confirmationResult is lost
  if (pending && pending.method === "phone" && !window.confirmationResult) {
    showError(verifyError, "Resending OTP...");
    autoResendPhoneOTP(pending.contact);
  }

  async function autoResendPhoneOTP(phoneNumber) {
    try {
      const auth = window.firebaseAuth;
      if (!auth) {
        throw new Error("Firebase Auth not initialized");
      }

      // Initialize reCAPTCHA verifier
      if (!window.firebaseRecaptchaVerifier) {
        window.firebaseRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          'size': 'invisible'
        });
        await window.firebaseRecaptchaVerifier.render();
      }

      // Re-send OTP
      const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, window.firebaseRecaptchaVerifier);
      window.confirmationResult = confirmationResult;

      console.log("OTP resent successfully");
      showError(verifyError, "");
      startCountdown();
    } catch (error) {
      console.error("Failed to auto-resend OTP:", error);
      showError(verifyError, "Failed to resend OTP. Please go back and try again.");
    }
  }

  if (pending && pending.displayContact) {
    if (pending.method === "phone") {
      verifyTitle.textContent = "Verify your number";
      verifyLede.textContent = `Enter the 6-digit OTP sent to ${pending.displayContact}`;
    } else {
      verifyTitle.textContent = "Verify your email";
      verifyLede.textContent = `Enter the 6-digit OTP sent to ${pending.displayContact}`;
    }
  } else if (pending && pending.contact) {
    verifyTitle.textContent = pending.method === "phone" ? "Verify your number" : "Verify your email";
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
        // If confirmationResult is not available, we need to re-send the OTP
        // This can happen when navigating between pages
        throw new Error("Session expired. Please request a new OTP.");
      }

      console.log("Attempting to verify OTP:", code);
      const result = await confirmationResult.confirm(code);
      const user = result.user;

      console.log("OTP verified successfully for user:", user.uid);

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
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      throw error;
    }
  }

  async function verifyEmailOTP(code) {
    try {
      const response = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: pending.contact,
          otp: code
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify email OTP');
      }

      // Sign in with custom token
      const auth = window.firebaseAuth;
      if (!auth) {
        throw new Error("Firebase Auth not initialized");
      }

      const userCredential = await auth.signInWithCustomToken(data.customToken);
      const user = userCredential.user;

      // Get ID token
      const idToken = await user.getIdToken();

      return {
        success: true,
        uid: user.uid,
        idToken: idToken,
        email: user.email
      };
    } catch (error) {
      console.error("Email OTP verification error:", error);
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
      let result;

      // Use appropriate verification method based on auth type
      if (pending && pending.method === "email") {
        result = await verifyEmailOTP(code);
      } else {
        result = await verifyFirebaseOTP(code);
      }

      showError(verifyError, "");
      clearInterval(countdownTimer);

      const authData = {
        method: pending ? pending.method : "phone",
        contact: pending ? pending.contact : (result.phoneNumber || result.email),
        displayContact: pending ? pending.displayContact : (result.phoneNumber || result.email),
        uid: result.uid,
        idToken: result.idToken
      };

      sessionStorage.setItem("flightpoolUser", JSON.stringify(authData));
      sessionStorage.removeItem("flightpoolPendingAuth");
      window.location.href = "profile";
    } catch (error) {
      let errorMessage = "Invalid OTP. Please try again.";
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (error.code === 'auth/code-expired') {
        errorMessage = "Code has expired. Please request a new one.";
      } else if (error.message) {
        errorMessage = error.message;
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
    window.location.href = "signin";
  });

  if (otpBoxes[0]) otpBoxes[0].focus();
});
