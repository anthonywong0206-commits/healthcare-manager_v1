# 長者健康自我管理｜Supabase 跨平台同步版 v1.2.1

此版本建基於原有完整版本，新增 **Supabase Auth + Database + Realtime**，讓同一使用者可以在手機、平板及電腦登入同一帳戶後使用同一份健康資料。

## v1.2.1 Production 修正

此版本已預設連接目前健康管理網站使用的 Supabase project：

- Project URL：`https://jciqwdzuptvmwdmmqdaj.supabase.co`
- 使用瀏覽器安全的 Supabase Publishable Key
- 如 Vercel 已提供 `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`，仍會優先使用 Vercel 的值
- 即使 Vercel 尚未設定上述兩項，production 網站也不會再誤判為「只儲存在本機」
- **沒有**把 `service_role` / `sb_secret_...` 放入前端；資料隔離仍由 RLS 保護

部署成功後，未登入狀態應顯示 **「未登入雲端」**，到「設定」頁會見到 Supabase 電郵／密碼登入。


## 新增功能

- Supabase 電郵／密碼登入及建立帳戶
- 前端 Supabase SDK 固定使用 `@supabase/supabase-js 2.112.4` 的官方支援 CDN 載入方式，不需要更改原有 npm lock dependency tree
- 每位使用者獨立的雲端健康資料
- Row Level Security（RLS），使用者只能存取自己的資料
- 自動把本機資料保存到 `localStorage`
- 登入後約 1 秒自動同步到 Supabase
- 新帳戶第一次登入而雲端未有資料時，自動把目前裝置資料建立為雲端初始版本
- 已有雲端資料時，登入後自動載入雲端最新版本
- Realtime：另一部已登入裝置更新後，可即時收到最新資料
- 以 Supabase 資料庫伺服器時間標記更新版本，減少跨裝置時鐘差異造成的同步衝突
- 登入後本機快取按帳戶 `user_id` 分隔，登出不會把上一個帳戶資料留在畫面
- 手動「立即同步」及「從雲端載入」
- Supabase 無法連線時仍保留本機資料，不會令網站不能使用

原有功能全部保留：

1. 首頁健康總覽
2. 今日藥物清單及服藥時間紀錄
3. AI 藥袋／藥物圖片讀取
4. AI 藥單分析
5. 血糖、血壓、體重、心跳等健康數據
6. 血糖及血壓趨勢圖
7. 月曆式覆診／檢查紀錄
8. 健康備註及 JSON 匯出
9. 個人資料、長期病患、藥物敏感及提醒設定

## 1. Supabase 資料庫設定

在 Supabase 建立／選擇專案後，到 **SQL Editor** 執行：

`supabase/setup.sql`

此 SQL 會：

- 建立 `public.health_snapshots`
- 啟用 RLS
- 只授權 `authenticated` 使用者
- 建立 select / insert / update / delete 自有資料政策
- 把資料表加入 `supabase_realtime` publication

> 不要把 `service_role` 或 `sb_secret_...` 放在前端或 Vite 環境變數。

## 2. Vercel Environment Variables

到 Vercel → Project → Settings → Environment Variables，加入：

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
OPENAI_API_KEY=你的_OpenAI_API_Key
```

Supabase 新專案建議使用 **Publishable key**。如果舊專案暫時只有 legacy `anon` key，程式亦兼容 `VITE_SUPABASE_ANON_KEY`。

完成後 **Redeploy**。

## 3. Supabase Auth 網址設定

在 Supabase Authentication 的 URL / Redirect URLs 加入 production 網址，例如：

```text
https://healthcare-manager-v1.vercel.app
```

如果啟用 email confirmation，使用者建立帳戶後需要先完成電郵驗證。

## 4. 本地開發

將 `.env.example` 複製為 `.env.local` 並填上 Supabase URL／Publishable key：

```bash
npm install
npm run dev
```

## 同步邏輯

- **未登入**：只使用本機 `localStorage`。
- **第一次登入、雲端沒有資料**：目前本機資料會上載成該帳戶的初始資料。
- **雲端已有資料**：以雲端資料作登入後的最新版本。
- **登入後修改資料**：本機先儲存，再自動上載 Supabase。
- **其他裝置更新**：透過 Realtime 收取同一帳戶的最新資料。
- 同時修改同一帳戶時採用較新的雲端更新（last-write-wins）；不適合多人同時編輯同一帳戶。

## 安全設定

`health_snapshots.user_id` 對應 `auth.users.id`，所有資料庫操作受 RLS 保護。前端只使用低權限 Publishable key；OpenAI key 繼續只放在 Vercel server-side Environment Variables。
