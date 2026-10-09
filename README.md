# 魚缸先生 Mr. Fish Tank — 設計概念 Demo

魚缸先生水景設計的三個版本概念網站，以 GitHub Pages 部署為靜態網站。

| 版本 | 路徑 |
|---|---|
| 海洋版（首頁預設） | [`aqua-design-ocean/`](aqua-design-ocean/) |
| 日式版 | [`aqua-design-jp/`](aqua-design-jp/) |
| 原始版 | [`aqua-design/`](aqua-design/) |

根目錄的 `index.html` 會自動導向海洋版；三個版本可由頁面右上角互相切換。

## 部署

推送到 `main` 後，`.github/workflows/pages.yml` 會自動把整個 repo 部署到 GitHub Pages。

## 注意

- 「AI 魚缸設計」需要本機的生成服務（`/api/aqua-design`），靜態網站上會顯示「生成服務尚未連線」，其餘功能都可正常使用。
- 網站影像為 AI 概念示意，非施工案例或生物品種辨識資料。
