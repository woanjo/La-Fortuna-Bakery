/* ==========================================================================
   LA FORTUNA BAKESHOP - COLLECTION, MODAL & ON-DEMAND COMPARISON
   ========================================================================== */

const productsData = [
    {
        id: 'pandesal',
        name: 'Traditional Pan de Sal',
        categoryLabel: 'Breads',
        categoryTag: 'HEARTH ROLLS & BREAKFAST',
        category: 'breads',
        chineseTag: '傳統麵包',
        price: '₱85.00',
        unit: '/ dozen (12 rolls)',
        shortUnit: '/ dozen',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
        description: 'Artisan wood-fired rolls baked with traditional slow-fermentation methods for a soft, pillowy crumb and golden crust.',
        calories: '140 kcal',
        caloriesNum: 140,
        caloriesSub: 'Lowest energy density',
        sugar: '3g',
        sugarNum: 3,
        sugarSub: 'Ideal for daily glycemic management.',
        lowSugar: true,
        serving: '1 Roll',
        servingSub: '(approx. 35g)',
        matchReasons: [
            'Matches low-sugar preference',
            'Nut-free safeguard'
        ],
        ingredients: 'Enriched wheat flour, spring water, cane sugar, sea salt, sourdough starter, vegetable shortening, breadcrumbs.',
        allergenBadges: [
            { text: 'Contains Wheat (Gluten)', type: 'danger', icon: 'fa-triangle-exclamation' },
            { text: 'Nut-Free', type: 'safe', icon: '' },
            { text: 'Dairy-Free', type: 'safe', icon: '' }
        ],
        allergenSummary: 'Free from Tree Nuts, Peanuts, and Dairy.',
        allergens: 'Contains Wheat (Gluten). Free from Tree Nuts, Peanuts, and Dairy.'
    },
    {
        id: 'hopia',
        name: 'Special Munggo Hopia',
        categoryLabel: 'Hopia',
        categoryTag: 'CEBUANO-CHINESE HEARTH',
        category: 'hopia',
        chineseTag: '綠豆餅',
        price: '₱120.00',
        unit: '/ box of 10',
        shortUnit: '/ box of 10',
        image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&q=80&w=600',
        description: 'Flaky layered pastry crust with sweet yellow mung bean filling, baked following Cebuano-Chinese hearth traditions.',
        calories: '185 kcal',
        caloriesNum: 185,
        caloriesSub: 'Slow-cooked bean core',
        sugar: '11g',
        sugarNum: 11,
        sugarSub: 'Natural yellow mung bean sweetness with cane syrup.',
        lowSugar: false,
        serving: '1 Piece',
        servingSub: '(approx. 45g)',
        matchReasons: [
            'Authentic heritage Cebuano recipe',
            'Peanut-free safeguard'
        ],
        ingredients: 'Wheat flour, sweet yellow mung bean paste, sugar, vegetable shortening, water, sesame seeds.',
        allergenBadges: [
            { text: 'Wheat (Gluten)', type: 'danger', icon: 'fa-triangle-exclamation' },
            { text: 'Sesame Seeds', type: 'warn', icon: '' },
            { text: 'Tree Nut-Free', type: 'safe', icon: '' }
        ],
        allergenSummary: 'Free from Tree Nuts and Peanuts.',
        allergens: 'Contains Wheat (Gluten), Sesame Seeds. Free from Tree Nuts and Peanuts.'
    }
];

