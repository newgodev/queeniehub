import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/properties.json'), 'utf8'));
const dist = path.join(root, 'dist');
const agentPage = 'https://oir.centanet.com/agent-detail/queenie-yeung/49008/';
const whatsappBase = 'https://wa.me/85266552539';
const publicOrigin = (process.env.PUBLIC_ORIGIN || '').replace(/\/$/, '');

const districtMeta = {
  '觀塘': '觀塘工廈、工商樓盤及寫字樓出售／放租公開資料。按面積、用途及價格瀏覽，查詢最新盤況及睇樓安排。',
  '長沙灣': '長沙灣工廈、工商樓盤及寫字樓出售／放租公開資料。集中查看不同面積及用途選項。',
  '屯門': '屯門工廈及工商樓盤放租公開資料。按樓面面積、價格及公開特色比較。',
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

function categoryLabel(p) { return p.categoryLabel || '樓盤'; }
function price(p) { return p.category === 'rent' && p.rent ? `${p.rent}／月` : (p.price || '價格請查詢'); }
function card(p) {
  const href = `/listing/${p.slug}/`;
  const tags = p.tags.length ? p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('') : '<span class="tag muted">公開資料待核</span>';
  return `<article class="listing-card" data-search="${esc([p.name,p.nameEn,p.district,p.usage,p.categoryLabel,p.address,p.propertyNo,p.tags.join(' ')].join(' '))}" data-district="${esc(p.district)}" data-usage="${esc(p.usage)}" data-category="${esc(p.category)}">
    <div class="card-top"><span class="eyebrow">${esc(p.district)} · ${esc(categoryLabel(p))}</span><span class="code">${esc(p.propertyNo)}</span></div>
    <h3><a href="${href}">${esc(p.name)}</a></h3>
    <p class="card-address">${esc(p.address)} · ${esc(p.usage)}</p>
    <div class="card-stats"><strong>${esc(p.size || '面積請查詢')}</strong><span>${esc(price(p))}</span></div>
    <div class="tags">${tags}</div>
    <a class="card-link" href="${href}">查看公開資料 <span>↗</span></a>
  </article>`;
}
function whatsapp(p) {
  const text = `你好，我想查詢${p.name}（${p.propertyNo}），想了解最新${categoryLabel(p)}狀況、實際面積、可用日期及睇樓安排。`;
  return `${whatsappBase}?text=${encodeURIComponent(text)}`;
}
function layout({title, description, canonical, body, active='all', jsonLd='', keywords='香港工商舖, 香港工廈, 寫字樓放租, 商業地產, 樓盤搜尋'}) {
  return `<!doctype html><html lang="zh-HK"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="keywords" content="${esc(keywords)}"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="Queenie 商業地產搜尋">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">
<link rel="stylesheet" href="/styles.css"><script type="application/ld+json">${jsonLd}</script></head><body>
<header class="site-header"><a class="brand" href="/"><span class="brand-mark">Q</span><span><b>QUEENIE</b><small>COMMERCIAL INDEX</small></span></a><nav><a class="${active==='listings'?'active':''}" href="/listings/">搵樓盤</a><a href="/district/kwun-tong/">地區</a><a href="/usage/industrial/">用途</a><a class="nav-cta" href="${whatsappBase}">WhatsApp 查詢</a></nav></header>
<main>${body}</main>
<footer class="site-footer"><div><span class="brand-footer">Q / COMMERCIAL INDEX</span><p>香港工商舖公開資料搜尋入口。資料來自公開來源，價格、盤況及面積請於聯絡前重新核對。</p></div><div class="footer-links"><a href="${agentPage}" rel="nofollow">原始代理公開頁</a><a href="/listings/">全部公開樓盤</a><span>資料更新：2026-11-08 抓取</span></div></footer>
<script src="/app.js" defer></script></body></html>`;
}
function filterPanel() {
  const districts = [...new Set(data.map(p=>p.district))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
  const usages = [...new Set(data.map(p=>p.usage))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
  return `<section class="filter-panel" aria-label="樓盤篩選"><div class="search-field"><span>⌕</span><input id="searchInput" type="search" placeholder="搜尋樓名、地區、用途或物業編號" autocomplete="off"></div><label>地區<select id="districtFilter"><option value="">全部地區</option>${districts.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>用途<select id="usageFilter"><option value="">全部用途</option>${usages.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>類型<select id="categoryFilter"><option value="">出售／放租</option><option value="sale">出售</option><option value="rent">放租</option><option value="new_property">新盤</option><option value="project">項目</option></select></label><button class="ghost-button" id="clearFilters" type="button">清除</button></section>`;
}
function listingJson(p, canonical) {
  return JSON.stringify({'@context':'https://schema.org','@type':'RealEstateListing','name':`${p.district}${p.usage}${categoryLabel(p)}｜${p.name}｜${p.size || '面積請查詢'}`,'url':canonical,'description':`${p.district}${p.usage}${categoryLabel(p)}公開資料：${p.name}，${p.size || '面積請查詢'}，${price(p)}。`,'address':{'@type':'PostalAddress','addressLocality':p.district,'streetAddress':p.address}});
}
function detail(p) {
  const canonical=pageUrl(`/listing/${p.slug}`);
  const tags=p.tags.length?p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join(''):'<span class="tag muted">公開資料待核</span>';
  const fields=[['地區',p.district],['用途',p.usage],['樓層',p.floor||'公開資料未列明'],['面積',p.size||'公開資料未列明'],['物業編號',p.propertyNo],['廣告日期',p.publishDate?String(p.publishDate).slice(0,10):'公開資料未列明']];
  const body=`<section class="detail-hero"><div class="detail-kicker">${esc(p.district)} / ${esc(categoryLabel(p))} / ${esc(p.usage)}</div><h1>${esc(p.name)}</h1><p class="lede">${esc(p.address)} · ${esc(p.size || '面積請查詢')} · ${esc(price(p))}</p><div class="hero-actions"><a class="primary-button" href="${whatsapp(p)}" target="_blank" rel="noopener">WhatsApp 查詢 ↗</a><a class="secondary-button" href="${agentPage}" target="_blank" rel="noopener">查看原始代理頁</a></div></section>
<section class="detail-grid"><div class="detail-main"><div class="section-label">公開樓盤資料</div><div class="facts">${fields.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div><div class="detail-block"><h2>樓盤特色</h2><div class="tags large">${tags}</div><p>以上內容由公開樓盤資料整理，實際樓面面積、價格、盤況及可用日期請於聯絡代理前重新核對。</p></div><div class="detail-block"><h2>查詢時可以直接講</h2><p class="message-box">你好，我想查詢${esc(p.name)}（${esc(p.propertyNo)}），想了解最新${esc(categoryLabel(p))}狀況、實際面積、可用日期及睇樓安排。</p></div></div><aside class="detail-aside"><div class="aside-card"><span class="eyebrow">資料來源</span><h2>公開代理頁</h2><p>呢個頁面只係搜尋及整理入口，唔代表代理已確認現時仍然有盤。</p><a href="${agentPage}" target="_blank" rel="nofollow noopener">前往原始頁面 ↗</a></div><div class="aside-card accent"><span class="eyebrow">想搵相近盤？</span><h2>講你想要嘅地區、面積同預算</h2><a class="primary-button" href="${whatsapp(p)}" target="_blank" rel="noopener">WhatsApp 楊佩儀</a></div></aside></section><section class="related"><div class="section-heading"><div><span class="section-label">繼續瀏覽</span><h2>${esc(p.district)} 其他公開樓盤</h2></div><a href="/district/${districtSlug[p.district] || slug(p.district)}/">查看地區頁 ↗</a></div><div class="listing-grid">${data.filter(x=>x.district===p.district && x.id!==p.id).slice(0,3).map(card).join('')}</div></section>`;
  return layout({title:`${p.district}${p.usage}${categoryLabel(p)}｜${p.name}｜Queenie 商業地產搜尋`,description:`${p.district}${p.usage}${categoryLabel(p)}公開資料：${p.name}，${p.size||'面積請查詢'}，${price(p)}。查詢最新盤況及睇樓安排。`,canonical,body,jsonLd:listingJson(p,canonical)});
}
function listingsPage() {
  const body=`<section class="page-intro compact"><span class="section-label">PUBLIC LISTINGS / ${data.length}</span><h1>全部公開樓盤</h1><p>用地區、用途、出售／放租或關鍵字，快速縮窄你要搵嘅工商舖選項。</p></section>${filterPanel()}<section class="results-head"><strong id="resultCount">${data.length} 個公開項目</strong><span>價格及盤況請重新核對</span></section><section class="listing-grid" id="listingGrid">${data.map(card).join('')}</section><p class="empty-state" id="emptyState" hidden>未搵到符合條件嘅公開項目。試下放寬地區、用途或搜尋字詞。</p>`;
  return layout({title:'全部香港工商舖公開樓盤｜Queenie 商業地產搜尋',description:'按地區、用途、出售／放租及關鍵字瀏覽香港工商舖公開樓盤。',canonical:pageUrl('/listings'),body,active:'listings'});
}
function home() {
  const featured=data.filter(p=>['觀塘','長沙灣','屯門'].includes(p.district)).slice(0,6);
  const districtCards=['觀塘','長沙灣','屯門','九龍灣','黃竹坑','油塘'].map(d=>{const count=data.filter(p=>p.district===d).length; return `<a class="district-card" href="/district/${districtSlug[d]}/"><span>${esc(d)}</span><strong>${count}</strong><small>個公開項目 ↗</small></a>`}).join('');
  const body=`<section class="hero"><div class="hero-copy"><span class="eyebrow inverse">QUEENIE / COMMERCIAL INDEX</span><h1>搵到啱你<br><em>做生意</em>嘅地方。</h1><p>一個自有、清楚、由公開資料整理嘅香港工商舖搜尋入口。先搵地區，再睇用途，最後直接 WhatsApp 查詢。</p><a class="hero-cta" href="/listings/">開始搵樓盤 <span>↗</span></a></div><div class="hero-aside"><div class="orbit"><span class="orbit-dot dot-a"></span><span class="orbit-dot dot-b"></span><span class="orbit-dot dot-c"></span><div><b>${data.length}</b><small>PUBLIC<br>LISTINGS</small></div></div><p>資料由公開代理頁整理，價格、盤況及面積請於聯絡前重新核對。</p></div></section><section class="district-section"><div class="section-heading"><div><span class="section-label">BROWSE BY AREA</span><h2>先揀你想做生意嘅區</h2></div><a href="/listings/">全部樓盤 ↗</a></div><div class="district-grid">${districtCards}</div></section><section class="featured-section"><div class="section-heading"><div><span class="section-label">FRESH SHORTLIST</span><h2>一眼睇到重點</h2></div><a href="/listings/">開啟完整篩選 ↗</a></div><div class="listing-grid">${featured.map(card).join('')}</div></section><section class="trust-strip"><div><span class="section-label">HOW IT WORKS</span><h2>由搜尋到聯絡，唔使兜路。</h2></div><div class="steps"><span><b>01</b>按地區／用途篩選</span><span><b>02</b>睇公開樓盤資料</span><span><b>03</b>WhatsApp 代理核對</span></div></section>`;
  return layout({title:'香港商業地產樓盤搜尋｜觀塘工廈、寫字樓、商舖出售放租｜Queenie 商業地產',description:'香港工商舖公開資料搜尋入口。按地區、用途及出售／放租瀏覽工廈、寫字樓及商業樓盤，直接 WhatsApp 查詢。',canonical:pageUrl('/'),body,keywords:'香港工商舖, 香港工廈, 觀塘工廈, 寫字樓放租, 商業地產'});
}
function aggregatePage(type, value, list) {
  const isDistrict=type==='district';
  const title=isDistrict?`${value}工廈、寫字樓及工商樓盤｜Queenie 商業地產搜尋`:`${value}出售／放租公開樓盤｜Queenie 商業地產搜尋`;
  const description=isDistrict?(districtMeta[value] || `${value}工商舖公開樓盤資料。`):(usageMeta[value] || `${value}公開樓盤資料。`);
  const body=`<section class="page-intro"><span class="section-label">${isDistrict?'AREA INDEX':'USAGE INDEX'}</span><h1>${esc(value)}<br><em>${isDistrict?'公開樓盤':'樓盤分類'}</em></h1><p>${esc(description)}</p><a class="primary-button" href="/listings/">查看全部樓盤</a></section><section class="results-head"><strong>${list.length} 個公開項目</strong><span>資料需重新核對</span></section><section class="listing-grid">${list.map(card).join('')}</section><section class="notice"><strong>資料提醒</strong><p>呢度係公開資料整理入口，唔係實時庫存保證。價格、面積、盤況及可用日期請直接向代理核對。</p></section>`;
  const pathName=isDistrict?`/district/${districtSlug[value] || slug(value)}`:`/usage/${usageSlug[value] || slug(value)}`;
  return layout({title,description,canonical:pageUrl(pathName),body});
}

fs.rmSync(dist,{recursive:true,force:true}); mkdir(dist);
write(path.join(dist,'styles.css'), fs.readFileSync(path.join(root,'styles.css'),'utf8'));
write(path.join(dist,'app.js'), fs.readFileSync(path.join(root,'app.js'),'utf8'));
write(path.join(dist,'index.html'), home());
write(path.join(dist,'listings/index.html'), listingsPage());
for (const p of data) write(path.join(dist,`listing/${p.slug}/index.html`), detail(p));
for (const [d, dSlug] of Object.entries(districtSlug)) write(path.join(dist,`district/${dSlug}/index.html`), aggregatePage('district', d, data.filter(p=>p.district===d)));
for (const [u, uSlug] of Object.entries(usageSlug)) write(path.join(dist,`usage/${uSlug}/index.html`), aggregatePage('usage', u, data.filter(p=>p.usage===u)));
const allPages=['/','/listings/',...data.map(p=>`/listing/${p.slug}/`),...Object.values(districtSlug).map(s=>`/district/${s}/`),...Object.values(usageSlug).map(s=>`/usage/${s}/`)];
write(path.join(dist,'manus-routes.json'),JSON.stringify({routes:allPages.map(p=>({path:p,title:p==='/'?'Queenie 商業地產搜尋':p.includes('/listing/')?'樓盤詳情':p.includes('/district/')?'地區樓盤':p.includes('/usage/')?'用途樓盤':'全部公開樓盤'}))}));
write(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /api/\n${publicOrigin ? `Sitemap: ${publicOrigin}/sitemap.xml\n` : ''}`);
write(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allPages.map(p=>`<url><loc>${pageUrl(p)}</loc></url>`).join('')}</urlset>`);
console.log(`Built ${allPages.length} pages into ${dist}`);
