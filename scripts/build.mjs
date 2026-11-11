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
const districtStations = { '觀塘':['觀塘站','牛頭角站'], '九龍灣':['九龍灣站','啟德站'], '長沙灣':['荔枝角站','長沙灣站'], '屯門':['屯門站','兆康站'], '黃竹坑':['黃竹坑站'], '油塘':['油塘站'], '新蒲崗':['鑽石山站'], '葵涌':['葵興站','葵芳站'], '荃灣':['荃灣站','荃灣西站'], '大角咀':['奧運站'], '太子':['太子站'], '佐敦':['佐敦站'], '粉嶺':['粉嶺站'], '尖沙咀':['尖沙咀站'], '銅鑼灣':['銅鑼灣站'], '中環':['中環站'], '灣仔':['灣仔站'], '石門':['石門站'] };
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
    <div class="card-top"><span class="eyebrow">${esc(p.district)} · ${esc(categoryLabel(p))}</span><span class="card-top-right"><span class="code">${esc(p.propertyNo)}</span>${freshBadge(p)}</span></div>
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
  const ga4 = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-70S2C66S4E"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-70S2C66S4E');</script>`;
  return `<!doctype html><html lang="zh-HK"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="keywords" content="${esc(keywords)}"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="${ogType}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="Queenie 商業地產搜尋">${publicOrigin ? `<meta property="og:image" content="${publicOrigin}/og-cover.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="zh_HK">` : ''}
<meta name="twitter:card" content="${publicOrigin ? 'summary_large_image' : 'summary'}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">${publicOrigin ? `<meta name="twitter:image" content="${publicOrigin}/og-cover.png">` : ''}
<link rel="stylesheet" href="/styles.css">${ga4}<script type="application/ld+json">${structured}</script></head><body>
<a class="skip-link" href="#main">跳至主要內容</a>
<header class="site-header"><a class="brand" href="/"><span class="brand-mark">Q</span><span><b>QUEENIE</b><small>COMMERCIAL INDEX</small></span></a><nav><a class="${active==='tools'?'active':''}" href="/match/">配對</a><a class="${active==='buildings'?'active':''}" href="/buildings/">大廈</a><a class="${active==='listings'?'active':''}" href="/listings/">盤源</a><a href="/compare/">比較</a><a class="${active==='guides'?'active':''}" href="/guides/">指南</a><a class="nav-cta" href="${whatsappBase}">WhatsApp 查詢</a></nav></header>
<main id="main">${body}</main>
<footer class="site-footer"><div><span class="brand-footer">Q / COMMERCIAL INDEX</span><p>香港工商舖公開資料整理及查詢入口，並非任何大廈業主或管理處官方網站。資料來自公開來源，價格、盤況及面積請於聯絡前重新核對。</p></div><div class="footer-links"><a href="${agentPage}" rel="nofollow">原始代理公開頁</a><a href="/buildings/">全部大廈</a><a href="/listings/">全部盤源</a><a href="/market/">呎租參考</a><a href="/match/">配對器</a><a href="/budget/">預算計算器</a><a href="/compare/">大廈比較</a><a href="/brief/">查詢 Brief</a><a href="/use/">按用途搵盤</a><a href="/guides/">指南</a><a href="/about/">關於 QueenieHub</a><a href="/methodology/">資料方法</a><a href="/contact/">聯絡</a><a href="/kwun-tong-industrial-for-rent/">觀塘工廈放租</a><a href="/kwun-tong-office-for-rent/">觀塘寫字樓放租</a><a href="/kowloon-bay-office/">九龍灣寫字樓</a><a href="/cheung-sha-wan-industrial-for-sale/">長沙灣工廈出售</a><a href="/tuen-mun-industrial-for-rent/">屯門工廈放租</a><a href="/wong-chuk-hang-commercial/">黃竹坑商業地產</a><span>資料更新：${dataDate} 抓取</span></div></footer>
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
    <div class="entity-block">
      <h2>${esc(b.name)}位置及交通</h2>
      <p>地址：${esc(b.district)}${b.address ? `，${esc(b.address)}` : ''}${b.zone ? `（${esc(b.zone)}）` : ''}。${bf && bf.mtr ? `最近港鐵：${esc(bf.mtr)}（公開資料）。` : (districtStations[b.district] ? `本區主要港鐵站：${districtStations[b.district].map(esc).join('、')}，實際步行時間視乎大廈位置及出入口。` : '')}</p>
      <p>公開資料顯示用途為 ${b.usages.length ? esc(b.usages.join('、')) : '未列明'}。實際可否作辦公室、工作室、零售或特定行業使用，要視乎地契、大廈公契、屋宇署批准用途及消防要求，租或買之前應該逐項確認。</p>
      <div class="hero-actions"><a class="secondary-button dark" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.name, b.address, b.district, 'Hong Kong'].filter(Boolean).join(' '))}" target="_blank" rel="noopener nofollow">Google 地圖路線 ↗</a>${(intents.find(i=>i.district===b.district)) ? `<a class="secondary-button dark" href="/${intents.find(i=>i.district===b.district).slug}/">${esc(intents.find(i=>i.district===b.district).h1)} ↗</a>` : ''}</div>
      <p class="table-note">地址及港鐵資料整理自公開來源；步行時間只作參考，實際路線請用 Google 地圖確認。</p>
    </div>
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
  const fields = [['地區',p.district],['用途',p.usage],['樓層',p.floor||'公開資料未列明'],['面積',p.size||'公開資料未列明'],['物業編號',p.propertyNo],['廣告日期',p.publishDate?String(p.publishDate).slice(0,10):'公開資料未列明'],['資料新鮮度',freshLabel(p).label]];
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
  const body = `<section class="hero"><div class="hero-copy"><span class="eyebrow inverse">QUEENIE / COMMERCIAL INDEX</span><h1>由大廈開始，<br>搵到啱你<em>做生意</em>嘅地方。</h1><p>先睇大廈嘅地址、用途、面積同價格範圍，再睇呢幢大廈現有嘅出售同放租盤源。唔使逐個 listing 猜。</p><a class="hero-cta" href="/buildings/">睇全部大廈 <span>↗</span></a></div><div class="hero-aside"><div class="orbit"><span class="orbit-dot dot-a"></span><span class="orbit-dot dot-b"></span><span class="orbit-dot dot-c"></span><div><b>${buildings.length}</b><small>BUILDINGS<br>INDEXED</small></div></div><p>公開資料整理及查詢入口，並非任何大廈業主或管理處官方網站。</p></div></section><section class="featured-section"><div class="section-heading"><div><span class="section-label">START WITH BUILDINGS</span><h2>先揀一幢大廈</h2></div><a href="/buildings/">全部大廈 ↗</a></div><div class="building-grid">${featuredBuildings.map(buildingCard).join('')}</div></section><section class="tool-strip"><div class="section-heading"><div><span class="section-label">TOOLS</span><h2>唔想逐個盤睇？用工具收窄</h2></div><a href="/match/">開始配對 ↗</a></div><div class="tool-strip-grid"><a class="tool-tile" href="/match/"><span>01</span><strong>物業配對器</strong><small>六個問題，睇最接近嘅盤</small></a><a class="tool-tile" href="/budget/"><span>02</span><strong>租金預算</strong><small>計月租、按金、佣金</small></a><a class="tool-tile" href="/compare/"><span>03</span><strong>大廈比較</strong><small>最多四幢並排對比</small></a><a class="tool-tile" href="/brief/"><span>04</span><strong>查詢 Brief</strong><small>列印睇樓清單</small></a><a class="tool-tile" href="/use/"><span>05</span><strong>按業務搵盤</strong><small>電商、物流、工作室</small></a></div></section><section class="intent-section"><div class="section-heading"><div><span class="section-label">POPULAR SEARCHES</span><h2>最多人搵嘅組合</h2></div><a href="/listings/">全部盤源 ↗</a></div><div class="intent-strip">${intents.map(i => `<a class="intent-chip" href="/${i.slug}/"><strong>${esc(i.h1)}</strong><span>${esc(i.district)} · 面積及呎租參考 ↗</span></a>`).join('')}</div></section><section class="district-section"><div class="section-heading"><div><span class="section-label">BROWSE BY AREA</span><h2>按地區搵大廈</h2></div><a href="/listings/">全部盤源 ↗</a></div><div class="district-grid">${districtCards}</div></section><section class="featured-section"><div class="section-heading"><div><span class="section-label">FRESH LISTINGS</span><h2>最新公開盤源</h2></div><a href="/listings/">開啟完整篩選 ↗</a></div><div class="listing-grid">${featuredListings.map(card).join('')}</div></section><section class="trust-strip"><div><span class="section-label">HOW IT WORKS</span><h2>由大廈資料到聯絡，唔使兜路。</h2></div><div class="steps"><span><b>01</b>揀大廈睇概況</span><span><b>02</b>比較面積同價格</span><span><b>03</b>WhatsApp 核對盤況</span></div></section>`;
  return layout({title:'香港工商大廈及盤源索引｜觀塘工廈、寫字樓、商舖｜QueenieHub',description:'由大廈開始搵香港工商物業：大廈地址、用途、面積及價格範圍，附現有出售及放租公開盤源。資料更新 2026-11-08。',canonical:pageUrl('/'),body,keywords:'香港工商大廈, 香港工廈, 觀塘工廈, 寫字樓放租, 工商舖'});
}
function aggregatePage(type, value, list) {
  const isDistrict = type === 'district';
  const dSlug = districtSlug[value] || slug(value);
  const bList = isDistrict ? buildings.filter(b => b.district === value) : [];
  const relatedIntents = isDistrict ? intents.filter(i => i.district === value) : [];
  const intentBlock = relatedIntents.length
    ? `<section class="entity-block"><h2>${esc(value)}熱門搜尋</h2><ul class="source-list">${relatedIntents.map(i => `<li><a href="/${i.slug}/">${esc(i.title.replace('｜QueenieHub', ''))}</a></li>`).join('')}</ul></section>`
    : '';
  const title = isDistrict
    ? `${value}工廈及寫字樓大廈索引及盤源｜${bList.length} 幢大廈｜QueenieHub`
    : `${value}出售及放租公開盤源｜${list.length} 個工商物業項目｜QueenieHub`;
  const description = isDistrict
    ? `${value}工商物業大廈索引：${bList.length} 幢大廈嘅地址、用途、面積範圍及價格概況，並列出 ${list.length} 個公開出售及放租盤源。`
    : `${value}公開盤源共 ${list.length} 個項目，按面積、價格及出售或放租瀏覽，每項附所屬大廈地址、面積範圍及 WhatsApp 查詢方法。`;
  const body = `${breadcrumbHtml([{ label: '首頁', href: '/' }, { label: isDistrict ? value : `${value}盤源` }])}<section class="page-intro"><span class="section-label">${isDistrict?'AREA INDEX':'USAGE INDEX'}</span><h1>${esc(value)}<br><em>${isDistrict?'大廈及盤源':'盤源分類'}</em></h1><p>${esc(description)}</p><a class="primary-button" href="/listings/">查看全部盤源</a></section>${isDistrict && bList.length ? `<section class="featured-section"><div class="section-heading"><div><span class="section-label">BUILDINGS</span><h2>${esc(value)}大廈</h2></div><a href="/buildings/">全部大廈 ↗</a></div><div class="building-grid">${bList.map(buildingCard).join('')}</div></section>` : ''}<section class="results-head"><strong>${list.length} 個公開項目</strong><span>資料需重新核對</span></section><section class="listing-grid">${list.map(card).join('')}</section>${intentBlock}<section class="notice"><strong>資料提醒</strong><p>呢度係公開資料整理入口，唔係實時庫存保證，亦非任何大廈業主或管理處官方網站。價格、面積、盤況及可用日期請直接向代理核對。</p></section>`;
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
  return layout({title:'資料方法｜香港工商大廈及盤源公開資料點樣整理、核對及更新做法',description:'QueenieHub 解釋香港工商大廈及盤源資料來源、整理方法、交叉核對原則、資料快照日期及價格盤況限制。',canonical:pageUrl('/methodology'),body,keywords:'商業地產資料方法,香港工廈資料,寫字樓盤源,物業資料核對'});
}
function contactPage() {
  const body = `${breadcrumbHtml([{label:'首頁',href:'/'},{label:'聯絡 Queenie'}])}
<section class="page-intro"><span class="section-label">CONTACT</span><h1>講你想搵邊區、咩用途、幾大面積。</h1><p>你可以先講地區、工廈／寫字樓／商舖、出售定放租、預算及大約面積，Queenie 再按公開盤源同你核對。</p><div class="hero-actions"><a class="primary-button" href="${whatsappBase}?text=${encodeURIComponent('你好，我想查詢香港商業地產。地區／用途／出售或放租／面積或預算：')}">WhatsApp 查詢 ↗</a><a class="secondary-button dark" href="/listings/">先睇全部盤源</a></div></section>
<section class="entity-block"><h2>查詢時可以提供</h2><ul class="source-list"><li>想搵嘅地區，例如觀塘、九龍灣、長沙灣。</li><li>用途，例如工廈、寫字樓、商舖或工作室。</li><li>出售／放租、預算、面積及樓層要求。</li><li>如果已經睇中某個盤，直接提供物業編號會最快。</li></ul></section>`;
  return layout({title:'聯絡 Queenie｜香港工廈、寫字樓及商業盤源查詢入口網站',description:'聯絡 Queenie 查詢觀塘、九龍灣、長沙灣等香港工商大廈、工廈、寫字樓及商業物業公開盤源，可直接 WhatsApp 查詢。',canonical:pageUrl('/contact'),body,keywords:'聯絡Queenie,香港工廈查詢,觀塘寫字樓,商業物業放租'});
}


