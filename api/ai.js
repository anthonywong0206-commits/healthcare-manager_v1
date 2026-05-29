export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed.' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: '後端尚未設定 OPENAI_API_KEY。請到 Vercel Project Settings > Environment Variables 新增 OPENAI_API_KEY。'
    })
  }

  try {
    const { action, medications = [] } = req.body || {}
    if (action !== 'medication-analysis') {
      return res.status(400).json({ error: '不支援的 AI 動作。' })
    }
    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ error: '請先提供藥物清單。' })
    }

    const safeList = medications
      .slice(0, 40)
      .map((m, index) => {
        const no = m.no || index + 1
        const name = String(m.name || '').slice(0, 120)
        const dosage = String(m.dosage || '未設定').slice(0, 80)
        const frequency = String(m.frequency || '未設定').slice(0, 80)
        const time = String(m.time || '未設定').slice(0, 120)
        const note = String(m.note || '沒有').slice(0, 200)
        return `${no}. ${name}｜劑量：${dosage}｜每日次數：${frequency}｜服用時間：${time}｜備註：${note}`
      })
      .join('\n')

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: [
              '你是協助長者、照顧者及社福服務單位整理藥物資料的安全健康助理。',
              '請使用繁體中文，語氣清晰、溫和、適合長者閱讀。',
              '你不可提供醫療診斷，不可建議自行停藥、改藥、加藥或減藥。',
              '如涉及藥物相互作用、禁忌、重複用藥、嚴重副作用或異常症狀，必須提醒用戶向醫生或藥劑師確認。',
              '避免作出絕對判斷，例如「一定相沖」；請用「可能需要確認」、「建議向藥劑師核對」。'
            ].join('')
          },
          {
            role: 'user',
            content: `請根據以下服藥清單，提供一份長者容易明白的藥單分析。請包括：\n1. 整體服藥整理摘要\n2. 可能需要向醫護確認的重複用藥或相沖風險\n3. 特別服用注意事項，例如飯前飯後、頭暈、低血糖、出血風險等\n4. 需要盡快求助的警號\n5. 一句清晰免責提醒\n\n服藥清單：\n${safeList}`
          }
        ]
      })
    })

    const data = await openaiRes.json().catch(() => ({}))
    if (!openaiRes.ok) {
      const message = data?.error?.message || 'OpenAI API 回應失敗。'
      return res.status(openaiRes.status).json({ error: message })
    }

    const result = data?.choices?.[0]?.message?.content || '未能取得 AI 分析結果。'
    return res.status(200).json({ result })
  } catch (error) {
    return res.status(500).json({ error: error.message || '後端 AI 發生錯誤。' })
  }
}
