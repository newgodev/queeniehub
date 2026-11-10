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
/* =========================================================
   QueenieHub tools: matcher, budget, compare, brief
   All calculations run locally in the browser. No network
   requests except loading the static JSON data files.
   ========================================================= */
(() => {
  const WA = 'https://wa.me/85266552539';
  const money = n => `$${Math.round(n).toLocaleString('en-HK')}`;
  const num = v => {
    const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const grab = async url => {
    try {
      const r = await fetch(url, { cache: 'force-cache' });
      return r.ok ? await r.json() : [];
    } catch (e) {
      return [];
    }
  };
  const waLink = text => `${WA}?text=${encodeURIComponent(text)}`;
  const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------------- matcher ---------------- */
  const matchForm = document.querySelector('#matchForm');
  if (matchForm) {
    const result = document.querySelector('#matchResult');
    const listEl = document.querySelector('#matchList');
    const distEl = document.querySelector('#matchDistricts');
    const headEl = document.querySelector('#matchHeadline');
    const sumEl = document.querySelector('#matchSummary');
    const waEl = document.querySelector('#matchWa');
    let props = [];

    const val = name => {
      const el = matchForm.querySelector(`[name="${name}"]:checked`);
      return el ? el.value : '';
    };
    const needs = () => [...matchForm.querySelectorAll('[name="needs"]:checked')].map(x => x.value);
    const sizeBand = sv => sv < 1000 ? 's' : sv <= 2000 ? 'm' : sv <= 5000 ? 'l' : 'xl';
    const usageGroup = u =>
      ['工商', '工業'].includes(u) ? 'industrial'
      : ['寫字樓', '寫字樓及商舖'].includes(u) ? 'office'
      : u === '商舖' ? 'shop' : 'other';

    const run = () => {
      const deal = val('deal');
      const district = matchForm.querySelector('[name="district"]').value;
      const usage = val('usage');
      const size = val('size');
      const budget = Number(matchForm.querySelector('[name="budget"]').value || 0);
      const buyBudget = Number(matchForm.querySelector('[name="buyBudget"]').value || 0);
      const wanted = needs();

      const scored = props
        .filter(p => deal === 'any' ? ['rent', 'sale'].includes(p.c) : p.c === deal)
        .filter(p => !district || p.d === district)
        .filter(p => usage === 'any' || usageGroup(p.u) === usage)
        .map(p => {
          let score = 0;
          let max = 0;
          if (district) { max += 30; if (p.d === district) score += 30; }
          if (usage !== 'any') { max += 20; if (usageGroup(p.u) === usage) score += 20; }
          if (size !== 'any') {
            max += 25;
            const mid = { s: 600, m: 1500, l: 3500, xl: 7000 }[size];
            const sv = p.sv || 0;
            if (sv) score += Math.max(0, 25 * (1 - Math.abs(sv - mid) / mid));
          }
          if (p.c === 'rent' && budget > 0) {
            max += 20;
            const monthly = num(p.r);
            score += monthly && monthly <= budget ? 20 : monthly ? Math.max(0, 20 - (monthly - budget) / budget * 20) : 4;
          }
          if (p.c === 'sale' && buyBudget > 0) {
            max += 20;
            const price = num(p.pr);
            score += price && price <= buyBudget ? 20 : price ? Math.max(0, 20 - (price - buyBudget) / buyBudget * 20) : 4;
          }
          const tags = p.t || [];
          if (wanted.includes('裝修')) { max += 8; if (tags.includes('有裝修')) score += 8; }
          if (wanted.includes('海景')) { max += 8; if (tags.some(t => /海景|開揚|城市景/.test(t))) score += 8; }
          if (wanted.includes('近港鐵')) { max += 8; if (p.m) score += 8; }
          if (wanted.includes('大面積')) { max += 8; if ((p.sv || 0) >= 2000) score += 8; }
          const days = p.pd ? Math.max(0, (Date.now() - new Date(p.pd).getTime()) / 86400000) : 120;
          max += 6;
          score += 6 * Math.max(0, 1 - days / 120);
          const pct = max > 0 ? Math.round((score / max) * 100) : 60;
          return { p, pct: Math.min(99, Math.max(12, pct)) };
        })
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 6);

      if (!scored.length) {
        headEl.textContent = '呢個組合暫時冇公開盤源';
        sumEl.textContent = '可以試下放寬地區或面積，或者直接發 WhatsApp 講你嘅要求，我幫你留意新盤。';
        listEl.innerHTML = '<p class="empty-state">暫時無符合條件嘅公開盤源。</p>';
        distEl.innerHTML = '';
        waEl.href = waLink('你好，我想搵工商物業，但網站暫時配對唔到，想直接講我嘅要求。');
        result.hidden = false;
        return;
      }

      const dealText = deal === 'rent' ? '放租' : deal === 'sale' ? '出售' : '租或買';
      headEl.textContent = `最接近你要求嘅 ${scored.length} 個盤源`;
      sumEl.textContent = `條件：${dealText}${district ? `、${district}` : ''}${usage !== 'any' ? `、${{ industrial: '工廈', office: '寫字樓', shop: '商舖' }[usage]}` : ''}${size !== 'any' ? `、${{ s: '1,000 呎以下', m: '1,000–2,000 呎', l: '2,000–5,000 呎', xl: '5,000 呎以上' }[size]}` : ''}${budget ? `、月租上限 ${money(budget)}` : ''}${buyBudget ? `、售價上限 ${money(buyBudget)}` : ''}${wanted.length ? `、需要${wanted.join('、')}` : ''}。`;

      listEl.innerHTML = scored.map(({ p, pct }) => `
        <article class="result-item">
          <div class="result-score"><strong>${pct}%</strong><span>吻合</span></div>
          <div class="result-body">
            <p class="eyebrow">${esc(p.d)} · ${esc(p.cl)}${p.f ? ` · ${esc(p.f)}` : ''}</p>
            <h3><a href="${esc(p.ln)}">${esc(p.n)}</a></h3>
            <p class="card-address">${esc(p.ad || '')}${p.ad ? ' · ' : ''}${esc(p.u)} · 物業編號 ${esc(p.i)}</p>
            <div class="result-facts">
              <span><b>${esc(p.s || '面積待核')}</b></span>
              <span><b>${esc(p.c === 'rent' ? (p.r ? p.r + '／月' : '租金待核') : (p.pr || '售價待核'))}</b></span>
              ${p.up ? `<span>${esc(p.up)}／呎</span>` : ''}
              <span class="fresh fresh-${/新盤/.test(p.fr) ? 'new' : 'ok'}">${esc(p.fr)}</span>
            </div>
            <div class="result-actions">
              <a class="card-link" href="${esc(p.ln)}">睇盤源詳情 ↗</a>
              <a class="ghost-button small" target="_blank" rel="noopener" href="${waLink(`你好，我想查詢${p.n}（${p.i}），我係用網站配對器搵到，想了解最新情況、實際面積及睇樓安排。`)}">WhatsApp 問呢個</a>
            </div>
          </div>
        </article>`).join('');

      const byDistrict = {};
      scored.forEach(({ p, pct }) => { byDistrict[p.d] = (byDistrict[p.d] || 0) + pct; });
      const top = Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 3);
      distEl.innerHTML = `<p class="entity-kicker">建議地區</p><div class="district-pick-row">${top.map(([d, sc]) => {
        const n = scored.filter(x => x.p.d === d).length;
        return `<a class="district-pill" href="/district/${encodeURIComponent(d)}/"><strong>${esc(d)}</strong><span>${n} 個吻合盤源</span></a>`;
      }).join('')}</div>`;

      const lines = scored.slice(0, 3).map((x, i) => `${i + 1}. ${x.p.n}（${x.p.i}）${x.p.s || ''} ${x.p.c === 'rent' ? (x.p.r || '') : (x.p.pr || '')}`).join('\n');
      waEl.href = waLink(`你好，我用網站配對器搵盤，條件如下：\n· 租或買：${dealText}\n· 地區：${district || '任何'}\n· 用途：${usage === 'any' ? '任何' : { industrial: '工廈', office: '寫字樓', shop: '商舖' }[usage]}\n· 面積：${size === 'any' ? '任何' : { s: '1,000 呎以下', m: '1,000–2,000 呎', l: '2,000–5,000 呎', xl: '5,000 呎以上' }[size]}\n${budget ? `· 月租上限：${money(budget)}\n` : ''}${buyBudget ? `· 售價上限：${money(buyBudget)}\n` : ''}${wanted.length ? `· 需要：${wanted.join('、')}\n` : ''}\n網站配對到：\n${lines}\n\n想了解最新盤況及睇樓安排。`);
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    matchForm.addEventListener('submit', event => {
      event.preventDefault();
      run();
    });
    matchForm.addEventListener('reset', () => {
      if (result) result.hidden = true;
    });
    grab('/data/properties.json').then(data => { props = data; });
  }

  /* ---------------- budget ---------------- */
  const budgetForm = document.querySelector('#budgetForm');
  if (budgetForm) {
    const out = {
      rent: document.querySelector('#outRent'),
      year: document.querySelector('#outYear'),
      mgmt: document.querySelector('#outMgmt'),
      monthly: document.querySelector('#outMonthly'),
      deposit: document.querySelector('#outDeposit'),
      commission: document.querySelector('#outCommission'),
      upfront: document.querySelector('#outUpfront')
    };
    const waEl = document.querySelector('#budgetWa');
    const calc = () => {
      const f = new FormData(budgetForm);
      const area = Number(f.get('area') || 0);
      const rate = Number(f.get('rate') || 0);
      const dep = Number(f.get('deposit') || 0);
      const comm = Number(f.get('commission') || 0);
      const mgmt = Number(f.get('mgmt') || 0);
      const fitout = Number(f.get('fitout') || 0);
      const rent = area * rate;
      const mgmtTotal = area * mgmt;
      const deposit = rent * dep;
      const commission = rent * comm;
      out.rent.textContent = money(rent);
      out.year.textContent = money(rent * 12);
      out.mgmt.textContent = money(mgmtTotal);
      out.monthly.textContent = money(rent + mgmtTotal);
      out.deposit.textContent = money(deposit);
      out.commission.textContent = money(commission);
      out.upfront.textContent = money(deposit + commission + rent);
      waEl.href = waLink(`你好，我計過租務預算：\n· 面積：${area.toLocaleString('en-HK')} 呎\n· 呎租：$${rate}\n· 每月租金：${money(rent)}\n· 預算每月總支出（連管理費）：${money(rent + mgmtTotal)}\n想睇下呢個預算有咩盤可以揀，同實際要準備幾多錢。`);
    };
    budgetForm.addEventListener('input', calc);
    budgetForm.addEventListener('submit', e => e.preventDefault());
    calc();
  }

  /* ---------------- compare ---------------- */
  const compareGroups = document.querySelector('#compareGroups');
  if (compareGroups) {
    const table = document.querySelector('#compareTable');
    const resultEl = document.querySelector('#compareResult');
    const hint = document.querySelector('#compareHint');
    const search = document.querySelector('#compareSearch');
    const waEl = document.querySelector('#compareWa');
    const MAX = 4;
    let buildings = [];
    let picked = [];

    const readHash = () => {
      const m = new URLSearchParams(location.search).get('b');
      return m ? m.split(',').filter(Boolean).slice(0, MAX) : [];
    };
    const sync = () => {
      const url = new URL(location.href);
      if (picked.length) url.searchParams.set('b', picked.join(',')); else url.searchParams.delete('b');
      history.replaceState(null, '', url);
    };
    const renderTable = () => {
      const rows = picked.map(s => buildings.find(b => b.s === s)).filter(Boolean);
      if (!rows.length) { resultEl.hidden = true; return; }
      const label = { 地區: 'd', 地址: 'a' };
      const cell = (b, key) => {
        switch (key) {
          case 'd': return esc(b.d);
          case 'a': return esc(b.a || '—');
          case 'us': return esc((b.us || []).join('、') || '—');
          case 'count': return `${b.sale} 售 / ${b.rent} 租`;
          case 'size': return b.smin ? `${b.smin.toLocaleString('en-HK')}–${b.smax.toLocaleString('en-HK')} 呎` : '—';
          case 'rr': return b.rr ? `$${b.rr}／呎` : '—';
          case 'pr': return b.pr ? `$${b.pr.toLocaleString('en-HK')}／呎` : '—';
          case 'm': return esc(b.m || '—');
          case 'link': return `<a class="inline-link" href="/building/${esc(b.s)}/">睇大廈頁 ↗</a>`;
          default: return '';
        }
      };
      const defs = [['地區', 'd'], ['地址', 'a'], ['公開用途', 'us'], ['盤源', 'count'], ['面積範圍', 'size'], ['放租中位', 'rr'], ['出售中位', 'pr'], ['最近港鐵', 'm'], ['詳細', 'link']];
      table.innerHTML = `<thead><tr><th scope="col">項目</th>${rows.map(b => `<th scope="col">${esc(b.n)}</th>`).join('')}</tr></thead><tbody>${defs.map(([t, k]) => `<tr><th scope="row">${t}</th>${rows.map(b => `<td>${cell(b, k)}</td>`).join('')}</tr>`).join('')}</tbody>`;
      resultEl.hidden = false;
      const names = rows.map(b => `${b.n}（${b.d}）`).join('、');
      waEl.href = waLink(`你好，我想比較以下大廈：${names}。想了解現有盤源、面積、租金／售價同睇樓安排。`);
    };
    const update = () => {
      hint.textContent = `已揀 ${picked.length}／${MAX} 幢`;
      compareGroups.querySelectorAll('input[name="building"]').forEach(input => {
        input.checked = picked.includes(input.value);
        input.disabled = !input.checked && picked.length >= MAX;
      });
      renderTable();
      sync();
    };
    compareGroups.addEventListener('change', event => {
      const input = event.target.closest('input[name="building"]');
      if (!input) return;
      if (input.checked) {
        if (picked.length >= MAX) { input.checked = false; return; }
        picked.push(input.value);
      } else {
        picked = picked.filter(x => x !== input.value);
      }
      update();
    });
    search?.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      compareGroups.querySelectorAll('.compare-group').forEach(group => {
        let any = false;
        group.querySelectorAll('.compare-option').forEach(opt => {
          const hit = !q || opt.textContent.toLowerCase().includes(q);
          opt.hidden = !hit;
          if (hit) any = true;
        });
        group.hidden = !any;
        if (q && any) group.open = true;
      });
    });
    grab('/data/buildings.json').then(data => {
      buildings = data;
      picked = readHash().filter(s => data.some(b => b.s === s));
      update();
    });
  }

  /* ---------------- brief ---------------- */
  const briefSheet = document.querySelector('#briefSheet');
  if (briefSheet) {
    const emptyEl = document.querySelector('#briefEmpty');
    const STORE = 'queeniehub-shortlist-v1';
    const readPicked = () => {
      try {
        const raw = JSON.parse(localStorage.getItem(STORE) || '[]');
        return Array.isArray(raw) ? raw : [];
      } catch (e) { return []; }
    };
    const render = props => {
      const picked = readPicked();
      const rows = picked.map(x => props.find(p => p.id === x.id)).filter(Boolean);
      if (!rows.length) {
        emptyEl.hidden = false;
        briefSheet.hidden = true;
        return;
      }
      emptyEl.hidden = true;
      briefSheet.hidden = false;
      briefSheet.innerHTML = `<div class="brief-title"><h2>睇樓清單（${rows.length} 個盤源）</h2><p>整理日期：${new Date().toISOString().slice(0,10)}　·　資料來源：公開代理資料</p></div>
        <table class="brief-table"><thead><tr><th>#</th><th>物業</th><th>面積</th><th>叫價</th><th>樓層／用途</th></tr></thead><tbody>
        ${rows.map((p, i) => `<tr><td>${i + 1}</td><td><strong>${esc(p.n)}</strong><br><small>${esc(p.d)} · ${esc(p.ad || '')} · ${esc(p.i)}</small></td><td>${esc(p.s || '—')}</td><td>${esc(p.c === 'rent' ? (p.r ? p.r + '／月' : '待核') : (p.pr || '待核'))}</td><td>${esc(p.f || '—')} · ${esc(p.u)}</td></tr>`).join('')}
        </tbody></table>
        <div class="brief-questions"><h3>睇樓時要問清楚</h3><ul>
          <li>實際面積係建築定實用？同廣告相差幾多？</li>
          <li>租金／售價是否已包管理費、差餉及冷氣？</li>
          <li>幾時可以交吉？有冇免租期？</li>
          <li>大廈准許用途係咩？我嘅行業做唔做得？</li>
          <li>按金、佣金、退租復原條款點寫？</li>
          <li>貨𨋢、上落貨時段、停車安排如何？</li>
        </ul></div>
        <p class="tool-note">呢張清單只係根據公開資料整理，唔構成任何要約。價格及盤況請向代理核實。</p>`;
    };
    grab('/data/properties.json').then(render);
    document.querySelector('#briefPrint')?.addEventListener('click', () => window.print());
    document.querySelector('#briefClear')?.addEventListener('click', () => {
      localStorage.removeItem(STORE);
      render([]);
      document.querySelectorAll('.compare-btn').forEach(b => b.classList.remove('is-on'));
      const bar = document.querySelector('#compareBar');
      if (bar) bar.hidden = true;
    });
  }
})();
