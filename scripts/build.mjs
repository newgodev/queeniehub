import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawData = JSON.parse(fs.readFileSync(path.join(root, 'data/properties.json'), 'utf8'));
const dist = path.join(root, 'dist');
const agentPage = 'https://oir.centanet.com/agent-detail/queenie-yeung/49008/';
const whatsappBase = 'https://wa.me/85266552539';
const publicOrigin = (process.env.PUBLIC_ORIGIN || '').replace(/\/$/, '');
const dataDate = '2026-11-08';

const districtMeta = {
  '觀塘': '觀塘工廈、工商樓盤及寫字樓出售／放租公開資料。按大廈、面積及價格瀏覽，查詢最新盤況及睇樓安排。',
  '長沙灣': '長沙灣工廈、工商樓盤及寫字樓出售／放租公開資料。按大廈集中查看不同面積及用途選項。',
  '屯門': '屯門工廈及工商樓盤放租公開資料。按大廈、樓面面積及價格比較。',
  '九龍灣': '九龍灣寫字樓、辦公室及商業樓盤出售／放租公開資料。',
  '黃竹坑': '黃竹坑寫字樓及工商樓盤出售／放租公開資料。',
  '油塘': '油塘工廈及工商樓盤放租公開資料。'
};
const usageMeta = {
  '工商': '香港工商樓盤及工廈出售／放租公開資料。',
  '寫字樓': '香港寫字樓及辦公室出售／放租公開資料。',
  '工業': '香港工業大廈及工廈出售／放租公開資料。',
  '寫字樓及商舖': '香港寫字樓及商舖公開樓盤資料。',
  '商舖': '香港商舖出售／放租公開資料。'
};
const districtSlug = { '觀塘':'kwun-tong', '長沙灣':'cheung-sha-wan', '屯門':'tuen-mun', '九龍灣':'kowloon-bay', '黃竹坑':'wong-chuk-hang', '油塘':'yau-tong', '新蒲崗':'san-po-kong', '葵涌':'kwai-chung', '大角咀':'tai-kok-tsui', '太子':'prince-edward', '荃灣':'tsuen-wan', '西區':'western-district', '南區':'southern-district', '佐敦':'jordan', '粉嶺':'fan-ling', '尖沙咀':'tsim-sha-tsui', '銅鑼灣':'causeway-bay', '石門':'shek-mun', '中環':'central', '灣仔':'wan-chai' };
const usageSlug = { '工商':'industrial', '寫字樓':'office', '工業':'factory', '寫字樓及商舖':'office-shop', '商舖':'shop' };
const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const slug = (v='') => String(v).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'');
const mkdir = p => fs.mkdirSync(p, { recursive: true });
const write = (p, text) => { mkdir(path.dirname(p)); fs.writeFileSync(p, text); };
const publicPath = (p) => p === '/' ? '/' : `${p.replace(/\/$/,'')}/`;
const pageUrl = (p) => publicOrigin ? `${publicOrigin}${publicPath(p)}` : publicPath(p);
const num = v => { const n = Number(String(v ?? '').replace(/[^0-9.]/g,'')); return Number.isFinite(n) ? n : null; };

function categoryLabel(p) { return p.categoryLabel || '樓盤'; }
function price(p) { return p.category === 'rent' && p.rent ? `${p.rent}／月` : (p.price || '價格請查詢'); }

