// ---- Sample data (replace with your API/database) ----
const user = { firstName: "Maria", lastName: "Santos", avatar: "" /* e.g. "images/avatar.jpg" */ };

const breads = [
    {
        id: "sprouted-pan-de-sal", badge: "Stoneground", category: "Bread", name: "Sprouted Whole Wheat Pan de Sal",
        short: "100% stoneground sprouted grains, exceptionally low natural sugars, zero nuts, complies with lower sugar goal.",
        image: "images/sprouted-pan-de-sal.jpg", kcal: 130, sugar: 1.8, price: 95, yield: "dozen (12 rolls)", serving: "approx. 35g",
        tag: "Hearth Rolls & Breakfast", why: ["Matches low-sugar preference", "Nut-free safeguard"],
        ingredients: "Sprouted whole wheat flour, spring water, sea salt, sourdough starter, vegetable shortening.",
        allergens: "Contains Wheat (Gluten). Free from Tree Nuts, Peanuts, and Dairy."
    },
    {
        id: "pan-de-suelo", badge: "Ancestral Oven", category: "Pastry", name: "Traditional Pan de Suelo",
        short: "Direct hearth-baked ancestral dough with no added cane sugar, strictly segregated nut-free bakery formulation.",
        image: "images/pan-de-suelo.jpg", kcal: 145, sugar: 2.1, price: 110, yield: "dozen (12 rolls)", serving: "approx. 40g",
        tag: "Hearth Rolls & Breakfast", why: ["Matches low-sugar preference", "Nut-free safeguard"],
        ingredients: "Wheat flour, spring water, sea salt, sourdough starter, vegetable shortening.",
        allergens: "Contains Wheat (Gluten). Free from Tree Nuts, Peanuts, and Dairy."
    },
    {
        id: "hopia-baboy", badge: "Laminated", category: "Hopia", name: "Savory Hopia Baboy (Kundol)",
        short: "Savory candied wintermelon and scallion filling without peanut/nut traces, fits moderate calorie budget.",
        image: "images/hopia-baboy.jpg", kcal: 175, sugar: 3.5, price: 20, yield: "piece", serving: "1 piece (approx. 55g)",
        tag: "Laminated Pastry", why: ["Within your sugar ceiling", "Nut-free safeguard"],
        ingredients: "Wheat flour, wintermelon, scallion, vegetable shortening, sea salt, sugar.",
        allergens: "Contains Wheat (Gluten). Free from Tree Nuts and Peanuts."
    },
    {
        id: "masi-de-cebu", badge: "Steamed Masi", category: "Rice cake", name: "Masi de Cebu (Rice Dumpling)",
        short: "Steamed glutinous rice pastry crafted in a nut-free dedicated steamer line with subdued natural sweetness.",
        image: "images/masi-de-cebu.jpg", kcal: 160, sugar: 4.2, price: 18, yield: "piece", serving: "1 piece (approx. 50g)",
        tag: "Steamed Delicacies", why: ["Within your sugar ceiling", "Nut-free safeguard"],
        ingredients: "Glutinous rice flour, cane sugar, water, coconut oil.",
        allergens: "Free from Wheat, Tree Nuts, Peanuts, and Dairy."
    },
];

// ---- Helpers ----
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const peso = (n) => `<span class="peso">₱</span>${Number(n).toFixed(2)}`;

// Favorites persist in localStorage (guarded for private mode)
const FAV_KEY = "lafortuna:favorites";
const loadFavs = () => { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) || []); } catch { return new Set(); } };
const saveFavs = (set) => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch { } };
const favorites = loadFavs();

// ---- Header / welcome ----
$("firstName").textContent = user.firstName;
$("userName").textContent = `${user.firstName} ${user.lastName}`;
if (user.avatar) { $("avatar").style.backgroundImage = `url("${user.avatar}")`; $("avatar").textContent = ""; }
else $("avatar").textContent = user.firstName[0] + user.lastName[0];
$("matchCount").textContent = breads.length;

