import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  FileImage,
  HeartPulse,
  Home,
  Loader2,
  Moon,
  Pill,
  Plus,
  Save,
  Settings,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRound
} from 'lucide-react'
import './styles.css'

const STORAGE_KEY = 'elderHealthSelfCare.full.v3'

const demoRows = [
  'Metformin | 500mg | 每日2次 | 早餐後、晚餐後 | 糖尿病用藥',
  'Gliclazide MR | 30mg | 每日1次 | 早餐前 | 糖尿病用藥',
  'Empagliflozin | 10mg | 每日1次 | 早餐後 | 留意飲水及小便情況'
].join('\n')

const defaultState = {
  profile: { name: '使用者', emergency: '', allergies: '', chronic: '糖尿病、高血壓', note: '' },
  bulkText: demoRows,
  meds: [],
  vitals: [
    { id: 'v1', date: new Date().toISOString().slice(0, 10), type: '血糖', value: '7.2', unit: 'mmol/L', note: '早餐前' },
    { id: 'v2', date: new Date().toISOString().slice(0, 10), type: '血壓', value: '132/78', unit: 'mmHg', note: '早上量度' }
  ],
  appointments: [
    { id: 'a1', date: '', time: '', title: '覆診', location: '普通科門診', note: '帶藥袋及血糖紀錄' }
  ],
  records: [
    { id: 'r1', date: new Date().toISOString().slice(0, 10), title: '今日狀況', content: '精神尚可，已提醒按時食藥。' }
  ],
  reminders: { morning: true, afternoon: true, evening: true, hydration: true }
}

defaultState.meds = parseBulkInput(demoRows)

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return {
      ...defaultState,
      ...parsed,
      profile: { ...defaultState.profile, ...(parsed.profile || {}) },
      reminders: { ...defaultState.reminders, ...(parsed.reminders || {}) },
      meds: Array.isArray(parsed.meds) ? parsed.meds : defaultState.meds,
      vitals: Array.isArray(parsed.vitals) ? parsed.vitals : defaultState.vitals,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : defaultState.appointments,
      records: Array.isArray(parsed.records) ? parsed.records : defaultState.records
    }
  } catch {
    return defaultState
  }
}

function parseBulkInput(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.includes('|')
        ? line.split('|').map((p) => p.trim())
        : line.split(/\s{2,}|\t|,/).map((p) => p.trim()).filter(Boolean)

      if (parts.length >= 4) {
        return {
          id: uid(`med-${index}`),
          name: parts[0] || '',
          dose: parts[1] || '',
          frequency: parts[2] || '',
          time: parts[3] || '',
          note: parts.slice(4).join(' ') || '',
          takenLogs: []
        }
      }

      const loose = line.split(/\s+/)
      return {
        id: uid(`med-${index}`),
        name: loose[0] || '',
        dose: loose[1] || '',
        frequency: loose[2] || '',
        time: loose.slice(3).join(' ') || '',
        note: '',
        takenLogs: []
      }
    })
}

