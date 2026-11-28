
document.addEventListener("DOMContentLoaded", async () => {
  // =====================================================
  // 1. CONFIGURATION AND AUTHENTICATION
  // =====================================================

  const API_BASE = "http://127.0.0.1:5000";
  const appShell = document.querySelector(".app-shell");

  // Hide dashboard until the administrator session is verified.
  if (appShell) {
    appShell.style.visibility = "hidden";
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    });

    if (response.status === 401 || response.status === 403) {
      window.location.replace("login.html");
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to verify administrator session.");
    }

    const data = await response.json();

    if (data.user && data.user.role && data.user.role !== "admin") {
      window.location.replace("login.html");
      return;
    }

    // Authentication successful.
    if (appShell) {
      appShell.style.visibility = "visible";
    }

  } catch (error) {
    console.error("Dashboard authentication error:", error);

    document.body.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        background: #f8f7f3;
        color: #333;
      ">
        <div style="
          max-width: 440px;
          padding: 32px;
          background: white;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        ">
          <h2>Unable to Load Dashboard</h2>
          <p>
            The administrator session could not be verified.
            Please make sure the Flask backend is running.
          </p>
          <button
            onclick="location.reload()"
            style="
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              background: #315b42;
              color: white;
              cursor: pointer;
            "
          >
            Try Again
          </button>
          <p>
            <a href="login.html">Return to Admin Login</a>
          </p>
        </div>
      </div>
    `;

    return;
  }

  // =====================================================
  // 2. DASHBOARD STATE
  // =====================================================

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

    monthlyActivity: [],

    products: []
  };

  // =====================================================
  // 3. DOM REFERENCES
  // =====================================================

  const mainWrapper = document.getElementById("mainWrapper");
  const productStatusList = document.getElementById("productStatusList");
  const attentionCountPill = document.getElementById("attentionCountPill");

  const kpiTotalProducts = document.getElementById("kpiTotalProducts");
  const kpiActiveProducts = document.getElementById("kpiActiveProducts");
  const kpiIncompleteProducts = document.getElementById("kpiIncompleteProducts");
  const kpiReviewBadge = document.getElementById("kpiReviewBadge");
  const kpiRegisteredUsers = document.getElementById("kpiRegisteredUsers");
  const kpiUserFeedback = document.getElementById("kpiUserFeedback");

  // Category and chart references
  const categoryTotalPill = document.getElementById("categoryTotalPill");
  const activityDateRange = document.getElementById("activityDateRange");
  const activityBars = document.getElementById("activityBars");

  // Modal references
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

  // Toast references
  const toastNotification = document.getElementById("toastNotification");
  const toastMessage = document.getElementById("toastMessage");

  let toastTimer = null;
  let activeProductId = null;

  // =====================================================
  // 4. TOAST NOTIFICATION
  // =====================================================

  function showToast(message) {
    if (!toastNotification || !toastMessage) {
      console.log(message);
      return;
    }

    toastMessage.textContent = message;
    toastNotification.classList.add("is-visible");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toastNotification.classList.remove("is-visible");
    }, 3000);
  }

  // =====================================================
  // 5. RENDER CATEGORY DISTRIBUTION
  // =====================================================

  function renderCategories() {
    if (!categoryTotalPill) return;

    const {
      hearth,
      flaky,
      steamed,
      merienda
    } = dashboardState.categories;

    const total = hearth + flaky + steamed + merienda;

    categoryTotalPill.textContent = `${total} Total Items`;

    const entries = [
      {
        key: "hearth",
        label: "Hearth Breads",
        count: hearth,
        metaId: "catMetaHearth"
      },
      {
        key: "flaky",
        label: "Flaky Pastries",
        count: flaky,
        metaId: "catMetaFlaky"
      },
      {
        key: "steamed",
        label: "Steamed & Glutinous",
        count: steamed,
        metaId: "catMetaSteamed"
      },
      {
        key: "merienda",
        label: "Sweet Merienda",
        count: merienda,
        metaId: "catMetaMerienda"
      }
    ];

    entries.forEach(({ key, label, count, metaId }) => {
      const pct = total > 0
        ? Math.round((count / total) * 100)
        : 0;

      const barWidth = total > 0 ? pct : 25;

      const segment = document.querySelector(
        `.bar-segment[data-cat="${key}"]`
      );

      if (segment) {
        segment.style.width = `${barWidth}%`;
        segment.title = `${label}: ${pct}% (${count} items)`;
      }

      const metaEl = document.getElementById(metaId);

      if (metaEl) {
        metaEl.textContent = `${pct}% • ${count} items`;
      }
    });
  }

  // =====================================================
  // 6. RENDER RECOMMENDATION ACTIVITY CHART
  // =====================================================

  function renderActivityChart() {
    if (!activityDateRange || !activityBars) return;

    activityDateRange.textContent = dashboardState.activityDateRange;
    activityBars.innerHTML = "";

    if (!dashboardState.monthlyActivity.length) {
      activityBars.style.display = "flex";
      activityBars.style.alignItems = "center";
      activityBars.style.justifyContent = "center";

      const message = document.createElement("p");

      message.textContent = "No recommendation activity recorded yet.";
      message.style.fontSize = "13px";
      message.style.color = "var(--text-muted)";

      activityBars.appendChild(message);
      return;
    }

    activityBars.style.display = "grid";

    const maxSessions = Math.max(
      ...dashboardState.monthlyActivity.map((month) => month.sessions),
      1
    );

    dashboardState.monthlyActivity.forEach((entry, index) => {
      const heightPct = Math.round(
        (entry.sessions / maxSessions) * 85
      );

      const isLast =
        index === dashboardState.monthlyActivity.length - 1;

      const col = document.createElement("div");

      col.className = `bar-col${isLast ? " is-active" : ""}`;
      col.dataset.month = entry.month;
      col.dataset.year = entry.year || "";
      col.dataset.sessions = entry.sessions;

      const valueLabel = document.createElement("span");
      valueLabel.className = "bar-value-label";
      valueLabel.textContent = entry.sessions;

      const visual = document.createElement("div");
      visual.className = "bar-visual";
      visual.style.height = `${heightPct}%`;

      const monthLabel = document.createElement("span");
      monthLabel.className = "bar-month";
      monthLabel.textContent = entry.month;

      col.append(valueLabel, visual, monthLabel);

      col.addEventListener("click", () => {
        document.querySelectorAll(".bar-col").forEach((bar) => {
          bar.classList.remove("is-active");
        });

        col.classList.add("is-active");

        const period = entry.year
          ? `${entry.month} ${entry.year}`
          : entry.month;

        showToast(
          `${period}: ${entry.sessions} recommendation sessions`
        );
      });

      activityBars.appendChild(col);
    });
  }

  // =====================================================
  // 7. RENDER PRODUCT LIST AND KPI COUNTERS
  // =====================================================

  function renderProductList() {
    if (!productStatusList) return;

    productStatusList.innerHTML = "";

    if (kpiRegisteredUsers) {
      kpiRegisteredUsers.textContent =
        dashboardState.registeredUsers.toLocaleString();
    }

    if (kpiUserFeedback) {
      kpiUserFeedback.textContent =
        dashboardState.userFeedback.toLocaleString();
    }

    let incompleteCount = 0;

    if (!dashboardState.products.length) {
      const emptyRow = document.createElement("div");

      emptyRow.className = "product-row";
      emptyRow.style.justifyContent = "center";
      emptyRow.style.padding = "28px 18px";

      const message = document.createElement("p");

      message.textContent = "No product records available.";
      message.style.fontSize = "13px";
      message.style.color = "var(--text-muted)";

      emptyRow.appendChild(message);
      productStatusList.appendChild(emptyRow);

    } else {
      dashboardState.products.forEach((item) => {
        const isComplete = item.status === "COMPLETE";

        if (!isComplete) {
          incompleteCount++;
        }

        const row = document.createElement("div");
        row.className = "product-row";

        const left = document.createElement("div");
        left.className = "product-left";

        const monogram = document.createElement("div");

        monogram.className =
          `product-monogram ${
            isComplete ? "monogram-complete" : "monogram-incomplete"
          }`;

        monogram.textContent = item.monogram || "PR";

        const info = document.createElement("div");
        info.className = "product-info";

        const name = document.createElement("div");
        name.className = "product-name";
        name.textContent = item.name || "Unnamed Product";

        const status = document.createElement("span");

        status.className =
          `status-tag ${
            isComplete ? "tag-complete" : "tag-incomplete"
          }`;

        status.textContent = item.status || "INCOMPLETE";

        const issue = document.createElement("div");

        issue.className =
          `product-issue ${
            isComplete ? "issue-complete" : "issue-incomplete"
          }`;

        issue.textContent = item.issue || "";

        const category = document.createElement("div");
        category.className = "product-category";
        category.textContent = `Category: ${item.category || "Uncategorized"}`;

        info.append(name, status, issue, category);
        left.append(monogram, info);

        const action = document.createElement("button");

        action.type = "button";
        action.className = "btn-row-action";
        action.dataset.id = item.id;
        action.textContent = isComplete ? "View" : "Edit";

        row.append(left, action);
        productStatusList.appendChild(row);
      });
    }

    const total = Math.max(
      dashboardState.totalProducts,
      dashboardState.products.length
    );

    const active = Math.max(0, total - incompleteCount);

    if (kpiTotalProducts) {
      kpiTotalProducts.textContent = total.toLocaleString();
    }

    if (kpiIncompleteProducts) {
      kpiIncompleteProducts.textContent =
        incompleteCount.toLocaleString();
    }

    if (kpiActiveProducts) {
      kpiActiveProducts.textContent = active.toLocaleString();
    }

    if (
      incompleteCount === 0
    ) {
      if (kpiIncompleteProducts) {
        kpiIncompleteProducts.classList.remove("is-alert");
      }

      if (kpiReviewBadge) {
        kpiReviewBadge.classList.add("is-clear");
        kpiReviewBadge.innerHTML = "ALL<br>VERIFIED";
      }

      if (attentionCountPill) {
        attentionCountPill.textContent = "ALL ITEMS VERIFIED";
        attentionCountPill.classList.add("all-complete");
      }

    } else {
      if (kpiIncompleteProducts) {
        kpiIncompleteProducts.classList.add("is-alert");
      }

      if (kpiReviewBadge) {
        kpiReviewBadge.classList.remove("is-clear");
        kpiReviewBadge.innerHTML = "NEEDS<br>REVIEW";
      }

      if (attentionCountPill) {
        attentionCountPill.textContent =
          `${incompleteCount} ITEMS NEED ATTENTION`;

        attentionCountPill.classList.remove("all-complete");
      }
    }
  }

  // =====================================================
  // 8. PRODUCT MODAL
  // =====================================================

  function openProductModal(productId) {
    const product = dashboardState.products.find(
      (item) => String(item.id) === String(productId)
    );

    if (!product || !productModal) return;

    activeProductId = productId;

    const isComplete = product.status === "COMPLETE";

    if (modalMonogram) {
      modalMonogram.textContent = product.monogram || "PR";
    }

    if (productModalTitle) {
      productModalTitle.textContent = product.name || "Unnamed Product";
    }

    if (productModalCategory) {
      productModalCategory.textContent =
        `Category: ${product.category || "Uncategorized"}`;
    }

    if (modalIssuePrompt) {
      modalIssuePrompt.textContent = product.issue || "";

      modalIssuePrompt.style.color = isComplete
        ? "#1e6b43"
        : "#a81c2b";
    }

    if (modalStatusPill) {
      modalStatusPill.textContent = product.status || "INCOMPLETE";

      modalStatusPill.className =
        `status-tag ${
          isComplete ? "tag-complete" : "tag-incomplete"
        }`;
    }

    if (productFieldLabel) {
      productFieldLabel.textContent =
        product.fieldLabel || "CATALOG SPECIFICATION DETAILS";
    }

    if (productDetailsField) {
      productDetailsField.value = product.details || "";
      productDetailsField.readOnly = isComplete;
    }

    if (saveProductModalBtn) {
      saveProductModalBtn.style.display =
        isComplete ? "none" : "inline-flex";
    }

    if (mainWrapper) {
      mainWrapper.classList.add("modal-open");
    }

    productModal.classList.add("is-visible");
    productModal.setAttribute("aria-hidden", "false");
  }

  function closeProductModal() {
    if (mainWrapper) {
      mainWrapper.classList.remove("modal-open");
    }

    if (productModal) {
      productModal.classList.remove("is-visible");
      productModal.setAttribute("aria-hidden", "true");
    }

    activeProductId = null;
  }

  // =====================================================
  // 9. PRODUCT LIST EVENT DELEGATION
  // =====================================================

  if (productStatusList) {
    productStatusList.addEventListener("click", (event) => {
      const button = event.target.closest(".btn-row-action");

      if (button) {
        openProductModal(button.dataset.id);
      }
    });
  }

  if (closeProductModalBtn) {
    closeProductModalBtn.addEventListener(
      "click",
      closeProductModal
    );
  }

  if (cancelProductModalBtn) {
    cancelProductModalBtn.addEventListener(
      "click",
      closeProductModal
    );
  }

  if (productModal) {
    productModal.addEventListener("click", (event) => {
      if (event.target === productModal) {
        closeProductModal();
      }
    });
  }

  // Correct keyboard event handler.
  document.addEventListener("DOMContentLoaded", async () => {
    if (
      event.key === "Escape" &&
      productModal &&
      productModal.classList.contains("is-visible")
    ) {
      closeProductModal();
    }
  });

  // =====================================================
  // 10. SAVE PRODUCT DETAILS
  // =====================================================

  if (productStatusForm) {
    productStatusForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!activeProductId || !productDetailsField) {
        return;
      }

      const product = dashboardState.products.find(
        (item) => String(item.id) === String(activeProductId)
      );

      const value = productDetailsField.value.trim();

      if (!product || !value) {
        showToast("Please enter the required product details.");
        return;
      }

      product.details = value;
      product.status = "COMPLETE";
      product.issue = "All catalog details verified";

      renderProductList();
      closeProductModal();

      showToast(`${product.name} marked as COMPLETE.`);
    });
  }

  // =====================================================
  // 11. CATEGORY HIGHLIGHT INTERACTIONS
  // =====================================================

  const categoryTiles = document.querySelectorAll(".category-tile");
  const barSegments = document.querySelectorAll(".bar-segment");

  function highlightCategory(categoryKey) {
    categoryTiles.forEach((tile) => {
      tile.classList.toggle(
        "is-highlighted",
        tile.getAttribute("data-cat") === categoryKey
      );
    });
  }

  barSegments.forEach((segment) => {
    segment.addEventListener("mouseenter", () => {
      highlightCategory(segment.getAttribute("data-cat"));
    });

    segment.addEventListener("mouseleave", () => {
      highlightCategory(null);
    });
  });

  // =====================================================
  // 12. SIDEBAR NAVIGATION PREVIEW
  // =====================================================

  // Sidebar Navigation
const adminPageRoutes = {
  "dashboard": "dashboard.html",
  "bread management": "bread_management.html",
  "account settings": "account_settings.html"
};
 // Only prevent navigation for unfinished placeholder links.
  document.querySelectorAll(".sidebar-nav .nav-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      const href = item.getAttribute("href");

      if (!href || href.trim() === "" || href.trim() === "#") {
        event.preventDefault();
        showToast("This section has not been implemented yet.");
      }
    });
  });

  // =====================================================
  // 13. ADMIN LOGOUT
  // =====================================================

  const logoutNavBtn = document.getElementById("logoutNavBtn");

  if (logoutNavBtn) {
    logoutNavBtn.addEventListener("click", async (event) => {
      event.preventDefault();

      logoutNavBtn.style.pointerEvents = "none";

      try {
        const response = await fetch(
          `${API_BASE}/api/auth/logout`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error("Logout failed. Please try again.");
        }

        window.location.replace("login.html");

      } catch (error) {
        console.error("Logout error:", error);

        showToast(error.message || "Unable to log out.");

        logoutNavBtn.style.pointerEvents = "";
      }
    });
  }

  // =====================================================
  // 14. INITIAL DASHBOARD RENDER
  // =====================================================

  renderCategories();
  renderActivityChart();
  renderProductList();

});