/* ---------- high-intent landing pages ---------- */
const intents = JSON.parse(fs.readFileSync(path.join(root, 'data/intent-pages.json'), 'utf8'));
function rateNum(p) {
  if (p.category === 'rent') {
    const r = num(p.rent), s = Number(p.sizeValue) || 0;
    return r && s ? r / s : 0;
  }
  return num(p.unitPrice) || 0;
}
function intentListings(cfg) {
  return rawData.filter(p => p.district === cfg.district && cfg.usages.includes(p.usage) && (cfg.category === 'any' || p.category === cfg.category));
}
function intentStats(list) {
  const rates = list.map(rateNum).filter(n => n > 0).sort((a, b) => a - b);
  const sizes = list.map(p => Number(p.sizeValue) || 0).filter(n => n > 0).sort((a, b) => a - b);
  if (!rates.length) return null;
  return { n: rates.length, median: median(rates), min: rates[0], max: rates[rates.length - 1], sizeMin: sizes[0] || 0, sizeMax: sizes[sizes.length - 1] || 0 };
}
function intentAnswer(cfg) {
  const list = intentListings(cfg);
  const rents = intentStats(list.filter(p => p.category === 'rent'));
  const sales = intentStats(list.filter(p => p.category !== 'rent'));
  const rng = st => {
    const f = v => `$${Math.round(v).toLocaleString('en-HK')}`;
    return st.min === st.max ? `@${f(st.min)}／呎` : `@${f(st.min)}–${f(st.max)}／呎`;
  };
  const bits = [];
  if (list.length) bits.push(`目前整理到 ${list.length} 個相關公開盤源`);
  if (rents) bits.push(`放租叫價約 ${rng(rents)}，中位 ${`$${Math.round(rents.median).toLocaleString('en-HK')}`}／呎（樣本 ${rents.n}）`);
  if (sales) bits.push(`出售叫價約 ${rng(sales)}，中位 ${`$${Math.round(sales.median).toLocaleString('en-HK')}`}／呎（樣本 ${sales.n}）`);
  const areaSrc = rents || sales;
  if (areaSrc && areaSrc.sizeMin) bits.push(`公開面積約 ${areaSrc.sizeMin.toLocaleString('en-HK')}–${areaSrc.sizeMax.toLocaleString('en-HK')} 呎`);
  const smallSample = (rents && rents.n < 3) || (sales && sales.n < 3);
  return bits.length
    ? `${bits.join('；')}。${smallSample ? '部分組合樣本太少，只宜視為個別叫價，唔應當成市場定價。' : ''}以上係 ${dataDate} 整理嘅公開廣告叫價，未經成交核實，實際價錢及盤況請向代理確認。`
    : `目前未夠公開盤源去計算叫價範圍，可以直接查詢最新供應同可睇時間。`;
}
function intentTable(cfg) {
  const groups = [
    { label: '放租單位', list: intentListings(cfg).filter(p => p.category === 'rent'), unit: '呎租' },
    { label: '出售單位', list: intentListings(cfg).filter(p => p.category !== 'rent'), unit: '呎價' }
  ].filter(g => g.list.length);
  if (!groups.length) return '';
  const rows = groups.map(g => {
    const st = intentStats(g.list);
    if (!st) return '';
    const fmt = v => `$${Math.round(v).toLocaleString('en-HK')}`;
    const range = st.min === st.max ? `${fmt(st.min)}／呎` : `${fmt(st.min)}–${fmt(st.max)}／呎`;
    const area = st.sizeMin ? (st.sizeMin === st.sizeMax ? `${st.sizeMin.toLocaleString('en-HK')} 呎` : `${st.sizeMin.toLocaleString('en-HK')}–${st.sizeMax.toLocaleString('en-HK')} 呎`) : '—';
    return `<tr><td>${g.label}</td><td>${st.n}${st.n < 3 ? '（樣本少）' : ''}</td><td>${fmt(st.median)}／呎</td><td>${range}</td><td>${area}</td></tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="unit-table"><thead><tr><th>類型</th><th>樣本</th><th>中位${cfg.category === 'sale' ? '呎價' : '呎租'}（叫價）</th><th>叫價範圍</th><th>公開面積</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function intentPage(cfg) {
  const list = intentListings(cfg);
  const relatedBuildings = buildings.filter(b => b.district === cfg.district).sort((a, b) => b.properties.length - a.properties.length).slice(0, 8);
  const faqJson = {
    '@type': 'FAQPage',
    mainEntity: cfg.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
  };
  const crumbs = [{ label: '首頁', href: '/' }, { label: `${cfg.district}`, href: `/district/${districtSlug[cfg.district]}/` }, { label: cfg.h1 }];
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${pageUrl(`/${cfg.slug}`)}#webpage`, url: pageUrl(`/${cfg.slug}`), name: cfg.title, description: cfg.desc, isPartOf: siteRef(), about: { '@type': 'Place', name: `${cfg.district}`, address: { '@type': 'PostalAddress', addressLocality: 'Hong Kong', addressRegion: cfg.district } } },
      breadcrumbJson(crumbs),
      faqJson,
      { '@type': 'ItemList', name: `${cfg.h1}公開盤源`, numberOfItems: list.length, itemListElement: list.slice(0, 30).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `${p.name} ${p.size || ''} ${categoryLabel(p)}`.trim(), url: pageUrl(listingPath(p)) })) }
    ]
  });
  const ctaText = `你好，我想搵${cfg.district}${cfg.category === 'sale' ? '出售' : cfg.category === 'rent' ? '放租' : ''}物業，用途係${cfg.usages[0]}，預算同面積大約係：`;
  const body = `${breadcrumbHtml(crumbs)}
<section class="intent-hero"><span class="section-label">${esc(cfg.district)} / ${cfg.category === 'sale' ? '出售' : cfg.category === 'rent' ? '放租' : '租售'}</span><h1>${esc(cfg.h1)}</h1><p class="intent-answer">${esc(intentAnswer(cfg))}</p><div class="hero-actions"><a class="primary-button" href="${whatsappBase}?text=${encodeURIComponent(ctaText)}" target="_blank" rel="noopener">WhatsApp 講需求 ↗</a><a class="secondary-button dark" href="/listings/">睇全部盤源</a></div></section>
<section class="entity-block"><p class="entity-lede">${esc(cfg.lede)}</p></section>
<section class="entity-block"><h2>${esc(cfg.district)}${esc(cfg.h1.replace(cfg.district, ''))}：叫價同面積參考</h2>${intentTable(cfg) || '<p>目前未夠公開盤源計算叫價範圍。</p>'}<p class="table-note">${esc(cfg.rentNote)}</p></section>
<section class="entity-block"><h2>呢類單位適合邊類公司</h2><ul class="fit-list">${cfg.fitFor.map(f => `<li><strong>${esc(f.who)}</strong><span>${esc(f.why)}</span></li>`).join('')}</ul></section>
<section class="entity-block"><h2>交通及位置</h2><ul class="source-list">${cfg.transport.map(t => `<li>${esc(t)}</li>`).join('')}</ul><p class="table-note">步行時間只作參考，實際路線及出入口請用 Google 地圖確認。</p></section>
${relatedBuildings.length ? `<section class="featured-section"><div class="section-heading"><div><span class="section-label">BUILDINGS</span><h2>${esc(cfg.district)}主要大廈</h2></div><a href="/district/${districtSlug[cfg.district]}/">全區大廈 ↗</a></div><div class="building-grid">${relatedBuildings.map(buildingCard).join('')}</div></section>` : ''}
<section class="featured-section"><div class="section-heading"><div><span class="section-label">LISTINGS</span><h2>目前公開盤源</h2></div><span class="count-note">${list.length} 個項目</span></div>${list.length ? `<div class="listing-grid">${list.map(card).join('')}</div>` : `<div class="notice"><strong>暫時未有公開盤源</strong><p>呢個組合目前未見公開廣告，可以直接 WhatsApp 講需求，我會幫你對返現有及未上網嘅盤源。</p></div>`}</section>
<section class="entity-block"><h2>${esc(cfg.h1)}常見問題</h2><div class="faq">${cfg.faq.map(f => `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('')}</div></section>
<section class="aside-card accent intent-cta"><span class="eyebrow">下一步</span><h2>講地區、面積同預算，我幫你對盤。</h2><p>唔需要自己逐個盤估價。講清楚用途、需要幾大、幾時起租或成交，我會按公開盤源同你核對。</p><a class="primary-button" href="${whatsappBase}?text=${encodeURIComponent(ctaText)}" target="_blank" rel="noopener">WhatsApp 查詢</a></section>
<section class="entity-block"><h2>相關頁面</h2><ul class="source-list">${intents.filter(i => i.slug !== cfg.slug).map(i => `<li><a href="/${i.slug}/">${esc(i.title.replace('｜QueenieHub', ''))}</a></li>`).join('')}<li><a href="/market/">全港呎租及呎價參考</a></li><li><a href="/methodology/">資料方法及限制</a></li></ul></section>`;
  return layout({ title: cfg.title, description: cfg.desc, canonical: pageUrl(`/${cfg.slug}`), body, keywords: cfg.keywords, jsonLd });
}

function notFoundPage() {
  const body = `<section class="page-intro"><span class="section-label">404 / NOT FOUND</span><h1>搵唔到呢一頁。</h1><p>個別盤源可能已經下架，或者網址打錯。你可以由大廈索引或全部盤源重新開始。</p><div class="hero-actions"><a class="primary-button" href="/buildings/">睇全部大廈</a><a class="secondary-button dark" href="/listings/">睇全部盤源</a></div></section><section class="featured-section"><div class="section-heading"><div><span class="section-label">START HERE</span><h2>熱門地區大廈</h2></div><a href="/buildings/">全部大廈 ↗</a></div><div class="building-grid">${buildings.slice(0, 6).map(buildingCard).join('')}</div></section>`;
  return layout({ title: '搵唔到呢一頁｜香港工商大廈索引及公開盤源｜QueenieHub', description: '此頁面不存在或盤源可能已下架。由香港工商大廈索引或全部公開盤源重新開始，按地區、用途、面積及價格搵合適工商物業。', canonical: pageUrl('/404.html'), body, keywords: '香港工商大廈, 工廈, 寫字樓, 盤源索引' });
}

/* ---------- build ---------- */
fs.rmSync(dist,{recursive:true,force:true}); mkdir(dist);
/* ===================== tool pages: shared ===================== */
function toolPage({ kicker, heading, lede, body, title, description, canonical, jsonLd = '', keywords, extraClass = '' }) {
  const crumb = breadcrumbHtml([
    { label: '首頁', href: '/' },
    { label: heading }
  ]);
  const page = `${crumb}
