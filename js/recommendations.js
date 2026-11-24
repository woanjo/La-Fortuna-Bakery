document.addEventListener("DOMContentLoaded", () => {
  // Recommended Breads Data (includes Traditional Pan de Sal from modal & the 3 cards from page)
  const BREADS = [
    {
      id: "sprouted-pandesal",
      badge: "Bread",
      modalCategory: "HEARTH ROLLS & BREAKFAST",
      name: "Sprouted Whole Wheat Pan de Sal",
      chineseTag: "全麥麵包",
      price: "₱110.00 / dozen",
      priceNote: "(12 rolls)",
      shortDesc: "Soft whole wheat bread rolls made with sprouted grains.",
      fullDesc: "Cold-milled sprouted whole wheat rolls fermented slowly for natural sweetness, high dietary fiber, and a tender crumb.",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      calories: "130 kcal",
      sugar: "1.8g",
      sugarNote: "low sugar",
      fiber: "3.4g fiber",
      serving: "1 Roll",
      servingNote: "(approx. 38g)",
      cardMatchText: "Matches your low-sugar preferences",
      matches: [
        "Matches low-sugar preference (< 5g)",
        "High fiber whole-grain option",
        "Nut-free & dairy-free safeguard"
      ],
      ingredients: "Sprouted whole wheat flour, purified water, raw muscovado sugar, Ilocos sea salt, active sourdough starter, cold-pressed coconut oil.",
      allergens: "Contains Wheat (Gluten). Free from Tree Nuts, Peanuts, and Dairy."
    },
    {
      id: "pan-de-suelo",
      badge: "Bread",
      modalCategory: "HEARTH ROLLS & BREAKFAST",
      name: "Traditional Pan de Suelo",
      chineseTag: "傳統麵包",
      price: "₱85.00 / dozen",
      priceNote: "(12 rolls)",
      shortDesc: "Traditional Filipino bread with a soft crumbs and golden crust.",
      fullDesc: "Artisan wood-fired rolls baked directly on the hearth floor using traditional slow-fermentation methods for a crisp crust and airy interior.",
      image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80",
      calories: "145 kcal",
      sugar: "0.9g",
      sugarNote: "low sugar",
      fiber: "2.1g fiber",
      serving: "1 Roll",
      servingNote: "(approx. 35g)",
      cardMatchText: "Matches your low-sugar preferences",
      matches: [
        "Matches low-sugar preference",
        "Nut-free safeguard",
        "Baked without commercial pork lard"
      ],
      ingredients: "Enriched wheat flour, spring water, cane sugar, sea salt, sourdough starter, vegetable shortening, breadcrumbs.",
      allergens: "Contains Wheat (Gluten). Free from Tree Nuts, Peanuts, and Dairy."
    },
    {
      id: "hopia-baboy-kundol",
      badge: "Hopia",
      modalCategory: "FLAKY PASTRIES & MERIENDA",
      name: "Savory Hopia Baboy (Kundol)",
      chineseTag: "冬瓜肉餅",
      price: "₱140.00 / box",
      priceNote: "(8 pieces)",
      shortDesc: "Flaky hopia pastry filled with sweet kundol.",
      fullDesc: "Delicate multi-layered Chinese-Filipino pastry filled with slow-cooked candied wintermelon (kundol) and aromatic scallions.",
      image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
      calories: "185 kcal",
      sugar: "4.2g",
      sugarNote: "within limit",
      fiber: null,
      serving: "1 Piece",
      servingNote: "(approx. 45g)",
      cardMatchText: "Fits your saved sugar limit.",
      matches: [
        "Fits your saved sugar limit (< 5g)",
        "Matches Candied Kundol preference",
        "Nut-free & dairy-free safeguard"
      ],
      ingredients: "Enriched wheat flour, candied wintermelon (kundol), vegetable shortening, water, sesame oil, green scallions, sea salt.",
      allergens: "Contains Wheat (Gluten), Sesame. Free from Tree Nuts, Peanuts, and Dairy."
    }
  ];

  // State
  const favorites = new Set();
  let activeBreadId = null;

  // Elements
  const cardsGrid = document.getElementById("cardsGrid");
  const detailsModal = document.getElementById("detailsModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const footerCloseBtn = document.getElementById("footerCloseBtn");
  const modalFavBtn = document.getElementById("modalFavBtn");
  const modalFavText = document.getElementById("modalFavText");
  const navFavCount = document.getElementById("navFavCount");
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
      navFavCount.textContent = favorites.size;
      navFavCount.hidden = false;
    } else {
      navFavCount.hidden = true;
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
              <span class="nutri-pill">⚡ ${bread.calories}</span>
              <span class="nutri-pill">💧 ${bread.sugar} sugar</span>
              ${bread.fiber ? `<span class="nutri-pill">🌾 ${bread.fiber}</span>` : ""}
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
    modalFavBtn.classList.toggle("is-saved", isFav);
    modalFavText.textContent = isFav ? "SAVED IN FAVORITES" : "ADD TO FAVORITES";
  }

  function openModal(breadId) {
    const bread = BREADS.find((b) => b.id === breadId);
    if (!bread) return;

    activeBreadId = bread.id;
    document.getElementById("mImage").src = bread.image;
    document.getElementById("mImage").alt = bread.name;
    document.getElementById("mChineseTag").textContent = bread.chineseTag;
    document.getElementById("mCategory").textContent = bread.modalCategory;
    document.getElementById("mName").textContent = bread.name;
    document.getElementById("mPrice").textContent = bread.price;
    document.getElementById("mPriceNote").textContent = bread.priceNote;
    document.getElementById("mDesc").textContent = bread.fullDesc;

    document.getElementById("mCalories").textContent = bread.calories;
    document.getElementById("mSugar").textContent = bread.sugar;
    document.getElementById("mSugarNote").textContent = bread.sugarNote;
    document.getElementById("mServing").textContent = bread.serving;
    document.getElementById("mServingNote").textContent = bread.servingNote;

    document.getElementById("mMatchList").innerHTML = bread.matches
      .map(
        (m) => `
        <li>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="9 12 11 14 15 10"></polyline>
          </svg>
          <span>${m}</span>
        </li>`
      )
      .join("");

    document.getElementById("mIngredients").textContent = bread.ingredients;
    document.getElementById("mAllergens").textContent = bread.allergens;

    syncModalFavButton();

    document.body.classList.add("modal-open");
    detailsModal.classList.add("is-visible");
    detailsModal.setAttribute("aria-hidden", "false");
    closeModalBtn.focus();
  }

  function closeModal() {
    document.body.classList.remove("modal-open");
    detailsModal.classList.remove("is-visible");
    detailsModal.setAttribute("aria-hidden", "true");
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

  modalFavBtn.addEventListener("click", () => {
    if (activeBreadId) toggleFavorite(activeBreadId);
  });

  closeModalBtn.addEventListener("click", closeModal);
  footerCloseBtn.addEventListener("click", closeModal);

  detailsModal.addEventListener("click", (e) => {
    if (e.target === detailsModal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detailsModal.classList.contains("is-visible")) {
      closeModal();
    }
  });

  document.getElementById("editPrefBtn").addEventListener("click", () => {
    showToast("Redirecting to Dietary Preferences settings...");
  });

  // Initial Render
  renderCards();
});