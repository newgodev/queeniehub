import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawData = JSON.parse(fs.readFileSync(path.join(root, 'data/properties.json'), 'utf8'));
const dist = path.join(root, 'dist');
const agentPage = 'https://oir.centanet.com/agent-detail/queenie-yeung/49008/';
const whatsappBase = 'https://wa.me/85266552539';
const propertyNoCounts = new Map();
for (const item of rawData) {
  const key = String(item.propertyNo || '').toLowerCase();
  propertyNoCounts.set(key, (propertyNoCounts.get(key) || 0) + 1);
}
function shortListingSlug(p) {
  const no = String(p.propertyNo || '').toLowerCase();
  if ((propertyNoCounts.get(no) || 0) <= 1) return no;
  const tail = String(p.slug || '').split('-').pop().toLowerCase();
  return `${no}-${tail || String(p.id || '').slice(0, 6).toLowerCase()}`;
}
const listingPath = (p) => `/listing/${shortListingSlug(p)}/`;
const publicOrigin = (process.env.PUBLIC_ORIGIN || '').replace(/\/$/, '');
const dataDate = '2026-11-08';
const buildingFactsPath = path.join(root, 'data/building-facts.json');
const buildingFacts = fs.existsSync(buildingFactsPath) ? JSON.parse(fs.readFileSync(buildingFactsPath, 'utf8')) : {};
function factsFor(b) {
  if (!b) return null;
  const key = slug(b.nameEn || b.name);
  const entry = buildingFacts[key];
  return entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : null;
}
function factRowsFor(bf) {
  const rows = [];
  if (bf.yearBuilt) rows.push(['落成年份', `${bf.yearBuilt}${bf.yearNote ? `（${bf.yearNote}）` : ''}`]);
  if (bf.floors) rows.push(['樓層數目', bf.floors]);
  if (bf.grade) rows.push(['級別', bf.grade]);
  if (bf.lifts) rows.push(['升降機', bf.lifts]);
  if (bf.ac) rows.push(['冷氣系統', bf.ac]);
  if (bf.ownership) rows.push(['業權', bf.ownership]);
  if (bf.developer) rows.push(['發展商', bf.developer]);
  if (bf.management) rows.push(['管理公司', bf.management]);
  if (bf.typicalFloor) rows.push(['標準樓層面積', bf.typicalFloor]);
  if (bf.ceiling) rows.push(['樓底', bf.ceiling]);
  if (bf.gfa) rows.push(['總樓面', bf.gfa]);
  if (bf.parking) rows.push(['車位', bf.parking]);
  if (bf.mtr) rows.push(['最近港鐵', bf.mtr]);
  return rows;
}
function factSentence(b, bf) {
  const parts = [];
  if (bf.yearBuilt) parts.push(`${b.name}於 ${bf.yearBuilt} 年落成${bf.yearNote ? `（${bf.yearNote}）` : ''}`);
  else parts.push(`${b.name}`);
  if (bf.floors) parts.push(`樓高 ${bf.floors}`);
  if (bf.grade) parts.push(`屬${bf.grade}`);
  let head = parts.join('，');
  const details = [];
  if (bf.lifts) details.push(`升降機配置為 ${bf.lifts}`);
  if (bf.ac) details.push(`冷氣系統為${bf.ac}`);
  if (bf.ownership) details.push(`業權為${bf.ownership}`);
  if (bf.developer) details.push(`由${bf.developer}發展`);
  if (bf.management) details.push(`管理公司為${bf.management}`);
  if (bf.typicalFloor) details.push(`標準樓層面積約 ${bf.typicalFloor.replace(/^約\s*/, '')}`);
  if (bf.parking) details.push(`車位供應包括${bf.parking}`);
  let text = `${head}，位於${b.district}${b.address ? `，地址為${b.address}` : ''}。`;
  if (details.length) text += `大廈${details.join('，')}。`;
  if (bf.mtr) text += `交通方面，鄰近${bf.mtr}，方便客戶及員工往返。`;
  return text;
}

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
function shortSize(b) {
  const vals = b.properties.map(x => x.sizeValue).filter(v => Number.isFinite(v) && v > 0);
  if (!vals.length) return '';
  const min = Math.min(...vals);
  return `${min.toLocaleString('en-HK')}呎`;
}
function buildingTitle(b) {
  const total = b.properties.length;
  const size = shortSize(b);
  const uses = b.usages.length ? b.usages[0] : '工商';
  const rent = b.rents.length;
  const sale = b.sales.length;
  const intent = rent && sale ? '租售' : rent ? '放租' : sale ? '出售' : '盤源';
  const en = b.nameEn || '';
  const enShort = en.split(/[\s(（]/)[0] || '';
  const candidates = [
    `${b.name}｜${b.district}${uses}${intent}${size ? `｜${size}起` : ''}｜QueenieHub`,
    `${b.name}｜${b.district}${uses}${intent}｜${total}個盤源｜QueenieHub`,
    `${b.name}${enShort ? ` ${enShort}` : ''}｜${b.district}${uses}${intent}｜大廈資料`,
    `${b.name}｜${b.district}${uses}${intent}｜面積及價格一覽`,
    `${b.name}｜${b.district}${uses}${intent}｜大廈資料及盤源`,
    `${b.name}${enShort ? ` ${enShort}` : ''}｜${b.district}大廈資料及公開盤源｜QueenieHub`
  ];
  return pickLen(candidates, 30, 46, `${b.name}｜${b.district}${uses}${intent}｜大廈資料及公開盤源｜QueenieHub`);
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
  const rent = p.category === 'rent';
  const money = rent ? (p.rent ? `${p.rent}／月` : '') : (p.price || '');
  const size = p.size || '';
  const no = p.propertyNo;
  const candidates = [
    `${p.name} ${size}${rent ? '放租' : categoryLabel(p)}${money ? ` ${money}` : ''}｜${no}`,
    `${p.name}｜${p.district}${p.usage}${categoryLabel(p)}${rent ? '放租' : ''}｜${size}｜${no}`,
    `${p.name}${size ? ` ${size}` : ''}｜${p.district}${p.usage}${categoryLabel(p)}｜${no}｜QueenieHub`,
    `${p.name}｜${p.district}${p.usage}${categoryLabel(p)}｜${size}｜${no}｜大廈資料`,
    `${p.name}｜${p.district}${p.usage}${categoryLabel(p)}｜${no}｜盤源面積價格及大廈資料`,
    `${p.name}｜${p.district}${p.usage}${categoryLabel(p)}${b ? `｜${b.name}` : ''}｜${no}`
  ];
  return pickLen(candidates, 30, 46, `${p.name}｜${p.district}${p.usage}${categoryLabel(p)}｜${no}｜盤源面積價格及大廈資料`);
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
function unitRate(p) {
  if (p.category === 'rent') {
    const r = num(p.rent), s = p.sizeValue;
    if (r && s) return `$${Math.round(r / s)}／呎`;
    return '—';
  }
  return p.unitPrice || '—';
}
function unitTable(b) {
  const rows = b.properties.map(p => `<tr>
      <td><a href="${listingPath(p)}">${esc(p.floor || '未列明')}</a></td>
      <td>${esc(p.size || '未列明')}</td>
      <td>${esc(categoryLabel(p))}</td>
      <td>${esc(price(p))}</td>
      <td>${esc(unitRate(p))}</td>
      <td>${esc(p.publishDate ? String(p.publishDate).slice(0, 10) : '—')}</td>
    </tr>`).join('');
  return `<div class="entity-block"><h2>${esc(b.name)}現有盤源一覽</h2><p>同一幢大廈嘅公開盤源放埋一齊比較，睇清楚樓層、面積、叫價同呎價差異，再決定問邊個盤。</p><div class="table-wrap"><table class="unit-table"><thead><tr><th>樓層</th><th>面積</th><th>類型</th><th>叫價</th><th>呎價／呎租</th><th>廣告日期</th></tr></thead><tbody>${rows}</tbody></table></div><p class="table-note">呎租以公開月租除以公開面積計算，只作比較參考；實際面積、叫價及盤況以代理及業主最新確認為準。</p></div>`;
}

/* ---------- shared components ---------- */
function card(p, opts = {}) {
  const href = listingPath(p);
  const b = p._building;
  const tags = p.tags.length ? p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('') : '<span class="tag muted">公開資料待核</span>';
  return `<article class="listing-card" data-search="${esc([p.name,p.nameEn,p.district,p.usage,p.categoryLabel,p.address,p.propertyNo,p.tags.join(' ')].join(' '))}" data-district="${esc(p.district)}" data-usage="${esc(p.usage)}" data-category="${esc(p.category)}">
    <div class="card-top"><span class="eyebrow">${esc(p.district)} · ${esc(categoryLabel(p))}</span><span class="code">${esc(p.propertyNo)}</span></div>
    <h3><a href="${href}">${esc(p.name)}</a></h3>
    <p class="card-address">${esc(p.address)} · ${esc(p.usage)}</p>
    <div class="card-stats"><strong>${esc(p.size || '面積請查詢')}</strong><span>${esc(price(p))}</span></div>
    <div class="tags">${tags}</div>
    ${b && !opts.hideBuilding ? `<p class="card-building-link"><a href="${buildingPath(b)}">大廈資料：${esc(b.name)} ↗</a></p>` : ''}
    <div class="card-foot"><a class="card-link" href="${href}">查看盤源 <span>↗</span></a><button class="compare-btn" type="button" data-id="${esc(p.id)}" data-label="${esc(`${p.name}（${p.propertyNo}）`)}" aria-pressed="false">＋ 比較</button></div>
  </article>`;
}
function buildingCard(b) {
  const saleN = b.sales.length, rentN = b.rents.length;
  const badge = [saleN ? `${saleN} 出售` : '', rentN ? `${rentN} 放租` : ''].filter(Boolean).join(' · ') || '資料整理中';
  const search = esc([b.name, b.nameEn, b.district, b.address, b.usages.join(' ')].filter(Boolean).join(' ')).toLowerCase();
  return `<a class="building-card" href="${buildingPath(b)}" data-search="${esc(search)}">
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
  const structured = jsonLd || JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: title, description, isPartOf: siteRef() },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '首頁', item: pageUrl('/') }] }
    ]
  });
  return `<!doctype html><html lang="zh-HK"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="keywords" content="${esc(keywords)}"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="${ogType}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="Queenie 商業地產搜尋">${publicOrigin ? `<meta property="og:image" content="${publicOrigin}/og-cover.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="zh_HK">` : ''}
<meta name="twitter:card" content="${publicOrigin ? 'summary_large_image' : 'summary'}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">${publicOrigin ? `<meta name="twitter:image" content="${publicOrigin}/og-cover.png">` : ''}
<link rel="stylesheet" href="/styles.css"><script type="application/ld+json">${structured}</script></head><body>
<a class="skip-link" href="#main">跳至主要內容</a>
<header class="site-header"><a class="brand" href="/"><span class="brand-mark">Q</span><span><b>QUEENIE</b><small>COMMERCIAL INDEX</small></span></a><nav><a class="${active==='buildings'?'active':''}" href="/buildings/">大廈</a><a class="${active==='listings'?'active':''}" href="/listings/">盤源</a><a href="/district/kwun-tong/">地區</a><a href="/usage/industrial/">用途</a><a class="nav-cta" href="${whatsappBase}">WhatsApp 查詢</a></nav></header>
<main id="main">${body}</main>
<footer class="site-footer"><div><span class="brand-footer">Q / COMMERCIAL INDEX</span><p>香港工商舖公開資料整理及查詢入口，並非任何大廈業主或管理處官方網站。資料來自公開來源，價格、盤況及面積請於聯絡前重新核對。</p></div><div class="footer-links"><a href="${agentPage}" rel="nofollow">原始代理公開頁</a><a href="/buildings/">全部大廈</a><a href="/listings/">全部盤源</a><a href="/market/">呎租參考</a><a href="/about/">關於 QueenieHub</a><a href="/methodology/">資料方法</a><a href="/contact/">聯絡</a><span>資料更新：${dataDate} 抓取</span></div></footer>
<div class="compare-bar" id="compareBar" hidden><div class="compare-info"><strong id="compareCount">0</strong><span>個盤源已選</span><div class="compare-list" id="compareList"></div></div><div class="compare-actions"><a class="primary-button" id="compareSend" href="#" target="_blank" rel="noopener">WhatsApp 一次查詢</a><button class="ghost-button" type="button" id="compareClear">清除</button></div></div>
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

  const bf = factsFor(b);
  const factList = bf ? [...facts, ...factRowsFor(bf)] : facts;
  const factSourceBlock = bf && Array.isArray(bf.sources) && bf.sources.length
    ? `<div class="entity-block"><h2>大廈客觀資料來源</h2><p>以下年份、層數、升降機及業權資料由公開物業資料庫交叉核對；數字有差異時保留較多來源一致嘅版本，並喺括號標示分歧。</p><ul class="source-list">${bf.sources.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="nofollow noopener">${esc(x.label)} ↗</a></li>`).join('')}</ul><p class="table-note">本頁唔會就未經核實嘅資料作推測；如發現資料有更新，歡迎透過 WhatsApp 通知我更正。</p></div>`
    : '';

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
  const districtMarket = market.districts.get(b.district);
  const dmSum = districtMarket ? marketSummary(districtMarket) : null;
  const marketCard = dmSum && dmSum.rentN >= 3
    ? `<div class="aside-card"><span class="eyebrow">同區呎租參考</span><h2>${esc(b.district)}放租中位數 ${hkd(dmSum.rentMedian)}／呎</h2><p>按本站 ${dmSum.rentN} 個${esc(b.district)}放租樣本計算，面積中位數約 ${Math.round(dmSum.rentSize).toLocaleString('en-HK')} 呎。只作比較起點，非估價。</p><a class="inline-link" href="/market/">睇全港呎租及呎價參考 ↗</a></div>`
    : '';

  const faqs = [];
  if (total) {
    faqs.push({
      q: `${b.name}現時有幾多個公開盤源？`,
      a: `截至 ${dataDate}，本站整理到 ${total} 個公開盤源${pieces.length ? `（${pieces.join('、')}）` : ''}；公開面積${rangeText(b)}，${priceSummary(b)}。盤源數目會隨代理更新而變動，查詢時建議再確認。`
    });
  }
  if (bf && bf.yearBuilt) {
    const bits = [`${bf.yearBuilt} 年落成${bf.yearNote ? `（${bf.yearNote}）` : ''}`];
    if (bf.floors) bits.push(`樓高 ${bf.floors}`);
    if (bf.grade) bits.push(`屬${bf.grade}`);
    faqs.push({ q: `${b.name}幾時落成？樓高幾層？`, a: `${b.name}${bits.join('，')}，地址為${b.district}${b.address ? ` ${b.address}` : ''}。` });
  }
  if (bf && (bf.lifts || bf.ac)) {
    const bits = [];
    if (bf.lifts) bits.push(`升降機配置為 ${bf.lifts}`);
    if (bf.ac) bits.push(`冷氣系統為${bf.ac}`);
    if (bf.ownership) bits.push(`業權為${bf.ownership}`);
    faqs.push({ q: `${b.name}嘅升降機、冷氣及業權係點？`, a: `${bits.join('，')}。資料由公開物業資料庫核對，實際情況請以管理處及代理最新說明為準。` });
  }
  if (bf && bf.mtr) {
    faqs.push({ q: `${b.name}交通方便嗎？`, a: `${b.name}鄰近${bf.mtr}，方便客戶及員工往返。實際步行時間會因出口及路線略有差異。` });
  }
  if (dmSum && dmSum.rentN >= 3 && b.rents.length) {
    faqs.push({
      q: `${b.name}嘅租金水平大概係點？`,
      a: `本站整理嘅${b.district}放租樣本（${dmSum.rentN} 個）呎租中位數約 ${hkd(dmSum.rentMedian)}／呎，面積中位數約 ${Math.round(dmSum.rentSize).toLocaleString('en-HK')} 呎，可用嚟同本頁放租盤源比較叫價。`
    });
  }
  faqs.push({
    q: `想睇${b.name}嘅盤或者問價，要點做？`,
    a: `可以透過本頁 WhatsApp 直接查詢，講清楚想要嘅面積、預算、用途同希望交吉日期，我會幫你核對最新盤況同安排睇樓。本頁並非大廈業主或管理處官方網站。`
  });
  const faqBlock = faqs.length >= 3
    ? `<div class="entity-block"><h2>${esc(b.name)}常見問題</h2><div class="faq">${faqs.map(f => `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('')}</div></div>`
    : '';

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
        ...(bf ? { additionalProperty: factRowsFor(bf).map(([name, value]) => ({ '@type': 'PropertyValue', name, value })) } : {}),
        ...(b.properties.length ? { containsPlace: b.properties.map(p => ({ '@type': 'Apartment', name: `${b.name} ${p.size || ''} ${categoryLabel(p)}`.trim(), url: pageUrl(listingPath(p)) })) } : {})
      },
      ...(faqs.length >= 3 ? [{
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      }] : []),
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
    ${bf ? `<h2 class="entity-subhead">位置、落成年份及大廈規格</h2><p class="entity-lede">${esc(factSentence(b, bf))}</p>` : ''}
    <h2 class="entity-subhead">大廈資料</h2>
    <div class="facts">${factList.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>
    ${unitTable(b)}
    <div class="entity-block">
      <h2>睇樓或落訂前，建議逐項核對</h2>
      <p>以下係工商物業常見但公開資料未必齊全嘅項目。呢個清單幫你問得準，唔代表本頁已核實相關數值。</p>
      <ul class="checklist">${checklist.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    ${faqBlock}
    <div class="entity-block">
      <h2>資料來源及身份說明</h2>
      <p>本頁資料整理自公開代理頁面，最後抓取日期為 ${dataDate}。QueenieHub 係獨立嘅公開資料整理及查詢入口，同${esc(b.name)}業主、管理處及發展商並無官方關係，亦唔代表任何一方發出要約。所有價格、面積及盤況以代理及業主最新確認為準。</p>
      <p><a class="inline-link" href="${agentPage}" rel="nofollow noopener" target="_blank">查看原始代理公開頁 ↗</a></p>
    </div>
    ${factSourceBlock}
  </div>
  <aside class="entity-aside">
    <div class="aside-card"><span class="eyebrow">快速查詢</span><h2>想要${esc(b.name)}嘅最新盤？</h2><p>講你想搵嘅面積、預算同用途，我哋可以直接幫你核對最新盤況。</p><a class="primary-button" href="${whatsappBuilding(b)}" target="_blank" rel="noopener">WhatsApp 楊佩儀</a></div>
    <div class="aside-card"><span class="eyebrow">同區索引</span><h2>${esc(b.district)}其他大廈</h2><div class="aside-links">${sameDistrict.slice(0,5).map(x=>`<a href="${buildingPath(x)}">${esc(x.name)} <span>${x.properties.length}</span></a>`).join('')}</div><a class="inline-link" href="/district/${districtSlug[b.district] || slug(b.district)}/">睇全部 ${esc(b.district)} 大廈 ↗</a></div>
    ${marketCard}
  </aside>
</section>
${listingBlocks.length ? `<section class="building-listings">${listingBlocks.join('')}</section>` : ''}
${sameDistrict.length ? `<section class="related"><div class="section-heading"><div><span class="section-label">NEARBY BUILDINGS</span><h2>${esc(b.district)}同區大廈</h2></div><a href="/buildings/">全部大廈 ↗</a></div><div class="building-grid">${sameDistrict.map(buildingCard).join('')}</div></section>` : ''}`;

  return layout({ title, description, canonical, body, active: 'buildings', jsonLd: JSON.stringify(graph), ogType: 'article', keywords: `${b.name}, ${b.nameEn || ''}, ${b.district}工廈, ${b.district}寫字樓, ${b.district}工商物業`.replace(/,\s*,/g,',') });
}

/* ---------- listing long copy ---------- */
function unitRateText(p) {
  const size = p.sizeValue;
  if (!Number.isFinite(size) || size <= 0) return '';
  if (p.category === 'rent') {
    const rent = num(p.rent);
    return rent ? `折合呎租約 $${Math.round(rent / size)}／呎` : '';
  }
  const sale = num(p.price);
  return sale ? `折合呎價約 $${Math.round((sale * 10000) / size)}／呎` : '';
}
function normSize(v) { return String(v || '').replace(/^約\s*/, '').trim(); }
function listingLongDesc(p, b, bf) {
  const core = [];
  const nameEn = b && b.nameEn ? `（${b.nameEn}）` : '';
  core.push(`${p.name}${nameEn}位於${p.district}${p.address ? ` ${p.address}` : ''}，屬${p.usage}用途，物業編號 ${p.propertyNo}。`);

  const unit = [];
  if (p.floor) unit.push(`位於${p.floor}`);
  const sizeText = normSize(p.size);
  if (sizeText) unit.push(`公開發布面積 ${sizeText}`);
  if (p.category === 'rent' && p.rent) unit.push(`月租 ${p.rent}`);
  else if (p.price) unit.push(`叫價 ${p.price}`);
  const rate = unitRateText(p);
  if (unit.length) core.push(`${unit.join('，')}${rate ? `，${rate}` : ''}。`);

  const building = [];
  if (bf) {
    const bits = [];
    if (bf.yearBuilt) bits.push(`${bf.yearBuilt} 年落成`);
    if (bf.floors) bits.push(`樓高 ${bf.floors}`);
    if (bf.lifts) bits.push(`設 ${bf.lifts}`);
    if (bf.mtr) bits.push(`鄰近${bf.mtr}`);
    if (bits.length) building.push(`所屬大廈${b.name}於 ${bits.join('、')}。`.replace('於 於','於'));
  } else if (b) {
    const dCount = buildings.filter(x => x.district === p.district).length;
    const dListings = rawData.filter(x => x.district === p.district).length;
    building.push(`所屬大廈${b.name}現有 ${b.properties.length} 個公開盤源，${p.district}同區另有 ${dCount} 幢大廈、${dListings} 個公開盤源可一併比較。`);
  }

  const tags = p.tags && p.tags.length ? `單位狀況標示為${p.tags.join('、')}。` : '';
  const dm = market.districts.get(p.district);
  const dmSum = dm ? marketSummary(dm) : null;
  let marketText = '';
  if (dmSum) {
    const isRent = p.category === 'rent';
    if ((isRent && dmSum.rentN >= 3) || (!isRent && dmSum.saleN >= 3)) {
      const med = isRent ? `$${Math.round(dmSum.rentMedian)}／呎` : `$${Math.round(dmSum.saleMedian).toLocaleString('en-HK')}／呎`;
      marketText = `${p.district}同類公開盤源${isRent ? '呎租' : '呎價'}中位數約 ${med}，可作議價參考。`;
    }
  }
  const closing = '面積、交吉期及盤況請於查詢時核對。';

  const optional = [tags, marketText].filter(Boolean);
  const render = (opts, tail) => core.concat(building, opts, [tail]).filter(Boolean).join('');
  let text = render(optional.concat([closing]));
  while (text.length > 205 && optional.length) {
    optional.pop();
    text = render(optional.concat([closing]));
  }
  return text;
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
  const bf = factsFor(b);
  const rentVal = num(p.rent);
  const saleVal = num(p.price);
  const offerPrice = p.category === 'rent' ? rentVal : (saleVal ? saleVal * 10000 : null);
  const accId = `${canonical}#accommodation`;
  const offerId = `${canonical}#offer`;

  const accommodation = {
    '@type': 'Accommodation',
    '@id': accId,
    name: `${b ? b.name : p.name}${p.floor ? ` ${p.floor}` : ''}${p.size ? ` ${p.size}` : ''}`.trim(),
    ...(p.sizeValue ? { floorSize: { '@type': 'QuantitativeValue', value: p.sizeValue, unitCode: 'FTK' } } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: p.address || (b && b.address) || '',
      addressLocality: p.district,
      addressRegion: '香港',
      addressCountry: 'HK'
    },
    ...(b ? {
      containedInPlace: {
        '@type': 'Place',
        '@id': `${pageUrl(buildingPath(b))}#place`,
        name: b.name,
        ...(b.nameEn ? { alternateName: b.nameEn } : {}),
        url: pageUrl(buildingPath(b))
      }
    } : {})
  };

  const offer = offerPrice ? {
    '@type': 'Offer',
    '@id': offerId,
    price: offerPrice,
    priceCurrency: 'HKD',
    availability: 'https://schema.org/InStock',
    url: canonical,
    itemOffered: { '@id': accId },
    ...(p.category === 'rent' ? {
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: offerPrice,
        priceCurrency: 'HKD',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' }
      }
    } : {})
  } : null;

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateListing',
        '@id': `${canonical}#listing`,
        url: canonical,
        name: `${p.name}${p.size ? ` ${p.size}` : ''}${categoryLabel(p)}（物業編號 ${p.propertyNo}）`,
        ...(p.publishDate ? { datePosted: String(p.publishDate).slice(0, 10) } : {}),
        dateModified: dataDate,
        identifier: { '@type': 'PropertyValue', propertyID: '物業編號', value: p.propertyNo },
        about: { '@id': accId },
        ...(offer ? { mainEntity: { '@id': offerId } } : {}),
        isPartOf: siteRef()
      },
      ...(offer ? [offer] : []),
      accommodation,
      {
        '@type': 'WebPage',
        url: canonical,
        name: `${b ? `${b.name}｜` : ''}${p.district}${p.usage}${categoryLabel(p)}｜${p.propertyNo}`,
        description: `${p.district}${p.usage}${categoryLabel(p)}公開資料：${p.name}，${p.size || '面積請查詢'}，${price(p)}。`,
        dateModified: dataDate,
        lastReviewed: dataDate,
        about: { '@id': accId },
        isPartOf: siteRef()
      },
      breadcrumbJson(crumb)
    ]
  });
}
function detail(p) {
  const b = p._building;
  const canonical = pageUrl(listingPath(p));
  const tags = p.tags.length ? p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('') : '<span class="tag muted">公開資料待核</span>';
  const fields = [['地區',p.district],['用途',p.usage],['樓層',p.floor||'公開資料未列明'],['面積',p.size||'公開資料未列明'],['物業編號',p.propertyNo],['廣告日期',p.publishDate?String(p.publishDate).slice(0,10):'公開資料未列明']];
  const crumb = [
    { label: '首頁', href: '/' },
    { label: p.district, href: `/district/${districtSlug[p.district] || slug(p.district)}` },
    ...(b ? [{ label: b.name, href: buildingPath(b) }] : []),
    { label: `${categoryLabel(p)} ${p.propertyNo}` }
  ];
  const body = `${breadcrumbHtml(crumb)}
<section class="detail-hero"><div class="detail-kicker">${esc(p.district)} / ${esc(categoryLabel(p))} / ${esc(p.usage)}</div><h1>${esc(`${p.name} ${normSize(p.size) || ""} ${categoryLabel(p)}`.replace(/\s+/g," ").trim())}${p.propertyNo ? `<span class="h1-no">${esc(p.propertyNo)}</span>` : ""}</h1><p class="lede">${esc(p.address)} · ${esc(p.size || '面積請查詢')} · ${esc(price(p))}</p>${b ? `<p class="hero-building">所屬大廈：<a href="${buildingPath(b)}">${esc(b.name)}${b.nameEn ? ` ${esc(b.nameEn)}` : ''} 大廈資料 ↗</a></p>` : ''}<div class="hero-actions"><a class="primary-button" href="${whatsapp(p)}" target="_blank" rel="noopener">WhatsApp 查詢 ↗</a><button class="secondary-button compare-btn" type="button" data-id="${esc(p.id)}" data-label="${esc(`${p.name}（${p.propertyNo}）`)}" aria-pressed="false">＋ 加入比較</button><a class="secondary-button" href="${agentPage}" target="_blank" rel="noopener">查看原始代理頁</a></div></section>
<section class="detail-grid"><div class="detail-main"><div class="section-label">公開盤源資料</div><div class="facts">${fields.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div><div class="detail-block"><h2>盤源特色</h2><div class="tags large">${tags}</div><p>以上內容由公開盤源資料整理，實際樓面面積、價格、盤況及可用日期請於聯絡代理前重新核對。</p></div><div class="detail-block"><h2>${esc(p.name)}嘅位置、面積及價格重點</h2><p>${esc(listingLongDesc(p, b, factsFor(b)))}</p></div><div class="detail-block"><h2>查詢時可以直接講</h2><p class="message-box">你好，我想查詢${esc(p.name)}（${esc(p.propertyNo)}），想了解最新${esc(categoryLabel(p))}狀況、實際面積、可用日期及睇樓安排。</p></div>${b ? `<div class="detail-block"><h2>關於${esc(b.name)}</h2><p>${esc(b.name)}${b.nameEn ? `（${esc(b.nameEn)}）` : ''}位於${esc(b.district)}${b.address ? ` ${esc(b.address)}` : ''}。呢幢大廈現時有 ${b.properties.length} 個公開盤源，包括 ${b.sales.length} 個出售及 ${b.rents.length} 個放租。</p><p><a class="inline-link" href="${buildingPath(b)}">睇${esc(b.name)}完整大廈資料、面積及價格範圍 ↗</a></p></div>` : ''}</div><aside class="detail-aside"><div class="aside-card"><span class="eyebrow">資料來源</span><h2>公開代理頁</h2><p>呢個頁面係搜尋及整理入口，唔代表代理已確認現時仍然有盤。</p><a href="${agentPage}" target="_blank" rel="nofollow noopener">前往原始頁面 ↗</a></div><div class="aside-card accent"><span class="eyebrow">想搵相近盤？</span><h2>講你想要嘅地區、面積同預算</h2><a class="primary-button" href="${whatsapp(p)}" target="_blank" rel="noopener">WhatsApp 楊佩儀</a></div></aside></section><section class="related"><div class="section-heading"><div><span class="section-label">繼續瀏覽</span><h2>${esc(p.district)} 其他公開盤源</h2></div><a href="/district/${districtSlug[p.district] || slug(p.district)}/">查看地區頁 ↗</a></div><div class="listing-grid">${rawData.filter(x=>x.district===p.district && x.id!==p.id).slice(0,3).map(card).join('')}</div></section>`;
  return layout({title:listingTitle(p),description:listingDesc(p),canonical,body,jsonLd:listingJson(p,canonical),ogType:'article'});
}