<section class="tool-hero">
  <p class="entity-kicker">${esc(kicker)}</p>
  <h1>${esc(heading)}</h1>
  <p class="tool-lede">${lede}</p>
</section>
${body}`;
  return layout({
    title,
    description,
    canonical,
    body: page,
    active: 'tools',
    jsonLd,
    keywords: keywords || '香港工商舖, 工廈放租, 寫字樓, 商業地產, QueenieHub'
  });
}

function toolJsonLd(name, canonical, description) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl(canonical)}#page`,
        url: pageUrl(canonical),
        name,
        description,
        inLanguage: 'zh-HK',
        isPartOf: { '@id': `${publicOrigin || ''}/#website` }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: pageUrl('/') },
          { '@type': 'ListItem', position: 2, name, item: pageUrl(canonical) }
        ]
      }
    ]
  });
}

/* ===================== /match/ ===================== */
function matchPage() {
  const districts = [...new Set(rawData.map(p => p.district))].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  const body = `<section class="tool-wrap">
  <form id="matchForm" class="tool-card" novalidate>
    <div class="tool-steps">
      <fieldset class="tool-step">
        <legend><span>01</span>你想租定買？</legend>
        <div class="chip-row">
          <label class="chip"><input type="radio" name="deal" value="rent" checked><span>放租</span></label>
          <label class="chip"><input type="radio" name="deal" value="sale"><span>出售</span></label>
          <label class="chip"><input type="radio" name="deal" value="any"><span>兩樣都睇</span></label>
        </div>
      </fieldset>
      <fieldset class="tool-step">
        <legend><span>02</span>心水地區</legend>
        <label class="select-field">地區
          <select name="district">
            <option value="">任何地區</option>
            ${districts.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('')}
          </select>
        </label>
      </fieldset>
      <fieldset class="tool-step">
        <legend><span>03</span>物業用途</legend>
        <div class="chip-row">
          <label class="chip"><input type="radio" name="usage" value="any" checked><span>無所謂</span></label>
          <label class="chip"><input type="radio" name="usage" value="industrial"><span>工廈／工貿</span></label>
          <label class="chip"><input type="radio" name="usage" value="office"><span>寫字樓</span></label>
          <label class="chip"><input type="radio" name="usage" value="shop"><span>商舖／陳列</span></label>
        </div>
      </fieldset>
      <fieldset class="tool-step">
        <legend><span>04</span>需要幾大？</legend>
        <div class="chip-row">
          <label class="chip"><input type="radio" name="size" value="any" checked><span>無所謂</span></label>
          <label class="chip"><input type="radio" name="size" value="s"><span>1,000 呎以下</span></label>
          <label class="chip"><input type="radio" name="size" value="m"><span>1,000–2,000 呎</span></label>
          <label class="chip"><input type="radio" name="size" value="l"><span>2,000–5,000 呎</span></label>
          <label class="chip"><input type="radio" name="size" value="xl"><span>5,000 呎以上</span></label>
        </div>
      </fieldset>
      <fieldset class="tool-step">
        <legend><span>05</span>預算上限</legend>
        <label class="input-field">每月租金上限（HKD）
          <input type="number" name="budget" min="0" step="1000" placeholder="例如 30000">
        </label>
        <label class="input-field">買入價上限（HKD）
          <input type="number" name="buyBudget" min="0" step="100000" placeholder="例如 8000000">
        </label>
      </fieldset>
      <fieldset class="tool-step">
        <legend><span>06</span>必要條件</legend>
        <div class="chip-row">
          <label class="chip"><input type="checkbox" name="needs" value="裝修"><span>已有裝修</span></label>
          <label class="chip"><input type="checkbox" name="needs" value="近港鐵"><span>近港鐵</span></label>
          <label class="chip"><input type="checkbox" name="needs" value="海景"><span>海景／開揚</span></label>
          <label class="chip"><input type="checkbox" name="needs" value="大面積"><span>大面積</span></label>
        </div>
      </fieldset>
    </div>
    <div class="tool-actions">
      <button class="primary-button" type="submit">睇配對結果 <span>↗</span></button>
      <button class="ghost-button" type="reset">重設</button>
      <span class="tool-note">全部計算喺你部手機／電腦完成，唔會上傳任何資料。</span>
    </div>
  </form>

  <section id="matchResult" class="tool-result" hidden aria-live="polite">
    <div class="result-head">
      <p class="entity-kicker">MATCH RESULT</p>
      <h2 id="matchHeadline">最接近你要求嘅盤源</h2>
      <p id="matchSummary" class="tool-lede"></p>
    </div>
    <div id="matchDistricts" class="district-pick"></div>
    <div id="matchList" class="result-list"></div>
    <div class="result-cta">
      <div>
        <strong>想我幫你直接配對？</strong>
        <p>將上面答案一次過發去 WhatsApp，唔需要再重複講。</p>
      </div>
      <a id="matchWa" class="primary-button" href="${whatsappBase}" rel="noopener">WhatsApp 發送需求 <span>↗</span></a>
    </div>
    <p class="tool-disclaimer">配對結果只按公開資料嘅地區、用途、面積及叫價排序，唔代表實際可租／可售，最終以代理核實為準。</p>
  </section>

  <section class="tool-card tool-explain">
    <h2>配對器點樣運作</h2>
    <ol class="number-list">
      <li><strong>先篩租售</strong>：你揀放租就唔會顯示出售盤，反之亦然。</li>
      <li><strong>再計地區及用途</strong>：地區完全符合會加分，用途以工廈、寫字樓、商舖三大類歸納。</li>
      <li><strong>面積用區間</strong>：你揀 1,000–2,000 呎，系統會優先顯示範圍內盤源，超出範圍會按差距扣分。</li>
      <li><strong>預算用上限</strong>：租金以每月總額比較，售價以叫價比較。</li>
      <li><strong>必要條件加分</strong>：例如「已有裝修」、「近港鐵」會按公開標籤及地區加權。</li>
    </ol>
    <p>結果只顯示頭 6 個最接近嘅盤源，避免一次過給你幾十個選項。想睇全部，仍然可以去 <a class="inline-link" href="/listings/">盤源索引</a> 自己篩。</p>
  </section>
</section>
<noscript><p class="tool-note">配對器需要 JavaScript。你可以直接去 <a href="/listings/">盤源索引</a> 或用 WhatsApp 查詢。</p></noscript>`;
  return toolPage({
    kicker: 'PROPERTY MATCHER',
    heading: '六個問題，搵出最接近嘅盤源',
    lede: '唔需要識講行話。揀租定買、地區、用途、面積同預算，即刻睇邊幾個盤最接近你要求，再一按 WhatsApp 發送完整需求。',
    body,
    title: '工商物業配對器｜按地區、面積及預算搵盤源｜QueenieHub',
    description: '輸入租售、地區、用途、面積及預算，即時配對香港公開工商盤源，並產生可直接發送的 WhatsApp 查詢內容。',
    canonical: '/match/',
    jsonLd: toolJsonLd('工商物業配對器', '/match/', '按地區、用途、面積及預算配對香港工商盤源。')
  });
}