// ---- Cards ----
$("breadGrid").innerHTML = breads.map((b) => `
  <article class="bcard">
    <div class="bcard_img" style="background-image:url('${esc(b.image)}'),linear-gradient(135deg,#c79a63,#7a4e2a)">
      <span class="badge">${esc(b.badge)}</span><span class="sugar">${b.sugar}g Sugar</span>
    </div>
    <div class="bcard_body">
      <div class="bcard_meta"><span>${esc(b.category)}</span><b>${b.kcal} kcal</b></div>
      <h3>${esc(b.name)}</h3>
      <p>${esc(b.short)}</p>
      <button class="bcard_btn" type="button" data-id="${b.id}">View Details &nbsp;
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="11" viewBox="0 0 15 10" fill="none">
          <path d="M7.33333 8C8.16667 8 8.875 7.70833 9.45833 7.125C10.0417 6.54167 10.3333 5.83333 10.3333 5C10.3333 4.16667 10.0417 3.45833 9.45833 2.875C8.875 2.29167 8.16667 2 7.33333 2C6.5 2 5.79167 2.29167 5.20833 2.875C4.625 3.45833 4.33333 4.16667 4.33333 5C4.33333 5.83333 4.625 6.54167 5.20833 7.125C5.79167 7.70833 6.5 8 7.33333 8V8M7.33333 6.8C6.83333 6.8 6.40833 6.625 6.05833 6.275C5.70833 5.925 5.53333 5.5 5.53333 5C5.53333 4.5 5.70833 4.075 6.05833 3.725C6.40833 3.375 6.83333 3.2 7.33333 3.2C7.83333 3.2 8.25833 3.375 8.60833 3.725C8.95833 4.075 9.13333 4.5 9.13333 5C9.13333 5.5 8.95833 5.925 8.60833 6.275C8.25833 6.625 7.83333 6.8 7.33333 6.8V6.8M7.33333 10C5.71111 10 4.23333 9.54722 2.9 8.64167C1.56667 7.73611 0.6 6.52222 0 5C0.6 3.47778 1.56667 2.26389 2.9 1.35833C4.23333 0.452778 5.71111 0 7.33333 0C8.95556 0 10.4333 0.452778 11.7667 1.35833C13.1 2.26389 14.0667 3.47778 14.6667 5C14.0667 6.52222 13.1 7.73611 11.7667 8.64167C10.4333 9.54722 8.95556 10 7.33333 10V10M7.33333 5V5V5V5V5V5V5V5V5V5M7.33333 8.66667C8.58889 8.66667 9.74167 8.33611 10.7917 7.675C11.8417 7.01389 12.6444 6.12222 13.2 5C12.6444 3.87778 11.8417 2.98611 10.7917 2.325C9.74167 1.66389 8.58889 1.33333 7.33333 1.33333C6.07778 1.33333 4.925 1.66389 3.875 2.325C2.825 2.98611 2.02222 3.87778 1.46667 5C2.02222 6.12222 2.825 7.01389 3.875 7.675C4.925 8.33611 6.07778 8.66667 7.33333 8.66667V8.66667" fill="#440010"/>
        </svg>
      </button>
    </div>
  </article>`).join("");

// ---- Modal ----
const modal = $("modal");
let current = null, opener = null;

function renderFavBtn() {
    const on = favorites.has(current.id);
    $("favBtn").setAttribute("aria-pressed", String(on));
    $("favIcon").textContent = on ? "♥" : "♡";
    $("favText").textContent = on ? "Saved to favorites" : "Add to favorites";
}

function openModal(id, trigger) {
    current = breads.find((b) => b.id === id);
    if (!current) return;
    opener = trigger;
    const b = current;
    $("mImg").style.backgroundImage = `url("${b.image}"), linear-gradient(135deg,#c79a63,#7a4e2a)`;
    $("mCat").textContent = b.tag;
    $("mName").textContent = b.name;
    $("mPrice").innerHTML = `${peso(b.price)} / ${b.yield.split(" ")[0]}`;
    $("mYield").textContent = b.yield.includes("(") ? b.yield.slice(b.yield.indexOf("(")) : "";
    $("mDesc").textContent = b.short;
    $("mKcal").textContent = `${b.kcal} kcal`;
    $("mSugar").textContent = `${b.sugar}g`;
    $("mSugarNote").textContent = b.sugar < 5 ? "low sugar" : "moderate sugar";
    $("mServing").textContent = b.yield.includes("rolls") ? "1 Roll" : "1 pc";
    $("mServingNote").textContent = `(${b.serving.replace(/^1 piece \(|\)$/g, "")})`;
    $("mWhy").innerHTML = b.why.map((w) => `<li>${esc(w)}</li>`).join("");
    $("mIng").textContent = b.ingredients;
    $("mAll").textContent = b.allergens;
    renderFavBtn();
    modal.hidden = false;
    document.body.classList.add("is-locked");
    modal.querySelector(".modal_x").focus();
}

function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("is-locked");
    opener?.focus();
}

$("breadGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-id]");
    if (btn) openModal(btn.dataset.id, btn);
});
modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) closeModal(); });
$("favBtn").addEventListener("click", () => {
    favorites.has(current.id) ? favorites.delete(current.id) : favorites.add(current.id);
    saveFavs(favorites);
    renderFavBtn();
});

document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") return closeModal();
    if (e.key === "Tab") { // keep focus inside the dialog
        const f = [...modal.querySelectorAll("button")].filter((el) => !el.disabled);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
});

// Placeholder links
$("navFavorites").addEventListener("click", (e) => {
    e.preventDefault();
    alert(favorites.size ? `You have ${favorites.size} saved favorite(s).` : "You haven't saved any favorites yet.");
});