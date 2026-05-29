# 長者健康自我管理｜AI 圖片讀取藥單更新版

## 今次新增

- 在「批量輸入藥物」上方新增「AI 圖片讀取藥單」區域
- 支援圖片上傳
- 支援手機直接拍照 `capture="environment"`
- 圖片會傳送到後端 `/api/analyze-medication-image`
- 前端不需要、亦不會要求用戶輸入 API Key
- AI 會把藥袋／藥物紀錄整理成：

```txt
藥物名稱 | 劑量 | 服用次數 | 服用時間 | 備註
```

## Vercel 設定 API Key

到 Vercel Project Settings > Environment Variables 新增：

```txt
OPENAI_API_KEY=你的 OpenAI API Key
```

然後重新 Deploy。

## 本機測試

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

## 檔案位置

- 前端：`src/main.jsx`
- 樣式：`src/styles.css`
- 後端 AI API：`api/analyze-medication-image.js`
- Vercel 設定：`vercel.json`

## 注意

AI 圖片辨識只作資料整理及輔助輸入，不能取代醫生、藥劑師或正式藥物標籤。正式服藥安排應以醫護人員指示為準。
