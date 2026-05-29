import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ClipboardPlus, HeartPulse, Home, Pill, Settings, UserRound, Download, Upload, Trash2, Sparkles, CheckCircle2, Plus, Save, ShieldAlert } from 'lucide-react'

const DISCLAIMER = '本網站只作健康紀錄及自我管理用途，不能取代醫生、護士或藥劑師的專業意見。如出現不適、數值異常或對藥物有疑問，請盡快諮詢醫護人員。'

const DEFAULT_PROFILE = {
  name: '', age: '', gender: '', height: '', weight: '',
  medicalHistory: [],
  emergencyContact: { name: '', relation: '', phone: '' },
  healthGoals: ''
}

const HISTORY_OPTIONS = ['高血壓', '糖尿病', '高膽固醇', '心臟病', '中風紀錄', '腎病', '其他']

const drugHints = {
  metformin: '常見糖尿病藥物，通常用於協助控制血糖。',
  amlodipine: '常見降血壓藥物，通常用於協助控制血壓。',
  atorvastatin: '常見降膽固醇藥物，通常用於協助控制血脂。',
  aspirin: '常見抗血小板藥物，部分人士會按醫生指示用於心血管風險管理。',
  losartan: '常見降血壓藥物，通常用於協助控制血壓及保護腎臟。',
  gliclazide: '常見糖尿病藥物，通常用於協助控制血糖。',
  paracetamol: '常見止痛退燒藥物。'
}

const translateDrugName = (text) => {
  const key = text.trim().toLowerCase()
  const map = {
    metformin: 'Metformin（二甲雙胍）：常見糖尿病用藥名稱',
    amlodipine: 'Amlodipine（氨氯地平）：常見降血壓用藥名稱',
    atorvastatin: 'Atorvastatin（阿托伐他汀）：常見降膽固醇用藥名稱',
    aspirin: 'Aspirin（阿士匹靈）：常見抗血小板／止痛藥物名稱',
    losartan: 'Losartan（氯沙坦）：常見降血壓用藥名稱',
    gliclazide: 'Gliclazide（格列齊特）：常見糖尿病用藥名稱',
    paracetamol: 'Paracetamol（撲熱息痛）：常見止痛退燒藥物名稱'
  }
  return map[key] || `${text || '未輸入藥名'}：暫未有本地翻譯資料，請核對藥袋、處方或向藥劑師查詢。`
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue]
}

const todayKey = () => new Date().toISOString().slice(0, 10)
const nowTime = () => new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })
const timeInputValue = () => new Date().toTimeString().slice(0, 5)
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function App() {
  const [tab, setTab] = useState('home')
  const [profile, setProfile] = useLocalStorage('userProfile', DEFAULT_PROFILE)
  const [records, setRecords] = useLocalStorage('healthRecords', [])
  const [meds, setMeds] = useLocalStorage('medicationList', [])
  const [logs, setLogs] = useLocalStorage('medicationLogs', [])
  const [toast, setToast] = useState('')

  const notify = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const addRecord = (record) => {
    const stamp = new Date()
    setRecords([{ id: uid(), date: stamp.toISOString().slice(0, 10), time: nowTime(), ...record }, ...records])
    notify('已成功儲存健康紀錄')
  }

  const markTaken = (medId, customTime = nowTime()) => {
    setLogs(prev => [{ id: uid(), medicationId: medId, taken: true, takenTime: customTime || nowTime(), date: todayKey() }, ...prev])
    notify('已記錄服藥時間')
  }

  return <div className="app-shell">
    <header className="topbar">
      <div>
        <p className="eyebrow">樂齡健康管家</p>
        <h1>每日記錄健康，安心管理生活。</h1>
      </div>
      <div className="avatar"><HeartPulse size={30}/></div>
    </header>

    <main className="main-card">
      {tab === 'home' && <Dashboard profile={profile} records={records} meds={meds} logs={logs} markTaken={markTaken}/>} 
      {tab === 'input' && <InputPage addRecord={addRecord}/>} 
      {tab === 'meds' && <MedicationPage meds={meds} setMeds={setMeds} logs={logs} markTaken={markTaken} notify={notify}/>} 
      {tab === 'settings' && <SettingsPage profile={profile} setProfile={setProfile} records={records} meds={meds} logs={logs} setRecords={setRecords} setMeds={setMeds} setLogs={setLogs} notify={notify}/>} 
    </main>

    {toast && <div className="toast"><CheckCircle2 size={20}/>{toast}</div>}

    <nav className="bottom-nav">
      <NavButton active={tab==='home'} icon={<Home/>} label="首頁" onClick={()=>setTab('home')}/>
      <NavButton active={tab==='input'} icon={<ClipboardPlus/>} label="輸入" onClick={()=>setTab('input')}/>
      <NavButton active={tab==='meds'} icon={<Pill/>} label="藥物" onClick={()=>setTab('meds')}/>
      <NavButton active={tab==='settings'} icon={<Settings/>} label="設定" onClick={()=>setTab('settings')}/>
    </nav>
  </div>
}

