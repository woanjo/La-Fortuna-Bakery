document.addEventListener("DOMContentLoaded", () => {
  // Bread Catalog State (populate from your backend API / database)
  const KEY = "lafortuna:admin-breads:v1";
  const CATEGORIES = ["Bread (Hearth & Pan)", "Flaky Pastries", "Steamed & Glutinous", "Sweet Merienda"];
  const ALLERGENS = ["Wheat / Gluten", "Coconut", "Sesame", "Peanuts", "Tree Nuts", "Milk (Dairy)", "Egg", "Soy", "Pork Lard"];
  const MASTER_INGREDIENTS = ["Unbleached Bread Flour", "Enriched Wheat Flour", "Sprouted Whole Wheat Flour", "Glutinous Rice Flour", "Fresh Grated Coconut",
    "Raw Muscovado Sugar", "Dark Brown Sugar", "Cane Sugar", "Purified Water", "Active Dry Yeast", "Sourdough Starter", "Ilocos Sea Salt", "Sweet Yellow Mung Bean Paste",
    "Vegetable Shortening", "Pork Lard", "Butter", "Egg Yolks", "Fresh Milk", "Wintermelon", "Sesame Seeds", "Roasted Peanuts", "Aged Cheese"];
  const TODAY = "2026-11-23";

  const mk = (o) => ({ sub: "", flag: false, cross: "", verify: "Verified", serving: "1 piece", protein: null, fat: null, fiber: null, sodium: null, status: "Active", ...o });
  const SEED = [
    mk({
      code: "LFB-022",
      name: "Hopia Munggo",
      sub: "Classic Mung Filling",
      cat: "Flaky Pastries",
      desc: "Flaky layered pastry with sweet yellow mung bean filling.",
      image: "images/hopia-munggo.jpg",
      ingredients: ["Enriched Wheat Flour", "Sweet Yellow Mung Bean Paste", "Cane Sugar", "Vegetable Shortening", "Sesame Seeds"],
      allergens: ["Wheat / Gluten", "Sesame"],
      cross: "Shared equipment with tree nuts.",
      kcal: 175,
      sugar: 4.2,
      added: "2026-09-02",
      updated: "2026-11-20"
    }),
    mk({
      code: "LFB-031",
      name: "Steamed Sourdough Bun",
      sub: "Wintermelon Infusion",
      cat: "Steamed & Glutinous",
      desc: "Slow-fermented sourdough bun steamed with wintermelon.",
      image: "images/steamed-sourdough-bun.jpg",
      ingredients: ["Enriched Wheat Flour", "Sourdough Starter", "Wintermelon", "Purified Water"],
      allergens: ["Wheat / Gluten"],
      kcal: 140,
      sugar: 2.1,
      added: "2026-09-10",
      updated: "2026-11-19"
    }),
    mk({
      code: "LFB-002",
      name: "Traditional Hopia Baboy",
      sub: "",
      flag: true,
      cat: "Flaky Pastries",
      desc: "Savory candied wintermelon and scallion filling.",
      image: "images/hopia-baboy.jpg",
      ingredients: ["Enriched Wheat Flour", "Pork Lard", "Wintermelon", "Cane Sugar"],
      allergens: ["Pork Lard", "Wheat / Gluten"],
      verify: "Unverified",
      kcal: 210,
      sugar: 7.5,
      added: "2026-08-14",
      updated: "2026-11-18"
    }),
    mk({
      code: "LFB-009",
      name: "Masi de Cebu",
      sub: "Glutinous Peanut Confection",
      cat: "Steamed & Glutinous",
      desc: "Steamed glutinous rice dumpling with ground peanut filling.",
      image: "images/masi-de-cebu.jpg",
      ingredients: ["Glutinous Rice Flour", "Roasted Peanuts", "Cane Sugar", "Purified Water"],
      allergens: ["Peanuts"],
      kcal: 160,
      sugar: 6.1,
      added: "2026-08-20",
      updated: "2026-11-17"
    }),
    mk({
      code: "LFB-001",
      name: "Pan de Coco Tradisyonal",
      cat: "Bread (Hearth & Pan)",
      desc: "Traditional Filipino sweet bread filled with grated coconut and muscovado sugar, with a soft texture and lightly golden crust.",
      image: "images/pan-de-coco.jpg",
      imageName: "pan_de_coco_demo.webp",
      imageMeta: "WebP · 1200×900",
      ingredients: ["Unbleached Bread Flour", "Fresh Grated Coconut", "Raw Muscovado Sugar", "Purified Water", "Active Dry Yeast", "Ilocos Sea Salt"],
      allergens: ["Wheat / Gluten", "Coconut"],
      cross: "Prepared in a bakery handling dairy, eggs, and sesame. Shared equipment and tables may result in cross-contact.",
      verify: "Unverified",
      serving: "65 g (1 pc)",
      kcal: 185,
      sugar: 6.2,
      added: "2026-11-10",
      updated: "2026-11-12"
    }),
    mk({
      code: "LFB-003",
      name: "Traditional Pan de Sal",
      cat: "Bread (Hearth & Pan)",
      desc: "Artisan wood-fired rolls baked with slow fermentation.",
      image: "images/traditional-pan-de-sal.jpg",
      ingredients: ["Enriched Wheat Flour", "Purified Water", "Cane Sugar", "Ilocos Sea Salt", "Active Dry Yeast"],
      allergens: ["Wheat / Gluten"],
      serving: "35 g (1 roll)",
      kcal: 140,
      sugar: 3,
      added: "2026-06-01",
      updated: "2026-11-10"
    }),
    mk({
      code: "LFB-004",
      name: "Sprouted Whole Wheat Pan de Sal",
      cat: "Bread (Hearth & Pan)",
      desc: "Cold-milled sprouted grains with low glycemic load.",
      image: "images/sprouted-pan-de-sal.jpg",
      ingredients: ["Sprouted Whole Wheat Flour", "Purified Water", "Ilocos Sea Salt", "Sourdough Starter"],
      allergens: ["Wheat / Gluten"],
      kcal: 130,
      sugar: 1.8,
      added: "2026-06-12",
      updated: "2026-11-08"
    }),
    mk({
      code: "LFB-005",
      name: "Traditional Pan de Suelo",
      cat: "Bread (Hearth & Pan)",
      desc: "Hearth-floor baked using ancestral leavening techniques.",
      image: "images/pan-de-suelo.jpg",
      ingredients: ["Enriched Wheat Flour", "Purified Water", "Ilocos Sea Salt", "Sourdough Starter"],
      allergens: ["Wheat / Gluten"],
      kcal: 145,
      sugar: 2.1,
      added: "2026-06-20",
      updated: "2026-11-05"
    }),
    mk({
      code: "LFB-006",
      name: "Ensaymada Especial Cebuana",
      cat: "Sweet Merienda",
      desc: "Butter-rich sweet bread topped with aged cheese.",
      image: "images/ensaymada-especial.jpg",
      ingredients: ["Enriched Wheat Flour", "Butter", "Egg Yolks", "Cane Sugar", "Aged Cheese"],
      allergens: ["Wheat / Gluten", "Milk (Dairy)", "Egg"],
      kcal: 260,
      sugar: 12,
      added: "2026-07-02",
      updated: "2026-11-02"
    }),
    mk({
      code: "LFB-007",
      name: "Brown Sugar Tikoy Slices",
      cat: "Steamed & Glutinous",
      desc: "Slow-steamed sweet rice cake with dark caramel.",
      image: "images/brown-sugar-tikoy.jpg",
      ingredients: ["Glutinous Rice Flour", "Dark Brown Sugar", "Purified Water", "Sesame Seeds"],
      allergens: ["Sesame"],
      kcal: 175,
      sugar: 10.5,
      added: "2026-07-15",
      updated: "2026-10-28"
    }),
    mk({
      code: "LFB-008",
      name: "Mamon Tostado",
      cat: "Sweet Merienda",
      desc: "Twice-baked sponge slices.",
      image: "images/mamon-tostado.jpg",
      ingredients: ["Enriched Wheat Flour", "Egg Yolks", "Cane Sugar"],
      allergens: ["Wheat / Gluten", "Egg"],
      verify: "Unknown",
      kcal: null,
      sugar: null,
      status: "Inactive",
      added: "2026-05-30",
      updated: "2026-10-20"
    }),
    mk({
      code: "LFB-010",
      name: "Siopao Asado",
      cat: "Steamed & Glutinous",
      desc: "Steamed bun with sweet-savory pork filling.",
      image: "images/siopao-asado.jpg",
      ingredients: ["Enriched Wheat Flour", "Pork Lard", "Cane Sugar", "Active Dry Yeast"],
      allergens: ["Wheat / Gluten", "Soy", "Pork Lard"],
      kcal: 290,
      sugar: 5.5,
      added: "2026-05-12",
      updated: "2026-10-15"
    }),
  ];

  function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) && v.length ? v : null; } catch { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(products)); } catch { /* storage full/blocked: changes stay in memory */ } }
  let products = load() || SEED.map((p) => ({ ...p }));

  // ================= Helpers =================
  const SAVE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>';
  const ICON_EYE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const ICON_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const has = (v) => v !== null && v !== undefined && v !== "";
  const isComplete = (p) => p.ingredients.length > 0 && p.verify === "Verified" && has(p.kcal) && has(p.sugar);
  const bgStyle = (p) => (p.image ? `background-image:url("${esc(p.image)}"),linear-gradient(135deg,#c79a63,#7a4e2a)` : "background-image:linear-gradient(135deg,#d8c3c6,#b99ea2)");
  const baseName = (p) => p.imageName || (p.image && !p.image.startsWith("data:") ? p.image.split("/").pop() : "—");
  const shortAllergen = (a) => a.split(/ [\/(]/)[0];
  let toastTimer;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600); }

  // ================= List =================
  const state = { q: "", cat: "all", status: "all", sort: "updated", page: 1 };
  const PER_PAGE = 6;
  const sorters = {
    updated: (a, b) => b.updated.localeCompare(a.updated),
    name: (a, b) => a.name.localeCompare(b.name),
    kcal: (a, b) => (a.kcal ?? Infinity) - (b.kcal ?? Infinity),
    sugar: (a, b) => (a.sugar ?? Infinity) - (b.sugar ?? Infinity),
  };

  function allergenCell(p) {
    const chips = p.allergens.slice(0, 2).map((a) => `<span class="tag tag--red">Contains ${esc(shortAllergen(a))}</span>`);
    if (p.allergens.length > 2) chips.push(`<span class="tag tag--grey">+${p.allergens.length - 2} more</span>`);
    if (!p.allergens.length) chips.push(`<span class="tag tag--grey">${p.verify === "Verified" ? "No known allergens" : "Unverified"}</span>`);
    else if (p.verify === "Verified" && !p.allergens.includes("Wheat / Gluten")) chips.push('<span class="tag tag--grey">Gluten-Free</span>');
    return chips.join("");
  }

  function rowHTML(p) {
    const done = isComplete(p), sub = p.flag ? "Recipe Update Flagged" : p.sub;
    return `<tr class="${done ? "" : "is-incomplete"}">
    <td><div class="thumb thumb--sm" style="${bgStyle(p)}"></div></td>
    <td class="name"><b>${esc(p.name)}</b><small class="${p.flag ? "is-flag" : ""}">#${esc(p.code)}${sub ? ` • ${esc(sub)}` : ""}</small></td>
    <td><span class="cat">${esc(p.cat)}</span></td>
    <td class="num-cell">${has(p.kcal) ? `${p.kcal} kcal` : "—"}</td>
    <td class="num-cell">${has(p.sugar) ? `${p.sugar}g` : "—"}</td>
    <td>${allergenCell(p)}</td>
    <td><span class="pill ${done ? "pill--ok" : "pill--bad"}">${done ? "Complete" : "Incomplete"}</span></td>
    <td><span class="pill ${p.status === "Active" ? "pill--active" : "pill--inactive"}">${p.status}</span></td>
    <td><div class="actions">
      <button class="icon-btn" type="button" data-view="${p.code}" aria-label="View ${esc(p.name)}">${ICON_EYE}</button>
      <button class="icon-btn" type="button" data-edit="${p.code}" aria-label="Edit ${esc(p.name)}">${ICON_EDIT}</button></div></td>
  </tr>`;
  }

  function pageList(total, cur) {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= total));
    const out = []; let prev = 0;
    [...set].sort((a, b) => a - b).forEach((n) => { if (n - prev > 1) out.push("…"); out.push(n); prev = n; });
    return out;
  }

  function render() {
    const total = products.length, complete = products.filter(isComplete).length;
    $("sTotal").textContent = total; $("sComplete").textContent = complete; $("sIncomplete").textContent = total - complete;

    const q = state.q.trim().toLowerCase().replace(/^#/, "");
    const list = products
      .filter((p) => (state.cat === "all" || p.cat === state.cat) && (state.status === "all" || p.status === state.status) &&
        (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)))
      .sort(sorters[state.sort]);

    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

    $("rows").innerHTML = slice.map(rowHTML).join("");
    $("empty").hidden = list.length > 0;
    $("showing").innerHTML = `Showing <b>${slice.length}</b> of <b>${list.length}</b> Products`;
    $("pages").innerHTML = `<button type="button" data-page="${state.page - 1}" aria-label="Previous page" ${state.page === 1 ? "disabled" : ""}>&lsaquo;</button>` +
      pageList(pages, state.page).map((n) => n === "…" ? "<span>…</span>" : `<button type="button" data-page="${n}" class="${n === state.page ? "is-on" : ""}" ${n === state.page ? 'aria-current="page"' : ""}>${n}</button>`).join("") +
      `<button type="button" data-page="${state.page + 1}" aria-label="Next page" ${state.page === pages ? "disabled" : ""}>&rsaquo;</button>`;
  }

  // filters
  $("fCategory").innerHTML = `<option value="all">All Categories (${CATEGORIES.length})</option>` + CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join("");
  $("search").addEventListener("input", (e) => { state.q = e.target.value; state.page = 1; render(); });
  $("fCategory").addEventListener("change", (e) => { state.cat = e.target.value; state.page = 1; render(); });
  $("fStatus").addEventListener("change", (e) => { state.status = e.target.value; state.page = 1; render(); });
  $("fSort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("pages").addEventListener("click", (e) => { const b = e.target.closest("[data-page]"); if (b && !b.disabled) { state.page = +b.dataset.page; render(); } });
  $("rows").addEventListener("click", (e) => {
    const v = e.target.closest("[data-view]"), ed = e.target.closest("[data-edit]");
    if (v) openView(v.dataset.view, v); else if (ed) openForm("edit", ed.dataset.edit, ed);
  });
  $("addBtn").addEventListener("click", (e) => openForm("add", null, e.currentTarget));

  // ================= Modal plumbing (scoped to .main-wrapper, like the profile modal) =================
  const mainWrapper = document.querySelector(".main-wrapper");
  const openModals = []; // last item = top-most modal

  // Open Modal & Blur Main Content
  function openModal(el, trigger) {
    el._opener = trigger;
    openModals.push(el);
    mainWrapper.classList.add("modal-open");
    el.classList.add("is-visible");
    el.setAttribute("aria-hidden", "false");
  }

  // Close Modal & Remove Blur
  function closeModal(el) {
    el.classList.remove("is-visible");
    el.setAttribute("aria-hidden", "true");
    const i = openModals.indexOf(el);
    if (i > -1) openModals.splice(i, 1);
    if (!openModals.length) mainWrapper.classList.remove("modal-open");
    el._opener?.focus?.();
  }

  // Close via X / Cancel buttons or by clicking outside the dialog (within the blurred main area)
  document.querySelectorAll(".modal-backdrop").forEach((m) => m.addEventListener("click", (e) => {
    if (e.target === m || e.target.closest("[data-close]")) closeModal(m);
  }));

  // Close on Escape key press + keep Tab focus inside the open dialog
  document.addEventListener("keydown", (e) => {
    const top = openModals[openModals.length - 1]; if (!top) return;
    if (e.key === "Escape") return closeModal(top);
    if (e.key === "Tab") {
      const f = [...top.querySelectorAll("button,input,select,textarea,a[href]")].filter((x) => !x.disabled && !x.hidden && x.type !== "file" && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // ================= View modal =================
  let viewing = null;
  function openView(code, trigger) {
    const p = viewing = products.find((x) => x.code === code); if (!p) return;
    $("vStatus").textContent = p.status; $("vStatus").className = "status-pill-soft" + (p.status === "Active" ? "" : " status-pill-soft--inactive");
    $("vName").textContent = p.name; $("vCat").textContent = p.cat; $("vDesc").textContent = p.desc || "No description provided.";
    $("vImg").style.cssText = bgStyle(p);
    $("vImgName").textContent = baseName(p); $("vImgMeta").textContent = p.imageMeta || "";
    $("vImgStatus").textContent = p.status === "Active" ? "● Active — Visible on catalog" : "● Inactive — Hidden from catalog";
    $("vCode").textContent = p.code; $("vAdded").textContent = fmtDate(p.added); $("vUpdated").textContent = fmtDate(p.updated);
    $("vIngCount").textContent = `${p.ingredients.length} Item${p.ingredients.length === 1 ? "" : "s"}`;
    $("vIngs").innerHTML = p.ingredients.length ? p.ingredients.map((i) => `<span class="ing">${esc(i)}</span>`).join("") : '<span class="fine">No ingredients recorded.</span>';
    $("vVerify").className = "status-pill-soft status-pill-soft--grey"; $("vVerify").textContent = `Status: ${p.verify}`; $("vVerify").classList.toggle("is-ok", p.verify === "Verified");
    $("vAlls").innerHTML = p.allergens.length ? p.allergens.map((a) => `<span class="tagx tagx--red">&#10033; ${esc(a)}</span>`).join("") : '<span class="tagx tagx--none">No allergens recorded</span>';
    $("vCross").textContent = p.cross || "No cross-contact information recorded.";
    const m = /^(.*?)\s*\((.*)\)$/.exec(p.serving || "");
    $("vServ").textContent = m ? m[1] : p.serving || "—"; $("vServSub").textContent = m ? m[2] : "per portion";
    $("vKcal").textContent = has(p.kcal) ? p.kcal : "—"; $("vSugar").textContent = has(p.sugar) ? `${p.sugar} g` : "—";
    openModal($("viewModal"), trigger);
    $("viewModal").querySelector(".modal-close-btn").focus();
  }
  $("vEdit").addEventListener("click", () => { const code = viewing.code, opener = $("viewModal")._opener; closeModal($("viewModal")); openForm("edit", code, opener); });

  // ================= Add / Edit form =================
  const form = $("form");
  let fs = null; // form state
  $("fCat").innerHTML = '<option value="">Select bread category</option>' + CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join("");
  $("fAllSel").innerHTML = '<option value="">Applicable Allergens</option>' + ALLERGENS.map((a) => `<option>${esc(a)}</option>`).join("");
  $("ingList").innerHTML = MASTER_INGREDIENTS.map((i) => `<option value="${esc(i)}">`).join("");
  const NUM_IDS = { kcal: "nKcal", sugar: "nSugar", protein: "nProtein", fat: "nFat", fiber: "nFiber", sodium: "nSodium" };

  function renderChips() {
    $("fIngs").innerHTML = fs.ingredients.length
      ? fs.ingredients.map((i, k) => `<span class="chip">${esc(i)}<button type="button" data-rm-ing="${k}" aria-label="Remove ${esc(i)}">&times;</button></span>`).join("")
      : '<span class="empty-note">No ingredients added yet. Select from the master list above.</span>';
    $("fAlls").innerHTML = fs.allergens.length
      ? fs.allergens.map((a, k) => `<span class="chip chip--red">&#9888; ${esc(a)}<button type="button" data-rm-all="${k}" aria-label="Remove ${esc(a)}">&times;</button></span>`).join("")
      : '<span class="empty-note">No allergens selected.</span>';
  }
  function renderImage() {
    const t = $("fThumb");
    if (fs.image) { t.style.cssText = `background-image:url("${esc(fs.image)}")`; t.innerHTML = ""; }
    else { t.style.cssText = ""; t.innerHTML = "<span>No photo</span>"; }
    $("fChoose").innerHTML = fs.image ? "&#8635; Replace" : "&#8682; Choose Image";
    $("fRemoveImg").hidden = !fs.image;
    $("fImgInfo").textContent = fs.image ? [fs.imageName, fs.imageMeta].filter(Boolean).join(" · ") : "Supported formats: JPG, PNG, WebP · Max 5MB";
  }
  const clearErrors = () => { form.querySelectorAll(".field-error").forEach((e) => (e.textContent = "")); form.querySelectorAll(".is-invalid").forEach((e) => e.classList.remove("is-invalid")); };
  const setErr = (key, msg, inputId) => { form.querySelector(`[data-err="${key}"]`).textContent = msg; if (inputId) $(inputId).classList.add("is-invalid"); };

  function openForm(mode, code, trigger) {
    const p = mode === "edit" ? products.find((x) => x.code === code) : null;
    form.reset(); clearErrors();
    fs = { mode, code, ingredients: [...(p?.ingredients || [])], allergens: [...(p?.allergens || [])], image: p?.image || "", imageName: p ? baseName(p) !== "—" ? baseName(p) : "" : "", imageMeta: p?.imageMeta || "" };
    $("fTitle").firstChild.textContent = mode === "edit" ? "Edit Bread Details " : "Add New Bread Product ";
    $("fSku").hidden = mode !== "edit"; $("fSku").textContent = `SKU #${code}`;
    $("fSub").textContent = mode === "edit" ? "Update the product information in the bread catalog." : "Add a new product to the bread catalog.";
    $("fSave").innerHTML = SAVE_ICON + `<span>${mode === "edit" ? "Save Changes" : "Save Product"}</span>`;
    if (p) {
      $("fName").value = p.name; $("fCat").value = p.cat; $("fDesc").value = p.desc || ""; $("fCross").value = p.cross || ""; $("fVerify").value = p.verify;
      $("nServ").value = p.serving || "";
      Object.entries(NUM_IDS).forEach(([k, id]) => ($(id).value = has(p[k]) ? p[k] : ""));
      form.querySelector(`[name="status"][value="${p.status}"]`).checked = true;
    }
    renderChips(); renderImage();
    openModal($("formModal"), trigger);
    $("fName").focus();
  }

  // chips: ingredients + allergens
  function addIngredient() {
    const raw = $("fIngInput").value.trim(); if (!raw) return;
    const match = MASTER_INGREDIENTS.find((i) => i.toLowerCase() === raw.toLowerCase());
    if (!match) return toast("Choose an ingredient from the master list.");
    if (!fs.ingredients.includes(match)) fs.ingredients.push(match);
    $("fIngInput").value = ""; renderChips(); $("fIngInput").focus();
  }
  $("fIngAdd").addEventListener("click", addIngredient);
  $("fIngInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addIngredient(); } });
  $("fAllAdd").addEventListener("click", () => {
    const v = $("fAllSel").value; if (!v) return toast("Select an allergen first.");
    if (!fs.allergens.includes(v)) fs.allergens.push(v);
    $("fAllSel").value = ""; renderChips();
  });
  $("fIngs").addEventListener("click", (e) => { const b = e.target.closest("[data-rm-ing]"); if (b) { fs.ingredients.splice(+b.dataset.rmIng, 1); renderChips(); } });
  $("fAlls").addEventListener("click", (e) => { const b = e.target.closest("[data-rm-all]"); if (b) { fs.allergens.splice(+b.dataset.rmAll, 1); renderChips(); } });

  // image
  $("fChoose").addEventListener("click", () => $("fFile").click());
  $("fRemoveImg").addEventListener("click", () => { fs.image = ""; fs.imageName = ""; fs.imageMeta = ""; $("fFile").value = ""; renderImage(); });
  $("fFile").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    form.querySelector('[data-err="image"]').textContent = "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setErr("image", "Use a JPG, PNG, or WebP image.");
    if (f.size > 5 * 1024 * 1024) return setErr("image", "Image must be 5MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => {
      fs.image = reader.result; fs.imageName = f.name;
      fs.imageMeta = `${f.type.split("/")[1].toUpperCase()} · ${f.size > 1048576 ? (f.size / 1048576).toFixed(1) + " MB" : Math.round(f.size / 1024) + " KB"}`;
      renderImage();
    };
    reader.readAsDataURL(f);
  });

  // save
  form.addEventListener("submit", (e) => {
    e.preventDefault(); clearErrors();
    const name = $("fName").value.trim(), cat = $("fCat").value; let ok = true;
    if (!name) { setErr("name", "Enter the bread name.", "fName"); ok = false; }
    else if (products.some((p) => p.name.toLowerCase() === name.toLowerCase() && p.code !== fs.code)) { setErr("name", "A product with this name already exists.", "fName"); ok = false; }
    if (!cat) { setErr("cat", "Select a category.", "fCat"); ok = false; }
    const nums = {};
    for (const [k, id] of Object.entries(NUM_IDS)) {
      const v = $(id).value.trim();
      if (v === "") { nums[k] = null; continue; }
      if (Number.isNaN(Number(v)) || Number(v) < 0) { setErr("nutri", "Nutrition values must be zero or greater.", id); ok = false; } else nums[k] = Number(v);
    }
    if (!ok) return form.querySelector(".is-invalid")?.focus();

    const base = fs.mode === "edit" ? products.find((p) => p.code === fs.code) : null;
    const nextNum = Math.max(0, ...products.map((p) => parseInt(p.code.replace(/\D/g, ""), 10) || 0)) + 1;
    const rec = {
      ...(base || { sub: "", flag: false, added: TODAY }),
      code: base ? base.code : `LFB-${String(nextNum).padStart(3, "0")}`,
      name, cat, desc: $("fDesc").value.trim(), image: fs.image, imageName: fs.imageName, imageMeta: fs.imageMeta,
      ingredients: fs.ingredients, allergens: fs.allergens, cross: $("fCross").value.trim(), verify: $("fVerify").value,
      serving: $("nServ").value.trim(), ...nums, status: form.querySelector('[name="status"]:checked').value, updated: TODAY,
    };
    if (base) { if (rec.verify === "Verified") rec.flag = false; products[products.indexOf(base)] = rec; } else products.push(rec);
    save();
    closeModal($("formModal"));
    state.sort = "updated"; $("fSort").value = "updated"; state.page = 1;
    render();
    toast(base ? "Changes saved." : "Product added to the catalog.");
  });

  render();
});