const productsData = [];

let selectedForCompare = [];
let favorites = [];
let isComparisonOpen = false;
let activeCategory = 'all';
let searchQuery = '';
let sortOrder = 'az';
let currentModalBreadId = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderCollection();
    updateSelectionUI();
});

function getFilteredAndSortedProducts() {
    let list = productsData.filter(item => {
        const matchesCat = activeCategory === 'all' || item.category === activeCategory;
        const matchesQuery =
            item.name.toLowerCase().includes(searchQuery) ||
            item.description.toLowerCase().includes(searchQuery);
        return matchesCat && matchesQuery;
    });

    if (sortOrder === 'az') {
        list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'za') {
        list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === 'cal-low') {
        list.sort((a, b) => a.caloriesNum - b.caloriesNum);
    } else if (sortOrder === 'sugar-low') {
        list.sort((a, b) => a.sugarNum - b.sugarNum);
    }

    return list;
}

function renderCollection() {
    const gridContainer = document.getElementById('productsGrid');
    if (!gridContainer) return;

    const showingCount = document.getElementById('showingCount');
    const filtered = getFilteredAndSortedProducts();

    if (showingCount) {
        showingCount.textContent = `Showing ${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
    }
    gridContainer.innerHTML = '';

    if (filtered.length === 0) {
        gridContainer.innerHTML = `<p style="color: var(--color-text-muted); grid-column: 1 / -1;">No matching breads found.</p>`;
        return;
    }

    filtered.forEach(item => {
        const isSelected = selectedForCompare.includes(item.id);
        const isFav = favorites.includes(item.id);

        const cardHtml = `
            <div class="product-card">
                <div class="card-image-wrap">
                    <img src="${item.image}" alt="${item.name}">
                    <span class="category-badge">${item.categoryTag}</span>
                    <button class="fav-btn-icon ${isFav ? 'favorited' : ''}" onclick="toggleFavorite('${item.id}')" aria-label="Toggle favorite">
                        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-desc">${item.description}</p>
                    <div class="card-stats">
                        <span class="stat-chip"><i class="fa-solid fa-fire"></i> ${item.calories}</span>
                        <span class="stat-chip"><i class="fa-solid fa-cube"></i> ${item.sugar} sugar</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-view-details" onclick="openProductModal('${item.id}')">
                            <i class="fa-regular fa-eye"></i> VIEW DETAILS
                        </button>
                        <button class="btn-compare-check ${isSelected ? 'active' : ''}" onclick="toggleCompare('${item.id}')">
                            <i class="fa-solid ${isSelected ? 'fa-square-check' : 'fa-square'}"></i> Compare
                        </button>
                    </div>
                </div>
            </div>
        `;
        gridContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function toggleCompare(id) {
    const index = selectedForCompare.indexOf(id);
    if (index > -1) {
        selectedForCompare.splice(index, 1);
    } else {
        if (selectedForCompare.length >= 4) {
            alert('Maximum 4 products allowed for comparison.');
            return;
        }
        selectedForCompare.push(id);
    }

    if (isComparisonOpen && selectedForCompare.length < 2) {
        closeComparisonView();
    } else if (isComparisonOpen) {
        renderComparisonTable();
    }

    updateSelectionUI();
    renderCollection();
}

function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(id);
    }
    renderCollection();
    if (isComparisonOpen) {
        renderComparisonTable();
    }
    syncModalFavButton(id);
}

function openComparisonView() {
    if (selectedForCompare.length < 2) {
        alert('Please select at least 2 breads to compare.');
        return;
    }
    isComparisonOpen = true;

    const collectionView = document.getElementById('collectionView');
    const comparisonSection = document.getElementById('comparisonSection');

    if (collectionView) collectionView.style.display = 'none';
    if (comparisonSection) comparisonSection.style.display = 'block';

    renderComparisonTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeComparisonView() {
    isComparisonOpen = false;

    const collectionView = document.getElementById('collectionView');
    const comparisonSection = document.getElementById('comparisonSection');

    if (comparisonSection) comparisonSection.style.display = 'none';
    if (collectionView) collectionView.style.display = 'block';

    updateSelectionUI();
}

function renderComparisonTable() {
    const table = document.getElementById('comparisonTable');
    if (!table) return;

    const comparedItems = selectedForCompare
        .map(id => productsData.find(p => p.id === id))
        .filter(Boolean);

    const hasEmptySlot = comparedItems.length < 4;

    const headerCols = comparedItems.map(item => `
        <th class="col-product">
            <div class="prod-header-card">
                <span class="tag">${item.categoryLabel}</span>
                <div class="thumb-container">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <h4>${item.name}</h4>
                <div class="price">${item.price} <span class="unit">${item.shortUnit}</span></div>
                <button class="btn-remove" onclick="toggleCompare('${item.id}')">✕ REMOVE</button>
            </div>
        </th>
    `).join('') + (hasEmptySlot ? `
        <th class="col-product empty-slot">
            <div class="add-slot-card">
                <div class="plus-icon">+</div>
                <h4>Add Another Bread</h4>
                <p>Select up to 4 products to compare.</p>
                <button class="btn-add-product" onclick="closeComparisonView()">ADD PRODUCT</button>
            </div>
        </th>
    ` : '');

    const totalCols = 1 + comparedItems.length + (hasEmptySlot ? 1 : 0);

    const descCells = comparedItems.map(item => `<td>${item.description}</td>`).join('') +
        (hasEmptySlot ? `<td class="empty-cell">—</td>` : '');

    const ingCells = comparedItems.map(item => `<td class="ingredients-text">${item.ingredients}</td>`).join('') +
        (hasEmptySlot ? `<td class="empty-cell">—</td>` : '');

    const allergenCells = comparedItems.map(item => {
        const badgesHtml = item.allergenBadges.map(b => `
            <span class="allergen-tag ${b.type}">
                ${b.icon ? `<i class="fa-solid ${b.icon}"></i> ` : ''}${b.text}
            </span>
        `).join('');
        return `
            <td>
                <div class="tags-group">${badgesHtml}</div>
                <div class="allergen-subtext">${item.allergenSummary}</div>
            </td>
        `;
    }).join('') + (hasEmptySlot ? `<td class="empty-cell">—</td>` : '');

    const calCells = comparedItems.map(item => `
        <td>
            <div class="stat-value">${item.caloriesNum} kcal <span class="unit">${item.caloriesSub.toLowerCase().includes('roll') ? 'per roll' : 'per piece'}</span></div>
            <div class="stat-sub">${item.caloriesSub}</div>
        </td>
    `).join('') + (hasEmptySlot ? `<td class="empty-cell">—</td>` : '');

    const sugarCells = comparedItems.map(item => `
        <td>
            <div class="stat-value">
                ${item.sugar}
                ${item.lowSugar ? `<span class="highlight-badge green">LOW SUGAR</span>` : ''}
            </div>
            <div class="stat-sub">${item.sugarSub}</div>
        </td>
    `).join('') + (hasEmptySlot ? `<td class="empty-cell">—</td>` : '');

    const actionCells = comparedItems.map(item => {
        const isFav = favorites.includes(item.id);
        return `
            <td>
                <button class="btn-fav" onclick="toggleFavorite('${item.id}')">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i> ${isFav ? 'SAVED IN FAVORITES' : 'ADD TO FAVORITES'}
                </button>
            </td>
        `;
    }).join('') + (hasEmptySlot ? `<td class="empty-cell">—</td>` : '');

    table.innerHTML = `
        <thead>
            <tr>
                <th class="col-label">
                    <span class="group-tag">BREAD PROFILES</span>
                    <span class="group-sub">SHOWING ${comparedItems.length} OF 4 FORMULATIONS</span>
                </th>
                ${headerCols}
            </tr>
        </thead>
        <tbody>
            <tr class="section-row">
                <td colspan="${totalCols}">
                     <i class="fa-regular fa-folder-open"></i> PRODUCT INFORMATION</td>
            </tr>
            <tr>
                <td class="row-label">PRODUCT DESCRIPTION</td>
                ${descCells}
            </tr>
            <tr>
                <td class="row-label">INGREDIENTS</td>
                ${ingCells}
            </tr>
            <tr>
                <td class="row-label">ALLERGENS</td>
                ${allergenCells}
            </tr>
            <tr class="section-row">
                <td colspan="${totalCols}"><i class="fa-solid fa-droplet"></i> NUTRITION INFORMATION</td>
            </tr>
            <tr>
                <td class="row-label">CALORIES</td>
                ${calCells}
            </tr>
            <tr>
                <td class="row-label">SUGAR</td>
                ${sugarCells}
            </tr>
            <tr>
                <td class="row-label">ACTIONS</td>
                ${actionCells}
            </tr>
        </tbody>
    `;
}

function updateSelectionUI() {
    const count = selectedForCompare.length;

    const selectionBadgeText = document.getElementById('selectionBadgeText');
    if (selectionBadgeText) selectionBadgeText.textContent = `${count} selected for comparison`;

    const compStatusText = document.getElementById('compStatusText');
    if (compStatusText) compStatusText.textContent = `${count} OF 4 BREADS SELECTED`;

    const addAnotherBreadBtn = document.getElementById('addAnotherBreadBtn');
    if (addAnotherBreadBtn) {
        addAnotherBreadBtn.innerHTML = `<i class="fa-solid fa-circle-plus"></i> ADD ANOTHER BREAD (${count}/4 SELECTED)`;
    }

    const bottomBarTitle = document.getElementById('bottomBarTitle');
    if (bottomBarTitle) {
        bottomBarTitle.innerHTML = `${count} ${count === 1 ? 'ITEM' : 'ITEMS'} SELECTED FOR COMPARISON <span class="bar-max">(Max 4)</span>`;
    }

    const chipsContainer = document.getElementById('selectedChips');
    if (chipsContainer) {
        chipsContainer.innerHTML = '';
        selectedForCompare.forEach(id => {
            const item = productsData.find(p => p.id === id);
            if (item) {
                const chip = document.createElement('div');
                chip.className = 'chip';
                chip.innerHTML = `
                    ${item.name}
                    <i class="fa-solid fa-xmark close-chip" onclick="toggleCompare('${id}')"></i>
                `;
                chipsContainer.appendChild(chip);
            }
        });
    }

    const bottomBar = document.getElementById('bottomBar');
    if (bottomBar) {
        bottomBar.style.display = (count > 0 && !isComparisonOpen) ? 'flex' : 'none';
    }
}

function openProductModal(id) {
    const item = productsData.find(b => b.id === id);
    if (!item) return;

    currentModalBreadId = id;

    const mImg = document.getElementById('mImg');
    if (mImg) mImg.style.backgroundImage = `url('${item.image}')`;

    document.getElementById('mZh').textContent = item.chineseTag;
    document.getElementById('mCat').textContent = item.categoryTag;
    document.getElementById('mName').textContent = item.name;
    document.getElementById('mPrice').textContent = item.price;
    document.getElementById('mYield').textContent = item.shortUnit;
    document.getElementById('mDesc').textContent = item.description;

    document.getElementById('mKcal').textContent = item.calories;
    document.getElementById('mKcalNote').textContent = item.caloriesSub;
    document.getElementById('mSugar').textContent = item.sugar;
    document.getElementById('mSugarNote').textContent = item.sugarSub;
    document.getElementById('mServing').textContent = item.serving;
    document.getElementById('mServingNote').textContent = item.servingSub;

    const mWhy = document.getElementById('mWhy');
    if (mWhy) {
        mWhy.innerHTML = (item.matchReasons || []).map(reason => `<li>${reason}</li>`).join('');
    }

    document.getElementById('mIng').textContent = item.ingredients;
    document.getElementById('mAll').textContent = item.allergens;

    const favBtn = document.getElementById('favBtn');
    if (favBtn) {
        favBtn.setAttribute('data-product-id', item.id);
        syncModalFavButton(item.id);
    }

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

function syncModalFavButton(id) {
    const modalFavBtn = document.getElementById('favBtn');
    if (!modalFavBtn || modalFavBtn.getAttribute('data-product-id') !== id) return;
    const isFav = favorites.includes(id);
    modalFavBtn.innerHTML = `<i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i> <span id="favText">${isFav ? 'SAVED IN FAVORITES' : 'ADD TO FAVORITES'}</span>`;
}

function clearAllSelections() {
    selectedForCompare = [];
    if (isComparisonOpen) {
        closeComparisonView();
    }
    updateSelectionUI();
    renderCollection();
}

function setupEventListeners() {
    const modal = document.getElementById('modal');
    
    // Listen for clicks on any element with data-close attribute
    document.querySelectorAll('[data-close]').forEach(element => {
        element.addEventListener('click', closeBreadModal);
    });

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeBreadModal();
        });
    }

    const modalFavBtn = document.getElementById('favBtn');
    if (modalFavBtn) {
        modalFavBtn.addEventListener('click', () => {
            const id = modalFavBtn.getAttribute('data-product-id');
            if (id) toggleFavorite(id);
        });
    }

    const compareSelectedBtn = document.getElementById('compareSelectedBtn');
    if (compareSelectedBtn) compareSelectedBtn.addEventListener('click', openComparisonView);

    const backToCollectionBtn = document.getElementById('backToCollectionBtn');
    if (backToCollectionBtn) backToCollectionBtn.addEventListener('click', closeComparisonView);

    const addAnotherBreadBtn = document.getElementById('addAnotherBreadBtn');
    if (addAnotherBreadBtn) addAnotherBreadBtn.addEventListener('click', closeComparisonView);

    const resetAllBtn = document.getElementById('resetAllBtn');
    if (resetAllBtn) resetAllBtn.addEventListener('click', clearAllSelections);

    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllSelections);

    document.querySelectorAll('.pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.getAttribute('data-cat');
            renderCollection();
        });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderCollection();
        });
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            renderCollection();
        });
    }
}