function NavButton({active, icon, label, onClick}) {
  return <button className={`nav-btn ${active ? 'active' : ''}`} onClick={onClick}>{React.cloneElement(icon, {size:22})}<span>{label}</span></button>
}

function Dashboard({ profile, records, meds, logs, markTaken }) {
  const today = todayKey()
  const latestBP = records.find(r => r.type === 'bloodPressure')
  const glucose = records.filter(r => r.type === 'bloodGlucose')
  const latestByGlucoseType = (type) => glucose.find(r => r.glucoseType === type)
  const bmi = useMemo(() => {
    const h = Number(profile.height) / 100
    const w = Number(profile.weight)
    if (!h || !w) return null
    return +(w / (h*h)).toFixed(1)
  }, [profile.height, profile.weight])
  const bmiLabel = bmi ? (bmi < 18.5 ? '偏低' : bmi < 23 ? '正常' : bmi < 25 ? '過重' : '肥胖') : '未設定'
  const todayLogs = logs.filter(l => l.date === today)

  return <section className="page fade-in">
    <div className="welcome-card">
      <div><p>您好{profile.name ? `，${profile.name}` : ''}</p><h2>今日健康總覽</h2></div><Activity size={46}/>
    </div>
    <div className="grid two">
      <InfoCard title="今日血壓" tone="blue" icon={<HeartPulse/>}>
        <div className="big-reading">{latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : '--/--'} <small>mmHg</small></div>
        <p>心跳：{latestBP?.pulse || '--'} bpm</p><p>最近：{latestBP ? `${latestBP.date} ${latestBP.time}` : '未有紀錄'}</p>
      </InfoCard>
      <InfoCard title="血糖紀錄" tone="green" icon={<Activity/>}>
        {['空腹','飯前','飯後'].map(t => <p key={t}>{t}：<b>{latestByGlucoseType(t)?.value || '--'}</b> mmol/L</p>)}
      </InfoCard>
      <InfoCard title="BMI 資料" tone="amber" icon={<UserRound/>}>
        <div className="big-reading">{bmi || '--'} <small>{bmiLabel}</small></div><p>身高：{profile.height || '--'} cm｜體重：{profile.weight || '--'} kg</p>
      </InfoCard>
      <InfoCard title="今日服藥" tone="purple" icon={<Pill/>}>
        {meds.length === 0 && <p>尚未新增藥物</p>}
        {meds.slice(0,3).map(m => {
          const taken = todayLogs.find(l => l.medicationId === m.id && l.taken)
          return <div className="mini-med" key={m.id}><span>{m.name}<small>{m.time}</small></span><button onClick={()=>markTaken(m.id)} className={taken ? 'taken' : ''}>{taken ? '已服用' : '記錄'}</button></div>
        })}
      </InfoCard>
    </div>
    <div className="notice"><ShieldAlert size={22}/><div><b>健康提示</b><p>{latestBP ? '請保持定時量度及記錄。如數值持續偏高或不適，請向醫護人員查詢。' : '今日尚未有血壓紀錄，記得定時量度。'}</p><small>{DISCLAIMER}</small></div></div>
  </section>
}

function InfoCard({title, tone, icon, children}) {
  return <div className={`info-card ${tone}`}><div className="card-head"><h3>{title}</h3>{React.cloneElement(icon,{size:28})}</div>{children}</div>
}

