# 長者健康自我管理｜完整恢復版

此版本已恢復完整頁面及功能，並在「藥物」頁面的批量輸入上方加入：

- 圖片上傳藥袋／藥物紀錄
- 手機拍照讀取藥袋／藥物紀錄
- 後端 AI API 自動分析圖片
- 自動填入批量輸入框及今日藥物清單
- AI 藥單分析框

## 已包含頁面

1. 首頁健康總覽
2. 今日藥物清單
3. 健康數據：血糖、血壓、體重、心跳等
4. 覆診提醒
5. 健康紀錄
6. 設定：個人資料、長期病患、藥物敏感、提醒設定

## 本地安裝

```bash
npm install
npm run dev
```

## Vercel 部署

1. 將整個資料夾上傳到 GitHub
2. 在 Vercel 匯入 GitHub repository
3. 到 Project Settings > Environment Variables
4. 新增：

```env
OPENAI_API_KEY=你的 OpenAI API Key
```

5. 重新 Deploy

## 注意

- 前端不會顯示或要求使用者輸入 API Key。
- `/api/analyze-medication-image` 負責藥袋圖片分析。
- `/api/analyze-medication-list` 負責藥單健康分析。
- AI 藥物分析只作健康教育及資料整理，不可取代醫生或藥劑師意見。
