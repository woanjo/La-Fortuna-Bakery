
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:5000";

  const adminProfileState = {
    fullName: "",
    username: "",
    email: "",
    photoUrl: ""
  };

  const mainWrapper = document.querySelector(".main-wrapper");
  const editProfileModal = document.getElementById("editProfileModal");
  const openEditModalBtn = document.getElementById("openEditModalBtn");
  const closeEditModalBtn = document.getElementById("closeEditModalBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const editProfileForm = document.getElementById("editProfileForm");

  const displayBannerName = document.getElementById("displayBannerName");
  const displayFullName = document.getElementById("displayFullName");
  const displayEmail = document.getElementById("displayEmail");
  const displayUsername = document.getElementById("displayUsername");
  const mainAvatarInitials = document.getElementById("mainAvatarInitials");
  const mainAvatarImg = document.getElementById("mainAvatarImg");

  const inputFullName = document.getElementById("inputFullName");
  const inputUsername = document.getElementById("inputUsername");
  const inputEmail = document.getElementById("inputEmail");
  const photoInput = document.getElementById("photoInput");
  const changePhotoBtn = document.getElementById("changePhotoBtn");
  const removePhotoBtn = document.getElementById("removePhotoBtn");
  const modalAvatarInitials = document.getElementById("modalAvatarInitials");
  const modalAvatarImg = document.getElementById("modalAvatarImg");

  let tempPhotoDataUrl = "";
  let photoWasSelected = false;
  let removePhotoRequested = false;

  // ==========================================
  // API REQUEST
  // ==========================================

  async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json"
      }
    });

    const result = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      window.location.href = "login.html";
      throw new Error("Your administrator session has expired.");
    }

    if (!response.ok) {
      throw new Error(
        result.message || `Request failed with status ${response.status}.`
      );
    }

    return result;
  }

  // ==========================================
  // PROFILE HELPERS
  // ==========================================

  function getInitials(name) {
    const clean = (name || "").trim();

    if (!clean || clean === "—") {
      return "--";
    }

    const parts = clean.split(/\s+/);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase();
  }

  function populateProfile(user) {
    adminProfileState.fullName = [
      user.first_name || "",
      user.last_name || ""
    ].filter(Boolean).join(" ").trim();

    adminProfileState.username = user.username || "";
    adminProfileState.email = user.email || "";
    adminProfileState.photoUrl = user.profile_image_url || "";
  }

  function renderProfile() {
    const {
      fullName,
      username,
      email,
      photoUrl
    } = adminProfileState;

    displayBannerName.textContent = fullName || "—";
    displayFullName.textContent = fullName || "—";
    displayUsername.textContent = username || "—";
    displayEmail.textContent = email || "—";

    mainAvatarInitials.textContent = getInitials(fullName);

    if (photoUrl) {
      mainAvatarImg.src = photoUrl;
      mainAvatarImg.hidden = false;
      mainAvatarInitials.hidden = true;
    } else {
      mainAvatarImg.removeAttribute("src");
      mainAvatarImg.hidden = true;
      mainAvatarInitials.hidden = false;
    }
  }

  function updateModalAvatarPreview(photoUrl, fullName) {
    modalAvatarInitials.textContent = getInitials(fullName);

    if (photoUrl) {
      modalAvatarImg.src = photoUrl;
      modalAvatarImg.hidden = false;
      modalAvatarInitials.hidden = true;
    } else {
      modalAvatarImg.removeAttribute("src");
      modalAvatarImg.hidden = true;
      modalAvatarInitials.hidden = false;
    }
  }

  // ==========================================
  // LOAD PROFILE FROM POSTGRESQL
  // ==========================================

  async function loadProfile() {
    try {
      const result = await apiRequest("/api/auth/me");

      populateProfile(result.user);
      renderProfile();

    } catch (error) {
      console.error("Unable to load administrator profile:", error);

      if (!window.location.href.includes("login.html")) {
        alert(error.message || "Unable to load your account information.");
      }
    }
  }

  // ==========================================
  // MODAL
  // ==========================================

  function openModal() {
    inputFullName.value = adminProfileState.fullName;
    inputUsername.value = adminProfileState.username;
    inputEmail.value = adminProfileState.email;

    tempPhotoDataUrl = adminProfileState.photoUrl;
    photoWasSelected = false;
    removePhotoRequested = false;

    updateModalAvatarPreview(
      tempPhotoDataUrl,
      inputFullName.value
    );

    mainWrapper.classList.add("modal-open");
    editProfileModal.classList.add("is-visible");
    editProfileModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    mainWrapper.classList.remove("modal-open");
    editProfileModal.classList.remove("is-visible");
    editProfileModal.setAttribute("aria-hidden", "true");

    photoInput.value = "";
  }

  openEditModalBtn.addEventListener("click", openModal);
  closeEditModalBtn.addEventListener("click", closeModal);
  cancelEditBtn.addEventListener("click", closeModal);

  editProfileModal.addEventListener("click", (event) => {
    if (event.target === editProfileModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      editProfileModal.classList.contains("is-visible")
    ) {
      closeModal();
    }
  });

  // Update initials while typing a new name.
  inputFullName.addEventListener("input", () => {
    if (!tempPhotoDataUrl) {
      modalAvatarInitials.textContent = getInitials(
        inputFullName.value
      );
    }
  });

  // ==========================================
  // PROFILE PHOTO PREVIEW
  // ==========================================

  changePhotoBtn.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    const maxSizeBytes = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert("Please select a valid JPG, PNG, or WebP image.");
      photoInput.value = "";
      return;
    }

    if (file.size > maxSizeBytes) {
      alert("Image file size must not exceed 5MB.");
      photoInput.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      tempPhotoDataUrl = readerEvent.target.result;
      photoWasSelected = true;
      removePhotoRequested = false;

      updateModalAvatarPreview(
        tempPhotoDataUrl,
        inputFullName.value
      );
    };

    reader.onerror = () => {
      alert("Unable to preview the selected image.");
      photoInput.value = "";
    };

    reader.readAsDataURL(file);
  });

  removePhotoBtn.addEventListener("click", () => {
    tempPhotoDataUrl = "";
    photoWasSelected = false;
    removePhotoRequested = true;
    photoInput.value = "";

    updateModalAvatarPreview(
      "",
      inputFullName.value
    );
  });

  // ==========================================
  // SAVE PROFILE TO POSTGRESQL
  // ==========================================

  editProfileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const updatedName = inputFullName.value.trim();
    const updatedUsername = inputUsername.value.trim();
    const updatedEmail = inputEmail.value.trim();

    if (!updatedName || !updatedUsername || !updatedEmail) {
      alert("Please complete all required fields.");
      return;
    }

    const saveButton = editProfileForm.querySelector(
      'button[type="submit"]'
    );

    if (saveButton) {
      saveButton.disabled = true;
    }

    try {
      const payload = {
        full_name: updatedName,
        username: updatedUsername,
        email: updatedEmail
      };

      // Removing an existing hosted photo is supported.
      if (removePhotoRequested) {
        payload.profile_image_url = null;
      }

      const result = await apiRequest("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      // Always render the data returned by the database.
      populateProfile(result.user);
      renderProfile();
      closeModal();

      if (photoWasSelected) {
        alert(
          "Your account details were saved successfully. " +
          "The selected profile photo was only a preview and was not saved. " +
          "Image hosting will be connected separately."
        );
      } else {
        alert(result.message || "Account settings saved successfully.");
      }

    } catch (error) {
      console.error("Profile update failed:", error);
      alert(error.message || "Unable to save account settings.");

    } finally {
      if (saveButton) {
        saveButton.disabled = false;
      }
    }
  });

  // ==========================================
  // ADMIN SIDEBAR NAVIGATION
  // ==========================================

  const adminPageRoutes = {
  "dashboard": "dashboard.html",
  "bread management": "bread_management.html",
  "ingredient management": "ingredient_management.html",
  "feedback & inquiries": "feedback_management.html",
  "account settings": "account_settings.html"
};

  // Use the actual HTML href destinations.
  document.querySelectorAll(".sidebar-nav .nav-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      const href = item.getAttribute("href");

      if (!href || href.trim() === "" || href.trim() === "#") {
        event.preventDefault();
      }
    });
  });

  // Load saved details instead of starting with empty values.
  loadProfile();
});