/* keep titles 30-60 chars and descriptions 50-160 chars (SEO panel limits) */
function pickLen(candidates, min, max, fallback) {
  for (const c of candidates) {
    const v = String(c).replace(/\s+/g,' ').trim();
    if (v.length >= min && v.length <= max) return v;
  }
  const f = String(fallback).replace(/\s+/g,' ').trim();
  return f.length > max ? f.slice(0, max) : f;
}
function buildingTitle(b) {
  const en = b.nameEn || '';
  const enShort = en.split(/[\s(（]/)[0] || '';
  const suffixes = ['大廈資料及公開盤源', '大廈資料及盤源', '工商物業資料', '大廈資料'];
  const list = [];
  for (const e of [en, enShort, '']) {
    for (const s of suffixes) {
      list.push(`${b.name}${e ? ` ${e}` : ''}｜${b.district}${s}｜QueenieHub`);
      list.push(`${b.name}${e ? ` ${e}` : ''}｜${b.district}${s}`);
    }
  }
  return pickLen(list, 30, 60, `${b.name}｜${b.district}工商物業資料及盤源｜QueenieHub`);
}
function buildingDesc(b) {
  const total = b.properties.length;
  const pieces = [b.sales.length ? `${b.sales.length} 個出售` : '', b.rents.length ? `${b.rents.length} 個放租` : '', b.other.length ? `${b.other.length} 個新盤` : ''].filter(Boolean);
  return pickLen([
    `${b.name}${b.nameEn ? `（${b.nameEn}）` : ''}位於${b.district}${b.address ? `，${b.address}` : ''}。整理大廈地址、用途、面積及價格範圍，附 ${total} 個公開盤源${pieces.length ? `（${pieces.join('、')}）` : ''}。資料更新 ${dataDate}。`,
    `${b.name}${b.nameEn ? `（${b.nameEn}）` : ''}位於${b.district}${b.address ? `，${b.address}` : ''}。大廈資料、面積範圍、出售及放租公開盤源一頁睇清。資料更新 ${dataDate}。`,
    `${b.name}位於${b.district}${b.address ? `，${b.address}` : ''}。整理大廈地址、用途、面積範圍及現有公開出售與放租盤源，附查詢方法。`
  ], 50, 160, `${b.name}位於${b.district}，整理大廈地址、用途、面積範圍及現有公開出售與放租盤源，附查詢方法。`);
}
function listingTitle(p) {
  const b = p._building;
  const base = `${p.name}｜${p.district}${p.usage}${categoryLabel(p)}｜${p.size || '面積請查詢'}｜${p.propertyNo}`;
  return pickLen([
    `${base}｜大廈資料`,
    `${base}｜公開盤源`,
    `${base}｜大廈資料及盤源`,
    `${base}｜公開盤源及查詢`,
    `${base}｜工商物業資料`,
    base,
    `${p.name}｜${p.district}${p.usage}${categoryLabel(p)}｜${p.propertyNo}｜大廈資料及查詢`,
    `${p.name}｜${p.district}${p.usage}${categoryLabel(p)}${b ? `｜${b.name}` : ''}｜${p.propertyNo}`,
    `${p.name}｜${p.district}${p.usage}${categoryLabel(p)}｜${p.propertyNo}｜QueenieHub`
  ], 30, 60, base);
}
function listingDesc(p) {
  const b = p._building;
  const head = `${b ? `${b.name}（${p.district}）` : `${p.name}（${p.district}）`}${p.usage}${categoryLabel(p)}公開盤源`;
  return pickLen([
    `${head}：${p.size || '面積請查詢'}，${price(p)}，物業編號 ${p.propertyNo}。附大廈地址、面積範圍、價格概況及 WhatsApp 查詢方法。`,
    `${head}：${p.size || '面積請查詢'}，${price(p)}，物業編號 ${p.propertyNo}。附所屬大廈資料及查詢方法。`,
    `${head}：${p.size || '面積請查詢'}，${price(p)}。附大廈資料及查詢方法，價格及盤況請聯絡前重新核對。`
  ], 50, 160, `${head}：${p.size || '面積請查詢'}，${price(p)}，物業編號 ${p.propertyNo}。附所屬大廈資料及查詢方法。`);
}

/* ---------- building normalisation ---------- */
function cleanAddress(address, district) {
  let a = String(address || '').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  if (!a) return '';
  a = a.replace(new RegExp(`^${district}\\s*`), '');
  return a.trim();
}
function nameKey(name) { return String(name || '').replace(/[\s\u00a0]+/g,'').toUpperCase(); }

const buildingMap = new Map();
for (const p of rawData) {
  const key = `${p.district}||${nameKey(p.name)}`;
  if (!buildingMap.has(key)) {
    buildingMap.set(key, {
      key,
      district: p.district,
      zone: p.zone || '',
      name: String(p.name).replace(/\s+/g,' ').trim(),
      nameEn: '',
      addresses: new Map(),
      properties: []
    });
  }
  const b = buildingMap.get(key);
  const addr = cleanAddress(p.address, p.district);
  if (addr) b.addresses.set(addr, (b.addresses.get(addr) || 0) + 1);
  if (!b.nameEn && p.nameEn) b.nameEn = String(p.nameEn).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  b.properties.push(p);
}

const usedSlugs = new Set();
const buildings = [...buildingMap.values()].map(b => {
  const addrEntry = [...b.addresses.entries()].sort((a,c) => c[1] - a[1] || a[0].length - c[0].length)[0];
  b.address = addrEntry ? addrEntry[0] : '';
  const dSlug = districtSlug[b.district] || slug(b.district);
  let base = b.nameEn ? slug(b.nameEn.replace(/\(.*?\)/g,'')) : slug(b.name);
  if (!base) base = 'building';
  let candidate = base;
  let i = 2;
  while (usedSlugs.has(`${dSlug}/${candidate}`)) candidate = `${base}-${i++}`;
  usedSlugs.add(`${dSlug}/${candidate}`);
  const sales = b.properties.filter(p => p.category === 'sale');
  const rents = b.properties.filter(p => p.category === 'rent');
  const other = b.properties.filter(p => !['sale','rent'].includes(p.category));
  const sizes = b.properties.map(p => p.sizeValue).filter(v => Number.isFinite(v) && v > 0);
  b.slug = `${dSlug}/${candidate}`;
  b.sales = sales; b.rents = rents; b.other = other;
  b.sizeMin = sizes.length ? Math.min(...sizes) : null;
  b.sizeMax = sizes.length ? Math.max(...sizes) : null;
  const usages = [...new Set(b.properties.map(p => p.usage).filter(Boolean))];
  b.usages = usages;
  b.lastDate = b.properties.map(p => p.publishDate).filter(Boolean).sort().pop() || '';
  return b;
}).sort((a,c) => c.properties.length - a.properties.length || a.name.localeCompare(c.name,'zh-Hant'));

const buildingByKey = new Map(buildings.map(b => [b.key, b]));
for (const p of rawData) p._building = buildingByKey.get(`${p.district}||${nameKey(p.name)}`);

function buildingPath(b) { return `/building/${b.slug}`; }
function money(n) { return `$${n.toLocaleString('en-HK')}`; }
function rangeText(b) {
  if (b.sizeMin && b.sizeMax) {
    return b.sizeMin === b.sizeMax ? `約 ${b.sizeMin.toLocaleString('en-HK')} 呎` : `約 ${b.sizeMin.toLocaleString('en-HK')} 呎至 ${b.sizeMax.toLocaleString('en-HK')} 呎`;
  }
  return '公開資料未列明';
}
function priceSummary(b) {
  const parts = [];
  const saleVals = b.sales.map(p => num(p.price)).filter(v => v !== null);
  const rentVals = b.rents.map(p => num(p.rent)).filter(v => v !== null);
  if (saleVals.length) parts.push(`售價由 $${Math.min(...saleVals).toLocaleString('en-HK')} 萬起`);
  if (rentVals.length) parts.push(`租金由 ${money(Math.min(...rentVals))}／月起`);
  return parts.length ? parts.join('，') : '公開資料未列明';
}

/* ---------- shared components ---------- */
function card(p, opts = {}) {
  const href = `/listing/${p.slug}/`;
  const b = p._building;
  const tags = p.tags.length ? p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('') : '<span class="tag muted">公開資料待核</span>';
  return `<article class="listing-card" data-search="${esc([p.name,p.nameEn,p.district,p.usage,p.categoryLabel,p.address,p.propertyNo,p.tags.join(' ')].join(' '))}" data-district="${esc(p.district)}" data-usage="${esc(p.usage)}" data-category="${esc(p.category)}">
    <div class="card-top"><span class="eyebrow">${esc(p.district)} · ${esc(categoryLabel(p))}</span><span class="code">${esc(p.propertyNo)}</span></div>
    <h3><a href="${href}">${esc(p.name)}</a></h3>
    <p class="card-address">${esc(p.address)} · ${esc(p.usage)}</p>
    <div class="card-stats"><strong>${esc(p.size || '面積請查詢')}</strong><span>${esc(price(p))}</span></div>
    <div class="tags">${tags}</div>
    ${b && !opts.hideBuilding ? `<p class="card-building-link"><a href="${buildingPath(b)}">大廈資料：${esc(b.name)} ↗</a></p>` : ''}
    <a class="card-link" href="${href}">查看盤源 <span>↗</span></a>
  </article>`;
}
function buildingCard(b) {
  const saleN = b.sales.length, rentN = b.rents.length;
  const badge = [saleN ? `${saleN} 出售` : '', rentN ? `${rentN} 放租` : ''].filter(Boolean).join(' · ') || '資料整理中';
  return `<a class="building-card" href="${buildingPath(b)}">
    <span class="eyebrow">${esc(b.district)}${b.zone ? ` · ${esc(b.zone)}` : ''}</span>
    <strong>${esc(b.name)}</strong>
    <small>${esc(b.nameEn || '英文名稱待核')}</small>
    <span class="building-meta">${esc(b.address || '地址待核')}</span>
    <span class="building-count">${esc(badge)}</span>
    <span class="building-open">睇大廈資料 ↗</span>
  </a>`;
}
function whatsapp(p) {
  const text = p
    ? `你好，我想查詢${p.name}（${p.propertyNo}），想了解最新${categoryLabel(p)}狀況、實際面積、可用日期及睇樓安排。`
    : '';
  return text ? `${whatsappBase}?text=${encodeURIComponent(text)}` : whatsappBase;
}
function whatsappBuilding(b) {
  const text = `你好，我想查詢${b.name}${b.address ? `（${b.address}）` : ''}嘅工商物業，想了解現時有咩盤、面積、價錢及睇樓安排。`;
  return `${whatsappBase}?text=${encodeURIComponent(text)}`;
}
function breadcrumbHtml(items) {
  return `<nav class="breadcrumb" aria-label="麵包屑">${items.map((it, i) => it.href
    ? `<a href="${it.href}">${esc(it.label)}</a>${i < items.length - 1 ? '<span>/</span>' : ''}`
    : `<span aria-current="page">${esc(it.label)}</span>`).join('')}</nav>`;
}
function breadcrumbJson(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: pageUrl(it.href) } : {})
    }))
  };
}
function siteRef() {
  return { '@type': 'WebSite', name: 'Queenie 商業地產搜尋', url: pageUrl('/') };
}
function layout({title, description, canonical, body, active='all', jsonLd='', keywords='香港工商舖, 香港工廈, 寫字樓放租, 商業地產, 樓盤搜尋', ogType='website'}) {
  return `<!doctype html><html lang="zh-HK"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="keywords" content="${esc(keywords)}"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="${ogType}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="Queenie 商業地產搜尋">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">
<link rel="stylesheet" href="/styles.css"><script type="application/ld+json">${jsonLd}</script></head><body>
<header class="site-header"><a class="brand" href="/"><span class="brand-mark">Q</span><span><b>QUEENIE</b><small>COMMERCIAL INDEX</small></span></a><nav><a class="${active==='buildings'?'active':''}" href="/buildings/">大廈</a><a class="${active==='listings'?'active':''}" href="/listings/">盤源</a><a href="/district/kwun-tong/">地區</a><a href="/usage/industrial/">用途</a><a class="nav-cta" href="${whatsappBase}">WhatsApp 查詢</a></nav></header>
<main>${body}</main>
<footer class="site-footer"><div><span class="brand-footer">Q / COMMERCIAL INDEX</span><p>香港工商舖公開資料整理及查詢入口，並非任何大廈業主或管理處官方網站。資料來自公開來源，價格、盤況及面積請於聯絡前重新核對。</p></div><div class="footer-links"><a href="${agentPage}" rel="nofollow">原始代理公開頁</a><a href="/buildings/">全部大廈</a><a href="/listings/">全部盤源</a><span>資料更新：${dataDate} 抓取</span></div></footer>
<script src="/app.js" defer></script></body></html>`;
}
function filterPanel() {
  const districts = [...new Set(rawData.map(p=>p.district))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
  const usages = [...new Set(rawData.map(p=>p.usage))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
  return `<section class="filter-panel" aria-label="樓盤篩選"><div class="search-field"><span>⌕</span><input id="searchInput" type="search" placeholder="搜尋大廈名、地區、用途或物業編號" autocomplete="off"></div><label>地區<select id="districtFilter"><option value="">全部地區</option>${districts.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>用途<select id="usageFilter"><option value="">全部用途</option>${usages.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>類型<select id="categoryFilter"><option value="">出售／放租</option><option value="sale">出售</option><option value="rent">放租</option><option value="new_property">新盤</option><option value="project">項目</option></select></label><button class="ghost-button" id="clearFilters" type="button">清除</button></section>`;
}

/* ---------- building page ---------- */
function buildingPage(b) {
  const canonical = pageUrl(buildingPath(b));
  const total = b.properties.length;
  const pieces = [b.sales.length ? `${b.sales.length} 個出售` : '', b.rents.length ? `${b.rents.length} 個放租` : '', b.other.length ? `${b.other.length} 個新盤／項目` : ''].filter(Boolean);
  const title = buildingTitle(b);
  const description = buildingDesc(b);

  const overview = [
    `${b.name}${b.nameEn ? `（${b.nameEn}）` : ''}位於${b.district}${b.address ? `，${b.address}` : '（地址待核實）'}${b.zone ? `，屬${b.zone}區` : ''}${b.usages.length ? `，公開資料顯示用途為${b.usages.join('、')}` : ''}。`,
    total
      ? `根據 ${dataDate} 整理嘅公開代理資料，呢幢大廈現時有 ${total} 個公開盤源${pieces.length ? `（${pieces.join('、')}）` : ''}；公開面積${rangeText(b)}，${priceSummary(b)}。`
      : `目前未見呢幢大廈嘅公開盤源，以下資料只作大廈索引用途。`,
    `本頁係公開資料整理及查詢入口，並非${b.name}業主、管理處或發展商官方網站。樓面面積、叫價、管理費、用途限制同盤況，請喺聯絡代理時逐項重新核對。`
  ].join('');

  const facts = [
    ['大廈名稱', b.name],
    ['英文名稱', b.nameEn || '公開資料未列明'],
    ['地址', b.address || '公開資料未列明'],
    ['地區', `${b.district}${b.zone ? `（${b.zone}）` : ''}`],
    ['公開用途', b.usages.length ? b.usages.join('、') : '公開資料未列明'],
    ['公開盤源', total ? `${total} 個` : '暫無'],
    ['面積範圍', rangeText(b)],
    ['價格概況', priceSummary(b)],
    ['最新公開廣告日期', b.lastDate ? String(b.lastDate).slice(0,10) : dataDate]
  ];

  const listingBlocks = [];
  if (b.rents.length) {
    listingBlocks.push(`<div class="building-group"><div class="section-heading"><div><span class="section-label">FOR LEASE</span><h2>${esc(b.name)}放租盤源</h2></div><span class="count-note">${b.rents.length} 個公開項目</span></div><div class="listing-grid">${b.rents.map(x => card(x, {hideBuilding:true})).join('')}</div></div>`);
  }
  if (b.sales.length) {
    listingBlocks.push(`<div class="building-group"><div class="section-heading"><div><span class="section-label">FOR SALE</span><h2>${esc(b.name)}出售盤源</h2></div><span class="count-note">${b.sales.length} 個公開項目</span></div><div class="listing-grid">${b.sales.map(x => card(x, {hideBuilding:true})).join('')}</div></div>`);
  }
  if (b.other.length) {
    listingBlocks.push(`<div class="building-group"><div class="section-heading"><div><span class="section-label">NEW / PROJECT</span><h2>${esc(b.name)}新盤及項目資料</h2></div><span class="count-note">${b.other.length} 個公開項目</span></div><div class="listing-grid">${b.other.map(x => card(x, {hideBuilding:true})).join('')}</div></div>`);
  }

  const sameDistrict = buildings.filter(x => x.district === b.district && x.key !== b.key).slice(0, 6);
  const crumb = [
    { label: '首頁', href: '/' },
    { label: `${b.district}工商物業`, href: `/district/${districtSlug[b.district] || slug(b.district)}` },
    { label: b.name }
  ];

  const checklist = ['建築面積與實用面積分別', '管理費、差餉及地租', '樓底高度、負重及電力容量', '升降機數目、貨梯及卸貨位', '車位供應及月租', '地契／城規用途限制', '交吉日期及現有租約', '大廈維修狀況及消防要求'];

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        about: { '@id': `${canonical}#place` },
        isPartOf: siteRef()
      },
      {
        '@type': 'Place',
        '@id': `${canonical}#place`,
        name: b.name,
        ...(b.nameEn ? { alternateName: b.nameEn } : {}),
        url: canonical,
        ...(b.address ? { address: { '@type': 'PostalAddress', streetAddress: b.address, addressLocality: b.district, addressRegion: b.zone || '香港' } } : {}),
        ...(b.properties.length ? { containsPlace: b.properties.map(p => ({ '@type': 'Apartment', name: `${b.name} ${p.size || ''} ${categoryLabel(p)}`.trim(), url: pageUrl(`/listing/${p.slug}`) })) } : {})
      },
      breadcrumbJson(crumb)
    ]
  };

  const body = `${breadcrumbHtml(crumb)}
<section class="entity-hero">
  <div class="entity-kicker">${esc(b.district)}${b.zone ? ` / ${esc(b.zone)}` : ''} / 大廈資料</div>
  <h1>${esc(b.name)}</h1>
  ${b.nameEn ? `<p class="entity-en">${esc(b.nameEn)}</p>` : ''}
  <p class="entity-address">${esc(b.address || '地址待核實')}</p>
  <div class="entity-chips">${total ? `<span>${total} 個公開盤源</span>` : '<span>暫無公開盤源</span>'}${b.usages.map(u => `<span>${esc(u)}</span>`).join('')}<span>資料 ${dataDate}</span></div>
  <div class="hero-actions"><a class="primary-button" href="${whatsappBuilding(b)}" target="_blank" rel="noopener">WhatsApp 查詢呢幢大廈 ↗</a><a class="secondary-button" href="/district/${districtSlug[b.district] || slug(b.district)}/">睇${esc(b.district)}其他大廈</a></div>
</section>
<section class="entity-body">
  <div class="entity-main">
    <div class="section-label">BUILDING OVERVIEW</div>
    <h2>${esc(b.name)}係一幢點樣嘅物業？</h2>
    <p class="entity-lede">${esc(overview)}</p>
    <h2 class="entity-subhead">大廈資料</h2>
    <div class="facts">${facts.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>
    <div class="entity-block">
      <h2>睇樓或落訂前，建議逐項核對</h2>
      <p>以下係工商物業常見但公開資料未必齊全嘅項目。呢個清單幫你問得準，唔代表本頁已核實相關數值。</p>
      <ul class="checklist">${checklist.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    <div class="entity-block">
      <h2>資料來源及身份說明</h2>
      <p>本頁資料整理自公開代理頁面，最後抓取日期為 ${dataDate}。QueenieHub 係獨立嘅公開資料整理及查詢入口，同${esc(b.name)}業主、管理處及發展商並無官方關係，亦唔代表任何一方發出要約。所有價格、面積及盤況以代理及業主最新確認為準。</p>
      <p><a class="inline-link" href="${agentPage}" rel="nofollow noopener" target="_blank">查看原始代理公開頁 ↗</a></p>
    </div>
  </div>
  <aside class="entity-aside">
    <div class="aside-card"><span class="eyebrow">快速查詢</span><h2>想要${esc(b.name)}嘅最新盤？</h2><p>講你想搵嘅面積、預算同用途，我哋可以直接幫你核對最新盤況。</p><a class="primary-button" href="${whatsappBuilding(b)}" target="_blank" rel="noopener">WhatsApp 楊佩儀</a></div>
    <div class="aside-card"><span class="eyebrow">同區索引</span><h2>${esc(b.district)}其他大廈</h2><div class="aside-links">${sameDistrict.slice(0,5).map(x=>`<a href="${buildingPath(x)}">${esc(x.name)} <span>${x.properties.length}</span></a>`).join('')}</div><a class="inline-link" href="/district/${districtSlug[b.district] || slug(b.district)}/">睇全部 ${esc(b.district)} 大廈 ↗</a></div>
  </aside>
</section>
${listingBlocks.length ? `<section class="building-listings">${listingBlocks.join('')}</section>` : ''}
${sameDistrict.length ? `<section class="related"><div class="section-heading"><div><span class="section-label">NEARBY BUILDINGS</span><h2>${esc(b.district)}同區大廈</h2></div><a href="/buildings/">全部大廈 ↗</a></div><div class="building-grid">${sameDistrict.map(buildingCard).join('')}</div></section>` : ''}`;

  return layout({ title, description, canonical, body, active: 'buildings', jsonLd: JSON.stringify(graph), ogType: 'article', keywords: `${b.name}, ${b.nameEn || ''}, ${b.district}工廈, ${b.district}寫字樓, ${b.district}工商物業`.replace(/,\s*,/g,',') });
}