/* ---------- market reference (own sample statistics) ---------- */
function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function hkd(n) {
  if (n === null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-HK')}`;
}
const market = { districts: new Map(), groups: new Map() };
for (const p of rawData) {
  const size = p.sizeValue;
  if (!Number.isFinite(size) || size <= 0) continue;
  let unit = null;
  let kind = null;
  if (p.category === 'rent') {
    const rent = num(p.rent);
    if (rent) { unit = rent / size; kind = 'rent'; }
  } else if (p.category === 'sale') {
    const priceWan = num(p.price);
    if (priceWan) { unit = (priceWan * 10000) / size; kind = 'sale'; }
  }
  if (!kind) continue;
  if (!market.districts.has(p.district)) market.districts.set(p.district, { rent: [], sale: [], total: 0 });
  const dEntry = market.districts.get(p.district);
  dEntry.total += 1;
  dEntry[kind].push({ unit, size });
  const gk = `${p.district}||${p.usage}||${kind}`;
  if (!market.groups.has(gk)) market.groups.set(gk, { district: p.district, usage: p.usage, kind, units: [], sizes: [], count: 0 });
  const g = market.groups.get(gk);
  g.count += 1;
  g.units.push(unit);
  g.sizes.push(size);
}
function marketSummary(entry) {
  return {
    rentN: entry.rent.length,
    rentMedian: median(entry.rent.map(x => x.unit)),
    rentSize: median(entry.rent.map(x => x.size)),
    saleN: entry.sale.length,
    saleMedian: median(entry.sale.map(x => x.unit)),
    saleSize: median(entry.sale.map(x => x.size))
  };
}
function districtMarketRows() {
  return [...market.districts.entries()]
    .map(([district, entry]) => ({ district, ...marketSummary(entry) }))
    .filter(row => row.rentN >= 3 || row.saleN >= 3)
    .sort((a, c) => (c.rentN + c.saleN) - (a.rentN + a.saleN));
}
function marketPage() {
  const rows = districtMarketRows();
  const groupRows = [...market.groups.values()]
    .filter(g => g.count >= 3)
    .map(g => ({
      district: g.district,
      usage: g.usage,
      kind: g.kind,
      count: g.count,
      unitMedian: median(g.units),
      sizeMedian: median(g.sizes)
    }))
    .sort((a, c) => (a.kind === c.kind ? c.count - a.count : a.kind === 'rent' ? -1 : 1));

  const mainTable = `<div class="table-wrap"><table class="unit-table"><thead><tr><th>地區</th><th>放租樣本</th><th>呎租中位數</th><th>放租面積中位數</th><th>出售樣本</th><th>呎價中位數</th></tr></thead><tbody>${rows.map(r => `<tr>
      <td><a href="/district/${districtSlug[r.district] || slug(r.district)}/">${esc(r.district)}</a></td>
      <td>${r.rentN || '—'}</td>
      <td>${r.rentN >= 3 ? `${hkd(r.rentMedian)}／呎` : '樣本不足'}</td>
      <td>${r.rentN >= 3 && r.rentSize ? `約 ${Math.round(r.rentSize).toLocaleString('en-HK')} 呎` : '—'}</td>
      <td>${r.saleN || '—'}</td>
      <td>${r.saleN >= 3 ? `${hkd(r.saleMedian)}／呎` : '樣本不足'}</td>
    </tr>`).join('')}</tbody></table></div>`;

  const groupTable = `<div class="table-wrap"><table class="unit-table"><thead><tr><th>地區</th><th>公開用途</th><th>類型</th><th>樣本數</th><th>呎租／呎價中位數</th><th>面積中位數</th></tr></thead><tbody>${groupRows.map(g => `<tr>
      <td>${esc(g.district)}</td>
      <td>${esc(g.usage)}</td>
      <td>${g.kind === 'rent' ? '放租' : '出售'}</td>
      <td>${g.count}</td>
      <td>${g.kind === 'rent' ? `${hkd(g.unitMedian)}／呎` : `${hkd(g.unitMedian)}／呎`}</td>
      <td>${g.sizeMedian ? `約 ${Math.round(g.sizeMedian).toLocaleString('en-HK')} 呎` : '—'}</td>
    </tr>`).join('')}</tbody></table></div>`;

  const crumb = [{ label: '首頁', href: '/' }, { label: '呎租及呎價參考' }];
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl('/market')}#webpage`,
        url: pageUrl('/market'),
        name: '香港工商物業呎租及呎價參考｜觀塘、長沙灣、屯門｜QueenieHub',
        description: '根據本站 2026-11-08 整理嘅 126 個公開盤源，計算各地區及用途嘅呎租與呎價中位數，附樣本數及限制說明。',
        isPartOf: siteRef()
      },
      breadcrumbJson(crumb)
    ]
  };

  const body = `${breadcrumbHtml(crumb)}
<section class="page-intro"><span class="section-label">MARKET SNAPSHOT / ${dataDate}</span><h1>呎租同呎價，<br><em>大概喺咩水平？</em></h1><p>用本站整理嘅 ${rawData.length} 個公開盤源，自己計出各地區同用途嘅中位數。目的唔係報價，而係令你睇盤之前有個合理範圍，知道邊個叫價偏離市場。</p><a class="primary-button" href="/buildings/">由大廈開始睇</a></section>
<section class="entity-body market-body"><div class="entity-main">
  <div class="section-label">BY DISTRICT</div>
  <h2>各地區呎租及呎價中位數</h2>
  <p class="entity-lede">只列出樣本足夠嘅地區。樣本少過 3 個嘅地區唔顯示中位數，避免用一兩個盤代表整個區。</p>
  ${mainTable}
  <p class="table-note">呎租＝公開月租 ÷ 公開面積；呎價＝公開售價 ÷ 公開面積。面積以公開資料標示嘅建築面積為主，未換算實用面積。</p>
  <h2 class="entity-subhead">按用途拆開睇</h2>
  <p class="entity-lede">同一個區，工廈同寫字樓嘅呎租可以差好遠。以下只列樣本 3 個以上嘅組合。</p>
  ${groupTable}
  <div class="entity-block"><h2>點樣用呢啲數字</h2>
    <p>第一，睇盤時先計一次呎租或呎價，再同表中位數比較。明顯高過中位數，就要問清楚係咪有裝修、海景、大電、或者包含其他條件。</p>
    <p>第二，建築面積同實用面積可以相差一至三成。呢度用公開標示面積計算，如果代理提供實用面積，記得重新計一次。</p>
    <p>第三，中位數只反映「叫價」，唔等於成交價。真正成交要睇樓層、坐向、交吉期同業主意向，所以呢頁只可以當起點，唔可以當估價。</p>
  </div>
  <div class="entity-block"><h2>資料限制</h2>
    <p>本頁統計來自 ${dataDate} 抓取嘅公開代理資料，屬單一代理盤源樣本，並非全港成交數據，亦唔係估價報告。同一幢大廈可能有多個盤源被重複計算，樣本數少嘅組合波動會較大。任何議價或落訂決定，請以代理及業主最新確認為準。</p>
  </div>
</div>
<aside class="entity-aside">
  <div class="aside-card accent"><span class="eyebrow">想核對實際叫價？</span><h2>講出地區、面積同預算</h2><p>我可以幫你對返現有公開盤源，睇下邊個接近市場水平。</p><a class="primary-button" href="${whatsappBase}" target="_blank" rel="noopener">WhatsApp 查詢</a></div>
  <div class="aside-card"><span class="eyebrow">快速入口</span><h2>熱門地區</h2><div class="aside-links">${rows.slice(0, 6).map(r => `<a href="/district/${districtSlug[r.district] || slug(r.district)}/">${esc(r.district)} <span>${r.rentN + r.saleN} 個樣本</span></a>`).join('')}</div></div>
</aside></section>`;

  return layout({ title: '香港工商物業呎租及呎價參考｜觀塘、長沙灣、屯門｜QueenieHub', description: `根據 ${rawData.length} 個公開盤源計算香港工商物業呎租及呎價中位數，按地區及用途列出樣本數、面積中位數及資料限制。`, canonical: pageUrl('/market'), body, jsonLd: JSON.stringify(graph), keywords: '工商物業呎租, 工廈呎租, 寫字樓呎租, 觀塘呎租, 長沙灣呎租, 呎價參考' });
}

