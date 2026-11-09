(() => {
  /* listing filters (home, district, usage, listings pages) */
  const input = document.querySelector('#searchInput');
  const district = document.querySelector('#districtFilter');
  const usage = document.querySelector('#usageFilter');
  const category = document.querySelector('#categoryFilter');
  const clear = document.querySelector('#clearFilters');
  const grid = document.querySelector('#listingGrid');
  const count = document.querySelector('#resultCount');
  const empty = document.querySelector('#emptyState');

  if (grid && input) {
    const cards = [...grid.querySelectorAll('.listing-card')];
    const apply = () => {
      const q = input.value.trim().toLowerCase();
      const d = district ? district.value : '';
      const u = usage ? usage.value : '';
      const c = category ? category.value : '';
      let visible = 0;
      cards.forEach(card => {
        const haystack = (card.dataset.search || '').toLowerCase();
        const matches = (!q || haystack.includes(q))
          && (!d || card.dataset.district === d)
          && (!u || card.dataset.usage === u)
          && (!c || card.dataset.category === c);
        card.hidden = !matches;
        if (matches) visible++;
      });
      if (count) count.textContent = `${visible} 個公開項目`;
      if (empty) empty.hidden = visible !== 0;
    };
    [input, district, usage, category].forEach(el => el?.addEventListener('input', apply));
    clear?.addEventListener('click', () => {
      input.value = '';
      if (district) district.value = '';
      if (usage) usage.value = '';
      if (category) category.value = '';
      apply();
    });
  }

  /* building index search */
  const bInput = document.querySelector('#buildingSearch');
  const bCards = [...document.querySelectorAll('.building-card')];
  const bGroups = [...document.querySelectorAll('[data-building-group]')];
  const bCount = document.querySelector('#buildingCount');
  const bEmpty = document.querySelector('#buildingEmpty');

  if (bInput && bCards.length) {
    const apply = () => {
      const q = bInput.value.trim().toLowerCase();
      let visible = 0;
      bCards.forEach(card => {
        const hit = !q || (card.dataset.search || '').toLowerCase().includes(q);
        card.hidden = !hit;
        if (hit) visible++;
      });
      bGroups.forEach(group => {
        const any = [...group.querySelectorAll('.building-card')].some(c => !c.hidden);
        group.hidden = !any;
      });
      if (bCount) bCount.textContent = `${visible} 幢大廈`;
      if (bEmpty) bEmpty.hidden = visible !== 0;
    };
    bInput.addEventListener('input', apply);
  }

  /* building index district jump */
  document.querySelectorAll('[data-jump]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.getElementById(link.dataset.jump);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${link.dataset.jump}`);
    });
  });
})();