// Starts empty so nothing is compared until selected & COMPARE SELECTED is clicked
let selectedForCompare = [];
let favorites = [];
let isComparisonOpen = false;
let activeCategory = 'all';
let searchQuery = '';
let sortOrder = 'az';

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
    const showingCount = document.getElementById('showingCount');
    const filtered = getFilteredAndSortedProducts();

    showingCount.textContent = `Showing ${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
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

    // If comparison view is open and fewer than 2 items remain, return to collection
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
    document.getElementById('collectionView').style.display = 'none';
    document.getElementById('comparisonSection').style.display = 'block';
    renderComparisonTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeComparisonView() {
    isComparisonOpen = false;
    document.getElementById('comparisonSection').style.display = 'none';
    document.getElementById('collectionView').style.display = 'block';
    updateSelectionUI();
}

function renderComparisonTable() {
    const table = document.getElementById('comparisonTable');
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
                <button class="btn-remove" onclick="toggleCompare('${item.id}')">&#10005; REMOVE</button>
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
        (hasEmptySlot ? `<td class="empty-cell">&mdash;</td>` : '');

    const ingCells = comparedItems.map(item => `<td class="ingredients-text">${item.ingredients}</td>`).join('') +
        (hasEmptySlot ? `<td class="empty-cell">&mdash;</td>` : '');

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
    }).join('') + (hasEmptySlot ? `<td class="empty-cell">&mdash;</td>` : '');

    const calCells = comparedItems.map(item => `
        <td>
            <div class="stat-value">${item.caloriesNum} kcal <span class="unit">${item.caloriesSub.toLowerCase().includes('roll') ? 'per roll' : 'per piece'}</span></div>
            <div class="stat-sub">${item.caloriesSub}</div>
        </td>
    `).join('') + (hasEmptySlot ? `<td class="empty-cell">&mdash;</td>` : '');

    const sugarCells = comparedItems.map(item => `
        <td>
            <div class="stat-value">
                ${item.sugar}
                ${item.lowSugar ? `<span class="highlight-badge green">LOW SUGAR</span>` : ''}
            </div>
            <div class="stat-sub">${item.sugarSub}</div>
        </td>
    `).join('') + (hasEmptySlot ? `<td class="empty-cell">&mdash;</td>` : '');

    const actionCells = comparedItems.map(item => {
        const isFav = favorites.includes(item.id);
        return `
            <td>
                <button class="btn-fav" onclick="toggleFavorite('${item.id}')">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i> ${isFav ? 'SAVED IN FAVORITES' : 'ADD TO FAVORITES'}
                </button>
            </td>
        `;
    }).join('') + (hasEmptySlot ? `<td class="empty-cell">&mdash;</td>` : '');

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
                <td colspan="${totalCols}"><i class="fa-regular fa-circle-info"></i> PRODUCT INFORMATION</td>
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

    document.getElementById('selectionBadgeText').textContent = `${count} selected for comparison`;
    document.getElementById('compStatusText').textContent = `${count} OF 4 BREADS SELECTED`;
    document.getElementById('addAnotherBreadBtn').innerHTML =
        `<i class="fa-solid fa-circle-plus"></i> ADD ANOTHER BREAD (${count}/4 SELECTED)`;
    document.getElementById('bottomBarTitle').innerHTML =
        `${count} ${count === 1 ? 'ITEM' : 'ITEMS'} SELECTED FOR COMPARISON <span class="bar-max">(Max 4)</span>`;

    const chipsContainer = document.getElementById('selectedChips');
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

    // Show bottom bar only when items are selected and comparison view isn't already open
    const bottomBar = document.getElementById('bottomBar');
    bottomBar.style.display = (count > 0 && !isComparisonOpen) ? 'flex' : 'none';
}

function openProductModal(id) {
    const item = productsData.find(p => p.id === id);
    if (!item) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-grid">
            <div class="modal-product-summary">
                <div class="modal-img-container">
                    <img src="${item.image}" alt="${item.name}">
                    <span class="cn-overlay-tag">${item.chineseTag}</span>
                </div>
                <div class="modal-prod-info">
                    <span class="modal-cat-tag">${item.categoryTag}</span>
                    <h4>${item.name}</h4>
                    <div class="modal-price">${item.price} <span class="unit">${item.unit}</span></div>
                    <p class="modal-desc">${item.description}</p>
                </div>
            </div>

            <div class="modal-match-card">
                <div class="modal-match-title">
                    <i class="fa-solid fa-shield-halved"></i> WHY THIS MATCHES
                </div>
                <ul class="match-list">
                    ${item.matchReasons.map(r => `<li><i class="fa-solid fa-circle-check"></i> ${r}</li>`).join('')}
                </ul>
                <div class="modal-disclaimer">
                    <i class="fa-solid fa-circle-info"></i> Allergen information is verified by bakery records. If allergen information is incomplete, please verify with the bakery before consuming.
                </div>
            </div>
        </div>

        <div class="modal-metrics-row">
            <div class="metric-card">
                <span class="metric-label">CALORIES</span>
                <div class="metric-val">${item.caloriesNum} <span class="unit">kcal</span></div>
                <span class="metric-sub">${item.calories.includes('roll') ? 'per roll' : 'per piece'}</span>
            </div>
            <div class="metric-card">
                <span class="metric-label">SUGAR</span>
                <div class="metric-val">${item.sugar}</div>
                <span class="metric-sub">${item.lowSugar ? 'low sugar' : item.sugarSub}</span>
            </div>
            <div class="metric-card">
                <span class="metric-label">SERVING</span>
                <div class="metric-val">${item.serving}</div>
                <span class="metric-sub">${item.servingSub}</span>
            </div>
        </div>

        <div class="modal-info-card">
            <div class="modal-sec-title">
                <i class="fa-regular fa-folder-open"></i> PRODUCT INFORMATION
            </div>
            <div class="info-block">
                <label>INGREDIENTS</label>
                <div class="info-box-text">${item.ingredients}</div>
            </div>
            <div class="info-block">
                <label>ALLERGENS</label>
                <div class="info-box-text">${item.allergens}</div>
            </div>
        </div>
    `;

    const modalFavBtn = document.getElementById('modalFavBtn');
    modalFavBtn.setAttribute('data-product-id', item.id);
    syncModalFavButton(item.id);

    document.getElementById('productModal').classList.add('active');
}

function syncModalFavButton(id) {
    const modalFavBtn = document.getElementById('modalFavBtn');
    if (modalFavBtn.getAttribute('data-product-id') !== id) return;
    const isFav = favorites.includes(id);
    modalFavBtn.innerHTML = `<i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i> ${isFav ? 'SAVED IN FAVORITES' : 'ADD TO FAVORITES'}`;
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
    const modal = document.getElementById('productModal');
    const closeBtn = document.getElementById('closeModalBtn');
    const closeFooterBtn = document.getElementById('modalCloseFooterBtn');
    const modalFavBtn = document.getElementById('modalFavBtn');

    const closeModal = () => modal.classList.remove('active');

    closeBtn.addEventListener('click', closeModal);
    closeFooterBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    modalFavBtn.addEventListener('click', () => {
        const id = modalFavBtn.getAttribute('data-product-id');
        if (id) toggleFavorite(id);
    });

    document.getElementById('compareSelectedBtn').addEventListener('click', openComparisonView);
    document.getElementById('backToCollectionBtn').addEventListener('click', closeComparisonView);
    document.getElementById('navCollectionTab').addEventListener('click', (e) => {
        e.preventDefault();
        closeComparisonView();
    });

    document.getElementById('addAnotherBreadBtn').addEventListener('click', closeComparisonView);
    document.getElementById('resetAllBtn').addEventListener('click', clearAllSelections);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllSelections);

    document.querySelectorAll('.pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.getAttribute('data-cat');
            renderCollection();
        });
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderCollection();
    });

    document.getElementById('sortSelect').addEventListener('change', (e) => {
        sortOrder = e.target.value;
        renderCollection();
    });
}