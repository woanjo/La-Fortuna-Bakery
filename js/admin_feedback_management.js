document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:5000";
  const $ = (id) => document.getElementById(id);

  const shell = document.querySelector(".app-shell");
  const rows = $("feedbackRows");
  const modal = $("detailModal");
  const searchInput = $("searchInput");
  const statusFilter = $("statusFilter");
  const categoryFilter = $("categoryFilter");
  const toast = $("toast");

  let allFeedback = [];
  let selectedFeedbackId = null;
  let toastTimer = null;

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
      throw new Error("Administrator session expired.");
    }

    if (!response.ok) {
      throw new Error(result.message || `Request failed (${response.status}).`);
    }

    return result;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit"
    });
  }

  function statusClass(status) {
    if (status === "Resolved") return "feedback-status--resolved";
    if (status === "In Progress") return "feedback-status--progress";
    return "feedback-status--pending";
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
  }

  async function authenticate() {
    const result = await apiRequest("/api/auth/me");
    const user = result.user || {};
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    $("adminName").textContent = name || user.username || "Administrator";
    shell.style.visibility = "visible";
  }

  function updateStats(items) {
    $("statTotal").textContent = items.length;
    $("statPending").textContent = items.filter((item) => item.status === "Pending").length;
    $("statProgress").textContent = items.filter((item) => item.status === "In Progress").length;
    $("statResolved").textContent = items.filter((item) => item.status === "Resolved").length;
  }

  function renderRows() {
    const search = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedCategory = categoryFilter.value;

    const filtered = allFeedback.filter((item) => {
      const searchable = [item.customerName, item.customerEmail, item.subject, item.message]
        .join(" ").toLowerCase();
      return (!search || searchable.includes(search))
        && (!selectedStatus || item.status === selectedStatus)
        && (!selectedCategory || item.category === selectedCategory);
    });

    if (!filtered.length) {
      rows.innerHTML = '<tr><td colspan="6" class="feedback-list-empty">No messages match your filters.</td></tr>';
    } else {
      rows.innerHTML = filtered.map((item) => `
        <tr>
          <td class="feedback-date">${escapeHtml(formatDate(item.createdAt))}</td>
          <td><div class="feedback-customer"><strong>${escapeHtml(item.customerName)}</strong><small>${escapeHtml(item.customerEmail)}</small></div></td>
          <td>${escapeHtml(item.category)}</td>
          <td class="feedback-subject">${escapeHtml(item.subject)}</td>
          <td><span class="feedback-status ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td>
          <td class="ta-r"><button class="feedback-view-btn" type="button" data-open-feedback="${Number(item.id)}">View</button></td>
        </tr>
      `).join("");
    }

    $("resultCount").textContent = `Showing ${filtered.length} of ${allFeedback.length} message(s)`;
  }

  async function loadFeedback() {
    rows.innerHTML = '<tr><td colspan="6" class="empty-state">Loading messages...</td></tr>';
    try {
      const result = await apiRequest("/api/admin/feedback");
      allFeedback = Array.isArray(result.feedback) ? result.feedback : [];
      updateStats(allFeedback);
      renderRows();
    } catch (error) {
      rows.innerHTML = `<tr><td colspan="6" class="feedback-list-empty">${escapeHtml(error.message)}</td></tr>`;
      $("resultCount").textContent = "Unable to load submissions";
    }
  }

  function openDetail(item) {
    selectedFeedbackId = item.id;
    $("detailReference").textContent = `Submission #${item.id}`;
    $("detailName").textContent = item.customerName || "—";
    $("detailEmail").textContent = item.customerEmail || "—";
    $("detailCategory").textContent = item.category || "—";
    $("detailDate").textContent = formatDate(item.createdAt);
    $("detailSubject").textContent = item.subject || "—";
    $("detailMessage").textContent = item.message || "";
    $("detailStatus").value = item.status;
    $("modalError").hidden = true;
    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
    $("closeModalBtn").focus();
  }

  function closeDetail() {
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
    selectedFeedbackId = null;
  }

  rows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-feedback]");
    if (!button) return;
    const item = allFeedback.find((entry) => entry.id === Number(button.dataset.openFeedback));
    if (item) openDetail(item);
  });

  async function saveStatus() {
    if (!selectedFeedbackId) return;
    const button = $("saveStatusBtn");
    button.disabled = true;
    $("modalError").hidden = true;

    try {
      const result = await apiRequest(`/api/admin/feedback/${selectedFeedbackId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: $("detailStatus").value })
      });

      const updated = result.feedback;
      const index = allFeedback.findIndex((item) => item.id === updated.id);
      if (index !== -1) allFeedback[index] = updated;
      updateStats(allFeedback);
      renderRows();
      closeDetail();
      showToast(result.message || "Feedback status saved.");

    } catch (error) {
      $("modalError").textContent = error.message;
      $("modalError").hidden = false;

    } finally {
      button.disabled = false;
    }
  }

  $("saveStatusBtn").addEventListener("click", saveStatus);
  $("closeModalBtn").addEventListener("click", closeDetail);
  $("cancelModalBtn").addEventListener("click", closeDetail);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeDetail();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-visible")) closeDetail();
  });

  searchInput.addEventListener("input", renderRows);
  statusFilter.addEventListener("change", renderRows);
  categoryFilter.addEventListener("change", renderRows);
  $("refreshBtn").addEventListener("click", loadFeedback);

  $("logoutBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await apiRequest("/api/auth/logout", { method: "POST", body: "{}" });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      window.location.href = "login.html";
    }
  });

  authenticate().then(loadFeedback).catch((error) => {
    console.error("Admin authentication failed:", error);
    window.location.href = "login.html";
  });
});
