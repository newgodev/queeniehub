# Queenie 商業地產搜尋 — TODO

## 已完成

### 網站身份及公開資料
- [x] 以 Queenie 自有名稱建立網站身份，不使用中原品牌、商標、受版權保護圖片、原文或介面。
- [x] 每頁標示公開資料來源，連回原始代理頁；唔自稱任何大廈業主或管理處官方網站。
- [x] 顯示價格、盤況、面積及可用性需重新核對嘅提示。
- [x] 不登入、不修改中原後台、不繞過公司認證流程。

### 大廈實體優先架構（2026-11-09 新增）
- [x] 由 126 個公開盤源歸納出 **67 幢大廈實體**，以「地區＋大廈名稱」去重，地址只取公開資料中最一致版本。
- [x] 建立 67 個獨立大廈頁：`/building/{地區}/{大廈英文名}/`；每頁有 H1 大廈名、英文名、地址、地區、用途、面積範圍、價格概況及資料日期。
- [x] 大廈頁以「大廈概覽」開頭，真實描述該幢大廈現有盤源數量及範圍，之後才列出放租／出售盤源，令 Google 先理解建築物實體，而非第三方列表。
- [x] 大廈頁加入「睇樓前建議核對」清單（管理費、樓底、負重、升降機、車位、地契用途、交吉日期、維修狀況），明確標示為待核對項目，非已核實數值。
- [x] 大廈頁加入身份說明，列明與業主、管理處及發展商並無官方關係。
- [x] 建立 `/buildings/` 大廈索引，按地區分組並可逐幢進入。
- [x] 首頁改為「由大廈開始」：先列 6 幢重點大廈，再列地區及最新盤源。
- [x] 地區頁同時列出該區全部大廈及盤源。
- [x] 每個盤源頁加入「所屬大廈」連結、麵包屑（首頁／地區／大廈／盤源）及所屬大廈簡介段落。
- [x] 每個盤源卡片加入「大廈資料」反向連結，形成大廈↔盤源雙向內部連結。

### 結構化資料及 SEO
- [x] 大廈頁 JSON-LD：`WebPage` + `Place`（名稱、alternateName、PostalAddress、containsPlace）+ `BreadcrumbList`；無地址時不輸出空 PostalAddress。
- [x] 盤源頁 JSON-LD：`WebPage`（about 指向所屬大廈）+ `BreadcrumbList`。
- [x] 全站 221 頁 title 全部符合 30–60 字，description 全部符合 50–160 字。
- [x] sitemap.xml 改為 221 個 URL，並以首頁、大廈索引、67 幢大廈排最前。
- [x] `/manus-routes.json` 反映 221 個頁面路徑。
- [x] 全站 canonical、Open Graph 使用正式網域 `https://queeniehub.estate`。

### 網域、部署及索引
- [x] Spaceship DNS 設定：4 條 GitHub Pages A record + `www` CNAME。
- [x] GitHub Pages 已啟用、DNS check successful、SSL 憑證已簽發、Enforce HTTPS 已開啟。
- [x] `https://queeniehub.estate` 回應 200，`http://` 會 301 轉 HTTPS。
- [x] GitHub Actions workflow 自動 build 及部署；`newgodev/queeniehub` 公開 repo。
- [x] Google Search Console 完成 domain ownership 驗證（DNS CNAME）。
- [x] 提交 `https://queeniehub.estate/sitemap.xml`，狀態 Success，已發現 153 個頁面（提交時版本）。
- [x] 首頁 URL Inspection live test 通過：Page can be indexed。


### 2026-11-09 追加改進（大廈頁可用性及索引）
- [x] 每幢大廈頁加入「現有盤源一覽」比較表：樓層、面積、類型、叫價、呎價／呎租、廣告日期，全部由公開資料計算。
- [x] 大廈索引加入即時搜尋（大廈名、英文名、地區、街道）及 20 個地區跳轉標籤。
- [x] 列表頁、大廈索引、地區頁及用途頁補上麵包屑導覽。
- [x] 加入品牌 404 頁（GitHub Pages 會自動使用 `404.html`），引導回大廈索引及盤源。
- [x] sitemap 每個 URL 加入 `lastmod`。
- [x] 加入「跳至主要內容」skip link 及 `main` landmark，改善無障礙。
- [x] 修正 `app.js` 會覆寫首頁 `document.title` 嘅舊 bug（會令 SEO 面板讀到舊標題）。
- [x] 加入自製 1200×630 品牌分享圖 `og-cover.png`，補上 `og:image`、`twitter:image` 及 `og:locale`。
- [x] 建立 `scripts/deploy-github.sh`：同步專案到 GitHub Pages repo 並觸發部署。