/* ---------- index pages ---------- */
function buildingsIndex() {
  const byDistrict = new Map();
  for (const b of buildings) {
    if (!byDistrict.has(b.district)) byDistrict.set(b.district, []);
    byDistrict.get(b.district).push(b);
  }
  const ordered = [...byDistrict.entries()].sort((a,c) => c[1].length - a[1].length);
  const jumps = ordered.map(([d]) => `<a class="jump-chip" href="#d-${esc(districtSlug[d] || slug(d))}" data-jump="d-${esc(districtSlug[d] || slug(d))}">${esc(d)}</a>`).join('');
  const groups = ordered.map(([d, list]) => {
    const anchor = `d-${districtSlug[d] || slug(d)}`;
    return `<div class="building-group" id="${esc(anchor)}" data-building-group><div class="section-heading"><div><span class="section-label">${esc((districtSlug[d] || '').toUpperCase())}</span><h2>${esc(d)}大廈</h2></div><a href="/district/${districtSlug[d] || slug(d)}/">${esc(d)}樓盤頁 ↗</a></div><div class="building-grid">${list.map(buildingCard).join('')}</div></div>`;
  }).join('');
  const body = `<section class="page-intro compact"><span class="section-label">BUILDING INDEX / ${buildings.length}</span><h1>香港工商大廈索引</h1><p>由大廈開始搵：先睇地址、用途、面積及價格範圍，再睇呢幢大廈現有嘅公開出售同放租盤源。</p></section>
<section class="filter-panel buildings-filter" aria-label="大廈搜尋"><div class="search-field"><span>⌕</span><input id="buildingSearch" type="search" placeholder="搜尋大廈名、英文名、地區或街道" autocomplete="off"></div><div class="jump-chips">${jumps}</div></section>
<section class="results-head"><strong id="buildingCount">${buildings.length} 幢大廈</strong><span>按盤源數量排序</span></section>
<section class="building-listings">${groups}</section><p class="empty-state" id="buildingEmpty" hidden>未搵到符合嘅大廈。試下輸入大廈名一部分，或直接揀地區。</p>
<section class="notice"><strong>資料說明</strong><p>本索引整理自公開代理資料，最後抓取日期為 ${dataDate}。大廈名稱、地址及盤源數目會隨公開資料更新而變化；本頁並非任何大廈業主或管理處官方網站。</p></section>`;
  const idxGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl('/buildings')}#page`,
        url: pageUrl('/buildings'),
        name: '香港工商大廈索引',
        description: `香港 ${buildings.length} 幢工商大廈索引，可按地區、用途及盤源數量瀏覽。`,
        isPartOf: siteRef()
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl('/buildings')}#list`,
        numberOfItems: buildings.length,
        itemListElement: buildings.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, url: pageUrl(buildingPath(x)) }))
      },
      breadcrumbJson([{ label: '首頁', href: '/' }, { label: '全部大廈' }])
    ]
  };

  return layout({title:`香港工商大廈索引｜${buildings.length} 幢大廈資料及盤源｜QueenieHub`,description:`按大廈瀏覽香港工商物業：觀塘、長沙灣、屯門、葵涌、黃竹坑等 ${buildings.length} 幢大廈嘅地址、面積範圍、出售及放租公開盤源，附查詢方法。`,canonical:pageUrl('/buildings'),body,active:'buildings',keywords:'香港工商大廈, 工廈索引, 觀塘工廈, 長沙灣工廈, 屯門工廈, 寫字樓', jsonLd: JSON.stringify(idxGraph)});
}
function listingsPage() {
  const body = `${breadcrumbHtml([{ label: '首頁', href: '/' }, { label: '全部盤源' }])}<section class="page-intro compact"><span class="section-label">PUBLIC LISTINGS / ${rawData.length}</span><h1>全部公開盤源</h1><p>用地區、用途、出售／放租或關鍵字，快速縮窄你要搵嘅工商舖選項。</p></section>${filterPanel()}<section class="results-head"><strong id="resultCount">${rawData.length} 個公開項目</strong><span>價格及盤況請重新核對</span></section><section class="listing-grid" id="listingGrid">${rawData.map(card).join('')}</section><p class="empty-state" id="emptyState" hidden>未搵到符合條件嘅公開項目。試下放寬地區、用途或搜尋字詞。</p>`;
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
  const body = `${breadcrumbHtml([{ label: '首頁', href: '/' }, { label: isDistrict ? value : `${value}盤源` }])}<section class="page-intro"><span class="section-label">${isDistrict?'AREA INDEX':'USAGE INDEX'}</span><h1>${esc(value)}<br><em>${isDistrict?'大廈及盤源':'盤源分類'}</em></h1><p>${esc(description)}</p><a class="primary-button" href="/listings/">查看全部盤源</a></section>${isDistrict && bList.length ? `<section class="featured-section"><div class="section-heading"><div><span class="section-label">BUILDINGS</span><h2>${esc(value)}大廈</h2></div><a href="/buildings/">全部大廈 ↗</a></div><div class="building-grid">${bList.map(buildingCard).join('')}</div></section>` : ''}<section class="results-head"><strong>${list.length} 個公開項目</strong><span>資料需重新核對</span></section><section class="listing-grid">${list.map(card).join('')}</section><section class="notice"><strong>資料提醒</strong><p>呢度係公開資料整理入口，唔係實時庫存保證，亦非任何大廈業主或管理處官方網站。價格、面積、盤況及可用日期請直接向代理核對。</p></section>`;
  const pathName = isDistrict ? `/district/${dSlug}` : `/usage/${usageSlug[value] || slug(value)}`;
  return layout({title,description,canonical:pageUrl(pathName),body});
}


