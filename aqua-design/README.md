# 水景空間設計互動 Demo

依 Jerry Chang Aqua Design 的自然、水景、植栽主題，加入白澤式的互動與動態設計。此目錄為獨立前端 demo，不修改白澤首頁，也不串接現有聯絡 API。

## 預覽

在專案根目錄執行 `HOST=127.0.0.1 PORT=3100 node server.js`，開啟：

http://127.0.0.1:3100/public/demos/aqua-design/

一般展示亦可直接用瀏覽器開啟本目錄 `index.html`，AI 圖片功能必須透過上述本機網站啟動。照片、樣式與程式均使用相對路徑；Google Fonts 需要網路，離線時使用系統字型。

## 可操作功能

- 首頁三組水景手動切換、滑鼠水波、磁吸按鈕。
- 區塊滑入、跑馬燈、閱讀進度、圖片縮放轉場。
- 四件作品分類篩選、作品詳情彈窗，以及作品類型帶入諮詢。
- 日光／夜色光境模擬。
- 設計服務展開收合。
- 三步驟諮詢、必填與 email 驗證、上一步、完成需求摘要。
- 手機導覽、響應式排版、鍵盤操作、原生 modal 焦點管理。
- 遵循系統減少動態偏好。
- AI 魚缸設計：造景風格、尺寸、擺放位置、魚隻與補充想法；生成狀態、圖片下載、需求帶入諮詢。

諮詢資料只在當前頁面的記憶體中顯示，不儲存、不傳送。完成摘要不代表正式預約。

## 素材與內容

參考頁：https://www.jerrychang-aquadesign.com/about-us.html

`assets/` 圖片選自參考網站公開展示素材，保留原圖。作品標題與敘述為概念提案文案，不代表實際案例名稱、規格或地點。此 demo 用於本機設計評估；正式上線時請使用有授權的品牌與圖片。

## 驗證紀錄

- JavaScript 語法檢查通過。
- 桌面 1280px 與手機 390px 無水平溢出。
- 分類篩選、作品詳情、作品類型帶入、空欄位阻擋、完整三步驟流程測試通過。
- 日夜切換、手機選單展開與點擊後收合測試通過。
- 瀏覽器未觀察到 console warning / error。

## 品牌開場動畫

使用使用者提供的「魚缸先森LOGO.jpg」原始素材，先以純紅色輪廓、魚鬚與獨立魚鰭擺動的線條錦鯉（無漸層、填色或鱗片紋理）游入，再交疊轉換成 SVG 遮罩分離的原始紅魚，最後揭示完整 Logo 與「魚缸先生」網站名稱。原圖的「先森」字樣保留。

- 約 7.1 秒含退場；完成後直接操作首頁。
- 首頁「重播品牌開場」、右上角「跳過動畫」、Escape 鍵。
- 減少動態偏好下不自動播放，手動重播只顯示靜態標誌。
- 已確認完整播放、結束解除捲動鎖定、滑鼠重播與預約視窗正常；最終頁面無 console warning/error。
- 相關檔案：`intro.css`、`intro.js`、`assets/mr-fish-tank-logo.jpg`。

## 本機 Z-Image 圖片服務

已找到既有安裝：`/Users/mac/Documents/Codex/2026-07-24/1/work/zimage/`。使用 Z-Image Turbo Q2_K、Qwen3 4B Q2_K、VAE，以及 `runtime/bin/sd-server` 的 Metal 加速。模型維持原位置，不重新下載。

先在專案根目錄執行 `./scripts/start-aqua-image.sh`，另開一個終端執行預覽章節的網站指令。圖片服務僅監聽 `127.0.0.1:1234`，由網站後端呼叫 `/sdapi/v1/txt2img`。本機設定位於不納入版本控制的 `config/aqua-image.local.json`。測試解析度為 768 × 512、8 步、CFG 1、Euler／SmoothStep。第一張圖片可能需要數分鐘。

另保留 `images-api` 相容轉接，供未來更換服務使用。ComfyUI、Gradio、Draw Things 等介面須依實際安裝版本另外串接，不可直接假設相容。

- 圖片由後端保留在記憶體，重啟後失效；不寫入正式詢問資料。
- 最多三個待處理工作，逐張生成；每張等待上限十分鐘。
- 諮詢帶入生成條件與圖片編號，目前仍為前端示範。
- 相關檔案：`designer.css`、`designer.js`、`src/routes/aquaDesign.js`、`src/services/aquaImageService.js`。

### 實際生成驗證（2026-10-02）

從首頁選擇水草森林、90 × 45 × 45 cm、客廳、少量小型魚，實際經過本機 Z-Image 生成並顯示 768 × 512 PNG。模型記錄耗時 186.21 秒。下載檔案與生成條件帶入諮詢均通過，瀏覽器沒有 warning/error。

`assets/z-image-aquarium-test.png` 保留這次實際生成結果，`z-image-connected-preview.png` 是網站完成畫面。測試圖部分細節模糊，且出現假文字；目前用於操作流程評估。