/* ---------- listing page ---------- */
function listingJson(p, canonical) {
  const b = p._building;
  const crumb = [
    { label: '首頁', href: '/' },
    { label: p.district, href: `/district/${districtSlug[p.district] || slug(p.district)}` },
    ...(b ? [{ label: b.name, href: buildingPath(b) }] : []),
    { label: `${categoryLabel(p)} ${p.propertyNo}` }
  ];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url: canonical,
        name: `${b ? `${b.name}｜` : ''}${p.district}${p.usage}${categoryLabel(p)}｜${p.propertyNo}`,
        description: `${p.district}${p.usage}${categoryLabel(p)}公開資料：${p.name}，${p.size || '面積請查詢'}，${price(p)}。`,
        about: {
          '@type': 'Place',
          name: p.name,
          ...(b && b.nameEn ? { alternateName: b.nameEn } : {}),
          ...(p.address ? { address: { '@type': 'PostalAddress', streetAddress: p.address, addressLocality: p.district } } : {})
        },
        isPartOf: siteRef()
      },
      breadcrumbJson(crumb)
    ]
  });
}
function detail(p) {
  const b = p._building;
  const canonical = pageUrl(`/listing/${p.slug}`);
  const tags = p.tags.length ? p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('') : '<span class="tag muted">公開資料待核</span>';
  const fields = [['地區',p.district],['用途',p.usage],['樓層',p.floor||'公開資料未列明'],['面積',p.size||'公開資料未列明'],['物業編號',p.propertyNo],['廣告日期',p.publishDate?String(p.publishDate).slice(0,10):'公開資料未列明']];
  const crumb = [
    { label: '首頁', href: '/' },
    { label: p.district, href: `/district/${districtSlug[p.district] || slug(p.district)}` },
    ...(b ? [{ label: b.name, href: buildingPath(b) }] : []),
    { label: `${categoryLabel(p)} ${p.propertyNo}` }
  ];
  const body = `${breadcrumbHtml(crumb)}
<section class="detail-hero"><div class="detail-kicker">${esc(p.district)} / ${esc(categoryLabel(p))} / ${esc(p.usage)}</div><h1>${esc(p.name)}</h1><p class="lede">${esc(p.address)} · ${esc(p.size || '面積請查詢')} · ${esc(price(p))}</p>${b ? `<p class="hero-building">所屬大廈：<a href="${buildingPath(b)}">${esc(b.name)}${b.nameEn ? ` ${esc(b.nameEn)}` : ''} 大廈資料 ↗</a></p>` : ''}<div class="hero-actions"><a class="primary-button" href="${whatsapp(p)}" target="_blank" rel="noopener">WhatsApp 查詢 ↗</a><a class="secondary-button" href="${agentPage}" target="_blank" rel="noopener">查看原始代理頁</a></div></section>
<section class="detail-grid"><div class="detail-main"><div class="section-label">公開盤源資料</div><div class="facts">${fields.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div><div class="detail-block"><h2>盤源特色</h2><div class="tags large">${tags}</div><p>以上內容由公開盤源資料整理，實際樓面面積、價格、盤況及可用日期請於聯絡代理前重新核對。</p></div><div class="detail-block"><h2>查詢時可以直接講</h2><p class="message-box">你好，我想查詢${esc(p.name)}（${esc(p.propertyNo)}），想了解最新${esc(categoryLabel(p))}狀況、實際面積、可用日期及睇樓安排。</p></div>${b ? `<div class="detail-block"><h2>關於${esc(b.name)}</h2><p>${esc(b.name)}${b.nameEn ? `（${esc(b.nameEn)}）` : ''}位於${esc(b.district)}${b.address ? ` ${esc(b.address)}` : ''}。呢幢大廈現時有 ${b.properties.length} 個公開盤源，包括 ${b.sales.length} 個出售及 ${b.rents.length} 個放租。</p><p><a class="inline-link" href="${buildingPath(b)}">睇${esc(b.name)}完整大廈資料、面積及價格範圍 ↗</a></p></div>` : ''}</div><aside class="detail-aside"><div class="aside-card"><span class="eyebrow">資料來源</span><h2>公開代理頁</h2><p>呢個頁面係搜尋及整理入口，唔代表代理已確認現時仍然有盤。</p><a href="${agentPage}" target="_blank" rel="nofollow noopener">前往原始頁面 ↗</a></div><div class="aside-card accent"><span class="eyebrow">想搵相近盤？</span><h2>講你想要嘅地區、面積同預算</h2><a class="primary-button" href="${whatsapp(p)}" target="_blank" rel="noopener">WhatsApp 楊佩儀</a></div></aside></section><section class="related"><div class="section-heading"><div><span class="section-label">繼續瀏覽</span><h2>${esc(p.district)} 其他公開盤源</h2></div><a href="/district/${districtSlug[p.district] || slug(p.district)}/">查看地區頁 ↗</a></div><div class="listing-grid">${rawData.filter(x=>x.district===p.district && x.id!==p.id).slice(0,3).map(card).join('')}</div></section>`;
  return layout({title:listingTitle(p),description:listingDesc(p),canonical,body,jsonLd:listingJson(p,canonical),ogType:'article'});
}

