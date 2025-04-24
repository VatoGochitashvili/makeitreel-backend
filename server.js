import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { OpenAI } from 'openai'

dotenv.config()
const app = express()
const port = process.env.PORT || 5050

app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

app.post('/api/summarize', async (req, res) => {
  const { transcript } = req.body

  try {
    const chat = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Summarize this transcript into 3 viral YouTube Shorts ideas:

${transcript}`,
        },
      ],
      model: 'gpt-3.5-turbo',
    })

    res.json({ shorts: chat.choices[0].message.content })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to generate shorts' })
  }
})

app.listen(port, () => {
  console.log(`✅ MakeItReel backend running at http://localhost:${port}`)
})