function InputPage({ addRecord }) {
  const [mode, setMode] = useState('bloodPressure')
  const [form, setForm] = useState({
    systolic: '',
    diastolic: '',
    pulse: '',
    glucoseValue: '',
    glucoseType: '空腹',
    customName: '',
    customValue: '',
    customUnit: '',
    note: ''
  })

  const resetForm = () => setForm({
    systolic: '',
    diastolic: '',
    pulse: '',
    glucoseValue: '',
    glucoseType: '空腹',
    customName: '',
    customValue: '',
    customUnit: '',
    note: ''
  })

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const submit = () => {
    if (mode === 'bloodPressure') {
      if (!form.systolic && !form.diastolic && !form.pulse) return
      addRecord({
        type: 'bloodPressure',
        systolic: form.systolic,
        diastolic: form.diastolic,
        pulse: form.pulse,
        note: form.note
      })
    }
    if (mode === 'bloodGlucose') {
      if (!form.glucoseValue) return
      addRecord({
        type: 'bloodGlucose',
        value: form.glucoseValue,
        unit: 'mmol/L',
        glucoseType: form.glucoseType,
        note: form.note
      })
    }
    if (mode === 'custom') {
      if (!form.customName && !form.customValue) return
      addRecord({
        type: 'custom',
        name: form.customName,
        value: form.customValue,
        unit: form.customUnit,
        note: form.note
      })
    }
    resetForm()
  }

  const modes = [
    ['bloodPressure', '血壓', '收縮壓 / 舒張壓 / 心跳'],
    ['bloodGlucose', '血糖', '空腹 / 飯前 / 飯後 / 睡前'],
    ['custom', '自訂', '體溫、體重、疼痛分數等']
  ]

  return <section className="page fade-in input-page">
    <div className="section-title-row">
      <div>
        <p className="eyebrow small">新增紀錄</p>
        <h2>輸入健康數據</h2>
      </div>
    </div>

    <div className="horizontal-input-tabs" role="tablist" aria-label="健康紀錄類型">
      {modes.map(([key, label, hint]) => (
        <button
          key={key}
          type="button"
          className={mode === key ? 'selected' : ''}
          onClick={() => setMode(key)}
        >
          <b>{label}</b>
          <small>{hint}</small>
        </button>
      ))}
    </div>

    <div className="form-card input-panel">
      {mode === 'bloodPressure' && <>
        <h3>血壓紀錄</h3>
        <div className="row three">
          <label className="field"><span>收縮壓</span><input inputMode="decimal" type="number" value={form.systolic} onChange={e => update('systolic', e.target.value)} placeholder="例如 135" /></label>
          <label className="field"><span>舒張壓</span><input inputMode="decimal" type="number" value={form.diastolic} onChange={e => update('diastolic', e.target.value)} placeholder="例如 82" /></label>
          <label className="field"><span>心跳</span><input inputMode="decimal" type="number" value={form.pulse} onChange={e => update('pulse', e.target.value)} placeholder="例如 76" /></label>
        </div>
        <div className="unit-note">單位：血壓 mmHg｜心跳 bpm</div>
      </>}

      {mode === 'bloodGlucose' && <>
        <h3>血糖紀錄</h3>
        <div className="row two-inputs">
          <label className="field"><span>血糖類型</span><select value={form.glucoseType} onChange={e => update('glucoseType', e.target.value)}>{['空腹','飯前','飯後','睡前'].map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="field"><span>血糖數值</span><input inputMode="decimal" type="number" step="0.1" value={form.glucoseValue} onChange={e => update('glucoseValue', e.target.value)} placeholder="例如 6.2" /></label>
        </div>
        <div className="unit-note">單位：mmol/L</div>
      </>}

      {mode === 'custom' && <>
        <h3>自訂紀錄</h3>
        <div className="row three">
          <label className="field"><span>紀錄名稱</span><input value={form.customName} onChange={e => update('customName', e.target.value)} placeholder="例如：體溫" /></label>
          <label className="field"><span>數值</span><input inputMode="decimal" type="number" step="0.1" value={form.customValue} onChange={e => update('customValue', e.target.value)} placeholder="例如 36.5" /></label>
          <label className="field"><span>單位</span><input value={form.customUnit} onChange={e => update('customUnit', e.target.value)} placeholder="例如：°C" /></label>
        </div>
      </>}

      <label className="field"><span>備註</span><textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder="可輸入量度情況、身體感覺或照顧者備註" /></label>
      <button className="primary wide" onClick={submit}><Save size={22}/>確認儲存紀錄</button>
    </div>
  </section>
}

function getDoseCount(frequency) {
  const text = String(frequency || '').trim()
  const chineseMap = { 一:1, 壹:1, 二:2, 兩:2, 貳:2, 三:3, 叁:3, 四:4, 五:5, 六:6 }
  const digit = text.match(/\d+/)
  if (digit) return Math.max(1, Number(digit[0]))
  for (const [k, v] of Object.entries(chineseMap)) {
    if (text.includes(k)) return v
  }
  return 1
}

function buildLocalDrugExplanation(name) {
  const translated = translateDrugName(name)
  const key = String(name || '').trim().toLowerCase()
  const usage = drugHints[key] || '暫未有本地用途資料，請核對藥袋、處方或向醫生／藥劑師查詢。'
  return `中文名稱：${translated}\n\n用途：${usage}\n\n注意事項：藥物用途只供參考，實際服藥方法及用途請依照醫生或藥劑師指示。切勿自行停藥、改藥或加減劑量。`
}

function MedicationPage({ meds, setMeds, logs, markTaken, notify }) {
  const [bulk, setBulk] = useState('')
  const [single, setSingle] = useState({ name:'', dosage:'', frequency:'', time:'', note:'', usageDescription:'' })
  const [takingId, setTakingId] = useState(null)
  const [takeTime, setTakeTime] = useState(timeInputValue())
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [openAiKey, setOpenAiKey] = useLocalStorage('openaiApiKey', '')
  const today = todayKey()
  const todayLogs = logs.filter(l => l.date === today)

  const getMedLogs = (medId) => todayLogs.filter(l => l.medicationId === medId && l.taken)
  const isCompleted = (med) => getMedLogs(med.id).length >= getDoseCount(med.frequency)
  const pendingMeds = meds.filter(m => !isCompleted(m))

  const addSingle = () => {
    if (!single.name.trim()) return notify('請先輸入藥物名稱')
    setMeds([{ id: uid(), ...single }, ...meds])
    setSingle({ name:'', dosage:'', frequency:'', time:'', note:'', usageDescription:'' })
    notify('已新增藥物')
  }

  const parseBulkRow = (row) => {
    const normalized = row.replaceAll('｜', '|')
    let parts = normalized.includes('|') ? normalized.split('|') : normalized.split(/\s+/)
    parts = parts.map(x => x.trim()).filter(Boolean)
    const [name='', dosage='', frequency='', time='', ...noteParts] = parts
    return { id: uid(), name, dosage, frequency, time, note: noteParts.join(' '), usageDescription: '' }
  }

  const addBulk = () => {
    const rows = bulk.split('\n').map(r => r.trim()).filter(Boolean).map(parseBulkRow).filter(x => x.name)
    if (!rows.length) return notify('請先輸入批量藥物')
    setMeds([...rows, ...meds])
    setBulk('')
    notify(`已新增 ${rows.length} 款藥物`)
  }

  const confirmTaken = (medId) => {
    const med = meds.find(m => m.id === medId)
    if (!med || isCompleted(med)) return
    markTaken(medId, takeTime || nowTime())
    setTakingId(null)
    setTakeTime(timeInputValue())
  }

  const showTranslation = (med) => {
    setMeds(meds.map(m => m.id === med.id ? { ...m, usageDescription: buildLocalDrugExplanation(m.name) } : m))
  }

  const runAiAnalysis = async () => {
    if (!openAiKey.trim()) {
      setAiResult('請先在下方輸入 OpenAI API Key，才可連接 ChatGPT 進行藥單分析。\n\n提醒：藥物相沖及服用注意事項屬醫療高風險資訊，AI 只可作輔助整理，不能取代醫生或藥劑師判斷。')
      return
    }
    if (!meds.length) return notify('請先新增藥物')
    setAiLoading(true)
    setAiResult('')
    try {
      const medText = meds.map((m, i) => `${i+1}. ${m.name} ${m.dosage || ''}｜每日次數：${m.frequency || '未設定'}｜時間：${m.time || '未設定'}｜備註：${m.note || '沒有'}`).join('\n')
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '你是協助長者及照顧者整理藥物資料的安全健康助理。你不可診斷，不可叫用戶自行停藥、改藥或加減劑量。若涉及藥物相互作用、禁忌或異常症狀，必須建議向醫生或藥劑師確認。請用繁體中文、簡潔、分點、長者容易明白。' },
            { role: 'user', content: `請根據以下服藥清單，提供：1. 簡單健康分析；2. 可能需要向醫護確認的藥物相沖或重複風險；3. 特別服用注意事項；4. 需要立即求助的警號。\n\n服藥清單：\n${medText}` }
          ],
          temperature: 0.2
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'AI 分析失敗')
      setAiResult(data.choices?.[0]?.message?.content || '未能取得 AI 分析結果。')
    } catch (err) {
      setAiResult(`未能連接 ChatGPT：${err.message}\n\n你仍可使用本地藥物翻譯功能；如要做正式藥物相沖檢查，請向藥劑師查詢。`)
    } finally {
      setAiLoading(false)
    }
  }

  return <section className="page fade-in medication-page">
    <h2>藥物管理</h2>

    <div className={`med-warning ${pendingMeds.length ? 'alert' : 'safe'}`}>
      <ShieldAlert size={22}/>
      <div>
        <b>{pendingMeds.length ? `今日仍有 ${pendingMeds.length} 款藥物未完成服用紀錄` : '今日服藥紀錄暫無未完成提醒'}</b>
        <p>{pendingMeds.length ? pendingMeds.map(m => m.name).join('、') : '請繼續按醫生或藥劑師指示服藥。'}</p>
      </div>
    </div>

    <div className="notice compact"><ShieldAlert size={20}/><small>{DISCLAIMER}</small></div>

    <div className="section-title-row">
      <div>
        <p className="eyebrow small">今日服藥</p>
        <h3>今日藥物清單</h3>
      </div>
    </div>

    <div className="med-list today-med-list">
      {meds.length === 0 && <div className="empty-card">尚未新增藥物。請在下方批量輸入或單一新增。</div>}
      {meds.map(m => {
        const takenLogs = getMedLogs(m.id)
        const required = getDoseCount(m.frequency)
        const completed = takenLogs.length >= required
        return <div className="med-card detailed" key={m.id}>
          <div className="med-main-info">
            <b>{m.name}</b>
            <p>{m.dosage || '未設定劑量'}｜每日 {required} 次｜{m.time || '未設定服用時間'}</p>
            <small>服藥時間：{takenLogs.length ? takenLogs.map(l => l.takenTime).join('、') : '今日未有紀錄'}</small>
            {m.note && <small>備註：{m.note}</small>}
            {m.usageDescription && <div className="ai-box med-translation">{m.usageDescription}</div>}
            {takingId === m.id && !completed && <div className="take-time-panel">
              <label className="field"><span>請輸入服藥時間</span><input type="time" value={takeTime} onChange={e=>setTakeTime(e.target.value)} /></label>
              <button className="primary wide" onClick={()=>confirmTaken(m.id)}>確認服用</button>
            </div>}
          </div>
          <div className="med-actions">
            <button className={completed ? 'taken completed' : 'primary'} disabled={completed} onClick={()=>{ setTakingId(m.id); setTakeTime(timeInputValue()) }}>{completed ? '已完成是日容量' : '已服用'}</button>
            <button className="ai-mini" onClick={()=>showTranslation(m)}><Sparkles size={18}/>AI 翻譯</button>
            <button className="delete" onClick={()=>setMeds(meds.filter(x=>x.id!==m.id))}><Trash2 size={18}/></button>
          </div>
        </div>
      })}
    </div>

    <div className="form-card ai-analysis-card">
      <h3>AI 藥單分析</h3>
      <p>根據今日服藥清單，分析可能的服用注意事項、重複用藥或相沖風險。</p>
      <label className="field"><span>OpenAI API Key（只儲存在本機瀏覽器）</span><input type="password" value={openAiKey} onChange={e=>setOpenAiKey(e.target.value)} placeholder="sk-..." /></label>
      <button className="secondary wide" onClick={runAiAnalysis} disabled={aiLoading}><Sparkles size={20}/>{aiLoading ? '分析中...' : '連接 ChatGPT 分析藥單'}</button>
      {aiResult && <div className="ai-box analysis-result">{aiResult}</div>}
      <small className="safety-note">AI 分析只供健康紀錄及溝通參考，不能取代醫生、護士或藥劑師的專業意見。</small>
    </div>

    <div className="form-card"><h3>批量輸入藥物</h3><textarea value={bulk} onChange={e=>setBulk(e.target.value)} rows="5" placeholder={'每行格式：藥物名稱 劑量 服用次數 服用時間 備注\n例如：Metformin 500mg 2 早晚飯後 糖尿病用藥\n亦支援：Metformin｜500mg｜2｜早晚飯後｜糖尿病用藥'} /><button className="secondary wide" onClick={addBulk}><Plus size={20}/>批量新增</button></div>

    <div className="form-card"><h3>單一藥物輸入</h3>{['name','dosage','frequency','time','note'].map((f,i)=><label className="field" key={f}><span>{['藥物名稱','劑量','服用次數','服用時間','備註'][i]}</span><input value={single[f]} onChange={e=>setSingle({...single,[f]:e.target.value})}/></label>)}
      <div className="ai-row"><button onClick={()=>setSingle({...single, usageDescription: buildLocalDrugExplanation(single.name)})}><Sparkles size={18}/>AI 翻譯及用途</button><button onClick={addSingle}><Plus size={18}/>新增藥物</button></div>
      {single.usageDescription && <div className="ai-box">{single.usageDescription}</div>}
    </div>
  </section>
}