/* ---------- index pages ---------- */
function buildingsIndex() {
  const byDistrict = new Map();
  for (const b of buildings) {
    if (!byDistrict.has(b.district)) byDistrict.set(b.district, []);
    byDistrict.get(b.district).push(b);
  }
  const groups = [...byDistrict.entries()]
    .sort((a,c) => c[1].length - a[1].length)
    .map(([d, list]) => `<div class="building-group"><div class="section-heading"><div><span class="section-label">${esc(districtSlug[d] || '').toUpperCase()}</span><h2>${esc(d)}大廈</h2></div><a href="/district/${districtSlug[d] || slug(d)}/">${esc(d)}樓盤頁 ↗</a></div><div class="building-grid">${list.map(buildingCard).join('')}</div></div>`).join('');
  const body = `<section class="page-intro compact"><span class="section-label">BUILDING INDEX / ${buildings.length}</span><h1>香港工商大廈索引</h1><p>由大廈開始搵：先睇地址、用途、面積及價格範圍，再睇呢幢大廈現有嘅公開出售同放租盤源。</p></section><section class="building-listings">${groups}</section><section class="notice"><strong>資料說明</strong><p>本索引整理自公開代理資料，最後抓取日期為 ${dataDate}。大廈名稱、地址及盤源數目會隨公開資料更新而變化；本頁並非任何大廈業主或管理處官方網站。</p></section>`;
  return layout({title:`香港工商大廈索引｜${buildings.length} 幢大廈資料及盤源｜QueenieHub`,description:`按大廈瀏覽香港工商物業：觀塘、長沙灣、屯門、葵涌、黃竹坑等 ${buildings.length} 幢大廈嘅地址、面積範圍、出售及放租公開盤源，附查詢方法。`,canonical:pageUrl('/buildings'),body,active:'buildings',keywords:'香港工商大廈, 工廈索引, 觀塘工廈, 長沙灣工廈, 屯門工廈, 寫字樓'});
}
function listingsPage() {
  const body = `<section class="page-intro compact"><span class="section-label">PUBLIC LISTINGS / ${rawData.length}</span><h1>全部公開盤源</h1><p>用地區、用途、出售／放租或關鍵字，快速縮窄你要搵嘅工商舖選項。</p></section>${filterPanel()}<section class="results-head"><strong id="resultCount">${rawData.length} 個公開項目</strong><span>價格及盤況請重新核對</span></section><section class="listing-grid" id="listingGrid">${rawData.map(card).join('')}</section><p class="empty-state" id="emptyState" hidden>未搵到符合條件嘅公開項目。試下放寬地區、用途或搜尋字詞。</p>`;
  return layout({title:`全部香港工商舖公開盤源｜${rawData.length} 個項目｜QueenieHub`,description:`按地區、用途、出售／放租及關鍵字瀏覽香港工商舖 ${rawData.length} 個公開盤源，每項附所屬大廈地址、面積範圍及 WhatsApp 查詢方法。`,canonical:pageUrl('/listings'),body,active:'listings'});
}
function home() {
  const featuredBuildings = buildings.slice(0, 6);
  const featuredListings = rawData.filter(p=>['觀塘','長沙灣','屯門'].includes(p.district)).slice(0, 3);
  const districtCards = ['觀塘','長沙灣','屯門','九龍灣','黃竹坑','油塘'].map(d=>{
    const bCount = buildings.filter(b=>b.district===d).length;
    const pCount = rawData.filter(p=>p.district===d).length;
    return `<a class="district-card" href="/district/${districtSlug[d]}/"><span>${esc(d)}</span><strong>${bCount}</strong><small>幢大廈 · ${pCount} 個盤源 ↗</small></a>`;
  }).join('');
  const body = `<section class="hero"><div class="hero-copy"><span class="eyebrow inverse">QUEENIE / COMMERCIAL INDEX</span><h1>由大廈開始，<br>搵到啱你<em>做生意</em>嘅地方。</h1><p>先睇大廈嘅地址、用途、面積同價格範圍，再睇呢幢大廈現有嘅出售同放租盤源。唔使逐個 listing 猜。</p><a class="hero-cta" href="/buildings/">睇全部大廈 <span>↗</span></a></div><div class="hero-aside"><div class="orbit"><span class="orbit-dot dot-a"></span><span class="orbit-dot dot-b"></span><span class="orbit-dot dot-c"></span><div><b>${buildings.length}</b><small>BUILDINGS<br>INDEXED</small></div></div><p>公開資料整理及查詢入口，並非任何大廈業主或管理處官方網站。</p></div></section><section class="featured-section"><div class="section-heading"><div><span class="section-label">START WITH BUILDINGS</span><h2>先揀一幢大廈</h2></div><a href="/buildings/">全部大廈 ↗</a></div><div class="building-grid">${featuredBuildings.map(buildingCard).join('')}</div></section><section class="district-section"><div class="section-heading"><div><span class="section-label">BROWSE BY AREA</span><h2>按地區搵大廈</h2></div><a href="/listings/">全部盤源 ↗</a></div><div class="district-grid">${districtCards}</div></section><section class="featured-section"><div class="section-heading"><div><span class="section-label">FRESH LISTINGS</span><h2>最新公開盤源</h2></div><a href="/listings/">開啟完整篩選 ↗</a></div><div class="listing-grid">${featuredListings.map(card).join('')}</div></section><section class="trust-strip"><div><span class="section-label">HOW IT WORKS</span><h2>由大廈資料到聯絡，唔使兜路。</h2></div><div class="steps"><span><b>01</b>揀大廈睇概況</span><span><b>02</b>比較面積同價格</span><span><b>03</b>WhatsApp 核對盤況</span></div></section>`;
  return layout({title:'香港工商大廈及盤源索引｜觀塘工廈、寫字樓、商舖｜QueenieHub',description:'由大廈開始搵香港工商物業：大廈地址、用途、面積及價格範圍，附現有出售及放租公開盤源。資料更新 2026-11-08。',canonical:pageUrl('/'),body,keywords:'香港工商大廈, 香港工廈, 觀塘工廈, 寫字樓放租, 工商舖'});
}
function aggregatePage(type, value, list) {
  const isDistrict = type === 'district';
  const dSlug = districtSlug[value] || slug(value);
  const bList = isDistrict ? buildings.filter(b => b.district === value) : [];
  const title = isDistrict
    ? `${value}工廈及寫字樓大廈索引及盤源｜${bList.length} 幢大廈｜QueenieHub`
    : `${value}出售及放租公開盤源｜${list.length} 個工商物業項目｜QueenieHub`;
  const description = isDistrict
    ? `${value}工商物業大廈索引：${bList.length} 幢大廈嘅地址、用途、面積範圍及價格概況，並列出 ${list.length} 個公開出售及放租盤源。`
    : `${value}公開盤源共 ${list.length} 個項目，按面積、價格及出售或放租瀏覽，每項附所屬大廈地址、面積範圍及 WhatsApp 查詢方法。`;
  const body = `<section class="page-intro"><span class="section-label">${isDistrict?'AREA INDEX':'USAGE INDEX'}</span><h1>${esc(value)}<br><em>${isDistrict?'大廈及盤源':'盤源分類'}</em></h1><p>${esc(description)}</p><a class="primary-button" href="/listings/">查看全部盤源</a></section>${isDistrict && bList.length ? `<section class="featured-section"><div class="section-heading"><div><span class="section-label">BUILDINGS</span><h2>${esc(value)}大廈</h2></div><a href="/buildings/">全部大廈 ↗</a></div><div class="building-grid">${bList.map(buildingCard).join('')}</div></section>` : ''}<section class="results-head"><strong>${list.length} 個公開項目</strong><span>資料需重新核對</span></section><section class="listing-grid">${list.map(card).join('')}</section><section class="notice"><strong>資料提醒</strong><p>呢度係公開資料整理入口，唔係實時庫存保證，亦非任何大廈業主或管理處官方網站。價格、面積、盤況及可用日期請直接向代理核對。</p></section>`;
  const pathName = isDistrict ? `/district/${dSlug}` : `/usage/${usageSlug[value] || slug(value)}`;
  return layout({title,description,canonical:pageUrl(pathName),body});
}

