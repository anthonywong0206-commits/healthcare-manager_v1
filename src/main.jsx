import React, { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Camera, FileImage, Sparkles, ClipboardList, Pill, AlertTriangle, Loader2, Plus, CheckCircle2 } from 'lucide-react'
import './styles.css'

const demoRows = [
  'Metformin 500mg 每日2次 早餐後、晚餐後 糖尿病用藥',
  'Gliclazide MR 30mg 每日1次 早餐前 糖尿病用藥',
  'Empagliflozin 10mg 每日1次 早餐後 糖尿病用藥'
].join('\n')

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
          id: `${Date.now()}-${index}`,
          name: parts[0] || '',
          dose: parts[1] || '',
          frequency: parts[2] || '',
          time: parts[3] || '',
          note: parts.slice(4).join(' ') || ''
        }
      }

      const loose = line.split(/\s+/)
      return {
        id: `${Date.now()}-${index}`,
        name: loose[0] || '',
        dose: loose[1] || '',
        frequency: loose[2] || '',
        time: loose.slice(3).join(' ') || '',
        note: ''
      }
    })
}

function formatMedicationRows(items) {
  return items
    .map((item) => [item.name, item.dose, item.frequency, item.time, item.note].filter(Boolean).join(' | '))
    .join('\n')
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
  const [bulkText, setBulkText] = useState(demoRows)
  const [meds, setMeds] = useState(() => parseBulkInput(demoRows))
  const [imagePreview, setImagePreview] = useState('')
  const [imageName, setImageName] = useState('')
  const [aiStatus, setAiStatus] = useState('')
  const [aiError, setAiError] = useState('')
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const uploadRef = useRef(null)
  const cameraRef = useRef(null)

  const completedToday = useMemo(() => meds.filter((m) => m.takenAt).length, [meds])

  async function handleImageFile(file) {
    if (!file) return
    setAiError('')
    setAiStatus('')
    setImageName(file.name || '即時拍照圖片')

    if (!file.type.startsWith('image/')) {
      setAiError('請上傳圖片檔案，例如 JPG、PNG 或 HEIC。')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setAiError('圖片太大，請壓縮至 8MB 以下再上傳。')
      return
    }

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
      if (!rows.length) {
        throw new Error('未能在圖片中辨識到清晰藥物資料，請嘗試近距離重新拍攝。')
      }

      const formatted = formatMedicationRows(rows)
      setBulkText((current) => current.trim() ? `${current.trim()}\n${formatted}` : formatted)
      setMeds((current) => [...current, ...rows.map((row, idx) => ({ ...row, id: `ai-${Date.now()}-${idx}` }))])
      setAiStatus(`已成功辨識 ${rows.length} 項藥物，並加入批量輸入框。請核對藥名、劑量及時間。`)
    } catch (error) {
      setAiError(error.message || 'AI 分析失敗。')
      setAiStatus('')
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  function applyBulkText() {
    const parsed = parseBulkInput(bulkText)
    setMeds(parsed)
  }

  function markTaken(id) {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const manual = window.prompt('請輸入服藥時間', `${hh}:${mm}`)
    if (!manual) return
    setMeds((items) => items.map((m) => m.id === id ? { ...m, takenAt: manual } : m))
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">長者健康自我管理</p>
          <h1>今日藥物清單</h1>
          <p className="subtext">支援手動批量輸入、圖片上傳及手機拍攝藥袋，由後端 AI API 分析後自動填入。</p>
        </div>
        <div className="hero-badge"><Pill size={24} /><span>{completedToday}/{meds.length}</span></div>
      </section>

      <section className="card">
        <div className="section-title">
          <ClipboardList size={20} />
          <h2>今日服藥清單</h2>
        </div>
        <div className="med-list">
          {meds.map((med) => (
            <article className="med-item" key={med.id}>
              <div>
                <h3>{med.name || '未命名藥物'}</h3>
                <p>{[med.dose, med.frequency, med.time].filter(Boolean).join(' ｜ ')}</p>
                {med.note && <small>{med.note}</small>}
                {med.takenAt && <div className="taken-time"><CheckCircle2 size={15} />已服用：{med.takenAt}</div>}
              </div>
              <button className={med.takenAt ? 'done-btn' : 'take-btn'} onClick={() => markTaken(med.id)}>
                {med.takenAt ? '已完成是日容量' : '已服用'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="card ai-upload-card">
        <div className="section-title">
          <Sparkles size={20} />
          <h2>AI 圖片讀取藥單</h2>
        </div>
        <p className="hint">放在批量輸入上方：用戶可上傳圖片或直接拍攝藥袋／藥物紀錄，系統會經後端 API 分析，不會在前端輸入 API Key。</p>

        <div className="upload-actions">
          <button type="button" onClick={() => uploadRef.current?.click()}><FileImage size={19} />上傳圖片</button>
          <button type="button" onClick={() => cameraRef.current?.click()}><Camera size={19} />拍照讀取</button>
        </div>

        <input ref={uploadRef} className="hidden-input" type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0])} />
        <input ref={cameraRef} className="hidden-input" type="file" accept="image/*" capture="environment" onChange={(e) => handleImageFile(e.target.files?.[0])} />

        {imagePreview && (
          <div className="preview-box">
            <img src={imagePreview} alt="藥袋或藥物紀錄預覽" />
            <span>{imageName}</span>
          </div>
        )}

        {isAnalyzingImage && <div className="status loading"><Loader2 className="spin" size={17} />{aiStatus}</div>}
        {!isAnalyzingImage && aiStatus && <div className="status success"><Sparkles size={17} />{aiStatus}</div>}
        {aiError && <div className="status error"><AlertTriangle size={17} />{aiError}</div>}
      </section>

      <section className="card">
        <div className="section-title">
          <Plus size={20} />
          <h2>批量輸入藥物</h2>
        </div>
        <p className="hint">格式：藥物名稱 | 劑量 | 服用次數 | 服用時間 | 備註</p>
        <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={8} />
        <button className="primary-btn" onClick={applyBulkText}>套用批量輸入內容</button>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
