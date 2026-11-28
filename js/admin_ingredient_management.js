document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const API_BASE = "http://127.0.0.1:5000";
    const $ = (id) => document.getElementById(id);

    const state = {
        ingredients: [],
        filtered: [],
        page: 1,
        pageSize: 8,
        editingId: null,
        saving: false,
        loading: false,
        toastTimer: null
    };

    const shell = document.querySelector(".app-shell");
    const modal = $("ingredientModal");
    const form = $("ingredientForm");
    const nameInput = $("fName");
    const saveButton = $("fSave");

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function showToast(message, duration = 3000) {
        const toast = $("toast");
        toast.textContent = message;
        toast.hidden = false;

        window.clearTimeout(state.toastTimer);
        state.toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, duration);
    }

    function setPageError(message) {
        $("rows").innerHTML = `
            <tr>
                <td colspan="5" class="ingredient-empty">
                    <strong>Unable to load ingredients</strong>
                    ${escapeHTML(message)}
                </td>
            </tr>`;
        $("showing").textContent = "Catalog unavailable";
        $("pages").innerHTML = "";
    }

    async function apiRequest(path, options = {}) {
        const headers = {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        };

        let response;
        try {
            response = await fetch(`${API_BASE}${path}`, {
                ...options,
                headers,
                credentials: "include"
            });
        } catch (error) {
            throw new Error("Cannot reach the Flask server. Make sure the backend is running.");
        }

        let result = {};
        try {
            result = await response.json();
        } catch (_) {
            result = {};
        }

        if (response.status === 401 || response.status === 403) {
            window.location.href = "login.html";
            throw new Error("Your administrator session has expired. Please log in again.");
        }

        if (!response.ok) {
            throw new Error(result.message || `Request failed (${response.status}).`);
        }

        return result;
    }

    async function checkAdminSession() {
        try {
            const response = await fetch(`${API_BASE}/api/auth/me`, {
                method: "GET",
                credentials: "include"
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = "login.html";
                return false;
            }

            if (!response.ok) {
                throw new Error("Unable to verify the administrator session.");
            }

            const result = await response.json();
            if (result.status !== "success") {
                window.location.href = "login.html";
                return false;
            }

            shell.style.visibility = "visible";
            return true;
        } catch (error) {
            setPageError(error.message || "Unable to connect to the backend.");
            shell.style.visibility = "visible";
            return false;
        }
    }

    function openModal(mode, ingredient = null) {
        state.editingId = mode === "edit" ? ingredient.id : null;
        form.reset();
        $("fNameError").textContent = "";
        nameInput.classList.remove("is-invalid");

        if (mode === "edit") {
            $("fTitle").textContent = "Edit Ingredient";
            $("fSubtitle").textContent = "Update the ingredient name. Existing links will be preserved.";
            saveButton.textContent = "Save Changes";
            nameInput.value = ingredient.name;
        } else {
            $("fTitle").textContent = "Add Ingredient";
            $("fSubtitle").textContent = "Add a new item to the ingredient catalog.";
            saveButton.textContent = "Save Ingredient";
            nameInput.value = "";
        }

        modal.classList.add("is-visible");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-active");
        document.body.style.overflow = "hidden";
        window.setTimeout(() => nameInput.focus(), 80);
    }

    function closeModal(force = false) {
        if (state.saving && !force) return;

        modal.classList.remove("is-visible");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-active");
        document.body.style.overflow = "";
        state.editingId = null;
        form.reset();
        $("fNameError").textContent = "";
        nameInput.classList.remove("is-invalid");
    }

    function updateStats() {
        const items = state.ingredients;
        $("sTotal").textContent = items.length;
        $("sProducts").textContent = items.filter((item) => item.productUsage > 0).length;
        $("sCustomers").textContent = items.filter((item) => item.customerUsage > 0).length;
        $("sUnused").textContent = items.filter((item) => item.totalUsage === 0).length;
    }

    function applyFilters() {
        const searchTerm = $("search").value.trim().toLocaleLowerCase();
        const usageFilter = $("fUsage").value;
        const sortMode = $("fSort").value;

        let result = state.ingredients.filter((item) => {
            const matchesSearch = item.name.toLocaleLowerCase().includes(searchTerm);
            const matchesUsage = usageFilter === "all"
                || (usageFilter === "products" && item.productUsage > 0)
                || (usageFilter === "unused" && item.totalUsage === 0);
            return matchesSearch && matchesUsage;
        });

        result.sort((a, b) => {
            if (sortMode === "za") return b.name.localeCompare(a.name);
            if (sortMode === "most") {
                return (b.totalUsage - a.totalUsage) || a.name.localeCompare(b.name);
            }
            if (sortMode === "least") {
                return (a.totalUsage - b.totalUsage) || a.name.localeCompare(b.name);
            }
            return a.name.localeCompare(b.name);
        });

        state.filtered = result;
        const maxPage = Math.max(1, Math.ceil(result.length / state.pageSize));
        state.page = Math.min(state.page, maxPage);
        renderTable();
    }

    function renderTable() {
        const total = state.filtered.length;
        const maxPage = Math.max(1, Math.ceil(total / state.pageSize));
        const startIndex = (state.page - 1) * state.pageSize;
        const pageItems = state.filtered.slice(startIndex, startIndex + state.pageSize);

        if (!total) {
            const hasIngredients = state.ingredients.length > 0;
            $("rows").innerHTML = `
                <tr>
                    <td colspan="5" class="ingredient-empty">
                        <strong>${hasIngredients ? "No matching ingredients" : "No ingredients found"}</strong>
                        ${hasIngredients
                            ? "Try changing your search or filter."
                            : "Add your first ingredient to begin building the catalog."}
                    </td>
                </tr>`;
        } else {
            $("rows").innerHTML = pageItems.map((item) => {
                const hasLinks = item.totalUsage > 0;
                const usageLabel = hasLinks ? "Referenced" : "Unused";
                const usageClass = hasLinks ? "is-linked" : "is-unused";
                const deleteTitle = item.canDelete
                    ? "Delete ingredient"
                    : `Cannot delete: ${item.productUsage} product link(s), ${item.customerUsage} customer reference(s)`;

                return `
                    <tr data-id="${item.id}">
                        <td>
                            <div class="ingredient-name-cell">
                                <b>${escapeHTML(item.name)}</b>
                                <small>Ingredient ID: ${item.id}</small>
                            </div>
                        </td>
                        <td><span class="usage-count ${item.productUsage === 0 ? "is-zero" : ""}">${item.productUsage}</span></td>
                        <td><span class="usage-count ${item.customerUsage === 0 ? "is-zero" : ""}">${item.customerUsage}</span></td>
                        <td><span class="reference-status ${usageClass}">${usageLabel}</span></td>
                        <td>
                            <div class="ingredient-actions">
                                <button type="button" class="icon-btn" data-edit="${item.id}" aria-label="Edit ${escapeHTML(item.name)}" title="Edit ingredient">
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                                </button>
                                <button type="button" class="icon-btn" data-delete="${item.id}" aria-label="Delete ${escapeHTML(item.name)}" title="${escapeHTML(deleteTitle)}" ${item.canDelete ? "" : "disabled"}>
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5m4-5v5"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>`;
            }).join("");
        }

        const first = total ? startIndex + 1 : 0;
        const last = Math.min(startIndex + state.pageSize, total);
        $("showing").textContent = total
            ? `Showing ${first}–${last} of ${total} ingredients`
            : "Showing 0 ingredients";

        renderPagination(maxPage);
    }

    function renderPagination(maxPage) {
        const container = $("pages");
        if (maxPage <= 1) {
            container.innerHTML = "";
            return;
        }

        let html = `<button type="button" data-page="${state.page - 1}" aria-label="Previous page" ${state.page === 1 ? "disabled" : ""}>‹</button>`;
        for (let page = 1; page <= maxPage; page += 1) {
            html += `<button type="button" data-page="${page}" class="${page === state.page ? "is-on" : ""}" aria-current="${page === state.page ? "page" : "false"}">${page}</button>`;
        }
        html += `<button type="button" data-page="${state.page + 1}" aria-label="Next page" ${state.page === maxPage ? "disabled" : ""}>›</button>`;
        container.innerHTML = html;
    }

    async function loadIngredients({ keepPage = false } = {}) {
        if (state.loading) return;
        state.loading = true;
        $("rows").innerHTML = '<tr><td colspan="5" class="ingredient-loading">Loading ingredients...</td></tr>';

        try {
            const result = await apiRequest("/api/admin/ingredients");
            state.ingredients = Array.isArray(result.ingredients) ? result.ingredients : [];
            if (!keepPage) state.page = 1;
            updateStats();
            applyFilters();
        } catch (error) {
            setPageError(error.message);
        } finally {
            state.loading = false;
        }
    }

    async function saveIngredient(event) {
        event.preventDefault();
        if (state.saving) return;

        const name = nameInput.value.trim();
        $("fNameError").textContent = "";
        nameInput.classList.remove("is-invalid");

        if (!name) {
            $("fNameError").textContent = "Ingredient name is required.";
            nameInput.classList.add("is-invalid");
            nameInput.focus();
            return;
        }

        if (name.length > 150) {
            $("fNameError").textContent = "Ingredient name must not exceed 150 characters.";
            nameInput.classList.add("is-invalid");
            nameInput.focus();
            return;
        }

        const isEditing = state.editingId !== null;
        const endpoint = isEditing
            ? `/api/admin/ingredients/${state.editingId}`
            : "/api/admin/ingredients";

        state.saving = true;
        saveButton.disabled = true;
        saveButton.textContent = isEditing ? "Saving..." : "Adding...";

        try {
            const result = await apiRequest(endpoint, {
                method: isEditing ? "PUT" : "POST",
                body: JSON.stringify({ name })
            });

            closeModal(true);
            showToast(result.message || (isEditing ? "Ingredient updated." : "Ingredient added."));
            await loadIngredients({ keepPage: true });
        } catch (error) {
            $("fNameError").textContent = error.message;
            nameInput.classList.add("is-invalid");
        } finally {
            state.saving = false;
            saveButton.disabled = false;
            saveButton.textContent = isEditing ? "Save Changes" : "Save Ingredient";
        }
    }

    async function deleteIngredient(ingredient) {
        if (!ingredient || !ingredient.canDelete) return;

        const confirmed = window.confirm(
            `Delete "${ingredient.name}" from the ingredient catalog? This cannot be undone.`
        );
        if (!confirmed) return;

        try {
            const result = await apiRequest(`/api/admin/ingredients/${ingredient.id}`, {
                method: "DELETE"
            });
            showToast(result.message || "Ingredient deleted.");
            await loadIngredients({ keepPage: true });
        } catch (error) {
            showToast(error.message, 4500);
            await loadIngredients({ keepPage: true });
        }
    }

    // Move the modal to body so it is not clipped by the main content wrapper.
    if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    $("addBtn").addEventListener("click", () => openModal("add"));
    $("closeModalBtn").addEventListener("click", closeModal);
    $("cancelModalBtn").addEventListener("click", closeModal);
    form.addEventListener("submit", saveIngredient);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-visible")) {
            closeModal();
        }
    });

    $("rows").addEventListener("click", (event) => {
        const editButton = event.target.closest("[data-edit]");
        const deleteButton = event.target.closest("[data-delete]");

        if (editButton) {
            const id = Number(editButton.dataset.edit);
            const ingredient = state.ingredients.find((item) => item.id === id);
            if (ingredient) openModal("edit", ingredient);
            return;
        }

        if (deleteButton && !deleteButton.disabled) {
            const id = Number(deleteButton.dataset.delete);
            const ingredient = state.ingredients.find((item) => item.id === id);
            deleteIngredient(ingredient);
        }
    });

    $("pages").addEventListener("click", (event) => {
        const button = event.target.closest("button[data-page]");
        if (!button || button.disabled) return;

        const requestedPage = Number(button.dataset.page);
        const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        if (requestedPage < 1 || requestedPage > maxPage) return;

        state.page = requestedPage;
        renderTable();
    });

    $("search").addEventListener("input", () => {
        state.page = 1;
        applyFilters();
    });

    $("fUsage").addEventListener("change", () => {
        state.page = 1;
        applyFilters();
    });

    $("fSort").addEventListener("change", () => {
        state.page = 1;
        applyFilters();
    });

    $("logoutBtn").addEventListener("click", async (event) => {
        event.preventDefault();
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
        } finally {
            window.location.href = "login.html";
        }
    });

    document.querySelectorAll(".coming-soon-link").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            showToast("Feedback & Inquiries is not available yet.");
        });
    });

    const authenticated = await checkAdminSession();
    if (authenticated) {
        await loadIngredients();
    }
});