/* ---------- build ---------- */
fs.rmSync(dist,{recursive:true,force:true}); mkdir(dist);
write(path.join(dist,'styles.css'), fs.readFileSync(path.join(root,'styles.css'),'utf8'));
write(path.join(dist,'app.js'), fs.readFileSync(path.join(root,'app.js'),'utf8'));
write(path.join(dist,'index.html'), home());
write(path.join(dist,'buildings/index.html'), buildingsIndex());
write(path.join(dist,'listings/index.html'), listingsPage());
for (const b of buildings) write(path.join(dist,`building/${b.slug}/index.html`), buildingPage(b));
for (const p of rawData) write(path.join(dist,`listing/${p.slug}/index.html`), detail(p));
for (const [d, dSlug] of Object.entries(districtSlug)) write(path.join(dist,`district/${dSlug}/index.html`), aggregatePage('district', d, rawData.filter(p=>p.district===d)));
for (const [u, uSlug] of Object.entries(usageSlug)) write(path.join(dist,`usage/${uSlug}/index.html`), aggregatePage('usage', u, rawData.filter(p=>p.usage===u)));

const allPages = [
  { path: '/', title: 'QueenieHub 香港工商大廈索引' },
  { path: '/buildings/', title: '全部大廈' },
  ...buildings.map(b => ({ path: buildingPath(b), title: b.name })),
  ...Object.values(districtSlug).map(s => ({ path: `/district/${s}/`, title: '地區大廈及盤源' })),
  { path: '/listings/', title: '全部公開盤源' },
  ...rawData.map(p => ({ path: `/listing/${p.slug}/`, title: `${p.name} ${p.propertyNo}` })),
  ...Object.values(usageSlug).map(s => ({ path: `/usage/${s}/`, title: '用途盤源' }))
];
write(path.join(dist,'manus-routes.json'), JSON.stringify({ routes: allPages }));
write(path.join(dist,'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n${publicOrigin ? `Sitemap: ${publicOrigin}/sitemap.xml\n` : ''}`);
write(path.join(dist,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allPages.map(p=>`<url><loc>${pageUrl(p.path)}</loc></url>`).join('')}</urlset>`);
console.log(`Built ${allPages.length} pages (${buildings.length} buildings, ${rawData.length} listings) into ${dist}`);
