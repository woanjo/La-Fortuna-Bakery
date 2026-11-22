document.addEventListener("DOMContentLoaded", () => {
  // Dashboard State (populate from your backend API)
  const dashboardState = {
    totalProducts: 0,
    registeredUsers: 0,
    userFeedback: 0,
    categories: {
      hearth: 0,
      flaky: 0,
      steamed: 0,
      merienda: 0
    },
    activityDateRange: "—",
    monthlyActivity: [
      // Expected format: { month: "May", year: "2026", sessions: 0 }
    ],
    products: [
      // Expected format:
      // {
      //   id: "product-id",
      //   monogram: "HB",
      //   name: "Product Name",
      //   status: "INCOMPLETE" | "COMPLETE",
      //   issue: "Missing field description",
      //   category: "Category Name",
      //   fieldLabel: "INPUT LABEL",
      //   details: ""
      // }
    ]
  };

  // DOM References
  const mainWrapper = document.getElementById("mainWrapper");
  const productStatusList = document.getElementById("productStatusList");
  const attentionCountPill = document.getElementById("attentionCountPill");
  const kpiTotalProducts = document.getElementById("kpiTotalProducts");
  const kpiActiveProducts = document.getElementById("kpiActiveProducts");
  const kpiIncompleteProducts = document.getElementById("kpiIncompleteProducts");
  const kpiReviewBadge = document.getElementById("kpiReviewBadge");
  const kpiRegisteredUsers = document.getElementById("kpiRegisteredUsers");
  const kpiUserFeedback = document.getElementById("kpiUserFeedback");

  // Category & Chart References
  const categoryTotalPill = document.getElementById("categoryTotalPill");
  const activityDateRange = document.getElementById("activityDateRange");
  const activityBars = document.getElementById("activityBars");

  // Modal References
  const productModal = document.getElementById("productModal");
  const closeProductModalBtn = document.getElementById("closeProductModalBtn");
  const cancelProductModalBtn = document.getElementById("cancelProductModalBtn");
  const productStatusForm = document.getElementById("productStatusForm");
  const modalMonogram = document.getElementById("modalMonogram");
  const productModalTitle = document.getElementById("productModalTitle");
  const productModalCategory = document.getElementById("productModalCategory");
  const modalIssuePrompt = document.getElementById("modalIssuePrompt");
  const modalStatusPill = document.getElementById("modalStatusPill");
  const productFieldLabel = document.getElementById("productFieldLabel");
  const productDetailsField = document.getElementById("productDetailsField");
  const saveProductModalBtn = document.getElementById("saveProductModalBtn");

  // Toast References
  const toastNotification = document.getElementById("toastNotification");
  const toastMessage = document.getElementById("toastMessage");
  let toastTimer = null;
  let activeProductId = null;

  function showToast(msg) {
    toastMessage.textContent = msg;
    toastNotification.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove("is-visible");
    }, 3000);
  }

  // Render Category Distribution
  function renderCategories() {
    const { hearth, flaky, steamed, merienda } = dashboardState.categories;
    const total = hearth + flaky + steamed + merienda;
    categoryTotalPill.textContent = `${total} Total Items`;

    const entries = [
      { key: "hearth", label: "Hearth Breads", count: hearth, metaId: "catMetaHearth" },
      { key: "flaky", label: "Flaky Pastries", count: flaky, metaId: "catMetaFlaky" },
      { key: "steamed", label: "Steamed & Glutinous", count: steamed, metaId: "catMetaSteamed" },
      { key: "merienda", label: "Sweet Merienda", count: merienda, metaId: "catMetaMerienda" }
    ];

    entries.forEach(({ key, label, count, metaId }) => {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const barWidth = total > 0 ? pct : 25;

      const segment = document.querySelector(`.bar-segment[data-cat="${key}"]`);
      if (segment) {
        segment.style.width = `${barWidth}%`;
        segment.title = `${label}: ${pct}% (${count} items)`;
      }

      const metaEl = document.getElementById(metaId);
      if (metaEl) {
        metaEl.innerHTML = `${pct}% &bull; ${count} items`;
      }
    });
  }

  // Render Recommendation Activity Chart
  function renderActivityChart() {
    activityDateRange.textContent = dashboardState.activityDateRange;
    activityBars.innerHTML = "";

    if (!dashboardState.monthlyActivity.length) {
      activityBars.style.display = "flex";
      activityBars.style.alignItems = "center";
      activityBars.style.justifyContent = "center";
      activityBars.innerHTML = `<p style="font-size: 13px; color: var(--text-muted);">No recommendation activity recorded yet.</p>`;
      return;
    }

    activityBars.style.display = "grid";
    const maxSessions = Math.max(...dashboardState.monthlyActivity.map((m) => m.sessions), 1);

    dashboardState.monthlyActivity.forEach((entry, index) => {
      const heightPct = Math.round((entry.sessions / maxSessions) * 85);
      const isLast = index === dashboardState.monthlyActivity.length - 1;

      const col = document.createElement("div");
      col.className = `bar-col${isLast ? " is-active" : ""}`;
      col.dataset.month = entry.month;
      col.dataset.year = entry.year || "";
      col.dataset.sessions = entry.sessions;

      col.innerHTML = `
        <span class="bar-value-label">${entry.sessions}</span>
        <div class="bar-visual" style="height: ${heightPct}%;"></div>
        <span class="bar-month">${entry.month}</span>
      `;

      col.addEventListener("click", () => {
        document.querySelectorAll(".bar-col").forEach((c) => c.classList.remove("is-active"));
        col.classList.add("is-active");
        const period = entry.year ? `${entry.month} ${entry.year}` : entry.month;
        showToast(`${period}: ${entry.sessions} recommendation sessions`);
      });

      activityBars.appendChild(col);
    });
  }

  // Render Product List & Sync KPI Counters
  function renderProductList() {
    productStatusList.innerHTML = "";

    kpiRegisteredUsers.textContent = dashboardState.registeredUsers.toLocaleString();
    kpiUserFeedback.textContent = dashboardState.userFeedback.toLocaleString();

    let incompleteCount = 0;

    if (!dashboardState.products.length) {
      productStatusList.innerHTML = `
        <div class="product-row" style="justify-content: center; padding: 28px 18px;">
          <p style="font-size: 13px; color: var(--text-muted);">No product records available.</p>
        </div>
      `;
    } else {
      dashboardState.products.forEach((item) => {
        const isComplete = item.status === "COMPLETE";
        if (!isComplete) incompleteCount++;

        const row = document.createElement("div");
        row.className = "product-row";

        row.innerHTML = `
          <div class="product-left">
            <div class="product-monogram ${isComplete ? "monogram-complete" : "monogram-incomplete"}">
              ${item.monogram}
            </div>
            <div class="product-info">
              <div class="product-name">${item.name}</div>
              <span class="status-tag ${isComplete ? "tag-complete" : "tag-incomplete"}">
                ${item.status}
              </span>
              <div class="product-issue ${isComplete ? "issue-complete" : "issue-incomplete"}">
                ${item.issue}
              </div>
              <div class="product-category">Category: ${item.category}</div>
            </div>
          </div>
          <button type="button" class="btn-row-action" data-id="${item.id}">
            ${isComplete ? "View" : "Edit"}
          </button>
        `;

        productStatusList.appendChild(row);
      });
    }

    const total = Math.max(dashboardState.totalProducts, dashboardState.products.length);
    const active = Math.max(0, total - incompleteCount);

    kpiTotalProducts.textContent = total.toLocaleString();
    kpiIncompleteProducts.textContent = incompleteCount.toLocaleString();
    kpiActiveProducts.textContent = active.toLocaleString();

    if (incompleteCount === 0) {
      kpiIncompleteProducts.classList.remove("is-alert");
      kpiReviewBadge.classList.add("is-clear");
      kpiReviewBadge.innerHTML = "ALL<br />VERIFIED";
      attentionCountPill.textContent = "ALL ITEMS VERIFIED";
      attentionCountPill.classList.add("all-complete");
    } else {
      kpiIncompleteProducts.classList.add("is-alert");
      kpiReviewBadge.classList.remove("is-clear");
      kpiReviewBadge.innerHTML = "NEEDS<br />REVIEW";
      attentionCountPill.textContent = `${incompleteCount} ITEMS NEED ATTENTION`;
      attentionCountPill.classList.remove("all-complete");
    }
  }

  // Open Product Modal (Scoped Blur)
  function openProductModal(productId) {
    const product = dashboardState.products.find((p) => p.id === productId);
    if (!product) return;

    activeProductId = productId;
    const isComplete = product.status === "COMPLETE";

    modalMonogram.textContent = product.monogram;
    productModalTitle.textContent = product.name;
    productModalCategory.textContent = `Category: ${product.category}`;
    modalIssuePrompt.textContent = product.issue;
    modalIssuePrompt.style.color = isComplete ? "#1e6b43" : "#a81c2b";

    modalStatusPill.textContent = product.status;
    modalStatusPill.className = `status-tag ${isComplete ? "tag-complete" : "tag-incomplete"}`;

    productFieldLabel.textContent = product.fieldLabel || "CATALOG SPECIFICATION DETAILS";
    productDetailsField.value = product.details || "";
    productDetailsField.readOnly = isComplete;
    saveProductModalBtn.style.display = isComplete ? "none" : "inline-flex";

    mainWrapper.classList.add("modal-open");
    productModal.classList.add("is-visible");
    productModal.setAttribute("aria-hidden", "false");
  }

  function closeProductModal() {
    mainWrapper.classList.remove("modal-open");
    productModal.classList.remove("is-visible");
    productModal.setAttribute("aria-hidden", "true");
    activeProductId = null;
  }

  // Event Delegation for Edit/View buttons
  productStatusList.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-row-action");
    if (btn) {
      openProductModal(btn.getAttribute("data-id"));
    }
  });

  closeProductModalBtn.addEventListener("click", closeProductModal);
  cancelProductModalBtn.addEventListener("click", closeProductModal);

  productModal.addEventListener("click", (e) => {
    if (e.target === productModal) closeProductModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && productModal.classList.contains("is-visible")) {
      closeProductModal();
    }
  });

  // Handle Saving Product Details
  productStatusForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeProductId) return;

    const product = dashboardState.products.find((p) => p.id === activeProductId);
    const val = productDetailsField.value.trim();
    if (!product || !val) return;

    product.details = val;
    product.status = "COMPLETE";
    product.issue = "All catalog details verified";

    renderProductList();
    closeProductModal();
    showToast(`${product.name} marked as COMPLETE.`);
  });

  // Interactive Category Highlight Sync
  const categoryTiles = document.querySelectorAll(".category-tile");
  const barSegments = document.querySelectorAll(".bar-segment");

  function highlightCategory(catKey) {
    categoryTiles.forEach((t) => {
      t.classList.toggle("is-highlighted", t.getAttribute("data-cat") === catKey);
    });
  }

  barSegments.forEach((seg) => {
    seg.addEventListener("mouseenter", () => highlightCategory(seg.getAttribute("data-cat")));
    seg.addEventListener("mouseleave", () => highlightCategory(null));
  });

  // Sidebar Navigation Preview Feedback
  document.querySelectorAll(".sidebar-nav .nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const section = item.getAttribute("data-nav");
      if (section !== "Dashboard") {
        showToast(`Viewing ${section} (Admin Dashboard preview active)`);
      }
    });
  });

  document.getElementById("logoutNavBtn").addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Logout clicked.");
  });

  // Initial Render
  renderCategories();
  renderActivityChart();
  renderProductList();
});