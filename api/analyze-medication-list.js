import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: '只支援 POST 請求。' })
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: '後端尚未設定 OPENAI_API_KEY。請在 Vercel Environment Variables 加入。' })

  try {
    const { medications = [], profile = {} } = req.body || {}
    if (!Array.isArray(medications) || medications.length === 0) return res.status(400).json({ error: '沒有可分析的藥物清單。' })

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: [
            '你是長者健康自我管理網站的用藥資料整理助手。',
            '請用繁體中文，提供一般性健康提醒。',
            '不要作診斷，不要要求使用者自行改藥或停藥。',
            '如可能存在藥物相沖或高風險組合，請以「需要向醫生／藥劑師核對」方式表達。',
            '輸出要簡潔，分為：整體觀察、需要核對、日常提醒、求醫警號。'
          ].join('\n')
        },
        {
          role: 'user',
          content: JSON.stringify({ profile, medications }, null, 2)
        }
      ]
    })

    res.status(200).json({ analysis: completion.choices?.[0]?.message?.content || '' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'AI 藥單分析暫時失敗，請稍後再試。' })
  }
}
