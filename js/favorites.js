let favoriteBreads = [];

let activeCategory = 'all';
let searchQuery = '';
let sortOrder = 'recent';
let currentModalBreadId = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderFavorites();
});

function getCategoryIcon(category) {
    if (category === 'bread') {
        return `<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    }
    if (category === 'hopia') {
        return `<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`;
    }
    return `<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
}

function getFilteredFavorites() {
    let list = favoriteBreads.filter(item => {
        const matchesCat = activeCategory === 'all' || item.category === activeCategory;
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery) ||
            item.description.toLowerCase().includes(searchQuery) ||
            item.ingredients.toLowerCase().includes(searchQuery);
        return matchesCat && matchesSearch;
    });

    if (sortOrder === 'recent') {
        list.sort((a, b) => b.savedTimestamp - a.savedTimestamp);
    } else if (sortOrder === 'az') {
        list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'cal-low') {
        list.sort((a, b) => a.caloriesNum - b.caloriesNum);
    } else if (sortOrder === 'sugar-low') {
        list.sort((a, b) => a.sugarNum - b.sugarNum);
    }

    return list;
}

function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    if (!grid) return;

    const filtered = getFilteredFavorites();
    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:#6f5a5d; grid-column: 1 / -1;">No saved breads match your search or category filter.</p>`;
        return;
    }

    filtered.forEach(item => {
        const allergenChips = item.allergensList
            .map(a => `<span class="allergen_chip">${a}</span>`)
            .join('');

        const cardHtml = `
            <article class="fav_card">
                <div>
                    <div class="fav_card_top">
                        <button type="button" class="fav_heart_btn" onclick="removeFavorite('${item.id}')" aria-label="Remove ${item.name} from favorites" title="Remove from favorites">
                            ♥
                        </button>
                        <span class="saved_date">Saved on ${item.savedDate}</span>
                    </div>

                    <div class="fav_cat_pill">
                        ${getCategoryIcon(item.category)}
                        <span>${item.categoryLabel}</span>
                    </div>

                    <h3>${item.name}</h3>
                    <p class="fav_desc">${item.description}</p>

                    <div class="nutri_box">
                        <div class="nutri_col">
                            <span class="nutri_label">ENERGY</span>
                            <span class="nutri_val">${item.energy}</span>
                            <span class="nutri_unit">${item.energyUnit}</span>
                        </div>
                        <div class="nutri_col ${item.sugarHighlight ? 'is-highlight' : ''}">
                            <span class="nutri_label">SUGAR</span>
                            <span class="nutri_val">${item.sugar}</span>
                            <span class="nutri_unit">${item.sugarUnit}</span>
                        </div>
                        <div class="nutri_col">
                            <span class="nutri_label">FIBER</span>
                            <span class="nutri_val">${item.fiber}</span>
                            <span class="nutri_unit"></span>
                        </div>
                        <div class="nutri_col">
                            <span class="nutri_label">PROTEIN</span>
                            <span class="nutri_val">${item.protein}</span>
                            <span class="nutri_unit"></span>
                        </div>
                    </div>

                    <p class="allergen_label">ALLERGEN INFORMATION:</p>
                    <div class="allergen_tags">${allergenChips}</div>

                    <div class="match_note">
                        <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="14" height="14" viewBox="0 0 13 15" fill="none">
                            <path d="M5.06667 14L3.8 11.8667L1.4 11.3333L1.63333 8.86667L0 7L1.63333 5.13333L1.4 2.66667L3.8 2.13333L5.06667 0L7.33333 0.966667L9.6 0L10.8667 2.13333L13.2667 2.66667L13.0333 5.13333L14.6667 7L13.0333 8.86667L13.2667 11.3333L10.8667 11.8667L9.6 14L7.33333 13.0333L5.06667 14V14M6.63333 9.36667L10.4 5.6L9.46667 4.63333L6.63333 7.46667L5.2 6.06667L4.26667 7L6.63333 9.36667V9.36667" fill="#7B5900"/>
                        </svg>
                        <span>${item.matchNote}</span>
                    </div>
                </div>

                <div class="fav_card_footer">
                    <button type="button" class="btn_view_details" onclick="openBreadModal('${item.id}')">
                        VIEW DETAILS →
                    </button>
                </div>
            </article>
        `;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function removeFavorite(id) {
    favoriteBreads = favoriteBreads.filter(item => item.id !== id);
    renderFavorites();
}

function openBreadModal(id) {
    const item = favoriteBreads.find(b => b.id === id);
    if (!item) return;

    currentModalBreadId = id;

    const mImg = document.getElementById('mImg');
    if (mImg) mImg.style.backgroundImage = `url('${item.image}')`;

    document.getElementById('mZh').textContent = item.chineseTag;
    document.getElementById('mCat').textContent = item.modalCategory;
    document.getElementById('mName').textContent = item.name;
    document.getElementById('mPrice').textContent = item.price;
    document.getElementById('mYield').textContent = item.yieldText;
    document.getElementById('mDesc').textContent = item.modalDescription;

    document.getElementById('mKcal').textContent = `${item.energy} ${item.energyUnit}`;
    document.getElementById('mKcalNote').textContent = item.kcalNote;
    document.getElementById('mSugar').textContent = item.sugar;
    document.getElementById('mSugarNote').textContent = item.sugarNote;
    document.getElementById('mServing').textContent = item.serving;
    document.getElementById('mServingNote').textContent = item.servingNote;

    const mWhy = document.getElementById('mWhy');
    mWhy.innerHTML = item.whyMatches.map(reason => `<li>${reason}</li>`).join('');

    document.getElementById('mIng').textContent = item.ingredients;
    document.getElementById('mAll').textContent = item.allergenDetails;

    const favBtn = document.getElementById('favBtn');
    favBtn.setAttribute('aria-pressed', 'true');
    document.getElementById('favIcon').innerHTML = '♥';
    document.getElementById('favText').textContent = 'SAVED IN FAVORITES';

    const modal = document.getElementById('modal');
    if (modal) {
        modal.hidden = false;
        modal.classList.add('active');
    }
    document.body.classList.add('is-locked');
}

function closeBreadModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
        modal.hidden = true;
    }
    document.body.classList.remove('is-locked');
    currentModalBreadId = null;
}

function setupEventListeners() {
    // Category Filter Pills
    document.querySelectorAll('.cat_pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.cat_pill').forEach(p => p.classList.remove('is-active'));
            pill.classList.add('is-active');
            activeCategory = pill.getAttribute('data-cat');
            renderFavorites();
        });
    });

    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderFavorites();
        });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            renderFavorites();
        });
    }

    // Modal Close Controls
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', closeBreadModal);
    });

    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeBreadModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.hidden) {
            closeBreadModal();
        }
    });

    // Modal Favorite Toggle Button
    const favBtn = document.getElementById('favBtn');
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            if (!currentModalBreadId) return;
            removeFavorite(currentModalBreadId);
            closeBreadModal();
        });
    }
}