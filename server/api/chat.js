app.post("/api/chat", async (req, res) => {
  try {
    const { messages, language } = req.body

    const latestMessage =
      messages[messages.length - 1]?.content.toLowerCase()

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
          language === "rw"
            ? "Ndabona ko ushobora kuba uri mu bihe bikomeye. Niba uri mu kaga ako kanya, hamagara serivisi z'ubutabazi cyangwa uvugane n'umuntu mukuru wizeye. Nturi wenyine."
            : "It sounds like you're going through something very heavy. If you're in immediate danger, please contact local emergency services or speak to a trusted adult right now. You are not alone."
      })
    }

    const systemPrompt =
      language === "rw" ? SYSTEM_PROMPT_RW : SYSTEM_PROMPT_EN

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
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