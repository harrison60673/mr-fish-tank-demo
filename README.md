# 魚缸先生 Mr. Fish Tank — 設計概念 Demo

魚缸先生水草缸、純魚缸、海水缸三種缸型的概念網站，以 GitHub Pages 部署為靜態網站。

| 缸型 | 路徑 |
|---|---|
| 入口：選擇你的水景（開場動畫＋三缸型選擇） | [`index.html`](index.html) |
| 水草缸 | [`aqua-design/`](aqua-design/) |
| 純魚缸（介面預設日文） | [`aqua-design-jp/`](aqua-design-jp/) |
| 海水缸 | [`aqua-design-ocean/`](aqua-design-ocean/) |

根目錄 `index.html` 是入口選擇頁；三個網站可由頁面上方的切換列互相切換。

## 部署

推送到 `main` 後，`.github/workflows/pages.yml` 會自動把整個 repo 部署到 GitHub Pages。

## 注意

- 「AI 魚缸設計」需要本機的生成服務（`/api/aqua-design`），靜態網站上會顯示「生成服務尚未連線」，其餘功能都可正常使用。
- 網站影像為 AI 概念示意，非施工案例或生物品種辨識資料。
