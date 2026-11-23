document.addEventListener("DOMContentLoaded", () => {
  // Clean state with zero hardcoded dummy personal data
  const profileState = {
    firstName: "",
    lastName: "",
    email: "",
    birthdate: "",
    username: "",
    userId: "",
    joinedDate: ""
  };

  // Dietary Preferences Catalog Options (Matching 8.1.1)
  const allergenCatalog = [
    { id: "peanuts", label: "Peanuts", sub: "Legume protein" },
    { id: "tree-nuts", label: "Tree Nuts", sub: "Almonds, walnuts" },
    { id: "dairy", label: "Dairy", sub: "Butter, milk solids" },
    { id: "eggs", label: "Eggs", sub: "Glaze & dough yolks" },
    { id: "wheat", label: "Wheat", sub: "Flour & gluten bases" },
    { id: "sesame", label: "Sesame", sub: "Crust seeds & oil" }
  ];

  const ingredientCatalog = [
    { id: "lard", label: "Lard / Animal Shortening" },
    { id: "refined-sugar", label: "Refined White Sugar" },
    { id: "copra", label: "Coconut / Grated Copra" },
    { id: "margarine", label: "Margarine" }
  ];

  const breadCatalog = [
    { id: "hearth-rolls", label: "Traditional Hearth Rolls", sub: "Pan de Sal, Pandesal de Suelo", tag: "Morning Bake" },
    { id: "sweet-buns", label: "Sweet Filled Buns", sub: "Pan de Coco, Spanish Bread", tag: "Midday Batch" },
    { id: "hopia-flaky", label: "Hopia & Flaky Pastries", sub: "Munggo, Ube, Baboy crusts", tag: "Heritage Spec" },
    { id: "sliced-loaves", label: "Sliced Loaves & Pullman Breads", sub: "Classic Table Loaf, Whole Grain", tag: "Daily Slice" },
    { id: "savory-rolls", label: "Savory Rolls & Ensaymada", sub: "Brioche styled, Queso de Bola toppings", tag: "Traditional" },
    { id: "rice-cakes", label: "Rice Cakes & Bibingka", sub: "Masi, Tikoy, Banana Leaf Bibingka", tag: "Specialty" }
  ];

  // Saved Dietary State (Starts clean with no dummy selections)
  const dietaryState = {
    allergens: new Set(),
    ingredients: new Set(),
    breads: new Set(),
    sugarLimit: "Not set",
    fiberGoal: "Not set",
    primaryStyle: "Not set"
  };

  // Temporary selection sets while editing inside modal
  let tempAllergens = new Set();
  let tempIngredients = new Set();
  let tempBreads = new Set();

  // Dynamic Header Height Sync so modal overlay always starts right below sticky header
  const siteHeaderWrapper = document.getElementById("siteHeaderWrapper");
  function syncHeaderOffset() {
    if (siteHeaderWrapper) {
      document.documentElement.style.setProperty("--header-total-height", `${siteHeaderWrapper.offsetHeight}px`);
    }
  }
  syncHeaderOffset();
  window.addEventListener("resize", syncHeaderOffset);

  // Toast helper
  const toastNotification = document.getElementById("toastNotification");
  const toastMessage = document.getElementById("toastMessage");
  let toastTimer = null;

  function showToast(msg) {
    toastMessage.textContent = msg;
    toastNotification.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove("is-visible");
    }, 3000);
  }

  // ================= SYNC PERSONAL INFO UI =================
  const navDisplayName = document.getElementById("navDisplayName");
  const navAvatarInitials = document.getElementById("navAvatarInitials");
  const heroDisplayName = document.getElementById("heroDisplayName");
  const heroAvatarInitials = document.getElementById("heroAvatarInitials");
  const heroJoinedText = document.getElementById("heroJoinedText");
  const cardDisplayName = document.getElementById("cardDisplayName");
  const cardMonogram = document.getElementById("cardMonogram");
  const displayUserId = document.getElementById("displayUserId");
  const tileFullName = document.getElementById("tileFullName");
  const tileEmail = document.getElementById("tileEmail");
  const tileUsername = document.getElementById("tileUsername");
  const tileBirthdate = document.getElementById("tileBirthdate");

  function syncPersonalUI() {
    const hasName = profileState.firstName || profileState.lastName;
    const fullName = hasName ? `${profileState.firstName} ${profileState.lastName}`.trim() : "—";
    const shortName = hasName
      ? `${profileState.firstName.split(/\s+/)[0]} ${profileState.lastName}`.trim()
      : "Member Name";

    const initials = hasName
      ? `${(profileState.firstName[0] || "").toUpperCase()}${(profileState.lastName[0] || "").toUpperCase()}` || "--"
      : "--";

    navDisplayName.textContent = hasName ? shortName : "Member Profile";
    navAvatarInitials.textContent = initials;
    heroDisplayName.textContent = shortName;
    heroAvatarInitials.textContent = initials;
    cardDisplayName.textContent = fullName;
    cardMonogram.textContent = initials;

    tileFullName.textContent = fullName;
    tileEmail.textContent = profileState.email || "—";
    tileBirthdate.textContent = profileState.birthdate || "—";

    if (hasName && !profileState.username) {
      const generatedUser = `${profileState.firstName.split(/\s+/)[0]}.${profileState.lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, "");
      profileState.username = generatedUser;
    }
    tileUsername.textContent = profileState.username || "—";

    if (hasName && !profileState.userId) {
      profileState.userId = `${initials}-CEB-1953`;
    }
    displayUserId.textContent = profileState.userId || "—";

    if (profileState.joinedDate) {
      heroJoinedText.textContent = `Joined since ${profileState.joinedDate}`;
    }
  }

  // ================= PORTRAIT UPLOAD =================
  const portraitFileInput = document.getElementById("portraitFileInput");
  const heroAvatarImg = document.getElementById("heroAvatarImg");
  const navAvatarImg = document.getElementById("navAvatarImg");
  const portraitStatusLabel = document.getElementById("portraitStatusLabel");

  [
    document.getElementById("heroCamTrigger"),
    document.getElementById("cardCamTrigger"),
    document.getElementById("changePortraitBtn")
  ].forEach((btn) => {
    btn.addEventListener("click", () => portraitFileInput.click());
  });

  portraitFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Please select a valid JPG, PNG, or WebP image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      heroAvatarImg.src = src;
      heroAvatarImg.hidden = false;
      heroAvatarInitials.hidden = true;

      navAvatarImg.src = src;
      navAvatarImg.hidden = false;
      navAvatarInitials.hidden = true;

      portraitStatusLabel.textContent = file.name;
      showToast("Portrait updated.");
    };
    reader.readAsDataURL(file);
    portraitFileInput.value = "";
  });

  // ================= SIDEBAR TABS =================
  const menuBtns = document.querySelectorAll(".profile-menu-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  menuBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      menuBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      tabPanels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.id === `tab-${target}`);
      });
    });
  });

  // ================= MODAL 1: EDIT INFORMATION =================
  const editInfoModal = document.getElementById("editInfoModal");
  const inputFirstName = document.getElementById("inputFirstName");
  const inputLastName = document.getElementById("inputLastName");
  const inputBirthDate = document.getElementById("inputBirthDate");
  const inputEmail = document.getElementById("inputEmail");
  const editModalIdBadge = document.getElementById("editModalIdBadge");

  function openEditModal() {
    inputFirstName.value = profileState.firstName;
    inputLastName.value = profileState.lastName;
    inputBirthDate.value = profileState.birthdate;
    inputEmail.value = profileState.email;
    editModalIdBadge.textContent = profileState.userId || "PATRON PROFILE";

    editInfoModal.classList.add("is-visible");
    editInfoModal.setAttribute("aria-hidden", "false");
  }

  function closeEditModal() {
    editInfoModal.classList.remove("is-visible");
    editInfoModal.setAttribute("aria-hidden", "true");
  }

  document.getElementById("openEditModalBtn").addEventListener("click", openEditModal);
  document.getElementById("cancelEditModalBtn").addEventListener("click", closeEditModal);
  editInfoModal.addEventListener("click", (e) => {
    if (e.target === editInfoModal) closeEditModal();
  });

  document.getElementById("editInfoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    profileState.firstName = inputFirstName.value.trim();
    profileState.lastName = inputLastName.value.trim();
    profileState.birthdate = inputBirthDate.value.trim();
    profileState.email = inputEmail.value.trim();
    if (!profileState.joinedDate) {
      profileState.joinedDate = "November 2026";
    }

    syncPersonalUI();
    closeEditModal();
    showToast("Personal information updated.");
  });

  // ================= MODAL 2: EDIT DIETARY PREFERENCES =================
  const dietaryPrefsModal = document.getElementById("dietaryPrefsModal");
  const modalAllergenGrid = document.getElementById("modalAllergenGrid");
  const modalIngredientGrid = document.getElementById("modalIngredientGrid");
  const modalBreadList = document.getElementById("modalBreadList");
  const selectSugarLimit = document.getElementById("selectSugarLimit");
  const selectFiberGoal = document.getElementById("selectFiberGoal");
  const selectPrimaryStyle = document.getElementById("selectPrimaryStyle");

  const checkSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  function renderDietaryModalOptions() {
    // Render Allergens
    modalAllergenGrid.innerHTML = "";
    allergenCatalog.forEach((item) => {
      const checked = tempAllergens.has(item.id);
      const card = document.createElement("div");
      card.className = `select-option-card ${checked ? "is-checked" : ""}`;
      card.innerHTML = `
        <span class="check-square">${checked ? checkSvg : ""}</span>
        <div>
          <div class="opt-title">${item.label}</div>
          <div class="opt-sub">${item.sub}</div>
        </div>
      `;
      card.addEventListener("click", () => {
        if (tempAllergens.has(item.id)) tempAllergens.delete(item.id);
        else tempAllergens.add(item.id);
        renderDietaryModalOptions();
      });
      modalAllergenGrid.appendChild(card);
    });

    // Render Ingredients
    modalIngredientGrid.innerHTML = "";
    ingredientCatalog.forEach((item) => {
      const checked = tempIngredients.has(item.id);
      const pill = document.createElement("div");
      pill.className = `ingredient-option-pill ${checked ? "is-checked" : ""}`;
      pill.innerHTML = `
        <span class="check-square">${checked ? checkSvg : ""}</span>
        <span>${item.label}</span>
      `;
      pill.addEventListener("click", () => {
        if (tempIngredients.has(item.id)) tempIngredients.delete(item.id);
        else tempIngredients.add(item.id);
        renderDietaryModalOptions();
      });
      modalIngredientGrid.appendChild(pill);
    });

    // Render Bread Preferences
    modalBreadList.innerHTML = "";
    breadCatalog.forEach((item) => {
      const checked = tempBreads.has(item.id);
      const row = document.createElement("div");
      row.className = `bread-option-row ${checked ? "is-checked" : ""}`;
      row.innerHTML = `
        <div class="bread-opt-left">
          <span class="check-square">${checked ? checkSvg : ""}</span>
          <div>
            <div class="opt-title">${item.label}</div>
            <div class="opt-sub">${item.sub}</div>
          </div>
        </div>
        <span class="bread-badge-tag">${item.tag}</span>
      `;
      row.addEventListener("click", () => {
        if (tempBreads.has(item.id)) tempBreads.delete(item.id);
        else tempBreads.add(item.id);
        renderDietaryModalOptions();
      });
      modalBreadList.appendChild(row);
    });
  }

  function syncDietarySummaryUI() {
    const summaryAllergensWrap = document.getElementById("summaryAllergensWrap");
    const summaryBreadPrefsWrap = document.getElementById("summaryBreadPrefsWrap");
    const summaryIngredientsWrap = document.getElementById("summaryIngredientsWrap");

    // Allergens
    summaryAllergensWrap.innerHTML = "";
    if (dietaryState.allergens.size === 0) {
      summaryAllergensWrap.innerHTML = `<span class="empty-state-text">No allergens selected</span>`;
    } else {
      dietaryState.allergens.forEach((id) => {
        const found = allergenCatalog.find((a) => a.id === id);
        if (!found) return;
        const chip = document.createElement("span");
        chip.className = "allergen-chip";
        chip.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>${found.label}</span>
        `;
        summaryAllergensWrap.appendChild(chip);
      });
    }

    // Bread Preferences
    summaryBreadPrefsWrap.innerHTML = "";
    if (dietaryState.breads.size === 0) {
      summaryBreadPrefsWrap.innerHTML = `<span class="empty-state-text">No bread preferences selected</span>`;
    } else {
      dietaryState.breads.forEach((id) => {
        const found = breadCatalog.find((b) => b.id === id);
        if (!found) return;
        const pill = document.createElement("div");
        pill.className = "bread-pref-pill";
        pill.textContent = found.label;
        summaryBreadPrefsWrap.appendChild(pill);
      });
    }

    // Ingredients
    summaryIngredientsWrap.innerHTML = "";
    if (dietaryState.ingredients.size === 0) {
      summaryIngredientsWrap.innerHTML = `<span class="empty-state-text">No ingredients excluded</span>`;
    } else {
      dietaryState.ingredients.forEach((id) => {
        const found = ingredientCatalog.find((i) => i.id === id);
        if (!found) return;
        const tag = document.createElement("span");
        tag.className = "ingredient-chip";
        tag.textContent = found.label;
        summaryIngredientsWrap.appendChild(tag);
      });
    }

    // Nutritional Goals
    document.getElementById("summarySugarLimit").textContent = dietaryState.sugarLimit;
    document.getElementById("summaryFiberGoal").textContent = dietaryState.fiberGoal;
    document.getElementById("summaryPrimaryStyle").textContent = dietaryState.primaryStyle;
  }

  function openDietaryModal() {
    tempAllergens = new Set(dietaryState.allergens);
    tempIngredients = new Set(dietaryState.ingredients);
    tempBreads = new Set(dietaryState.breads);
    selectSugarLimit.value = dietaryState.sugarLimit;
    selectFiberGoal.value = dietaryState.fiberGoal;
    selectPrimaryStyle.value = dietaryState.primaryStyle;

    renderDietaryModalOptions();
    dietaryPrefsModal.classList.add("is-visible");
    dietaryPrefsModal.setAttribute("aria-hidden", "false");
  }

  function closeDietaryModal() {
    dietaryPrefsModal.classList.remove("is-visible");
    dietaryPrefsModal.setAttribute("aria-hidden", "true");
  }

  document.getElementById("openDietaryModalBtn").addEventListener("click", openDietaryModal);
  document.getElementById("closeDietaryModalBtn").addEventListener("click", closeDietaryModal);
  document.getElementById("cancelDietaryModalBtn").addEventListener("click", closeDietaryModal);
  dietaryPrefsModal.addEventListener("click", (e) => {
    if (e.target === dietaryPrefsModal) closeDietaryModal();
  });

  document.getElementById("saveDietaryPrefsBtn").addEventListener("click", () => {
    dietaryState.allergens = new Set(tempAllergens);
    dietaryState.ingredients = new Set(tempIngredients);
    dietaryState.breads = new Set(tempBreads);
    dietaryState.sugarLimit = selectSugarLimit.value;
    dietaryState.fiberGoal = selectFiberGoal.value;
    dietaryState.primaryStyle = selectPrimaryStyle.value;

    syncDietarySummaryUI();
    closeDietaryModal();
    showToast("Dietary preferences updated.");
  });

  // ================= VIEW 3: CHANGE PASSWORD FORM =================
  const changePasswordForm = document.getElementById("changePasswordForm");
  const currentPwdInput = document.getElementById("currentPwdInput");
  const newPwdInput = document.getElementById("newPwdInput");
  const pwdFormFeedback = document.getElementById("pwdFormFeedback");

  changePasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    pwdFormFeedback.classList.remove("is-visible");

    const curVal = currentPwdInput.value.trim();
    const newVal = newPwdInput.value.trim();

    if (newVal.length < 8) {
      pwdFormFeedback.textContent = "New password must be at least 8 characters long.";
      pwdFormFeedback.classList.add("is-visible");
      return;
    }

    if (curVal === newVal) {
      pwdFormFeedback.textContent = "New password must differ from your current password.";
      pwdFormFeedback.classList.add("is-visible");
      return;
    }

    currentPwdInput.value = "";
    newPwdInput.value = "";
    showToast("Password updated successfully.");
  });

  // ================= MODAL 3: DELETE ACCOUNT =================
  const deleteAccountModal = document.getElementById("deleteAccountModal");
  const deletePasswordInput = document.getElementById("deletePasswordInput");
  const deletePasswordError = document.getElementById("deletePasswordError");

  function openDeleteModal() {
    deletePasswordInput.value = "";
    deletePasswordInput.type = "password";
    deletePasswordError.classList.remove("is-visible");
    deleteAccountModal.classList.add("is-visible");
    deleteAccountModal.setAttribute("aria-hidden", "false");
  }

  function closeDeleteModal() {
    deleteAccountModal.classList.remove("is-visible");
    deleteAccountModal.setAttribute("aria-hidden", "true");
    deletePasswordError.classList.remove("is-visible");
  }

  document.getElementById("openDeleteModalBtn").addEventListener("click", openDeleteModal);
  document.getElementById("closeDeleteModalBtn").addEventListener("click", closeDeleteModal);
  document.getElementById("cancelDeleteModalBtn").addEventListener("click", closeDeleteModal);
  deleteAccountModal.addEventListener("click", (e) => {
    if (e.target === deleteAccountModal) closeDeleteModal();
  });

  deletePasswordInput.addEventListener("input", () => {
    if (deletePasswordInput.value.trim().length > 0) {
      deletePasswordError.classList.remove("is-visible");
    }
  });

  document.getElementById("deleteAccountForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!deletePasswordInput.value.trim()) {
      deletePasswordError.classList.add("is-visible");
      deletePasswordInput.focus();
      return;
    }
    closeDeleteModal();
    showToast("Identity verified. Account deletion request submitted.");
  });

  // Shared Password Visibility Toggle Buttons
  document.querySelectorAll(".toggle-eye-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  // Escape Key Closes Any Active Modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (editInfoModal.classList.contains("is-visible")) closeEditModal();
      if (dietaryPrefsModal.classList.contains("is-visible")) closeDietaryModal();
      if (deleteAccountModal.classList.contains("is-visible")) closeDeleteModal();
    }
  });

  // Top Nav & Logout Feedback
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      showToast(`Navigating to ${link.getAttribute("data-nav")}`);
    });
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    showToast("Logging out...");
  });

  // Initialize Clean UI
  syncPersonalUI();
  syncDietarySummaryUI();
});