function SettingsPage({ profile, setProfile, records, meds, logs, setRecords, setMeds, setLogs, notify }) {
  const fileRef = useRef(null)
  const update = (key, value) => setProfile({ ...profile, [key]: value })
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ userProfile: profile, healthRecords: records, medicationList: meds, medicationLogs: logs }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `樂齡健康管家備份-${todayKey()}.json`; a.click(); URL.revokeObjectURL(a.href)
  }
  const importData = (file) => {
    const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); setProfile(data.userProfile || DEFAULT_PROFILE); setRecords(data.healthRecords || []); setMeds(data.medicationList || []); setLogs(data.medicationLogs || []); notify('已匯入備份資料') } catch { notify('匯入失敗，請檢查檔案格式') } }; reader.readAsText(file)
  }
  const clearAll = () => { if (confirm('是否確認清除全部資料？')) { setProfile(DEFAULT_PROFILE); setRecords([]); setMeds([]); setLogs([]); notify('已清除全部資料') } }
  return <section className="page fade-in"><h2>個人資料設定</h2><div className="form-card"><label className="field"><span>姓名或稱呼</span><input value={profile.name} onChange={e=>update('name',e.target.value)}/></label><div className="row"><label className="field"><span>年齡</span><input value={profile.age} onChange={e=>update('age',e.target.value)}/></label><label className="field"><span>性別</span><select value={profile.gender} onChange={e=>update('gender',e.target.value)}><option></option><option>男</option><option>女</option><option>不透露</option></select></label></div><div className="row"><label className="field"><span>身高 cm</span><input value={profile.height} onChange={e=>update('height',e.target.value)}/></label><label className="field"><span>體重 kg</span><input value={profile.weight} onChange={e=>update('weight',e.target.value)}/></label></div><h3>主要病史</h3><div className="chips">{HISTORY_OPTIONS.map(x=><button key={x} className={profile.medicalHistory.includes(x)?'on':''} onClick={()=>update('medicalHistory', profile.medicalHistory.includes(x) ? profile.medicalHistory.filter(i=>i!==x) : [...profile.medicalHistory, x])}>{x}</button>)}</div><h3>緊急聯絡人</h3>{['name','relation','phone'].map((f,i)=><label className="field" key={f}><span>{['姓名','關係','電話'][i]}</span><input value={profile.emergencyContact[f]} onChange={e=>update('emergencyContact',{...profile.emergencyContact,[f]:e.target.value})}/></label>)}<label className="field"><span>健康目標</span><textarea value={profile.healthGoals} onChange={e=>update('healthGoals',e.target.value)} placeholder="例如：穩定血壓、定時服藥、控制血糖、增加運動"/></label><button className="primary wide" onClick={()=>notify('已儲存個人資料')}><Save size={20}/>儲存資料</button></div>
    <div className="action-grid"><button onClick={exportData}><Download/>匯出健康紀錄</button><button onClick={()=>fileRef.current.click()}><Upload/>匯入備份資料</button><button className="danger" onClick={clearAll}><Trash2/>清除全部資料</button><input type="file" accept="application/json" ref={fileRef} hidden onChange={e=>e.target.files[0]&&importData(e.target.files[0])}/></div></section>
}

export default App
