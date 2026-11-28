
document.addEventListener("DOMContentLoaded", async () => {
    // =====================================================
    // CONFIGURATION
    // =====================================================

    const API_BASE = "http://127.0.0.1:5000";

    const $ = (id) => document.getElementById(id);

    const SAVE_ICON = `
        <svg width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
        </svg>`;

    const ICON_EYE = `
        <svg width="17" height="17" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>`;

    const ICON_EDIT = `
        <svg width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>`;

    const esc = (value) =>
        String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);

    const has = (value) =>
        value !== null && value !== undefined && value !== "";

    const fmtDate = (value) => {
        if (!value) return "—";

        const date = new Date(`${value}T00:00:00`);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    // =====================================================
    // API REQUEST HELPER
    // =====================================================

    async function apiRequest(path, options = {}) {
        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            credentials: "include",
            headers: {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...options.headers
            }
        });

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error("The server returned an invalid response.");
        }

        if (response.status === 401 || response.status === 403) {
            window.location.href = "login.html";
            throw new Error("Administrator authentication required.");
        }

        if (!response.ok) {
            throw new Error(
                result.message || `Request failed (${response.status}).`
            );
        }

        return result;
    }

    // =====================================================
    // AUTHENTICATION CHECK
    // =====================================================

    try {
        await apiRequest("/api/auth/me");
    } catch (error) {
        console.error("Administrator authentication failed:", error);
        return;
    }

    // =====================================================
    // PAGE ELEMENTS
    // =====================================================

    const form = $("form");
    const mainWrapper = document.querySelector(".main-wrapper");

    if (!form || !mainWrapper) {
        console.error("Bread Management HTML elements are missing.");
        return;
    }

    // =====================================================
    // STATE
    // =====================================================

    let products = [];
    let categories = [];
    let masterIngredients = [];
    let masterAllergens = [];

    let viewing = null;
    let fs = null;

    let toastTimer;

    const state = {
        q: "",
        cat: "all",
        status: "all",
        sort: "updated",
        page: 1
    };

    const PER_PAGE = 6;

    const NUM_IDS = {
        kcal: "nKcal",
        sugar: "nSugar",
        protein: "nProtein",
        fat: "nFat",
        fiber: "nFiber",
        sodium: "nSodium"
    };

    // =====================================================
    // TOAST
    // =====================================================

    function toast(message) {
        const element = $("toast");

        if (!element) {
            console.log(message);
            return;
        }

        element.textContent = message;
        element.hidden = false;

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            element.hidden = true;
        }, 3000);
    }

    // =====================================================
    // LOGOUT
    // =====================================================

    const logoutButton =
        $("logoutBtn") ||
        [...document.querySelectorAll("a, button")].find((element) =>
            element.textContent.trim().toLowerCase() === "logout"
        );

    if (logoutButton) {
        logoutButton.addEventListener("click", async (event) => {
            event.preventDefault();

            try {
                await apiRequest("/api/auth/logout", {
                    method: "POST"
                });

                window.location.href = "login.html";
            } catch (error) {
                toast(error.message);
            }
        });
    }

    // =====================================================
    // LOAD DATABASE DATA
    // =====================================================

    async function loadCatalog() {
        const result = await apiRequest("/api/admin/product-catalog");

        categories = result.categories || [];
        masterIngredients = result.ingredients || [];
        masterAllergens = result.allergens || [];

        populateCatalogOptions();
    }

    async function loadProducts() {
        const result = await apiRequest("/api/admin/products");

        products = (result.products || []).map((product) => ({
            ...product,
            ingredients: product.ingredients || [],
            allergens: product.allergens || [],
            status: product.status || "Active"
        }));

        render();
    }

    function populateCatalogOptions() {
        $("fCategory").innerHTML =
            `<option value="all">All Categories (${categories.length})</option>` +
            categories.map((category) =>
                `<option value="${esc(category.name)}">${esc(category.name)}</option>`
            ).join("");

        $("fCat").innerHTML =
            '<option value="">Select bread category</option>' +
            categories.map((category) =>
                `<option value="${esc(category.name)}">${esc(category.name)}</option>`
            ).join("");

        $("fAllSel").innerHTML =
            '<option value="">Applicable Allergens</option>' +
            masterAllergens.map((allergen) =>
                `<option value="${esc(allergen.name)}">${esc(allergen.name)}</option>`
            ).join("");

        $("ingList").innerHTML =
            masterIngredients.map((ingredient) =>
                `<option value="${esc(ingredient.name)}"></option>`
            ).join("");
    }

    // =====================================================
    // PRODUCT HELPERS
    // =====================================================

    function isComplete(product) {
        return (
            product.ingredients.length > 0 &&
            product.verify === "Verified" &&
            has(product.kcal) &&
            has(product.sugar)
        );
    }

    function baseName(product) {
        if (product.imageName) return product.imageName;

        if (product.image) {
            try {
                return new URL(product.image, window.location.href)
                    .pathname.split("/").pop() || "—";
            } catch {
                return product.image.split("/").pop() || "—";
            }
        }

        return "—";
    }

    function imageStyle(product) {
        if (!product.image) {
            return "background-image:linear-gradient(135deg,#d8c3c6,#b99ea2)";
        }

        return `
            background-image:
                url("${esc(product.image)}"),
                linear-gradient(135deg,#c79a63,#7a4e2a)
        `;
    }

    function shortAllergen(allergen) {
        return allergen.split(/ [\/(]/)[0];
    }

    // =====================================================
    // CATALOG RENDERING
    // =====================================================

    const sorters = {
        updated: (a, b) =>
            (b.updated || "").localeCompare(a.updated || ""),

        name: (a, b) =>
            a.name.localeCompare(b.name),

        kcal: (a, b) =>
            (a.kcal ?? Infinity) - (b.kcal ?? Infinity),

        sugar: (a, b) =>
            (a.sugar ?? Infinity) - (b.sugar ?? Infinity)
    };

    function allergenCell(product) {
        const chips = product.allergens.slice(0, 2).map((allergen) =>
            `<span class="tag tag--red">Contains ${esc(shortAllergen(allergen))}</span>`
        );

        if (product.allergens.length > 2) {
            chips.push(
                `<span class="tag tag--grey">+${product.allergens.length - 2} more</span>`
            );
        }

        if (!product.allergens.length) {
            chips.push(
                `<span class="tag tag--grey">No allergens recorded</span>`
            );
        }

        return chips.join("");
    }

    function rowHTML(product) {
        const complete = isComplete(product);

        const subtitle = product.flag
            ? "Recipe Update Flagged"
            : product.sub;

        return `
            <tr class="${complete ? "" : "is-incomplete"}">
                <td>
                    <div class="thumb thumb--sm"
                        style="${imageStyle(product)}"></div>
                </td>

                <td class="name">
                    <b>${esc(product.name)}</b>
                    <small class="${product.flag ? "is-flag" : ""}">
                        #${esc(product.code)}
                        ${subtitle ? ` · ${esc(subtitle)}` : ""}
                    </small>
                </td>

                <td>
                    <span class="cat">${esc(product.cat || "Uncategorized")}</span>
                </td>

                <td class="num-cell">
                    ${has(product.kcal) ? `${product.kcal} kcal` : "—"}
                </td>

                <td class="num-cell">
                    ${has(product.sugar) ? `${product.sugar}g` : "—"}
                </td>

                <td>${allergenCell(product)}</td>

                <td>
                    <span class="pill ${complete ? "pill--ok" : "pill--bad"}">
                        ${complete ? "Complete" : "Incomplete"}
                    </span>
                </td>

                <td>
                    <span class="pill ${product.status === "Active"
                        ? "pill--active"
                        : "pill--inactive"}">
                        ${esc(product.status)}
                    </span>
                </td>

                <td>
                    <div class="actions">
                        <button class="icon-btn" type="button"
                            data-view="${product.id}"
                            aria-label="View ${esc(product.name)}">
                            ${ICON_EYE}
                        </button>

                        <button class="icon-btn" type="button"
                            data-edit="${product.id}"
                            aria-label="Edit ${esc(product.name)}">
                            ${ICON_EDIT}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function pageList(total, current) {
        if (total <= 5) {
            return Array.from({ length: total }, (_, index) => index + 1);
        }

        const set = new Set([
            1,
            total,
            current - 1,
            current,
            current + 1
        ].filter((number) => number >= 1 && number <= total));

        const output = [];
        let previous = 0;

        [...set].sort((a, b) => a - b).forEach((number) => {
            if (number - previous > 1) {
                output.push("...");
            }

            output.push(number);
            previous = number;
        });

        return output;
    }

    function render() {
        $("sTotal").textContent = products.length;

        const completeCount = products.filter(isComplete).length;

        $("sComplete").textContent = completeCount;
        $("sIncomplete").textContent =
            products.length - completeCount;

        const query = state.q.trim().toLowerCase().replace(/^#/, "");

        const filtered = products
            .filter((product) =>
                (state.cat === "all" || product.cat === state.cat) &&
                (state.status === "all" || product.status === state.status) &&
                (
                    !query ||
                    product.name.toLowerCase().includes(query) ||
                    product.code.toLowerCase().includes(query)
                )
            )
            .sort(sorters[state.sort] || sorters.updated);

        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / PER_PAGE)
        );

        state.page = Math.min(state.page, totalPages);

        const pageProducts = filtered.slice(
            (state.page - 1) * PER_PAGE,
            state.page * PER_PAGE
        );

        $("rows").innerHTML = pageProducts.map(rowHTML).join("");

        $("empty").hidden = filtered.length > 0;

        $("showing").innerHTML =
            `Showing <b>${pageProducts.length}</b> of <b>${filtered.length}</b> Products`;

        $("pages").innerHTML = `
            <button type="button"
                data-page="${state.page - 1}"
                aria-label="Previous page"
                ${state.page === 1 ? "disabled" : ""}>
                &lsaquo;
            </button>

            ${pageList(totalPages, state.page).map((number) =>
                number === "..."
                    ? "<span>...</span>"
                    : `
                        <button type="button"
                            data-page="${number}"
                            class="${number === state.page ? "is-on" : ""}"
                            ${number === state.page ? 'aria-current="page"' : ""}>
                            ${number}
                        </button>
                    `
            ).join("")}

            <button type="button"
                data-page="${state.page + 1}"
                aria-label="Next page"
                ${state.page === totalPages ? "disabled" : ""}>
                &rsaquo;
            </button>
        `;
    }

    // =====================================================
    // FILTERS AND SEARCH
    // =====================================================

    $("search").addEventListener("input", (event) => {
        state.q = event.target.value;
        state.page = 1;
        render();
    });

    $("fCategory").addEventListener("change", (event) => {
        state.cat = event.target.value;
        state.page = 1;
        render();
    });

    $("fStatus").addEventListener("change", (event) => {
        state.status = event.target.value;
        state.page = 1;
        render();
    });

    $("fSort").addEventListener("change", (event) => {
        state.sort = event.target.value;
        render();
    });

    $("pages").addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");

        if (!button || button.disabled) return;

        state.page = Number(button.dataset.page);
        render();
    });

    $("rows").addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    const editButton = event.target.closest("[data-edit]");

    console.log("Table click detected:", event.target);
    console.log("View button:", viewButton);
    console.log("Edit button:", editButton);

    if (viewButton) {
        console.log("Opening View modal");
        openView(Number(viewButton.dataset.view), viewButton);
    } else if (editButton) {
        console.log("Opening Edit modal");
        console.log("Product ID:", editButton.dataset.edit);

        openForm("edit", Number(editButton.dataset.edit), editButton);
    }
});

    $("addBtn").addEventListener("click", (event) => {
        openForm("add", null, event.currentTarget);
    });

    // =====================================================
    // MODAL MANAGEMENT
    // =====================================================

    const openModals = [];

    function openModal(element, trigger) {
        element._opener = trigger;

        openModals.push(element);

        mainWrapper.classList.add("modal-open");

        element.classList.add("is-visible");
        element.setAttribute("aria-hidden", "false");
    }

    function closeModal(element) {
        if (!element) return;

        element.classList.remove("is-visible");
        element.setAttribute("aria-hidden", "true");

        const index = openModals.indexOf(element);

        if (index > -1) {
            openModals.splice(index, 1);
        }

        if (!openModals.length) {
            mainWrapper.classList.remove("modal-open");
        }

        element._opener?.focus?.();
    }

    document.querySelectorAll(".modal-backdrop").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (
                event.target === modal ||
                event.target.closest("[data-close]")
            ) {
                closeModal(modal);
            }
        });
    });

    document.addEventListener("keydown", (event) => {
        const top = openModals[openModals.length - 1];

        if (!top) return;

        if (event.key === "Escape") {
            closeModal(top);
            return;
        }

        if (event.key === "Tab") {
            const focusable = [
                ...top.querySelectorAll(
                    "button,input,select,textarea,a[href]"
                )
            ].filter((element) =>
                !element.disabled &&
                !element.hidden &&
                element.type !== "file" &&
                element.offsetParent !== null
            );

            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    // =====================================================
    // VIEW PRODUCT
    // =====================================================

    function openView(id, trigger) {
        const product = products.find((item) => item.id === id);

        if (!product) return;

        viewing = product;

        $("vStatus").textContent = product.status;

        $("vStatus").className =
            "status-pill-soft" +
            (product.status === "Active"
                ? ""
                : " status-pill-soft--inactive");

        $("vName").textContent = product.name;
        $("vCat").textContent = product.cat || "Uncategorized";

        $("vDesc").textContent =
            product.desc || "No description provided.";

        $("vImg").style.cssText = imageStyle(product);

        $("vImgName").textContent = baseName(product);
        $("vImgMeta").textContent = product.imageMeta || "";

        $("vImgStatus").textContent =
            product.status === "Active"
                ? "● Active — Visible on catalog"
                : "● Inactive — Hidden from catalog";

        $("vCode").textContent = product.code;

        $("vAdded").textContent = fmtDate(product.added);
        $("vUpdated").textContent = fmtDate(product.updated);

        $("vIngCount").textContent =
            `${product.ingredients.length} Item${product.ingredients.length === 1 ? "" : "s"}`;

        $("vIngs").innerHTML = product.ingredients.length
            ? product.ingredients.map((ingredient) =>
                `<span class="ing">${esc(ingredient)}</span>`
            ).join("")
            : '<span class="fine">No ingredients recorded.</span>';

        $("vVerify").className =
            "status-pill-soft status-pill-soft--grey";

        $("vVerify").textContent = `Status: ${product.verify}`;

        $("vVerify").classList.toggle(
            "is-ok",
            product.verify === "Verified"
        );

        $("vAlls").innerHTML = product.allergens.length
            ? product.allergens.map((allergen) =>
                `<span class="tagx tagx--red">&#10033; ${esc(allergen)}</span>`
            ).join("")
            : '<span class="tagx tagx--none">No allergens recorded</span>';

        $("vCross").textContent =
            product.cross || "No cross-contact information recorded.";

        const servingMatch =
            /^(.*?)\s*\((.*)\)$/.exec(product.serving || "");

        $("vServ").textContent = servingMatch
            ? servingMatch[1]
            : product.serving || "—";

        $("vServSub").textContent = servingMatch
            ? servingMatch[2]
            : "per portion";

        $("vKcal").textContent =
            has(product.kcal) ? product.kcal : "—";

        $("vSugar").textContent =
            has(product.sugar) ? `${product.sugar} g` : "—";
            $("vProtein").textContent =
    has(product.protein) ? product.protein : "—";

$("vFat").textContent =
    has(product.fat) ? product.fat : "—";

$("vFiber").textContent =
    has(product.fiber) ? product.fiber : "—";

$("vSodium").textContent =
    has(product.sodium) ? product.sodium : "—";

        openModal($("viewModal"), trigger);

        $("viewModal").querySelector(".modal-close-btn")?.focus();
    }

    $("vEdit").addEventListener("click", () => {
        if (!viewing) return;

        const id = viewing.id;
        const opener = $("viewModal")._opener;

        closeModal($("viewModal"));

        openForm("edit", id, opener);
    });

    // =====================================================
    // ADD / EDIT FORM
    // =====================================================

    function clearErrors() {
        form.querySelectorAll(".field-error").forEach((element) => {
            element.textContent = "";
        });

        form.querySelectorAll(".is-invalid").forEach((element) => {
            element.classList.remove("is-invalid");
        });
    }

    function setErr(key, message, inputId) {
        const errorElement =
            form.querySelector(`[data-err="${key}"]`);

        if (errorElement) {
            errorElement.textContent = message;
        }

        if (inputId) {
            $(inputId)?.classList.add("is-invalid");
        }
    }

    function renderChips() {
        $("fIngs").innerHTML = fs.ingredients.length
            ? fs.ingredients.map((ingredient, index) => `
                <span class="chip">
                    ${esc(ingredient)}
                    <button type="button"
                        data-rm-ing="${index}"
                        aria-label="Remove ${esc(ingredient)}">
                        &times;
                    </button>
                </span>
            `).join("")
            : `
                <span class="empty-note">
                    No ingredients added yet. Select from the master list above.
                </span>
            `;

        $("fAlls").innerHTML = fs.allergens.length
            ? fs.allergens.map((allergen, index) => `
                <span class="chip chip--red">
                    &#9888; ${esc(allergen)}
                    <button type="button"
                        data-rm-all="${index}"
                        aria-label="Remove ${esc(allergen)}">
                        &times;
                    </button>
                </span>
            `).join("")
            : '<span class="empty-note">No allergens selected.</span>';
    }

    function renderImage() {
        const thumbnail = $("fThumb");

        if (fs.previewUrl) {
            thumbnail.style.backgroundImage =
                `url("${fs.previewUrl}")`;

            thumbnail.innerHTML = "";
        } else if (fs.image) {
            thumbnail.style.backgroundImage =
                `url("${fs.image}")`;

            thumbnail.innerHTML = "";
        } else {
            thumbnail.style.backgroundImage = "";
            thumbnail.innerHTML = "<span>No photo</span>";
        }

        $("fChoose").innerHTML =
            fs.image || fs.previewUrl
                ? "&#8635; Replace"
                : "&#8682; Choose Image";

        $("fRemoveImg").hidden =
            !fs.image && !fs.previewUrl;

        $("fImgInfo").textContent =
            fs.selectedFile
                ? `${fs.selectedFile.name} · Preview only — image hosting not connected yet`
                : fs.image
                    ? [fs.imageName, fs.imageMeta].filter(Boolean).join(" · ")
                    : "Supported formats: JPG, PNG, WebP · Max 5MB";
    }

    function openForm(mode, id, trigger) {
        const product = mode === "edit"
            ? products.find((item) => item.id === id)
            : null;

        if (mode === "edit" && !product) {
            toast("Product not found.");
            return;
        }

        form.reset();
        clearErrors();

        if (fs?.previewUrl) {
            URL.revokeObjectURL(fs.previewUrl);
        }

        fs = {
    mode,
    id,
    ingredients: [...(product?.ingredients || [])],
    allergens: [...(product?.allergens || [])],
    image: product?.image || "",
    imageName: product?.imageName || "",
    imageMeta: product?.imageMeta || "",
    imageRemoved: false,
    previewUrl: null,
    selectedFile: null
};

        $("fTitle").firstChild.textContent =
            mode === "edit"
                ? "Edit Bread Details "
                : "Add New Bread Product ";

        $("fSku").hidden = mode !== "edit";

        $("fSku").textContent =
            mode === "edit"
                ? `SKU #${product.code}`
                : "";

        $("fSub").textContent =
            mode === "edit"
                ? "Update the product information in the bread catalog."
                : "Add a new product to the bread catalog.";

        $("fSave").innerHTML =
            SAVE_ICON +
            `<span>${mode === "edit" ? "Save Changes" : "Save Product"}</span>`;

        if (product) {
            $("fName").value = product.name;
            $("fCat").value = product.cat || "";
            $("fDesc").value = product.desc || "";
            $("fCross").value = product.cross || "";
            $("fVerify").value = product.verify || "Unknown";

            $("nServ").value = product.serving || "";

            Object.entries(NUM_IDS).forEach(([key, id]) => {
                $(id).value = has(product[key])
                    ? product[key]
                    : "";
            });

            const statusRadio = form.querySelector(
                `[name="status"][value="${product.status}"]`
            );

            if (statusRadio) {
                statusRadio.checked = true;
            }
        } else {
            const activeRadio = form.querySelector(
                '[name="status"][value="Active"]'
            );

            if (activeRadio) {
                activeRadio.checked = true;
            }
        }

        $("fIngInput").value = "";
        $("fAllSel").value = "";
        $("fFile").value = "";

        renderChips();
        renderImage();

        openModal($("formModal"), trigger);

        $("fName").focus();
    }

    // =====================================================
    // INGREDIENT CHIPS
    // =====================================================

    function addIngredient() {
        const raw = $("fIngInput").value.trim();

        if (!raw) return;

        const match = masterIngredients.find(
            (ingredient) =>
                ingredient.name.toLowerCase() === raw.toLowerCase()
        );

        if (!match) {
            toast("Choose an ingredient from the database list.");
            return;
        }

        if (!fs.ingredients.includes(match.name)) {
            fs.ingredients.push(match.name);
        }

        $("fIngInput").value = "";

        renderChips();

        $("fIngInput").focus();
    }

    $("fIngAdd").addEventListener("click", addIngredient);

    $("fIngInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addIngredient();
        }
    });

    // =====================================================
    // ALLERGEN CHIPS
    // =====================================================

    $("fAllAdd").addEventListener("click", () => {
        const value = $("fAllSel").value;

        if (!value) {
            toast("Select an allergen first.");
            return;
        }

        if (!fs.allergens.includes(value)) {
            fs.allergens.push(value);
        }

        $("fAllSel").value = "";

        renderChips();
    });

    $("fIngs").addEventListener("click", (event) => {
        const button = event.target.closest("[data-rm-ing]");

        if (!button) return;

        fs.ingredients.splice(Number(button.dataset.rmIng), 1);

        renderChips();
    });

    $("fAlls").addEventListener("click", (event) => {
        const button = event.target.closest("[data-rm-all]");

        if (!button) return;

        fs.allergens.splice(Number(button.dataset.rmAll), 1);

        renderChips();
    });

    // =====================================================
    // IMAGE PREVIEW
    // Image hosting will be added later.
    // =====================================================

    $("fChoose").addEventListener("click", () => {
        $("fFile").click();
    });

    $("fRemoveImg").addEventListener("click", () => {
    if (fs.previewUrl) {
        URL.revokeObjectURL(fs.previewUrl);
        }
            fs.image = "";
            fs.imageName = "";
            fs.imageMeta = "";
            fs.imageRemoved = true;
            fs.previewUrl = null;
            fs.selectedFile = null;

            $("fFile").value = "";

        renderImage();
        });

    $("fFile").addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (!file) return;

        const errorElement =
            form.querySelector('[data-err="image"]');

        if (errorElement) {
            errorElement.textContent = "";
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setErr("image", "Use a JPG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErr("image", "Image must be 5MB or smaller.");
            event.target.value = "";
            return;
        }

        if (fs.previewUrl) {
            URL.revokeObjectURL(fs.previewUrl);
        }

        fs.selectedFile = file;
        fs.previewUrl = URL.createObjectURL(file);

        renderImage();

        toast("Image preview loaded. Upload storage will be connected later.");
    });

    // =====================================================
    // SAVE PRODUCT
    // =====================================================

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!fs) return;

        clearErrors();

        const name = $("fName").value.trim();
        const category = $("fCat").value;

        let valid = true;

        if (!name) {
            setErr("name", "Enter the bread name.", "fName");
            valid = false;
        } else {
            const duplicate = products.some((product) =>
                product.name.toLowerCase() === name.toLowerCase() &&
                product.id !== fs.id
            );

            if (duplicate) {
                setErr(
                    "name",
                    "A product with this name already exists.",
                    "fName"
                );

                valid = false;
            }
        }

        if (!category) {
            setErr("cat", "Select a category.", "fCat");
            valid = false;
        }

        const nutrition = {};

        for (const [key, id] of Object.entries(NUM_IDS)) {
            const raw = $(id).value.trim();

            if (raw === "") {
                nutrition[key] = null;
                continue;
            }

            const number = Number(raw);

            if (!Number.isFinite(number) || number < 0) {
                setErr(
                    "nutri",
                    "Nutrition values must be zero or greater.",
                    id
                );

                valid = false;
            } else {
                nutrition[key] = number;
            }
        }

        if (!valid) {
            form.querySelector(".is-invalid")?.focus();
            return;
        }

        const status = form.querySelector(
            '[name="status"]:checked'
        )?.value || "Active";

        const categoryRecord = categories.find(
            (item) => item.name === category
        );

        if (!categoryRecord) {
            setErr("cat", "The selected category is unavailable.", "fCat");
            return;
        }

        const payload = {
            name,
            categoryId: categoryRecord.id,
            sub: fs.mode === "edit"
                ? products.find((item) => item.id === fs.id)?.sub || ""
                : "",
            desc: $("fDesc").value.trim(),
            ingredients: [...fs.ingredients],
            allergens: [...fs.allergens],
            image: fs.imageRemoved ? null : undefined,
            imageName: fs.imageRemoved ? null : undefined,
            imageMeta: fs.imageRemoved ? null : undefined,
            cross: $("fCross").value.trim(),
            verify: $("fVerify").value,
            serving: $("nServ").value.trim(),
            status,
            ...nutrition
        };

        const saveButton = $("fSave");

        saveButton.disabled = true;

        const originalButtonHTML = saveButton.innerHTML;

        saveButton.innerHTML = "Saving...";

        try {
            const isEditing = fs.mode === "edit";

            const result = await apiRequest(
                isEditing
                    ? `/api/admin/products/${fs.id}`
                    : "/api/admin/products",
                {
                    method: isEditing ? "PUT" : "POST",
                    body: JSON.stringify(payload)
                }
            );

            if (fs.previewUrl) {
                URL.revokeObjectURL(fs.previewUrl);
            }

            closeModal($("formModal"));

            state.sort = "updated";
            state.page = 1;

            $("fSort").value = "updated";

            await loadProducts();

            toast(
                isEditing
                    ? "Product changes saved to PostgreSQL."
                    : "New product added to PostgreSQL."
            );

            if (fs.selectedFile) {
                console.info(
                    "Image preview was not uploaded. Image hosting is a later step."
                );
            }

        } catch (error) {
            console.error("Product save failed:", error);

            toast(error.message || "Unable to save product.");

        } finally {
            saveButton.disabled = false;
            saveButton.innerHTML = originalButtonHTML;
        }
    });

    // =====================================================
    // INITIAL PAGE LOAD
    // =====================================================

    try {
        await loadCatalog();
        await loadProducts();

        console.log("Bread Management connected to PostgreSQL.");

    } catch (error) {
        console.error("Bread Management initialization failed:", error);

        toast(
            "Unable to load Bread Management. Check your Flask server and database connection."
        );
    }
});
