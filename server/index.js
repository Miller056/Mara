import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT_EN = `
You are a compassionate mental health support assistant.
Respond calmly and gently.
Encourage seeking real-world help if necessary.
`

const SYSTEM_PROMPT_RW = `
Uri umufasha w'ubuzima bwo mu mutwe wuje impuhwe.
Subiza mu ituze n'ubwitonzi.
Niba bikomeye, shishikariza umuntu gushaka ubufasha.
`

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, language, message } = req.body

    const normalizedMessages =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : typeof message === "string" && message.trim()
          ? [{ role: "user", content: message.trim() }]
          : []

    const normalizedLanguage =
      language === "rw" || language === "en" ? language : "en"

    if (normalizedMessages.length === 0) {
      return res.status(400).json({ error: "Missing messages" })
    }

    const latestMessage =
      normalizedMessages[normalizedMessages.length - 1]?.content
        .toLowerCase()

    const crisisWords = [
      "suicide",
      "kill myself",
      "end my life",
      "i want to die",
      "hurt myself"
    ]

    const isCrisis = crisisWords.some(word =>
      latestMessage.includes(word)
    )

    if (isCrisis) {
      return res.json({
        reply:
          normalizedLanguage === "rw"
            ? `Ndumva uri mu bihe bikomeye cyane. Niba uri mu kaga ako kanya, hamagara 112 (ubutabazi bwihuse mu Rwanda) cyangwa uvugane n'umuntu mukuru wizeye. Ushobora kandi kugana ibitaro bya CARAES Ndera cyangwa kuvugana n'umujyanama w'ishuri. Nturi wenyine, ubufasha burahari.`
            : `It sounds like you're going through something very heavy. If you are in immediate danger in Rwanda, please call 112 right now (national emergency services). You can also visit CARAES Ndera Hospital or speak to a trusted adult, school counselor, or local health center. You are not alone. Help is available.`
      })
    }

    const systemPrompt =
      normalizedLanguage === "rw" ? SYSTEM_PROMPT_RW : SYSTEM_PROMPT_EN

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...normalizedMessages
      ],
    })

    res.json({
      reply: completion.choices[0].message.content
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

app.listen(5000, () =>
  console.log("Server running on port 5000")
)