function aboutPage() {
  const body = `${breadcrumbHtml([{label:'首頁',href:'/'},{label:'關於 QueenieHub'}])}
<section class="page-intro"><span class="section-label">ABOUT QUEENIEHUB</span><h1>香港商業地產，由大廈資料開始。</h1><p>QueenieHub 係一個以香港工商大廈為核心嘅公開資料整理及查詢入口，協助客人先了解地區、大廈、用途、面積及叫價，再直接向代理核對最新盤況。</p></section>
<section class="entity-block"><h2>我哋提供咩</h2><p>網站將「大廈」放喺第一層，盤源放喺第二層。你可以先睇日昇亞太中心、勵豐中心等大廈資料，再比較同一幢大廈嘅放租及出售盤源，減少只見單一廣告而難以比較嘅問題。</p><p>目前網站整理觀塘、長沙灣、屯門、九龍灣、黃竹坑、油塘及其他地區嘅公開工商物業資料。</p></section>
<section class="entity-block"><h2>資料透明度</h2><p>資料來自公開代理頁面及公開物業資料來源。叫價、面積、盤況、管理費、用途限制、交吉期及可用性都可能改變；網站唔係業主、管理處或任何大廈官方網站，聯絡前請重新核對。</p><p>如你發現某項公開資料需要更新，可以透過 WhatsApp 通知 Queenie，並提供物業編號或大廈名稱。</p></section>`;
  return layout({title:'關於 QueenieHub｜香港工商大廈及商業地產公開資料入口',description:'了解 QueenieHub 點樣整理香港工商大廈、工廈、寫字樓及商業地產公開資料，並以大廈為核心協助客人比較盤源。',canonical:pageUrl('/about'),body,keywords:'QueenieHub,香港商業地產,香港工商大廈,工廈,寫字樓,盤源資料'});
}
function methodPage() {
  const body = `${breadcrumbHtml([{label:'首頁',href:'/'},{label:'資料方法'}])}
<section class="page-intro"><span class="section-label">DATA METHOD</span><h1>資料點樣整理，同你講清楚。</h1><p>網站唔會將估計當成事實。每一頁都分開「公開盤源資料」、「大廈客觀資料」同「仍需向代理核對」三部分。</p></section>
<section class="entity-block"><h2>整理流程</h2><ol class="source-list"><li>由公開代理頁面整理物業編號、地區、用途、出售／放租、面積、價格及廣告日期。</li><li>將同一幢大廈嘅盤源聚合，建立大廈頁、地區頁、用途頁及獨立盤源頁。</li><li>對落成年份、層數、升降機等資料，只有在公開來源交叉核對後才會放入客觀資料區。</li><li>網站會明確提示價格、盤況、面積及可用性需要重新核對，唔將舊快照當成即時保證。</li></ol></section>
<section class="entity-block"><h2>快照及限制</h2><p>本次資料快照日期：${dataDate}。網站係搜尋及比較入口，唔係實時交易系統，亦唔代表任何盤源一定仍然有效。AI、搜尋器或客人引用資料時，都應以代理最新確認為準。</p></section>`;
  return layout({title:'資料方法｜香港工商大廈及盤源公開資料整理與核對原則說明網站',description:'QueenieHub 解釋香港工商大廈及盤源資料來源、整理方法、交叉核對原則、資料快照日期及價格盤況限制。',canonical:pageUrl('/methodology'),body,keywords:'商業地產資料方法,香港工廈資料,寫字樓盤源,物業資料核對'});
}
function contactPage() {
  const body = `${breadcrumbHtml([{label:'首頁',href:'/'},{label:'聯絡 Queenie'}])}
<section class="page-intro"><span class="section-label">CONTACT</span><h1>講你想搵邊區、咩用途、幾大面積。</h1><p>你可以先講地區、工廈／寫字樓／商舖、出售定放租、預算及大約面積，Queenie 再按公開盤源同你核對。</p><div class="hero-actions"><a class="primary-button" href="${whatsappBase}?text=${encodeURIComponent('你好，我想查詢香港商業地產。地區／用途／出售或放租／面積或預算：')}">WhatsApp 查詢 ↗</a><a class="secondary-button dark" href="/listings/">先睇全部盤源</a></div></section>
<section class="entity-block"><h2>查詢時可以提供</h2><ul class="source-list"><li>想搵嘅地區，例如觀塘、九龍灣、長沙灣。</li><li>用途，例如工廈、寫字樓、商舖或工作室。</li><li>出售／放租、預算、面積及樓層要求。</li><li>如果已經睇中某個盤，直接提供物業編號會最快。</li></ul></section>`;
  return layout({title:'聯絡 Queenie｜香港工廈、寫字樓及商業盤源查詢入口網站',description:'聯絡 Queenie 查詢觀塘、九龍灣、長沙灣等香港工商大廈、工廈、寫字樓及商業物業公開盤源。',canonical:pageUrl('/contact'),body,keywords:'聯絡Queenie,香港工廈查詢,觀塘寫字樓,商業物業放租'});
}