function formatMedicationRows(items) {
  return items
    .map((item) => [item.name, item.dose, item.frequency, item.time, item.note].filter(Boolean).join(' | '))
    .join('\n')
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function App() {
  const [tab, setTab] = useState('home')
  const [state, setState] = useState(safeLoad)
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  function update(patch) {
    setState((current) => ({ ...current, ...patch }))
  }

  function flash(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const completedToday = state.meds.filter((m) => (m.takenLogs || []).some((log) => log.date === todayKey())).length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">長者健康自我管理</p>
          <h1>{pageTitle(tab)}</h1>
        </div>
        <div className="top-pill"><HeartPulse size={19} /> 今日已服藥 {completedToday}/{state.meds.length}</div>
      </header>

      {tab === 'home' && <HomePage state={state} setTab={setTab} />}
      {tab === 'meds' && <MedicationPage state={state} update={update} flash={flash} />}
      {tab === 'vitals' && <VitalsPage state={state} update={update} flash={flash} />}
      {tab === 'appointments' && <AppointmentsPage state={state} update={update} flash={flash} />}
      {tab === 'records' && <RecordsPage state={state} update={update} flash={flash} />}
      {tab === 'settings' && <SettingsPage state={state} update={update} flash={flash} />}

      <nav className="bottom-nav">
        <NavButton active={tab === 'home'} icon={<Home size={19} />} label="首頁" onClick={() => setTab('home')} />
        <NavButton active={tab === 'meds'} icon={<Pill size={19} />} label="藥物" onClick={() => setTab('meds')} />
        <NavButton active={tab === 'vitals'} icon={<Activity size={19} />} label="健康" onClick={() => setTab('vitals')} />
        <NavButton active={tab === 'appointments'} icon={<CalendarDays size={19} />} label="覆診" onClick={() => setTab('appointments')} />
        <NavButton active={tab === 'records'} icon={<ClipboardList size={19} />} label="紀錄" onClick={() => setTab('records')} />
        <NavButton active={tab === 'settings'} icon={<Settings size={19} />} label="設定" onClick={() => setTab('settings')} />
      </nav>

      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  )
}

function pageTitle(tab) {
  return ({ home: '健康總覽', meds: '今日藥物清單', vitals: '健康數據', appointments: '覆診提醒', records: '健康紀錄', settings: '設定' })[tab]
}

function NavButton({ active, icon, label, onClick }) {
  return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<span>{label}</span></button>
}

function HomePage({ state, setTab }) {
  const latestBloodSugar = [...state.vitals].reverse().find((v) => v.type === '血糖')
  const latestBP = [...state.vitals].reverse().find((v) => v.type === '血壓')
  const nextAppt = state.appointments.find((a) => a.date) || state.appointments[0]
  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <p className="eyebrow">您好，{state.profile.name || '使用者'}</p>
          <h2>今日先由服藥、血糖血壓、覆診提醒開始。</h2>
          <p>此版本已恢復完整頁面，只在藥物頁面的批量輸入上方新增 AI 拍照／圖片讀取功能。</p>
        </div>
        <button className="white-btn" onClick={() => setTab('meds')}><Pill size={18} />查看藥物</button>
      </section>

      <div className="summary-grid">
        <MetricCard icon={<Pill />} title="藥物數量" value={`${state.meds.length} 項`} note="可拍藥袋自動加入" />
        <MetricCard icon={<Activity />} title="最新血糖" value={latestBloodSugar ? `${latestBloodSugar.value} ${latestBloodSugar.unit}` : '未有'} note={latestBloodSugar?.note || '可在健康頁新增'} />
        <MetricCard icon={<HeartPulse />} title="最新血壓" value={latestBP ? `${latestBP.value} ${latestBP.unit}` : '未有'} note={latestBP?.note || '可在健康頁新增'} />
        <MetricCard icon={<CalendarDays />} title="下次覆診" value={nextAppt?.date || '未設定'} note={nextAppt?.title || '可在覆診頁新增'} />
      </div>

      <section className="card">
        <div className="section-title"><Bell size={20} /><h2>今日提醒</h2></div>
        <div className="todo-list">
          <div>☀️ 早上：核對早餐前／早餐後藥物</div>
          <div>💧 白天：留意飲水及血糖紀錄</div>
          <div>🌙 晚上：完成晚餐後及睡前藥物</div>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ icon, title, value, note }) {
  return <article className="metric-card"><div className="metric-icon">{icon}</div><span>{title}</span><strong>{value}</strong><small>{note}</small></article>
}

