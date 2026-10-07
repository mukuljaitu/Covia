const signinForm = document.getElementById("signin-form");
const contactLabel = document.getElementById("contact-label-text");
const contactInput = document.getElementById("contact-input");
const signinError = document.getElementById("signin-error");

let method = "phone";

function setMethod(next) {
  method = next;
  document.querySelectorAll(".method-card").forEach((card) => {
    const active = card.dataset.method === method;
    card.classList.toggle("is-active", active);
    card.setAttribute("aria-checked", String(active));
  });

  if (method === "phone") {
    contactLabel.textContent = "Mobile number";
    contactInput.type = "tel";
    contactInput.inputMode = "tel";
    contactInput.autocomplete = "tel";
    contactInput.placeholder = "+91 98765 43210";
  } else {
    contactLabel.textContent = "Email";
    contactInput.type = "email";
    contactInput.inputMode = "email";
    contactInput.autocomplete = "email";
    contactInput.placeholder = "you@email.com";
  }

  signinError.hidden = true;
  contactInput.focus();
}

document.querySelectorAll(".method-card").forEach((card) => {
  card.addEventListener("click", () => setMethod(card.dataset.method));
});

function showError(el, message) {
  el.textContent = message;
  el.hidden = !message;
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  if (last10.length === 10) {
    return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
  }
  return value;
}

async function sendPhoneOTP(phoneNumber) {
  try {
    const auth = window.firebaseAuth;
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }

    // Initialize reCAPTCHA verifier if not already done
    if (!window.firebaseRecaptchaVerifier) {
      window.firebaseRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible'
      });
      
      // Render the reCAPTCHA
      await window.firebaseRecaptchaVerifier.render();
    }

    // Send OTP
    const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, window.firebaseRecaptchaVerifier);

    // Store confirmationResult globally - this should persist if we don't reload the page
    // However, if we navigate to a new page, we'll lose it
    // For now, store it and hope it persists
    window.confirmationResult = confirmationResult;

    return true;
  } catch (error) {
    console.error("Phone OTP error:", error);
    // Reset verifier on error
    if (window.firebaseRecaptchaVerifier) {
      window.firebaseRecaptchaVerifier.clear();
      window.firebaseRecaptchaVerifier = null;
    }
    throw error;
  }
}

async function sendEmailOTP(email) {
  try {
    const response = await fetch('/api/auth/send-email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email OTP');
    }

    return true;
  } catch (error) {
    console.error("Email OTP error:", error);
    throw new Error("Email OTP is temporarily unavailable. Please use phone number for now.");
  }
}

signinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = contactInput.value.trim();

  if (method === "phone" && !isValidPhone(value)) {
    showError(signinError, "Enter a valid 10-digit mobile number.");
    contactInput.focus();
    return;
  }

  if (method === "email" && !isValidEmail(value)) {
    showError(signinError, "Enter a valid email address.");
    contactInput.focus();
    return;
  }

  showError(signinError, "");
  
  // Show loading state
  const submitBtn = signinForm.querySelector('.auth-submit');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Sending...";
  submitBtn.disabled = true;

  try {
    if (method === "phone") {
      // Format phone number for Firebase (must include country code)
      const digits = value.replace(/\D/g, "");
      const phoneNumber = digits.length === 10 ? `+91${digits}` : `+${digits}`;

      await sendPhoneOTP(phoneNumber);

      const displayContact = maskPhone(value);
      sessionStorage.setItem(
        "flightpoolPendingAuth",
        JSON.stringify({ method: "phone", contact: phoneNumber, displayContact })
      );
      window.location.href = "verify";
    } else {
      await sendEmailOTP(value);

      // Store email OTP session data
      sessionStorage.setItem(
        "flightpoolPendingAuth",
        JSON.stringify({ method: "email", contact: value, displayContact: value })
      );
      window.location.href = "verify";
    }
  } catch (error) {
    showError(signinError, error.message || "Failed to send OTP. Please try again.");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});