/* ===================== /budget/ ===================== */
function budgetPage() {
  const body = `<section class="tool-wrap">
  <div class="tool-grid">
    <form id="budgetForm" class="tool-card">
      <h2>輸入租務條件</h2>
      <div class="field-grid">
        <label class="input-field">面積（平方呎）
          <input type="number" name="area" min="1" step="10" value="1200" required>
        </label>
        <label class="input-field">呎租（HKD／呎）
          <input type="number" name="rate" min="0" step="0.5" value="16" required>
        </label>
        <label class="input-field">按金（月租倍數）
          <input type="number" name="deposit" min="0" max="12" step="1" value="3">
        </label>
        <label class="input-field">免租期（日）
          <input type="number" name="fitout" min="0" max="180" step="1" value="14">
        </label>
        <label class="input-field">代理佣金（月租倍數）
          <input type="number" name="commission" min="0" max="2" step="0.5" value="0.5">
        </label>
        <label class="input-field">管理費（HKD／呎）
          <input type="number" name="mgmt" min="0" step="0.1" value="2.5">
        </label>
      </div>
      <p class="tool-note">以上只作估算。實際按金、免租期、佣金及管理費由業主及代理合約決定。</p>
    </form>

    <section class="tool-card calc-card" aria-live="polite">
      <h2>每月及起租支出</h2>
      <dl class="calc-out">
        <div><dt>每月租金</dt><dd id="outRent">—</dd></div>
        <div><dt>每年租金</dt><dd id="outYear">—</dd></div>
        <div><dt>每月管理費</dt><dd id="outMgmt">—</dd></div>
        <div><dt>每月總支出</dt><dd id="outMonthly" class="strong">—</dd></div>
        <div><dt>按金</dt><dd id="outDeposit">—</dd></div>
        <div><dt>代理佣金</dt><dd id="outCommission">—</dd></div>
        <div><dt>起租前一次過支出</dt><dd id="outUpfront" class="strong">—</dd></div>
      </dl>
      <p class="tool-note">未包括裝修、搬遷、差餉地租、水電按金、保險及印花稅（如有）。</p>
      <a id="budgetWa" class="primary-button" href="${whatsappBase}" rel="noopener">用呢個預算搵盤 <span>↗</span></a>
    </section>
  </div>

  <section class="tool-card tool-explain">
    <h2>租工商物業，通常有邊幾筆錢</h2>
    <ul class="plain-list">
      <li><strong>租金</strong>：多數以建築面積計，實際可用面積可能較細，簽約前要問清楚係建築定實用。</li>
      <li><strong>按金</strong>：市場常見兩至三個月租，視物業類型及業主取態。</li>
      <li><strong>免租期</strong>：用嚟裝修、搬遷，通常一至四星期，要寫入租約。</li>
      <li><strong>代理佣金</strong>：租務常見半個月租至一個月租，由業主、租客或雙方分擔，簽約前要確認。</li>
      <li><strong>管理費</strong>：部分租金已包，部分另計，工廈差異可以好大。</li>
      <li><strong>其他</strong>：差餉、地租、水電按金、裝修及消防工程，通常另計。</li>
    </ul>
    <p>如果你輸入嘅呎租明顯低於同區水平，通常代表面積計算方式、樓層、裝修或大廈條件有差異，唔一定係「抵」。可以先用 <a class="inline-link" href="/market/">呎租參考頁</a> 比較同區中位數。</p>
  </section>
</section>`;
  return toolPage({
    kicker: 'RENT BUDGET',
    heading: '租金預算計算器',
    lede: '輸入面積同呎租，即刻睇每月租金、每年租金、按金、佣金同起租前要準備幾多錢。',
    body,
    title: '工商物業租金預算計算器｜按金、佣金及起租支出｜QueenieHub',
    description: '輸入面積及呎租，即時估算每月租金、每年租金、按金、代理佣金、管理費及起租前一次過支出，方便比較不同盤源。',
    canonical: '/budget/',
    jsonLd: toolJsonLd('租金預算計算器', '/budget/', '估算香港工商物業租金、按金及佣金支出。')
  });
}

