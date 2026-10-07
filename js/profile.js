document.addEventListener("DOMContentLoaded", function () {
  const profileForm = document.getElementById("profile-form");
  const fullNameInput = document.getElementById("full-name");
  const profileError = document.getElementById("profile-error");
  const genderPills = [...document.querySelectorAll(".gender-pill")];
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarPreview = document.getElementById("avatar-preview");
  const avatarEditBtn = document.getElementById("avatar-edit");
  const photoInput = document.getElementById("photo-input");

  let selectedGender = "female";

  function showError(el, message) {
    el.textContent = message;
    el.hidden = !message;
  }

  function updateAvatarForGender(gender) {
    if (gender === "male") {
      avatarPreview.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=male123&gender=male&clothing=blazerAndShirt";
    } else if (gender === "female") {
      avatarPreview.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=female456&gender=female&clothing=blazerAndShirt";
    } else {
      avatarPreview.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=neutral789&clothing=blazerAndShirt";
    }
  }

  // Get initial gender from HTML and set avatar
  const activeGenderPill = document.querySelector(".gender-pill.is-active");
  if (activeGenderPill) {
    selectedGender = activeGenderPill.dataset.gender;
  }
  updateAvatarForGender(selectedGender);

  genderPills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      selectedGender = pill.dataset.gender;
      genderPills.forEach(function (p) {
        const active = p.dataset.gender === selectedGender;
        p.classList.toggle("is-active", active);
        p.setAttribute("aria-checked", String(active));
      });
      
      // Update avatar when gender changes
      updateAvatarForGender(selectedGender);
    });
  });

  avatarCircle.addEventListener("click", function () {
    photoInput.click();
  });

  avatarEditBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    photoInput.click();
  });

  photoInput.addEventListener("change", function () {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError(profileError, "Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function (ev) {
      avatarPreview.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    showError(profileError, "");
  });

  async function uploadImageToSupabase(imageDataUrl) {
    try {
      // Extract the base64 data
      const matches = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid image data');
      }

      const contentType = matches[1];
      const base64Data = matches[2];

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageDataUrl,
          fileName: 'profile.jpg',
          contentType: contentType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // If Supabase is not configured, fall back to base64
        if (result.error && result.error.includes('not configured')) {
          console.log('Supabase not configured, using base64 fallback');
          return imageDataUrl;
        }
        throw new Error(result.error || 'Failed to upload image');
      }

      return result.url;
    } catch (error) {
      console.error('Image upload error:', error);
      // Fallback to base64 if upload fails
      console.log('Falling back to base64 storage');
      return imageDataUrl;
    }
  }

  async function syncUserWithBackend(uid, idToken, userData) {
    try {
      // Use relative URL - will work with any domain
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          idToken: idToken,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          gender: userData.gender,
          photoUrl: userData.photoUrl
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync user');
      }

      return result;
    } catch (error) {
      console.error('Backend sync error:', error);
      throw error;
    }
  }

  profileForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const name = fullNameInput.value.trim();
    if (!name) {
      showError(profileError, "Please enter your full name.");
      fullNameInput.focus();
      return;
    }
    if (name.length < 2) {
      showError(profileError, "Name must be at least 2 characters.");
      fullNameInput.focus();
      return;
    }

    showError(profileError, "");

    // Get user data from sessionStorage
    let firebaseUser = null;
    try {
      const raw = sessionStorage.getItem("flightpoolUser");
      firebaseUser = raw ? JSON.parse(raw) : null;
    } catch (e) {
      firebaseUser = null;
    }

    if (!firebaseUser || !firebaseUser.uid) {
      showError(profileError, "Authentication required. Please sign in again.");
      setTimeout(() => {
        window.location.href = "signin";
      }, 2000);
      return;
    }

    // Show loading state
    const submitBtn = profileForm.querySelector('.auth-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    try {
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if user uploaded a custom photo (base64 data URL)
      let photoUrl = avatarPreview.src;
      if (avatarPreview.src.startsWith('data:image')) {
        // Upload to Supabase
        showError(profileError, "Uploading photo...");
        photoUrl = await uploadImageToSupabase(avatarPreview.src);
      }

      // Prepare user data
      const userData = {
        firstName: firstName,
        lastName: lastName,
        email: firebaseUser.email || null,
        phone: firebaseUser.contact || null,
        gender: selectedGender,
        photoUrl: photoUrl
      };

      // Sync with backend
      showError(profileError, "Saving profile...");
      await syncUserWithBackend(firebaseUser.uid, firebaseUser.idToken, userData);

      // Update sessionStorage
      let profile = firebaseUser || {};
      profile.fullName = name;
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.gender = selectedGender;
      profile.photoDataUrl = photoUrl;
      sessionStorage.setItem("flightpoolUser", JSON.stringify(profile));

      window.location.href = "flight";
    } catch (error) {
      showError(profileError, error.message || "Failed to save profile. Please try again.");
      const submitBtn = profileForm.querySelector('.auth-submit');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
});
