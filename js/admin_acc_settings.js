document.addEventListener("DOMContentLoaded", () => {
  // Profile State (populate from your backend API / session)
  const adminProfileState = {
    fullName: "",
    username: "",
    email: "",
    photoUrl: ""
  };

  // Elements for Modal & Blur Control
  const mainWrapper = document.querySelector(".main-wrapper");
  const editProfileModal = document.getElementById("editProfileModal");
  const openEditModalBtn = document.getElementById("openEditModalBtn");
  const closeEditModalBtn = document.getElementById("closeEditModalBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const editProfileForm = document.getElementById("editProfileForm");

  // Main Page Display Elements
  const displayBannerName = document.getElementById("displayBannerName");
  const displayFullName = document.getElementById("displayFullName");
  const displayEmail = document.getElementById("displayEmail");
  const displayUsername = document.getElementById("displayUsername");
  const mainAvatarInitials = document.getElementById("mainAvatarInitials");
  const mainAvatarImg = document.getElementById("mainAvatarImg");

  // Modal Form & Photo Elements
  const inputFullName = document.getElementById("inputFullName");
  const inputUsername = document.getElementById("inputUsername");
  const inputEmail = document.getElementById("inputEmail");
  const photoInput = document.getElementById("photoInput");
  const changePhotoBtn = document.getElementById("changePhotoBtn");
  const removePhotoBtn = document.getElementById("removePhotoBtn");
  const modalAvatarInitials = document.getElementById("modalAvatarInitials");
  const modalAvatarImg = document.getElementById("modalAvatarImg");

  let tempPhotoDataUrl = "";

  // Helper: Generate 2-letter initials from Full Name
  function getInitials(name) {
    const clean = (name || "").trim();
    if (!clean || clean === "—") return "--";
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Render Main Profile View from State
  function renderProfile() {
    const { fullName, username, email, photoUrl } = adminProfileState;

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
      mainAvatarImg.src = "";
      mainAvatarImg.hidden = true;
      mainAvatarInitials.hidden = false;
    }
  }

  // Helper: Sync avatar preview inside modal
  function updateModalAvatarPreview(photoUrl, fullName) {
    modalAvatarInitials.textContent = getInitials(fullName);

    if (photoUrl) {
      modalAvatarImg.src = photoUrl;
      modalAvatarImg.hidden = false;
      modalAvatarInitials.hidden = true;
    } else {
      modalAvatarImg.src = "";
      modalAvatarImg.hidden = true;
      modalAvatarInitials.hidden = false;
    }
  }

  // Open Modal & Blur Main Content
  function openModal() {
    inputFullName.value = adminProfileState.fullName;
    inputUsername.value = adminProfileState.username;
    inputEmail.value = adminProfileState.email;

    tempPhotoDataUrl = adminProfileState.photoUrl;
    updateModalAvatarPreview(tempPhotoDataUrl, inputFullName.value);

    mainWrapper.classList.add("modal-open");
    editProfileModal.classList.add("is-visible");
    editProfileModal.setAttribute("aria-hidden", "false");
  }

  // Close Modal & Remove Blur
  function closeModal() {
    mainWrapper.classList.remove("modal-open");
    editProfileModal.classList.remove("is-visible");
    editProfileModal.setAttribute("aria-hidden", "true");
    photoInput.value = "";
  }

  // Event Listeners for Opening & Closing
  openEditModalBtn.addEventListener("click", openModal);
  closeEditModalBtn.addEventListener("click", closeModal);
  cancelEditBtn.addEventListener("click", closeModal);

  // Close when clicking outside the modal card (within the blurred main area)
  editProfileModal.addEventListener("click", (e) => {
    if (e.target === editProfileModal) {
      closeModal();
    }
  });

  // Close on Escape key press
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editProfileModal.classList.contains("is-visible")) {
      closeModal();
    }
  });

  // Update modal initials live while typing Full Name
  inputFullName.addEventListener("input", () => {
    if (!tempPhotoDataUrl) {
      modalAvatarInitials.textContent = getInitials(inputFullName.value);
    }
  });

  // Photo Upload Handling (JPG, PNG, WebP up to 5MB)
  changePhotoBtn.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

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
    reader.onload = (event) => {
      tempPhotoDataUrl = event.target.result;
      updateModalAvatarPreview(tempPhotoDataUrl, inputFullName.value);
    };
    reader.readAsDataURL(file);
  });

  // Remove Photo Handling
  removePhotoBtn.addEventListener("click", () => {
    tempPhotoDataUrl = "";
    photoInput.value = "";
    updateModalAvatarPreview("", inputFullName.value);
  });

  // Save Changes & Update Main Page
  editProfileForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const updatedName = inputFullName.value.trim();
    const updatedUsername = inputUsername.value.trim();
    const updatedEmail = inputEmail.value.trim();

    if (!updatedName || !updatedUsername || !updatedEmail) return;

    adminProfileState.fullName = updatedName;
    adminProfileState.username = updatedUsername;
    adminProfileState.email = updatedEmail;
    adminProfileState.photoUrl = tempPhotoDataUrl;

    renderProfile();
    closeModal();
  });

  // Initial Render
  renderProfile();
});