/* ===================== /compare/ ===================== */
function comparePage() {
  const groups = {};
  for (const b of buildings) {
    (groups[b.district] ||= []).push(b);
  }
  const firstDistrict = Object.entries(groups).sort((a, b) => b[1].length - a[1].length)[0][0];
  const listing = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length || a.localeCompare(b, 'zh-Hant')).map(d => `
    <details class="compare-group" ${d === firstDistrict ? 'open' : ''}>
      <summary>${esc(d)} <span>${groups[d].length} 幢</span></summary>
      <div class="compare-options">
        ${groups[d].sort((a, b) => (b.sales.length + b.rents.length) - (a.sales.length + a.rents.length) || a.name.localeCompare(b.name, 'zh-Hant')).map(b => {
          const total = b.sales.length + b.rents.length;
          return `<label class="compare-option${total ? '' : ' is-empty'}">
          <input type="checkbox" name="building" value="${esc(b.slug)}">
          <span class="compare-option-name">${esc(b.name)}</span>
          <span class="compare-option-meta">${total ? `${total} 個公開盤源` : '暫無公開盤源'}</span>
        </label>`;
        }).join('')}
      </div>
    </details>`).join('');

  const body = `<section class="tool-wrap">
  <section class="tool-card">
    <div class="compare-head">
      <h2>揀最多 4 幢大廈比較</h2>
      <p class="compare-count" id="compareHint">已揀 0／4 幢</p>
    </div>
    <p class="tool-note">用搜尋快速搵大廈，或展開地區逐幢揀。</p>
    <label class="search-field compare-search"><span>⌕</span>
      <input id="compareSearch" type="search" placeholder="搜尋大廈名稱或地址，例如 日昇、萬兆豐、勵豐" autocomplete="off" aria-label="搜尋大廈名稱或地址">
    </label>
    <div id="compareGroups" class="compare-picker">${listing}</div>
  </section>

  <section id="compareResult" class="tool-card compare-result" hidden aria-live="polite">
    <h2>比較結果</h2>
    <div class="table-wrap"><table class="compare-table" id="compareTable"></table></div>
    <div class="result-cta">
      <div>
        <strong>想我幫你比較呢幾幢？</strong>
        <p>一次過發送去 WhatsApp，我直接回覆現有盤源同差異。</p>
      </div>
      <a id="compareWa" class="primary-button" href="${whatsappBase}" rel="noopener">WhatsApp 查詢 <span>↗</span></a>
    </div>
  </section>

  <section class="tool-card tool-explain">
    <h2>比較大廈時，最值得睇邊幾項</h2>
    <ul class="plain-list">
      <li><strong>盤源數量</strong>：同一幢大廈有幾個盤，代表你嘅選擇有幾多，亦反映業主放盤活躍程度。</li>
      <li><strong>面積範圍</strong>：同一幢可以有細單位同全層，差異可以幾倍。</li>
      <li><strong>呎租或呎價</strong>：只作參考，樓層、裝修、景觀會令同一幢出現明顯差距。</li>
      <li><strong>交通</strong>：最近港鐵站只作方向，實際步行要計上落斜及行人路。</li>
      <li><strong>用途限制</strong>：大廈公開用途唔等於你一定可以做你想做嘅行業，要睇地契、公契及屋宇署批准。</li>
    </ul>
    <p>比較完，可以再用 <a class="inline-link" href="/match/">配對器</a> 按你實際面積同預算收窄範圍。</p>
  </section>
</section>`;

  return toolPage({
    kicker: 'BUILDING COMPARE',
    heading: '大廈比較工具',
    lede: '一次過比較最多四幢大廈：盤源數量、面積範圍、呎租呎價參考、交通及用途限制。',
    body,
    title: '工商大廈比較工具｜盤源數量、面積及呎租對比｜QueenieHub',
    description: '揀選最多四幢香港工商大廈，比較公開盤源數量、面積範圍、呎租呎價參考、交通及用途限制，方便快速收窄選擇。',
    canonical: '/compare/',
    jsonLd: toolJsonLd('大廈比較工具', '/compare/', '比較香港工商大廈的盤源、面積、呎租及交通。')
  });
}

/* ===================== /brief/ ===================== */
function briefPage() {
  const body = `<section class="tool-wrap">
  <section class="tool-card">
    <div class="brief-head">
      <div>
        <h2>你嘅查詢清單</h2>
        <p class="tool-note">喺任何盤源卡按「＋ 比較」加入，呢頁會自動整理成一張可以列印或儲存嘅睇樓 Brief。</p>
      </div>
      <div class="brief-actions">
        <button class="ghost-button" type="button" id="briefPrint">列印／儲存 PDF</button>
        <button class="ghost-button" type="button" id="briefClear">清空</button>
      </div>
    </div>
    <div id="briefEmpty" class="empty-state">
      <p>清單暫時係空。</p>
      <p><a class="inline-link" href="/listings/">去盤源索引</a> 揀幾個盤，或者用 <a class="inline-link" href="/match/">配對器</a> 搵最接近嘅盤源。</p>
    </div>
    <div id="briefSheet" class="brief-sheet" hidden></div>
  </section>

  <section class="tool-card tool-explain">
    <h2>呢張 Brief 有咩用</h2>
    <ul class="plain-list">
      <li><strong>俾老闆或同事睇</strong>：一頁睇清地區、面積、叫價同大廈資料，唔需要轉發十條連結。</li>
      <li><strong>睇樓前準備</strong>：每個盤下面列出要問嘅問題，例如實際面積、管理費、免租期、可用日期。</li>
      <li><strong>比較同區選擇</strong>：同一區幾個盤放埋一齊，差異即刻見到。</li>
      <li><strong>私隱</strong>：清單只存喺你部裝置嘅瀏覽器，唔會上傳，亦唔會顯示俾其他人。</li>
    </ul>
  </section>
</section>`;

  return toolPage({
    kicker: 'VIEWING BRIEF',
    heading: '物業查詢 Brief',
    lede: '將你揀嘅盤源整理成一頁睇樓清單，可以列印或存成 PDF，直接俾老闆、同事或自己睇樓時用。',
    body,
    title: '工商物業睇樓 Brief｜列印查詢清單｜QueenieHub',
    description: '把已選的工商盤源整理成可列印的睇樓清單，包含面積、叫價、大廈資料，以及需要向代理確認的問題，作為睇樓準備。',
    canonical: '/brief/',
    jsonLd: toolJsonLd('物業查詢 Brief', '/brief/', '把已選盤源整理成可列印的睇樓清單。')
  });
}