### 2026-11-09 第二輪改進（原創數據及轉化）
- [x] 新增 `/market/` 呎租及呎價參考頁：用 126 個公開盤源自算各地區及用途中位數，附樣本數、面積中位數、計算方法及資料限制；大廈頁側欄加入「同區呎租參考」卡。
- [x] 全站加入「比較清單」：每個盤源卡及詳情頁可加入比較（最多 6 個，localStorage 保存），底部浮動條可一次過生成 WhatsApp 查詢訊息，列出已選盤源名稱及物業編號。
- [x] 修正 `[hidden]` 被版面 CSS 覆蓋嘅風險，統一 `[hidden]{display:none!important}`。
- [x] 淺色背景標題改用深綠，解決螢光綠在米色上對比不足。
- [x] 瀏覽器實測：搜尋「日昇」→ 2 個結果、清除 → 126 個；比較 2 個盤源 → 浮動條出現、WhatsApp 連結含兩個盤源名稱及編號。


### 2026-11-09 第三輪（SEO／GEO 深度）
- [x] `data/building-facts.json`：8 幢主力大廈已核實客觀資料（落成年份、層數、升降機、冷氣、業權、發展商、管理、標準樓層、車位、港鐵步行），每項附公開來源。
- [x] 大廈頁新增「位置、落成年份及大廈規格」段落及「大廈客觀資料來源」區塊；`Place` schema 加 `additionalProperty`。
- [x] 盤源頁新增 `RealEstateListing`（物業編號、價格、面積 FTK、地址、所屬大廈、Offer 價格）。
- [x] 盤源描述擴寫至 106–209 字（中位 189），自動帶入大廈核實資料、同幢盤源數及同區呎租／呎價中位數。
- [x] `robots.txt` 明確允許 10 個 AI 爬蟲；新增 `/llms.txt` 站點摘要。
- [x] 修正 29 頁空白 `ld+json`，全站 223 頁結構化資料 0 錯誤。
- [x] 產出《QueenieHub_SEO_GEO_審計與優化方案.md》：語義差距、關鍵字詞庫、title／description 對比、H1–H2、JSON-LD 範例、內文改寫前後。
- [ ] 待做：每幢大廈 FAQ 3–5 條、`geo` 座標、成交紀錄頁、管理費及車位數、圖片／平面圖。

## 尚未做 / 下一步
- [ ] 重新提交更新後 sitemap（221 個 URL，包含 67 幢大廈），並對日昇亞太中心等重點大廈頁 request indexing。
- [ ] 為 10–20 幢重點大廈補充已核實嘅大廈資料（樓層、落成年份、管理費、交通），只加有可靠來源嘅欄位。
- [ ] 建立香港工商物業知識內容（例如「工廈與寫字樓用途分別」、「睇工廈要問咩」），以內容而非重複 listing 增加搜尋覆蓋。
- [ ] 喺 Queenie 自己嘅 Facebook／IG／WhatsApp Business／YouTube 簡介放回大廈頁連結，建立外部連結訊號。
- [ ] 接駁合法、穩定及獲授權嘅資料更新來源；目前資料係 2026-11-08 抓取嘅公開快照。
- [ ] 網站未有圖片；如要加入，需使用自有拍攝或已授權圖片，不可直接使用中原圖片。

## 2026-11-10 高意圖搜尋頁及大廈頁深化
- [x] 新增 6 個高意圖頁：觀塘工廈放租、觀塘寫字樓放租、九龍灣寫字樓、長沙灣工廈出售、屯門工廈放租、黃竹坑商業地產
- [x] 每頁包含：直接答案（盤源數、叫價範圍、樣本量）、地區介紹、適合公司類型、交通、叫價與面積表、主要大廈、目前盤源、5–6 條 FAQ、WhatsApp 預填 CTA
- [x] 加入 FAQPage、ItemList、BreadcrumbList、WebPage 結構化資料
- [x] 大廈頁新增「位置及交通」：地址、本區港鐵站、Google 地圖路線、相關高意圖頁內鏈
- [x] 大廈頁新增用途提示：公開用途 vs 地契／公契／屋宇署／消防要求
- [x] 首頁新增「最多人搵嘅組合」、頁尾新增 6 個高意圖頁內鏈、地區頁加入熱門搜尋區塊
- [x] 修正全站內容區塊左右內距（entity-block 貼邊問題）
- [x] Sitemap 及 route manifest 由 225 增至 231 頁

## 將來待辦（用戶要求日後提醒）
- [ ] Contact 頁寫明 Queenie 可提供的服務範圍
- [ ] Queenie 真實代理身份資料（牌照／公司／公開頁）
- [ ] 服務地區清單
- [ ] 查詢流程圖文
- [ ] 資料更新日期顯示於更多頁面
- [ ] 真實客人常問問題整理
- [ ] 公司／代理公開頁連結（about 頁現有頁尾連結，未正式列入身份區）
- [ ] Google Business Profile
- [ ] 香港商業目錄
- [ ] 地區商會或行業目錄
- [ ] 供應商／合作夥伴／公司介紹頁