function MedicationPage({ state, update, flash }) {
  const uploadRef = useRef(null)
  const cameraRef = useRef(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageName, setImageName] = useState('')
  const [aiStatus, setAiStatus] = useState('')
  const [aiError, setAiError] = useState('')
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [listAnalysis, setListAnalysis] = useState('')
  const [listLoading, setListLoading] = useState(false)

  async function handleImageFile(file) {
    if (!file) return
    setAiError('')
    setAiStatus('')
    setImageName(file.name || '即時拍照圖片')

    if (!file.type.startsWith('image/')) return setAiError('請上傳圖片檔案，例如 JPG、PNG 或 HEIC。')
    if (file.size > 8 * 1024 * 1024) return setAiError('圖片太大，請壓縮至 8MB 以下再上傳。')

    const base64 = await fileToBase64(file)
    setImagePreview(base64)
    await analyzeMedicationImage(base64)
  }

  async function analyzeMedicationImage(imageBase64) {
    setIsAnalyzingImage(true)
    setAiStatus('AI 正在讀取藥袋／藥物紀錄，會自動整理成批量輸入格式。')
    setAiError('')
    try {
      const response = await fetch('/api/analyze-medication-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'AI 分析失敗，請稍後再試。')
      const rows = Array.isArray(data.medications) ? data.medications : []
      if (!rows.length) throw new Error('未能在圖片中辨識到清晰藥物資料，請嘗試近距離重新拍攝。')
      const normalized = rows.map((row) => ({ ...row, id: uid('ai-med'), takenLogs: [] }))
      const formatted = formatMedicationRows(normalized)
      update({
        bulkText: state.bulkText.trim() ? `${state.bulkText.trim()}\n${formatted}` : formatted,
        meds: [...state.meds, ...normalized]
      })
      setAiStatus(`已成功辨識 ${rows.length} 項藥物，並加入批量輸入框。請核對藥名、劑量及時間。`)
      flash('AI 已加入藥物資料')
    } catch (error) {
      setAiError(error.message || 'AI 分析失敗。')
      setAiStatus('')
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  function applyBulkText() {
    update({ meds: parseBulkInput(state.bulkText) })
    flash('已套用批量輸入')
  }

  function markTaken(id) {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const manual = window.prompt('請輸入服藥時間', `${hh}:${mm}`)
    if (!manual) return
    update({
      meds: state.meds.map((m) => {
        if (m.id !== id) return m
        const logs = (m.takenLogs || []).filter((log) => !(log.date === todayKey() && log.time === manual))
        return { ...m, takenLogs: [...logs, { date: todayKey(), time: manual }] }
      })
    })
  }

  async function analyzeList() {
    setListLoading(true)
    setListAnalysis('')
    try {
      const response = await fetch('/api/analyze-medication-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications: state.meds, profile: state.profile })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'AI 藥單分析失敗。')
      setListAnalysis(data.analysis || '未有分析結果。')
    } catch (error) {
      setListAnalysis(`⚠️ ${error.message || 'AI 藥單分析失敗。'}`)
    } finally {
      setListLoading(false)
    }
  }

  return (
    <div className="page-grid">
      <section className="card">
        <div className="section-title"><ClipboardList size={20} /><h2>今日服藥清單</h2></div>
        <div className="med-list">
          {state.meds.map((med) => {
            const todayLogs = (med.takenLogs || []).filter((log) => log.date === todayKey())
            return (
              <article className="med-item" key={med.id}>
                <div>
                  <h3>{med.name || '未命名藥物'}</h3>
                  <p>{[med.dose, med.frequency, med.time].filter(Boolean).join(' ｜ ')}</p>
                  {med.note && <small>{med.note}</small>}
                  {!!todayLogs.length && <div className="taken-time"><CheckCircle2 size={15} />服藥時間：{todayLogs.map((l) => l.time).join('、')}</div>}
                </div>
                <button className={todayLogs.length ? 'done-btn' : 'take-btn'} onClick={() => markTaken(med.id)}>
                  {todayLogs.length ? '已完成是日容量' : '已服用'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="card ai-upload-card">
        <div className="section-title"><Sparkles size={20} /><h2>AI 圖片讀取藥單</h2></div>
        <p className="hint">放在批量輸入上方：用戶可上傳圖片或直接拍攝藥袋／藥物紀錄，系統會經後端 API 分析，不會在前端輸入 API Key。</p>
        <div className="upload-actions">
          <button type="button" onClick={() => uploadRef.current?.click()}><FileImage size={19} />上傳圖片</button>
          <button type="button" onClick={() => cameraRef.current?.click()}><Camera size={19} />拍照讀取</button>
        </div>
        <input ref={uploadRef} className="hidden-input" type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0])} />
        <input ref={cameraRef} className="hidden-input" type="file" accept="image/*" capture="environment" onChange={(e) => handleImageFile(e.target.files?.[0])} />
        {imagePreview && <div className="preview-box"><img src={imagePreview} alt="藥袋或藥物紀錄預覽" /><span>{imageName}</span></div>}
        {isAnalyzingImage && <div className="status loading"><Loader2 className="spin" size={17} />{aiStatus}</div>}
        {!isAnalyzingImage && aiStatus && <div className="status success"><Sparkles size={17} />{aiStatus}</div>}
        {aiError && <div className="status error"><AlertTriangle size={17} />{aiError}</div>}
      </section>

      <section className="card">
        <div className="section-title"><Plus size={20} /><h2>批量輸入藥物</h2></div>
        <p className="hint">格式：藥物名稱 | 劑量 | 服用次數 | 服用時間 | 備註</p>
        <textarea value={state.bulkText} onChange={(e) => update({ bulkText: e.target.value })} rows={8} />
        <button className="primary-btn" onClick={applyBulkText}>套用批量輸入內容</button>
      </section>

      <section className="card">
        <div className="section-title"><Stethoscope size={20} /><h2>AI 藥單分析框</h2></div>
        <p className="hint">根據目前藥物清單提供一般健康提醒、可能需要核對的藥物組合及注意事項。不能取代醫生或藥劑師意見。</p>
        <button className="primary-btn" onClick={analyzeList} disabled={listLoading}>{listLoading ? '分析中...' : '開始 AI 藥單分析'}</button>
        {listLoading && <div className="status loading"><Loader2 className="spin" size={17} />後端 AI 正在分析藥單。</div>}
        {listAnalysis && <pre className="analysis-box">{listAnalysis}</pre>}
      </section>
    </div>
  )
}

function VitalsPage({ state, update, flash }) {
  const [form, setForm] = useState({ date: todayKey(), type: '血糖', value: '', unit: 'mmol/L', note: '' })
  function add() {
    if (!form.value.trim()) return
    update({ vitals: [{ ...form, id: uid('vital') }, ...state.vitals] })
    setForm({ ...form, value: '', note: '' })
    flash('已新增健康數據')
  }
  return (
    <div className="page-grid">
      <section className="card form-card">
        <div className="section-title"><Activity size={20} /><h2>新增健康數據</h2></div>
        <div className="form-grid">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, unit: e.target.value === '血壓' ? 'mmHg' : e.target.value === '體重' ? 'kg' : 'mmol/L' })}><option>血糖</option><option>血壓</option><option>體重</option><option>心跳</option><option>其他</option></select>
          <input placeholder="數值，例如 7.2 / 132/78" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <input placeholder="單位" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </div>
        <textarea rows={3} placeholder="備註，例如早餐前、餐後兩小時" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button className="primary-btn" onClick={add}><Save size={17} />儲存數據</button>
      </section>
      <ListCard title="健康數據紀錄" icon={<Activity size={20} />} items={state.vitals} render={(v) => <><strong>{v.date}｜{v.type}：{v.value} {v.unit}</strong><span>{v.note}</span></>} onDelete={(id) => update({ vitals: state.vitals.filter((v) => v.id !== id) })} />
    </div>
  )
}

function AppointmentsPage({ state, update, flash }) {
  const [form, setForm] = useState({ date: '', time: '', title: '', location: '', note: '' })
  function add() {
    if (!form.title.trim()) return
    update({ appointments: [{ ...form, id: uid('appt') }, ...state.appointments] })
    setForm({ date: '', time: '', title: '', location: '', note: '' })
    flash('已新增覆診提醒')
  }
  return (
    <div className="page-grid">
      <section className="card form-card">
        <div className="section-title"><CalendarDays size={20} /><h2>新增覆診／檢查</h2></div>
        <div className="form-grid">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <input placeholder="事項，例如 糖尿科覆診" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="地點" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <textarea rows={3} placeholder="備註" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button className="primary-btn" onClick={add}><Bell size={17} />新增提醒</button>
      </section>
      <ListCard title="覆診提醒" icon={<CalendarDays size={20} />} items={state.appointments} render={(a) => <><strong>{a.date || '未設定日期'} {a.time}｜{a.title}</strong><span>{a.location}</span><small>{a.note}</small></>} onDelete={(id) => update({ appointments: state.appointments.filter((a) => a.id !== id) })} />
    </div>
  )
}

function RecordsPage({ state, update, flash }) {
  const [form, setForm] = useState({ date: todayKey(), title: '', content: '' })
  function add() {
    if (!form.title.trim() && !form.content.trim()) return
    update({ records: [{ ...form, id: uid('record') }, ...state.records] })
    setForm({ date: todayKey(), title: '', content: '' })
    flash('已新增健康紀錄')
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `elder-health-record-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="page-grid">
      <section className="card form-card">
        <div className="section-title"><ClipboardList size={20} /><h2>新增健康紀錄</h2></div>
        <div className="form-grid two"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /><input placeholder="標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <textarea rows={5} placeholder="今日身體狀況、飲食、運動、睡眠或照顧備註" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <button className="primary-btn" onClick={add}><Save size={17} />儲存紀錄</button>
        <button className="secondary-btn" onClick={exportJson}><Download size={17} />匯出全部資料 JSON</button>
      </section>
      <ListCard title="健康紀錄" icon={<ClipboardList size={20} />} items={state.records} render={(r) => <><strong>{r.date}｜{r.title || '未命名紀錄'}</strong><span>{r.content}</span></>} onDelete={(id) => update({ records: state.records.filter((r) => r.id !== id) })} />
    </div>
  )
}

function SettingsPage({ state, update, flash }) {
  const [profile, setProfile] = useState(state.profile)
  function save() {
    update({ profile })
    flash('設定已儲存')
  }
  function resetDemo() {
    if (!window.confirm('確定要重設為示範資料？現有資料會被覆蓋。')) return
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }
  return (
    <div className="page-grid">
      <section className="card form-card">
        <div className="section-title"><UserRound size={20} /><h2>個人健康資料</h2></div>
        <div className="form-grid two">
          <input placeholder="稱呼" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <input placeholder="緊急聯絡" value={profile.emergency} onChange={(e) => setProfile({ ...profile, emergency: e.target.value })} />
          <input placeholder="長期病患" value={profile.chronic} onChange={(e) => setProfile({ ...profile, chronic: e.target.value })} />
          <input placeholder="藥物敏感／過敏" value={profile.allergies} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} />
        </div>
        <textarea rows={4} placeholder="其他照顧備註" value={profile.note} onChange={(e) => setProfile({ ...profile, note: e.target.value })} />
        <button className="primary-btn" onClick={save}><Save size={17} />儲存設定</button>
      </section>
      <section className="card">
        <div className="section-title"><Moon size={20} /><h2>提醒設定</h2></div>
        <p className="hint">此靜態版會保存設定；真正手機推送提醒需配合 PWA 或後端通知服務。</p>
        <div className="toggle-grid">
          {Object.entries(state.reminders).map(([key, value]) => <label key={key}><input type="checkbox" checked={value} onChange={(e) => update({ reminders: { ...state.reminders, [key]: e.target.checked } })} />{reminderLabel(key)}</label>)}
        </div>
        <button className="danger-btn" onClick={resetDemo}><Trash2 size={17} />重設示範資料</button>
      </section>
    </div>
  )
}

function reminderLabel(key) {
  return ({ morning: '早上服藥提醒', afternoon: '下午服藥提醒', evening: '晚上服藥提醒', hydration: '飲水提醒' })[key] || key
}

function ListCard({ title, icon, items, render, onDelete }) {
  return (
    <section className="card">
      <div className="section-title">{icon}<h2>{title}</h2></div>
      <div className="record-list">
        {items.map((item) => <article className="record-item" key={item.id}><div>{render(item)}</div><button onClick={() => onDelete(item.id)}><Trash2 size={16} /></button></article>)}
      </div>
    </section>
  )
}

createRoot(document.getElementById('root')).render(<App />)