/* ===================== use-case pages ===================== */
const useCases = [
  {
    slug: 'ecommerce-warehouse',
    kicker: 'E-COMMERCE',
    h1: '電商及網店倉庫',
    title: '電商倉庫租盤｜網店貨倉選址、面積及上落貨｜QueenieHub',
    description: '按出貨頻率、面積、上落貨及交通，整理香港適合電商及網店的工商倉庫盤源，並列出選址時要逐項核實的條件。',
    filter: p => ['工商', '工業'].includes(p.usage) && (p.sizeValue || 0) >= 1200,
    intro: [
      '電商揀倉，最常錯嘅一步係只看租金，忽略每日出貨動線。同樣 1,500 呎，一個有貨𨋢直達停車場、另一個要推貨行斜路，實際人手成本可以差好遠。',
      '呢頁集中整理現有公開盤源入面，面積較適合做小至中型電商倉嘅選擇，並列出落單前應該核實嘅條件。'
    ],
    fits: [
      ['每日出貨量穩定', '需要固定打包位、貨架區及收貨區，唔可以同寫字樓混用。'],
      ['有第三方物流配合', '要預留貨車短暫停泊及上落貨位置，否則司機唔願意等。'],
      ['需要一個小辦公角落', '部分工貿樓可以做陳列、客服及倉存三合一，減少另租寫字樓。']
    ],
    checks: [
      '貨𨋢數量、載重及尺寸，繁忙時間要排幾耐。',
      '車輛可否直達樓層或卸貨區，有冇時段限制。',
      '單位樓底高度，能否放兩層貨架。',
      '電力容量是否足夠叉電、包裝機或冷氣。',
      '大廈是否容許你嘅行業（物流、批發）及有冇消防要求。',
      '管理費、垃圾處理費及超時出入安排。'
    ],
    faq: [
      ['網店一定要租工廈嗎？', '不一定。出貨量細、以自取為主可以先用小型工作室或共享倉；當每日件數穩定、需要貨架及收貨區，才值得租獨立單位。'],
      ['1,200 呎夠做電商倉嗎？', '視貨品體積。以小型配件、美妝、服飾為例，1,200 呎通常可以應付每日數十至一百多張訂單，但仍要預留打包及收貨通道。'],
      ['租金之外仲有咩固定成本？', '管理費、差餉、水電、保險，以及貨架、打包台等一次性投入。搬入前最好用預算計算器計一次起租總支出。']
    ]
  },
  {
    slug: 'logistics-warehouse',
    kicker: 'LOGISTICS',
    h1: '物流及貨運倉',
    title: '物流倉租盤｜貨運倉儲選址、樓底、載重及上落貨｜QueenieHub',
    description: '整理適合物流、貨運及倉儲的香港工商盤源，重點講貨車出入、樓底高度、地台載重及地區接駁，方便實地核對。',
    filter: p => ['工商', '工業'].includes(p.usage) && (p.sizeValue || 0) >= 2000,
    intro: [
      '物流倉的關鍵唔係「有幾大」，而係「貨車入唔入得嚟、入到嚟停幾耐、上落貨要幾多人」。同一區兩個盤，租金相差兩成，但操作成本可以相差三成以上。',
      '呢頁按面積較大嘅公開盤源整理，適合需要固定貨車出入、存貨及分揀嘅公司作初步篩選。'
    ],
    fits: [
      ['需要長期停泊或輪替貨車', '要有足夠上落貨位置，唔可以只靠路邊臨時停車。'],
      ['存貨周期較長', '面積大、租金低的區域例如屯門、葵涌、油塘會較適合。'],
      ['需要分揀及包裝區', '單位形狀要方正，柱位唔好太密，否則貨架排位浪費空間。']
    ],
    checks: [
      '貨櫃車或噸車可否駛入，路面闊度及限高。',
      '卸貨台數量、預約制度及繁忙時段。',
      '樓底、地台載重是否適合堆高機。',
      '消防設備、危險品儲存限制（如有）。',
      '出入時間是否 24 小時，夜間有冇附加費。',
      '鄰近主要幹道或口岸的實際車程。'
    ],
    faq: [
      ['屯門倉租金較低，值得搬入嗎？', '如果主要客戶在新界西或需要接駁機場、港珠澳大橋，屯門有成本優勢；但如果客人及員工主要在港島或九龍東，交通時間要一併計入。'],
      ['工廈同貨倉大廈有咩分別？', '貨倉大廈通常有較大卸貨區及貨𨋢，工廈則視乎樓齡及設計。睇樓時要實地看貨車動線，唔好只看平面圖。'],
      ['大面積單位通常可以分租嗎？', '部分業主接受分租，但要睇租約、消防及大廈管理規定，唔可以自行間隔了就算。']
    ]
  },
  {
    slug: 'design-studio',
    kicker: 'STUDIO',
    h1: '設計及攝影工作室',
    title: '設計工作室租盤｜攝影棚選址、樓底及採光｜QueenieHub',
    description: '整理適合設計工作室、攝影棚及創作團隊的香港工商盤源，重點講樓底、採光、電力、隔音及出入安排，方便實地檢查。',
    filter: p => ['工商', '寫字樓', '寫字樓及商舖'].includes(p.usage) && (p.sizeValue || 0) >= 400 && (p.sizeValue || 0) <= 3000,
    intro: [
      '工作室同倉庫的需求完全相反：唔需要大上落貨，但要好靚嘅採光、夠高樓底、穩定電力，同一個客人願意上門嘅地址。',
      '呢頁整理現有盤源入面，面積及類型較適合設計、攝影、內容製作團隊嘅選擇。'
    ],
    fits: [
      ['需要拍產品或人像', '樓底高、有自然光、可以控制背景，比商廈單位實用。'],
      ['團隊 3–12 人', '需要固定工作位加一個會議或拍攝區。'],
      ['經常有客人到訪', '大廈大堂、電梯及周邊環境會影響專業感。']
    ],
    checks: [
      '樓底高度及橫樑位置，能否放燈架。',
      '電力負載，拍攝燈及冷氣同時開會否跳掣。',
      '窗向及日照時間，西斜會影響拍攝。',
      '隔音及鄰居行業，避免拍攝時被投訴。',
      '是否容許商業拍攝及偶爾多人到訪。',
      '大廈可否 24 小時出入，加班拍攝好常見。'
    ],
    faq: [
      ['工廈可以做工作室嗎？', '不少工廈單位實際被用作工作室，但是否合法取決於地契、公契及屋宇署批准的用途。簽約前應該書面確認，唔好只靠口頭。'],
      ['攝影棚需要特別裝修嗎？', '通常要處理電力、天花路軌、背景牆及隔音。呢部分成本要計入起租預算，亦要業主同意。'],
      ['細單位夠用嗎？', '純設計團隊 400–800 呎已經可以；如果同時要拍攝，建議 1,000 呎以上才夠分區。']
    ]
  },
  {
    slug: 'showroom-shop',
    kicker: 'SHOWROOM',
    h1: '陳列室及門市',
    title: '陳列室及門市租盤｜商舖、工商選擇及招牌｜QueenieHub',
    description: '整理適合產品陳列、門市及客戶體驗店的香港商舖及工商盤源，附人流、用途限制及招牌申請要點，方便逐項核實。',
    filter: p => ['商舖', '寫字樓及商舖'].includes(p.usage) || p.tags.includes('燈箱'),
    intro: [
      '陳列室同純門市唔一樣：客人多數預約而來，唔完全靠街客，但地址同外觀仍然影響信任。工廈陳列室租金低，但要解決「客人願唔願意上樓」呢個問題。',
      '呢頁整理有商舖用途或明顯展示條件嘅公開盤源，適合需要讓客人親身睇產品嘅業務。'
    ],
    fits: [
      ['產品需要現場體驗', '例如建材、傢俬、電子產品、美容儀器。'],
      ['以預約制為主', '工廈或樓上陳列室可以降低成本，但要清楚指示及接待安排。'],
      ['需要招牌或展示窗', '要確認大廈是否容許外牆招牌及相關申請。']
    ],
    checks: [
      '用途是否准許零售或陳列，公契有冇限制。',
      '人流方向、入口位置及可否設置指示牌。',
      '樓底、櫥窗及燈光條件。',
      '消防走火通道及可容納人數。',
      '是否可以申請招牌，費用及審批時間。',
      '卸貨及送貨安排，特別是大型產品。'
    ],
    faq: [
      ['工廈可以做陳列室嗎？', '部分工廈單位可作陳列或辦公室用途，但零售、直接銷售可能受地契及公契限制，應先核實。'],
      ['樓上舖同地舖點揀？', '樓上舖租金低、面積大，適合預約制；地舖人流高但租金及裝修成本高，適合靠街客的業務。'],
      ['招牌要另外申請嗎？', '大廈外牆招牌通常涉及業主、管理處及屋宇署名義的申請，唔可以自行安裝。']
    ]
  },
  {
    slug: 'small-office',
    kicker: 'SMALL OFFICE',
    h1: '初創及小型辦公室',
    title: '初創辦公室租盤｜細面積寫字樓及工貿單位｜QueenieHub',
    description: '整理適合初創、小型團隊的香港細面積寫字樓及工貿單位，附面積、租金水平及簽約前要注意的事項，方便計預算。',
    filter: p => ['寫字樓', '寫字樓及商舖', '工商'].includes(p.usage) && (p.sizeValue || 0) > 0 && (p.sizeValue || 0) <= 1600,
    intro: [
      '初創揀辦公室，最實際嘅三個問題係：租金佔支出幾多、客人上門見唔見到人、租約有冇彈性。面積細反而更難揀，因為每一個位置都要同時做工作、開會同接待。',
      '呢頁集中整理細面積寫字樓及工貿單位，適合兩至十五人團隊。'
    ],
    fits: [
      ['團隊 2–15 人', '需要穩定網絡、會議空間及合理私隱。'],
      ['需要客戶到訪', '地址及大堂觀感會直接影響成交信心。'],
      ['預算優先', '工貿單位通常比純寫字樓平，但用途及配套要逐項確認。']
    ],
    checks: [
      '租金是否已包管理費、冷氣及差餉。',
      '冷氣時間，超時收費點計。',
      '網絡供應商覆蓋及可否拉光纖。',
      '租約年期、免租期、續租及退租條款。',
      '可否註冊公司及收發信件。',
      '大廈用途是否准許辦公室。'
    ],
    faq: [
      ['工貿單位同寫字樓有咩分別？', '工貿單位租金通常較低，但用途、消防及大廈配套同純寫字樓不同，部分銀行或客戶會在意地址類型。'],
      ['最短租約通常幾年？', '市場常見兩年，部分業主接受一年，但租金或按金條件會較緊。'],
      ['租金以外要預幾多？', '按金、佣金、裝修、傢俬、網絡安裝及水電按金，通常相等於兩至四個月租。']
    ]
  }
];

function useCasePath(cfg) { return `/use/${cfg.slug}/`; }