function notFoundPage() {
  const body = `<section class="page-intro"><span class="section-label">404 / NOT FOUND</span><h1>搵唔到呢一頁。</h1><p>個別盤源可能已經下架，或者網址打錯。你可以由大廈索引或全部盤源重新開始。</p><div class="hero-actions"><a class="primary-button" href="/buildings/">睇全部大廈</a><a class="secondary-button dark" href="/listings/">睇全部盤源</a></div></section><section class="featured-section"><div class="section-heading"><div><span class="section-label">START HERE</span><h2>熱門地區大廈</h2></div><a href="/buildings/">全部大廈 ↗</a></div><div class="building-grid">${buildings.slice(0, 6).map(buildingCard).join('')}</div></section>`;
  return layout({ title: '搵唔到呢一頁｜香港工商大廈索引及公開盤源｜QueenieHub', description: '此頁面不存在或盤源可能已下架。由香港工商大廈索引或全部公開盤源重新開始，按地區、用途、面積及價格搵合適工商物業。', canonical: pageUrl('/404.html'), body, keywords: '香港工商大廈, 工廈, 寫字樓, 盤源索引' });
}

/* ---------- build ---------- */
fs.rmSync(dist,{recursive:true,force:true}); mkdir(dist);
write(path.join(dist,'styles.css'), fs.readFileSync(path.join(root,'styles.css'),'utf8'));
write(path.join(dist,'app.js'), fs.readFileSync(path.join(root,'app.js'),'utf8'));
const publicDir = path.join(root, 'public');
for (const file of fs.readdirSync(publicDir)) {
  if (file === 'manus-routes.json') continue;
  fs.copyFileSync(path.join(publicDir, file), path.join(dist, file));
}
write(path.join(dist,'index.html'), home());
write(path.join(dist,'buildings/index.html'), buildingsIndex());
write(path.join(dist,'listings/index.html'), listingsPage());
write(path.join(dist,'market/index.html'), marketPage());
write(path.join(dist,'about/index.html'), aboutPage());
write(path.join(dist,'methodology/index.html'), methodPage());
write(path.join(dist,'contact/index.html'), contactPage());
for (const b of buildings) write(path.join(dist,`building/${b.slug}/index.html`), buildingPage(b));
for (const p of rawData) {
  const html = detail(p);
  write(path.join(dist, `listing/${shortListingSlug(p)}/index.html`), html);
  // 舊中文網址保留，指回新網址，避免舊連結失效
  write(path.join(dist, `listing/${p.slug}/index.html`), html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl(listingPath(p))}"><meta name="robots" content="noindex,follow">`));
  // 短網址：方便社交平台貼連結，指向原始盤源頁
  const alias = html
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl(listingPath(p))}"><meta name="robots" content="noindex,follow">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(`${p.name} ${p.size || ''} ${categoryLabel(p)}｜${p.propertyNo}`)}</title>`);
  write(path.join(dist, `p/${shortListingSlug(p)}/index.html`), alias);
}
for (const [d, dSlug] of Object.entries(districtSlug)) write(path.join(dist,`district/${dSlug}/index.html`), aggregatePage('district', d, rawData.filter(p=>p.district===d)));
for (const [u, uSlug] of Object.entries(usageSlug)) write(path.join(dist,`usage/${uSlug}/index.html`), aggregatePage('usage', u, rawData.filter(p=>p.usage===u)));
write(path.join(dist,'404.html'), notFoundPage());

