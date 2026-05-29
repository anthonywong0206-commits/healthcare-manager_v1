import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支援 POST 請求。' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: '後端尚未設定 OPENAI_API_KEY。請在 Vercel Environment Variables 加入。' })
  }

  try {
    const { imageBase64 } = req.body || {}
    if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ error: '缺少有效圖片資料。' })
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            '你是協助長者健康自我管理網站讀取藥袋及藥物紀錄的資料整理助手。',
            '只抽取圖片中可見及合理辨識的藥物資料，不要自行創作藥物。',
            '輸出 JSON：{"medications":[{"name":"","dose":"","frequency":"","time":"","note":""}],"warnings":[""]}',
            'name 可包括英文藥名及中文名稱；dose 是劑量；frequency 是服用次數；time 是服用時間；note 可寫用途、注意事項或未能確認的地方。',
            '如資料不清楚，欄位留空或在 note 寫「需人工核對」。'
          ].join('\n')
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: '請分析這張藥袋／藥物紀錄圖片，整理成藥物清單。' },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ]
    })

    const raw = completion.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(raw)
    const medications = Array.isArray(parsed.medications) ? parsed.medications : []

    return res.status(200).json({
      medications: medications.map((m) => ({
        name: String(m.name || '').trim(),
        dose: String(m.dose || '').trim(),
        frequency: String(m.frequency || '').trim(),
        time: String(m.time || '').trim(),
        note: String(m.note || '').trim()
      })).filter((m) => m.name || m.dose || m.frequency || m.time),
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : []
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'AI 圖片分析暫時失敗，請重新上傳較清晰圖片。' })
  }
}