function useCasePage(cfg) {
  const items = rawData.filter(cfg.filter).sort((a, b) => (b.sizeValue || 0) - (a.sizeValue || 0));
  const shown = items.slice(0, 12);
  const districts = [...new Set(items.map(p => p.district))];
  const rentN = items.filter(p => p.category === 'rent').length;
  const saleN = items.filter(p => p.category === 'sale').length;
  const body = `<section class="page-intro">
  <p class="entity-kicker">${esc(cfg.kicker)}</p>
  <h1>${esc(cfg.h1)}</h1>
  ${cfg.intro.map(t => `<p>${esc(t)}</p>`).join('')}
  <div class="stat-row">
    <div><span>相關公開盤源</span><strong>${items.length} 個</strong></div>
    <div><span>涉及地區</span><strong>${districts.length} 區</strong></div>
    <div><span>租／售盤源</span><strong>${rentN} 租 · ${saleN} 售</strong></div>
  </div>
  <div class="hero-actions"><a class="primary-button" href="${whatsappBase}?text=${encodeURIComponent(`你好，我想搵${cfg.h1}類型嘅單位，想講下我嘅面積、地區同預算。`)}" rel="noopener">WhatsApp 講需求 <span>↗</span></a><a class="secondary-button dark" href="/match/">用配對器篩選</a></div>
</section>

<section class="entity-block">
  <h2>咩情況適合呢類單位</h2>
  <div class="fit-grid">
    ${cfg.fits.map(([t, d]) => `<div class="fit-card"><strong>${esc(t)}</strong><p>${esc(d)}</p></div>`).join('')}
  </div>
</section>

<section class="entity-block">
  <h2>揀盤前要核實嘅條件</h2>
  <ul class="checklist">${cfg.checks.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
</section>

<section class="entity-block">
  <h2>目前相關公開盤源（${items.length} 個）</h2>
  <p>按面積由大到細排列，最多顯示 12 個。全部屬公開廣告資料，實際盤況請向代理核實。</p>
  <div class="listing-grid">${shown.map(p => card(p, { hideBuilding: false })).join('')}</div>
  <p><a class="inline-link" href="/listings/">睇全部 ${rawData.length} 個公開盤源 →</a></p>
</section>

<section class="entity-block">
  <h2>常見問題</h2>
  <div class="faq">${cfg.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
</section>

<section class="entity-block">
  <h2>相關地區及用途</h2>
  <p>${districts.slice(0, 8).map(d => `<a class="inline-link" href="/district/${districtSlug[d] || slug(d)}/">${esc(d)}</a>`).join(' · ')}</p>
</section>`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${pageUrl(useCasePath(cfg))}#page`, url: pageUrl(useCasePath(cfg)), name: cfg.h1, description: cfg.description, inLanguage: 'zh-HK' },
      {
        '@type': 'FAQPage',
        mainEntity: cfg.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: pageUrl('/') },
          { '@type': 'ListItem', position: 2, name: '按用途搵盤', item: pageUrl('/use/') },
          { '@type': 'ListItem', position: 3, name: cfg.h1, item: pageUrl(useCasePath(cfg)) }
        ]
      }
    ]
  });

  return layout({
    title: cfg.title,
    description: cfg.description,
    canonical: useCasePath(cfg),
    body: breadcrumbHtml([{ label: '首頁', href: '/' }, { label: '按用途搵盤', href: '/use/' }, { label: cfg.h1 }]) + body,
    active: 'usage',
    jsonLd
  });
}

function useCaseIndex() {
  const rows = useCases.map(cfg => {
    const n = rawData.filter(cfg.filter).length;
    return `<a class="use-card" href="${useCasePath(cfg)}">
      <span class="entity-kicker">${esc(cfg.kicker)}</span>
      <strong>${esc(cfg.h1)}</strong>
      <p>${esc(cfg.intro[0].slice(0, 62))}…</p>
      <span class="use-count">${n} 個相關公開盤源 ↗</span>
    </a>`;
  }).join('');
  const body = `<section class="page-intro">
  <p class="entity-kicker">BY BUSINESS NEED</p>
  <h1>按你嘅業務搵盤</h1>
  <p>唔同業務對單位嘅要求差好遠。電商要出貨動線，工作室要樓底同採光，物流要貨車位。呢度按用途整理，每頁都有實際盤源同要核實嘅條件。</p>
</section>
<section class="entity-block"><div class="use-grid">${rows}</div></section>`;
  return layout({
    title: '按業務用途搵工商盤｜電商、物流及工作室選址｜QueenieHub',
    description: '按業務需要整理香港工商盤源：電商倉庫、物流倉、設計及攝影工作室、陳列室門市、初創小型辦公室，附選址要點。',
    canonical: '/use/',
    body: breadcrumbHtml([{ label: '首頁', href: '/' }, { label: '按用途搵盤' }]) + body,
    active: 'usage'
  });
}

/* ===================== guides ===================== */
const guides = [
  {
    slug: 'industrial-rental-checklist',
    h1: '租工廈前要核實嘅 12 件事',
    title: '租工廈前要核實嘅 12 件事｜香港工商租務｜QueenieHub',
    description: '租工廈前逐項核實：用途、貨𨋢、樓底、電力、消防、管理費、免租期、按金及退租條款，避免簽約後才發現問題。',
    kicker: 'CHECKLIST',
    lede: '工廈租約一簽通常兩年。以下 12 項係睇樓時最常被忽略、但事後最難補救嘅地方。',
    sections: [
      ['1. 大廈准許用途', '公開盤源寫嘅用途只係分類標籤，唔等於法律上可以做你嘅行業。要睇地契、公契及屋宇署批准用途，涉及特殊行業時應書面確認。'],
      ['2. 貨𨋢數量及尺寸', '有幾部貨𨋢、載重幾多、門闊幾多、繁忙時間要排幾耐，直接影響你每日運作。最好喺平日下晝實地觀察一次。'],
      ['3. 樓底及橫樑', '樓底高度決定你可唔可以放兩層貨架或裝天花設備。橫樑位置亦會限制燈光及貨架排位。'],
      ['4. 電力容量', '冷凍、叉電、大型機器都需要額外電力。要問清楚單位現有電錶容量，加電要唔要申請及費用由邊個負擔。'],
      ['5. 地台載重', '重型貨物或堆高機需要較高載重。舊式工廈地台限制可能比你想像中低。'],
      ['6. 消防及走火通道', '單位有冇改動過間隔、走火通道有冇被阻塞、消防設備是否有效，都應該睇清楚。改動前亦要符合相關規定。'],
      ['7. 上落貨安排', '車輛可否直達、卸貨區有冇時段限制、超時有冇收費、貨物可否放走廊短時間，全部要問管理處。'],
      ['8. 管理費及附加費', '管理費是否已包在租金內、冷氣是否另計、垃圾處理是否額外收費，要逐項寫入租約或報價。'],
      ['9. 免租期及裝修審批', '免租期通常用嚟裝修，但裝修圖則可能需要業主及管理處审批，時間要預留。'],
      ['10. 按金及上期', '市場常見兩至三個月按金，加首月租金。要確認按金幾時退、扣減條件。'],
      ['11. 退租及復原條款', '好多租約要求退租時將單位復原。呢筆費用可以好大，簽約前要問清楚標準。'],
      ['12. 續租及提前終止', '有冇續租優先權、提前終止要唔要罰款、可否轉租，呢三項對初創尤其重要。']
    ],
    outro: '以上只作一般參考，唔構成法律意見。實際條款以租約為準，涉及重大投資或長期租約時，應諮詢專業人士。'
  },
  {
    slug: 'industrial-usage-restrictions',
    h1: '工廈用途限制：點樣知道自己做唔做得',
    title: '工廈用途限制｜地契、公契及屋宇署檢查方法｜QueenieHub',
    description: '工廈用途限制點樣查：地契、公契、屋宇署批准用途及消防要求，以及簽約前應要求哪些書面證明，避免事後被要求停用。',
    kicker: 'USAGE RULES',
    lede: '「業主話可以做」唔等於合法。工廈用途要同時符合幾層規定，缺一層都可能被要求停止使用。',
    sections: [
      ['第一層：地契（Government Lease）', '地契規定土地用途，例如工業、倉庫或商住。部分舊工業地段有特定限制，亦有已獲批的豁免或修訂。'],
      ['第二層：公契（Deed of Mutual Covenant）', '公契規定大廈內各單位的使用限制，可能比地契更嚴，例如禁止零售、餐飲或特定行業。'],
      ['第三層：屋宇署批准用途', '建築圖則顯示單位原本設計用途。若實際用途與批准圖則不同，可能涉及違例。'],
      ['第四層：消防及牌照要求', '涉及食肆、教育、補習、醫療、危險品等行業，另有消防及牌照要求，唔可以只靠租約。'],
      ['實際做法：要求書面確認', '簽約前可要求業主提供地契摘要、公契相關條文、大廈管理處書面回覆，並保留紀錄。'],
      ['如果已經租了，點算？', '先確認實際風險，再同業主商討補救方案。情況複雜時應尋求專業意見，唔好自行改動單位。']
    ],
    outro: '呢頁只作一般說明，唔構成法律意見。個別大廈情況差異很大，應以文件及專業意見為準。'
  },
  {
    slug: 'compare-unit-rate',
    h1: '點樣比較呎租同呎價，唔會被數字誤導',
    title: '呎租呎價點比較｜建築面積、實用面積及管理費｜QueenieHub',
    description: '比較工商物業呎租呎價時要留意建築面積與實用面積、樓層、裝修、管理費，以及叫價與成交價的差異，避免被數字誤導。',
    kicker: 'HOW TO COMPARE',
    lede: '同一個地區，呎租可以由十幾元到二十幾元。差距通常唔係「邊個抵」，而係你比較緊唔同嘅東西。',
    sections: [
      ['先確認面積定義', '建築面積同實用面積可以相差一至三成。兩者混住比較，呎租會失真。'],
      ['管理費是否已包', '租金包管理費同唔包，實際支出可以差一成以上。比較時應以「每月總支出」為準。'],
      ['樓層及景觀', '高層、有窗、有景通常較貴，低層或無窗會平。呢個差距在工廈特別明顯。'],
      ['裝修及設備', '已有裝修、天花、冷氣、貨𨋢直達，會反映在租金上。空殼單位平，但裝修成本要自己承擔。'],
      ['叫價唔等於成交', '公開盤源多數是叫價。實際成交受議價、租期、免租期影響。'],
      ['用中位數而唔係平均數', '樣本少時平均數容易被極端值拉高。中位數較能反映典型水平。']
    ],
    outro: '你可以用 <a href="/market/">呎租及呎價參考頁</a> 睇本地區中位數，再用 <a href="/budget/">預算計算器</a> 計實際每月支出。'
  }
];

