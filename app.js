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

  /* shortlist: pick up to 6 listings and send one WhatsApp enquiry */
  const bar = document.querySelector('#compareBar');
  const barCount = document.querySelector('#compareCount');
  const barList = document.querySelector('#compareList');
  const send = document.querySelector('#compareSend');
  const clearBtn = document.querySelector('#compareClear');
  const buttons = [...document.querySelectorAll('.compare-btn')];
  const STORE = 'queeniehub-shortlist-v1';
  const MAX = 6;

  if (bar && buttons.length) {
    let picked = [];
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || '[]');
      if (Array.isArray(raw)) picked = raw.filter(x => x && x.id && x.label).slice(0, MAX);
    } catch (error) {
      picked = [];
    }

    const persist = () => {
      try { localStorage.setItem(STORE, JSON.stringify(picked)); } catch (error) { /* storage blocked */ }
    };

    const render = () => {
      buttons.forEach(btn => {
        const on = picked.some(x => x.id === btn.dataset.id);
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (btn.classList.contains('secondary-button')) {
          btn.textContent = on ? '✓ 已加入比較' : '＋ 加入比較';
        } else {
          btn.textContent = on ? '✓ 已選' : '＋ 比較';
        }
      });

      bar.hidden = picked.length === 0;
      if (barCount) barCount.textContent = String(picked.length);
      if (barList) {
        barList.innerHTML = picked.map(x => `<span class="compare-chip">${x.label.replace(/[<>&]/g, '')}</span>`).join('');
      }
      if (send) {
        const lines = picked.map((x, i) => `${i + 1}. ${x.label}`).join('\n');
        const text = `你好，我想比較以下 ${picked.length} 個盤源：\n${lines}\n\n想了解最新售價／租金、實際面積、可用日期及睇樓安排。`;
        send.href = `https://wa.me/85266552539?text=${encodeURIComponent(text)}`;
      }
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', event => {
        event.preventDefault();
        const id = btn.dataset.id;
        const label = btn.dataset.label || '';
        if (picked.some(x => x.id === id)) {
          picked = picked.filter(x => x.id !== id);
        } else {
          if (picked.length >= MAX) {
            if (barList) barList.insertAdjacentHTML('afterbegin', '<span class="compare-note">最多同時比較 6 個盤源</span>');
            return;
          }
          picked.push({ id, label });
        }
        persist();
        render();
      });
    });

    clearBtn?.addEventListener('click', () => {
      picked = [];
      persist();
      render();
    });

    render();
  }
})();
