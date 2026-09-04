const api = {
  async listings() {
    const res = await fetch('/api/listings');
    if (!res.ok) throw new Error('Failed to load listings');
    return res.json();
  }
};

const state = {
  listings: [],
  filtered: [],
  categories: new Map()
};

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function buildCategories() {
  state.categories.clear();
  for (const l of state.listings) {
    state.categories.set(l.category, (state.categories.get(l.category) || 0) + 1);
  }
}

function renderCategories() {
  const ul = document.getElementById('categoryList');
  ul.innerHTML = '';
  for (const [cat, count] of state.categories.entries()) {
    const li = document.createElement('li');
    li.className = 'category-item';
    li.innerHTML = `
      <span>${cat}</span>
      <span class="category-count">${count}</span>
    `;
    li.onclick = () => {
      state.filtered = state.listings.filter(l => l.category === cat);
      renderListings();
    };
    ul.appendChild(li);
  }
}

function renderListings() {
  const grid = document.getElementById('productGrid');
  const list = state.filtered.length ? state.filtered : state.listings;

  document.getElementById('resultsCount').textContent =
    list.length ? `${list.length} listings` : 'No listings found';

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">No parts found. Try a different search.</div>`;
    return;
  }

  grid.innerHTML = '';
  for (const l of list) {
    const card = document.createElement('div');
    card.className = 'product-card' + (l.sold ? ' sold' : '');
    card.innerHTML = `
      <div class="product-image">
        <span>${l.category}</span>
        ${l.image ? `<img src="/uploads/${l.image}" alt="">` : ''}
        ${l.sold ? `<div class="sold-stamp">SOLD</div>` : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${l.title}</div>
        <div class="product-meta">${l.fitment || 'Universal fit'}</div>
        <div class="seller-row">${l.city || ''}, ${l.region || ''} · ${l.country}</div>
        <div class="product-footer">
          <div>
            <div class="product-price">${l.price} ${l.currency}</div>
          </div>
          <div class="list-date">Listed: ${new Date(l.created_at).toLocaleDateString()}</div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }
}

async function init() {
  try {
    const listings = await api.listings();
    state.listings = listings;
    state.filtered = [];
    buildCategories();
    renderCategories();
    renderListings();
    document.getElementById('statListings').textContent = listings.length;
    const sellers = new Set(listings.map(l => l.user_id));
    document.getElementById('statSellers').textContent = sellers.size;
  } catch (e) {
    console.error(e);
    toast('Failed to load listings');
  }
}

document.addEventListener('DOMContentLoaded', init);