function guidePath(g) { return `/guides/${g.slug}/`; }

function guidePage(g) {
  const body = `<section class="page-intro">
  <p class="entity-kicker">${esc(g.kicker)}</p>
  <h1>${esc(g.h1)}</h1>
  <p>${esc(g.lede)}</p>
</section>
<section class="entity-block guide-body">
  ${g.sections.map(([h, p]) => `<h2>${esc(h)}</h2><p>${p.includes('<a ') ? p : esc(p)}</p>`).join('')}
  <p class="tool-note">${g.outro.includes('<a ') ? g.outro : esc(g.outro)}</p>
  <div class="hero-actions"><a class="primary-button" href="${whatsappBase}?text=${encodeURIComponent('你好，我睇完你哋嘅指南，想問下工商物業嘅實際情況。')}" rel="noopener">有問題直接問 <span>↗</span></a><a class="secondary-button dark" href="/guides/">睇其他指南</a></div>
</section>`;
  return layout({
    title: g.title,
    description: g.description,
    canonical: guidePath(g),
    body: breadcrumbHtml([{ label: '首頁', href: '/' }, { label: '指南', href: '/guides/' }, { label: g.h1 }]) + body,
    active: 'guides',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Article', headline: g.h1, description: g.description, inLanguage: 'zh-HK', mainEntityOfPage: pageUrl(guidePath(g)) },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: pageUrl('/') },
          { '@type': 'ListItem', position: 2, name: '指南', item: pageUrl('/guides/') },
          { '@type': 'ListItem', position: 3, name: g.h1, item: pageUrl(guidePath(g)) }
        ] }
      ]
    })
  });
}

function guidesIndex() {
  const rows = guides.map(g => `<a class="use-card" href="${guidePath(g)}">
    <span class="entity-kicker">${esc(g.kicker)}</span>
    <strong>${esc(g.h1)}</strong>
    <p>${esc(g.description.slice(0, 70))}…</p>
    <span class="use-count">閱讀 ↗</span>
  </a>`).join('');
  const body = `<section class="page-intro">
  <p class="entity-kicker">GUIDES</p>
  <h1>工商物業指南</h1>
  <p>唔講行話，直接講簽約前要核實咩、邊啲數字要小心、邊啲條件會影響你實際成本。</p>
</section>
<section class="entity-block"><div class="use-grid">${rows}</div></section>`;
  return layout({
    title: '香港工商物業指南｜租工廈注意事項及用途限制｜QueenieHub',
    description: '香港工商物業實用指南：租工廈前要核實的 12 件事、工廈用途限制、呎租呎價比較方法，全部附實際做法。',
    canonical: '/guides/',
    body: breadcrumbHtml([{ label: '首頁', href: '/' }, { label: '指南' }]) + body,
    active: 'guides'
  });
}


/* ---------- client data (static JSON for in-browser tools) ---------- */
function freshLabel(p) {
  if (!p.publishDate) return { label: '日期待核', tone: 'warn' };
  const now = new Date(`${dataDate}T00:00:00Z`);
  const pub = new Date(p.publishDate);
  const days = Math.max(0, Math.round((now - pub) / 86400000));
  if (days <= 7) return { label: days <= 1 ? '今日新盤' : `${days} 日內新盤`, tone: 'new' };
  if (days <= 30) return { label: `刊登約 ${days} 日`, tone: 'ok' };
  if (days <= 90) return { label: `刊登約 ${Math.round(days / 30)} 個月`, tone: 'old' };
  return { label: '刊登較久，請核實', tone: 'old' };
}
function freshBadge(p) {
  const f = freshLabel(p);
  return `<span class="fresh fresh-${f.tone}">${esc(f.label)}</span>`;
}
function clientDataFiles() {
  const props = rawData.map(p => ({
    id: p.id, i: p.propertyNo, n: p.name, d: p.district, u: p.usage, c: p.category, cl: categoryLabel(p),
    s: p.size || '', sv: p.sizeValue || 0, pr: p.price || '', r: p.rent || '', up: p.unitPrice || '',
    t: p.tags || [], ad: p.address || '', f: p.floor || '',
    b: p._building ? p._building.slug : '', bn: p._building ? p._building.name : '',
    ln: listingPath(p), fr: freshLabel(p).label, pd: p.publishDate || ''
  }));
  const blds = buildings.map(b => {
    const sizes = b.properties.map(p => p.sizeValue || 0).filter(Boolean);
    const rents = b.rents.map(p => num(p.rent)).filter(Boolean);
    const sales = b.sales.map(p => num(p.price)).filter(Boolean);
    const rateOf = p => {
      if (p.category === 'rent') {
        const r = num(p.rent), sz = p.sizeValue || 0;
        return r && sz ? r / sz : 0;
      }
      const up = num(p.unitPrice);
      if (up) return up;
      const pr = num(p.price), sz = p.sizeValue || 0;
      return pr && sz ? (pr * 10000) / sz : 0;
    };
    const rentRates = b.rents.map(rateOf).filter(x => x > 0).sort((x, y) => x - y);
    const saleRates = b.sales.map(rateOf).filter(x => x > 0).sort((x, y) => x - y);
    return {
      s: b.slug, n: b.name, e: b.nameEn || '', d: b.district, a: b.address || '',
      us: b.usages.filter(Boolean), sale: b.sales.length, rent: b.rents.length,
      smin: sizes.length ? Math.min(...sizes) : 0, smax: sizes.length ? Math.max(...sizes) : 0,
      rmin: rents.length ? Math.min(...rents) : 0, rmax: rents.length ? Math.max(...rents) : 0,
      pmin: sales.length ? Math.min(...sales) : 0, pmax: sales.length ? Math.max(...sales) : 0,
      rr: rentRates.length ? Math.round(rentRates[Math.floor(rentRates.length / 2)]) : 0,
      pr: saleRates.length ? Math.round(saleRates[Math.floor(saleRates.length / 2)]) : 0,
      m: districtStations[b.district] ? districtStations[b.district][0] : ''
    };
  });
  return { props, blds };
}

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
for (const cfg of intents) write(path.join(dist, cfg.slug, 'index.html'), intentPage(cfg));
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
write(path.join(dist,'match/index.html'), matchPage());
write(path.join(dist,'budget/index.html'), budgetPage());
write(path.join(dist,'compare/index.html'), comparePage());
write(path.join(dist,'brief/index.html'), briefPage());
write(path.join(dist,'use/index.html'), useCaseIndex());
for (const c of useCases) write(path.join(dist, `use/${c.slug}/index.html`), useCasePage(c));
write(path.join(dist,'guides/index.html'), guidesIndex());
for (const g of guides) write(path.join(dist, `guides/${g.slug}/index.html`), guidePage(g));
const clientData = clientDataFiles();
write(path.join(dist,'data/properties.json'), JSON.stringify(clientData.props));
write(path.join(dist,'data/buildings.json'), JSON.stringify(clientData.blds));
write(path.join(dist,'404.html'), notFoundPage());

const allPages = [
  { path: '/', title: 'QueenieHub 香港工商大廈索引' },
  { path: '/buildings/', title: '全部大廈' },
  ...buildings.map(b => ({ path: buildingPath(b), title: b.name })),
  ...Object.values(districtSlug).map(s => ({ path: `/district/${s}/`, title: '地區大廈及盤源' })),
  { path: '/listings/', title: '全部公開盤源' },
  { path: '/market/', title: '呎租及呎價參考' },
  { path: '/match/', title: '工商物業配對器' },
  { path: '/budget/', title: '租金預算計算器' },
  { path: '/compare/', title: '大廈比較工具' },
  { path: '/brief/', title: '物業查詢 Brief' },
  { path: '/use/', title: '按用途搵盤' },
  ...useCases.map(c => ({ path: useCasePath(c), title: c.h1 })),
  { path: '/guides/', title: '工商物業指南' },
  ...guides.map(g => ({ path: guidePath(g), title: g.h1 })),
  ...intents.map(i => ({ path: `/${i.slug}/`, title: i.h1 })),
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
