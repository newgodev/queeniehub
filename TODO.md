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

## 尚未做 / 下一步
- [ ] 重新提交更新後 sitemap（221 個 URL，包含 67 幢大廈），並對日昇亞太中心等重點大廈頁 request indexing。
- [ ] 為 10–20 幢重點大廈補充已核實嘅大廈資料（樓層、落成年份、管理費、交通），只加有可靠來源嘅欄位。
- [ ] 建立香港工商物業知識內容（例如「工廈與寫字樓用途分別」、「睇工廈要問咩」），以內容而非重複 listing 增加搜尋覆蓋。
- [ ] 喺 Queenie 自己嘅 Facebook／IG／WhatsApp Business／YouTube 簡介放回大廈頁連結，建立外部連結訊號。
- [ ] 接駁合法、穩定及獲授權嘅資料更新來源；目前資料係 2026-11-08 抓取嘅公開快照。
- [ ] 網站未有圖片；如要加入，需使用自有拍攝或已授權圖片，不可直接使用中原圖片。
