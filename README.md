# QueenieHub — 香港工商大廈及盤源索引

網址：<https://queeniehub.estate>

由香港工商物業代理 Queenie 楊佩儀使用嘅公開資料整理及查詢入口。網站以「大廈」為第一層，盤源為第二層，令客人同搜尋引擎都先理解建築物實體，再睇該幢大廈現有嘅出售及放租盤源。

本網站**唔係**任何大廈業主、管理處或發展商官方網站，亦唔代表中原或其他代理發出要約。所有資料整理自公開代理頁面，價格、面積及盤況需向代理重新核對。

## 托管方式（重要）

- 正式網站由 **GitHub Pages 免費托管**，自訂網域 `queeniehub.estate`，HTTPS 已開啟並強制轉址。
- 唔使用 Manus 托管，避免高流量時產生費用。
- 每次 push 到 `main`，`.github/workflows/pages.yml` 會自動 `npm run build` 並部署 `dist/`。
- build 時注入 `PUBLIC_ORIGIN=https://queeniehub.estate`，同時寫入 `dist/CNAME`。

## 網站結構

| 路徑 | 內容 |
| --- | --- |
| `/` | 首頁，先列大廈再列盤源 |
| `/buildings/` | 67 幢大廈索引，可搜尋、可按地區跳轉 |
| `/building/{地區}/{英文名}/` | 單幢大廈頁：概覽、資料表、盤源比較表、核對清單、盤源列表 |
| `/district/{地區}/` | 該區大廈及盤源 |
| `/usage/{用途}/` | 按用途分類 |
| `/listing/{樓盤}/` | 盤源詳情，頂部反向連回所屬大廈 |
| `/sitemap.xml` | 221 個 URL，附 `lastmod` |
| `/404.html` | 品牌 404 頁 |

## 技術

零依賴靜態網站：Node.js 腳本由 `data/properties.json`（126 個公開盤源快照）生成全部 HTML。

```bash
npm run import-data   # 由原始 CSV／JSON 重新整理 data/properties.json
npm run build         # 生成 dist/（221 頁 + sitemap + robots + route manifest）
npm start             # 本機預覽 http://127.0.0.1:3000
```

主要檔案：

- `scripts/build.mjs` — 頁面生成器（大廈聚合、結構化資料、SEO metadata、sitemap）
- `scripts/import-data.mjs` — 資料匯入
- `scripts/deploy-github.sh` — 由開發環境同步到本 repo 並觸發部署
- `styles.css` — 全站樣式（自有品牌，非抄襲）
- `app.js` — 盤源篩選及大廈搜尋

## SEO 現況

- 全站 221 頁，title 全部 30–60 字，description 全部 50–160 字。
- 大廈頁 JSON-LD：`WebPage` + `Place`（含 `alternateName`、`PostalAddress`）+ `BreadcrumbList`。
- 盤源頁 JSON-LD：`WebPage`（`about` 指向所屬大廈）+ `BreadcrumbList`。
- Google Search Console 已驗證 `queeniehub.estate`，sitemap 已提交。
- 日昇亞太中心大廈頁 live test 結果：可被索引、麵包屑有效。

## 內容原則

只寫有公開來源支持嘅資料。樓層數、落成年份、管理費、車位、交通等未核實欄位唔會捏造，改為以「睇樓前建議核對」清單列出，提醒客人向代理查證。

## 授權及資料

程式碼可自由參考。盤源資料來自公開頁面，只作搜尋及整理用途；如資料擁有人要求下架，請開 issue 聯絡。