const allPages = [
  { path: '/', title: 'QueenieHub 香港工商大廈索引' },
  { path: '/buildings/', title: '全部大廈' },
  ...buildings.map(b => ({ path: buildingPath(b), title: b.name })),
  ...Object.values(districtSlug).map(s => ({ path: `/district/${s}/`, title: '地區大廈及盤源' })),
  { path: '/listings/', title: '全部公開盤源' },
  { path: '/market/', title: '呎租及呎價參考' },
  { path: '/about/', title: '關於 QueenieHub' },
  { path: '/methodology/', title: '資料方法' },
  { path: '/contact/', title: '聯絡 Queenie' },
  ...rawData.map(p => ({ path: listingPath(p), title: `${p.name} ${p.propertyNo}` })),
  ...Object.values(usageSlug).map(s => ({ path: `/usage/${s}/`, title: '用途盤源' }))
];
write(path.join(dist,'manus-routes.json'), JSON.stringify({ routes: allPages }));
const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider'];
write(path.join(dist,'robots.txt'), [
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
  '',
  ...aiBots.flatMap(bot => [`User-agent: ${bot}`, 'Allow: /', '']),
  publicOrigin ? `Sitemap: ${publicOrigin}/sitemap.xml` : '',
  ''
].join('\n'));

write(path.join(dist,'llms.txt'), [
  '# QueenieHub — 香港工商大廈及盤源索引',
  '',
  '> 由香港工商物業代理 Queenie 楊佩儀維護嘅公開資料整理入口，以「大廈」為第一層實體，盤源為第二層。資料整理自公開代理頁面，價格及盤況需向代理重新核對。',
  '',
  `## 主要頁面`,
  `- [香港工商大廈索引](${pageUrl('/buildings')}): ${buildings.length} 幢大廈，含地址、落成年份、層數、升降機及面積範圍`,
  `- [全部公開盤源](${pageUrl('/listings')}): ${rawData.length} 個出售、放租及新盤項目`,
  `- [呎租及呎價參考](${pageUrl('/market')}): 按地區及用途嘅中位數，附樣本數`,
  `- [原始代理公開頁](${agentPage}): 資料原始來源`,
  '',
  '## 資料說明',
  `- 最後抓取日期：${dataDate}`,
  `- 大廈數目：${buildings.length}；盤源數目：${rawData.length}`,
  '- 本網站並非任何大廈業主、管理處或發展商官方網站，亦不代表任何代理發出要約。',
  '- 面積為公開標示嘅建築面積；呎租＝月租÷面積，呎價＝售價÷面積。',
  ''
].join('\n'));
write(path.join(dist,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allPages.map(p=>`<url><loc>${pageUrl(p.path)}</loc><lastmod>${dataDate}</lastmod></url>`).join('')}</urlset>`);
console.log(`Built ${allPages.length} pages (${buildings.length} buildings, ${rawData.length} listings) into ${dist}`);
