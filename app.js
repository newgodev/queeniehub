(() => {
  if (window.location.pathname === '/' || window.location.pathname === '') {
    document.title = '香港商業地產樓盤搜尋｜觀塘工廈、寫字樓、商舖出售放租｜Queenie 商業地產';
  }
  const input = document.querySelector('#searchInput');
  const district = document.querySelector('#districtFilter');
  const usage = document.querySelector('#usageFilter');
  const category = document.querySelector('#categoryFilter');
  const clear = document.querySelector('#clearFilters');
  const grid = document.querySelector('#listingGrid');
  const count = document.querySelector('#resultCount');
  const empty = document.querySelector('#emptyState');
  if (!grid || !input) return;
  const cards = [...grid.querySelectorAll('.listing-card')];
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    const d = district.value;
    const u = usage.value;
    const c = category.value;
    let visible = 0;
    cards.forEach(card => {
      const matches = (!q || card.dataset.search.toLowerCase().includes(q)) && (!d || card.dataset.district === d) && (!u || card.dataset.usage === u) && (!c || card.dataset.category === c);
      card.hidden = !matches;
      if (matches) visible++;
    });
    count.textContent = `${visible} 個公開項目`;
    empty.hidden = visible !== 0;
  };
  [input, district, usage, category].forEach(el => el.addEventListener('input', apply));
  clear?.addEventListener('click', () => { input.value=''; district.value=''; usage.value=''; category.value=''; apply(); });
})();
