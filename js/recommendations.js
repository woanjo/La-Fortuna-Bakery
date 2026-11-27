document.addEventListener("DOMContentLoaded", () => {
  // Recommended Breads Data
  const BREADS = [];

  // State
  const favorites = new Set();
  let activeBreadId = null;

  // Elements
  const cardsGrid = document.getElementById("cardsGrid");
  const detailsModal = document.getElementById("modal");
  const navFavCount = document.getElementById("navFavorites");
  const toastEl = document.getElementById("toast");

  let toastTimer;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 2500);
  }

  function updateFavCount() {
    if (favorites.size > 0) {
      navFavCount.textContent = `Favorites (${favorites.size})`;
    } else {
      navFavCount.textContent = "Favorites";
    }
  }

  function renderCards() {
    cardsGrid.innerHTML = BREADS.map((bread) => {
      const isFav = favorites.has(bread.id);
      return `
        <article class="bread-card">
          <div class="card-img-wrap">
            <img src="${bread.image}" alt="${bread.name}" loading="lazy" />
            <div class="card-img-overlay"></div>
            <span class="card-cat-badge">${bread.badge}</span>
            <button type="button" class="card-heart-btn ${isFav ? "is-fav" : ""}" data-fav="${bread.id}" aria-label="Favorite ${bread.name}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <h4 class="card-img-title">${bread.name}</h4>
          </div>

          <div class="card-body">
            <p class="card-desc">${bread.shortDesc}</p>

            <div class="card-pills">
              <span class="nutri-pill">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <path d="M3.82083 9.45L6.83958 5.83333H4.50625L4.92917 2.52292L2.23125 6.41667H4.25833L3.82083 9.45V9.45M2.33333 11.6667L2.91667 7.58333H0L5.25 0H6.41667L5.83333 4.66667H9.33333L3.5 11.6667H2.33333V11.6667M4.53542 5.97917V5.97917V5.97917V5.97917V5.97917V5.97917V5.97917V5.97917" fill="#7B5900"/>
                </svg> ${bread.calories}</span>
              <span class="nutri-pill">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <path d="M4.82708 9.91667C4.94375 9.90695 5.0434 9.86076 5.12604 9.77812C5.20868 9.69549 5.25 9.59583 5.25 9.47917C5.25 9.34306 5.20625 9.23368 5.11875 9.15104C5.03125 9.0684 4.91944 9.03195 4.78333 9.04167C4.38472 9.07083 3.96181 8.96146 3.51458 8.71354C3.06736 8.46563 2.78542 8.01597 2.66875 7.36458C2.64931 7.25764 2.59826 7.17014 2.51562 7.10208C2.43299 7.03403 2.33819 7 2.23125 7C2.09514 7 1.98333 7.05104 1.89583 7.15312C1.80833 7.25521 1.77917 7.37431 1.80833 7.51042C1.97361 8.39514 2.3625 9.02708 2.975 9.40625C3.5875 9.78542 4.20486 9.95556 4.82708 9.91667V9.91667M4.66667 11.6667C3.33472 11.6667 2.22396 11.2097 1.33438 10.2958C0.444792 9.38194 0 8.24444 0 6.88333C0 5.91111 0.386458 4.85382 1.15937 3.71146C1.93229 2.5691 3.10139 1.33194 4.66667 0C6.23194 1.33194 7.40104 2.5691 8.17396 3.71146C8.94688 4.85382 9.33333 5.91111 9.33333 6.88333C9.33333 8.24444 8.88854 9.38194 7.99896 10.2958C7.10938 11.2097 5.99861 11.6667 4.66667 11.6667V11.6667M4.66667 10.5C5.67778 10.5 6.51389 10.1573 7.175 9.47188C7.83611 8.78646 8.16667 7.92361 8.16667 6.88333C8.16667 6.17361 7.87257 5.37153 7.28438 4.47708C6.69618 3.58264 5.82361 2.60556 4.66667 1.54583C3.50972 2.60556 2.63715 3.58264 2.04896 4.47708C1.46076 5.37153 1.16667 6.17361 1.16667 6.88333C1.16667 7.92361 1.49722 8.78646 2.15833 9.47188C2.81944 10.1573 3.65556 10.5 4.66667 10.5V10.5M4.66667 5.83333V5.83333V5.83333V5.83333V5.83333V5.83333V5.83333V5.83333V5.83333V5.83333" fill="#7B5900"/>
                </svg> ${bread.sugar} sugar</span>
            </div>

            <div class="match-banner">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
              </svg>
              <span><strong>Why this matches:</strong> ${bread.cardMatchText}</span>
            </div>

            <button type="button" class="btn-view-details" data-view="${bread.id}">
              View Details →
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function syncModalFavButton() {
    if (!activeBreadId) return;
    const isFav = favorites.has(activeBreadId);
    const favBtn = document.getElementById("favBtn");
    const favIcon = document.getElementById("favIcon");
    const favText = document.getElementById("favText");

    if (favBtn) favBtn.setAttribute("aria-pressed", isFav ? "true" : "false");
    if (favIcon) favIcon.textContent = isFav ? "♥" : "♡";
    if (favText) favText.textContent = isFav ? "SAVED IN FAVORITES" : "ADD TO FAVORITES";
  }

  function openModal(breadId) {
    const bread = BREADS.find((b) => b.id === breadId);
    if (!bread) return;

    activeBreadId = bread.id;

    const mImg = document.getElementById("mImg");
    if (mImg) mImg.style.backgroundImage = `url('${bread.image}')`;

    document.getElementById("mZh").textContent = bread.chineseTag;
    document.getElementById("mCat").textContent = bread.modalCategory;
    document.getElementById("mName").textContent = bread.name;
    document.getElementById("mPrice").textContent = bread.price;
    document.getElementById("mYield").textContent = bread.yieldText;
    document.getElementById("mDesc").textContent = bread.fullDesc;

    document.getElementById("mKcal").textContent = bread.calories;
    document.getElementById("mKcalNote").textContent = bread.caloriesSub;
    document.getElementById("mSugar").textContent = bread.sugar;
    document.getElementById("mSugarNote").textContent = bread.sugarNote;
    document.getElementById("mServing").textContent = bread.serving;
    document.getElementById("mServingNote").textContent = bread.servingNote;

    document.getElementById("mWhy").innerHTML = bread.matches
      .map((m) => `<li>${m}</li>`)
      .join("");

    document.getElementById("mIng").textContent = bread.ingredients;
    document.getElementById("mAll").textContent = bread.allergens;

    syncModalFavButton();

    document.body.classList.add("is-locked");
    detailsModal.hidden = false;
    detailsModal.classList.add("active");
  }

  function closeModal() {
    document.body.classList.remove("is-locked");
    detailsModal.classList.remove("active");
    detailsModal.hidden = true;
    activeBreadId = null;
  }

  function toggleFavorite(breadId) {
    const bread = BREADS.find((b) => b.id === breadId);
    if (!bread) return;

    if (favorites.has(breadId)) {
      favorites.delete(breadId);
      showToast(`Removed "${bread.name}" from Favorites.`);
    } else {
      favorites.add(breadId);
      showToast(`Added "${bread.name}" to Favorites.`);
    }
    updateFavCount();
    renderCards();
    syncModalFavButton();
  }

  // Event Listeners
  cardsGrid.addEventListener("click", (e) => {
    const viewBtn = e.target.closest("[data-view]");
    const favBtn = e.target.closest("[data-fav]");

    if (viewBtn) {
      openModal(viewBtn.dataset.view);
    } else if (favBtn) {
      toggleFavorite(favBtn.dataset.fav);
    }
  });

  const modalFavBtn = document.getElementById("favBtn");
  if (modalFavBtn) {
    modalFavBtn.addEventListener("click", () => {
      if (activeBreadId) toggleFavorite(activeBreadId);
    });
  }

  // Hook up all elements with data-close attribute
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  detailsModal.addEventListener("click", (e) => {
    if (e.target === detailsModal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detailsModal.classList.contains("active")) {
      closeModal();
    }
  });

  const editPrefBtn = document.getElementById("editPrefBtn");
  if (editPrefBtn) {
    editPrefBtn.addEventListener("click", () => {
      showToast("Redirecting to Dietary Preferences settings...");
    });
  }

  // Initial Render
  renderCards();
});