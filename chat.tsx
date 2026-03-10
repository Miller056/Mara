import { useState } from "react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi 🌿 I’m here with you. How are you feeling right now?"
    }
  ])

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<"en" | "rw">("en")
  const [showEmergency, setShowEmergency] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const newMessages = [
      ...messages,
      { role: "user", content: input }
    ]

    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, language }),
    })

    const data = await response.json()

    setMessages([
      ...newMessages,
      { role: "assistant", content: data.reply }
    ])

    setLoading(false)
  }

  return (
    <div className="flex flex-col h-screen bg-[#f6f1ea] relative">

      {/* Emergency Button */}
      <button
        onClick={() => setShowEmergency(true)}
        className="absolute top-4 right-4 bg-red-500 text-white text-xs px-4 py-2 rounded-full shadow-md"
      >
        Emergency Help
      </button>

      {/* Emergency Modal */}
      {showEmergency && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-6 max-w-sm text-center space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold text-red-600">
              {language === "rw"
                ? "Ubufasha bwihuse"
                : "Immediate Support"}
            </h2>

            <p className="text-sm text-gray-700">
              {language === "rw"
                ? "Niba uri mu kaga ako kanya, hamagara 112 (ubutabazi bwihuse mu Rwanda). Ushobora kandi kuvugana n'umuntu mukuru wizeye cyangwa kugana ibitaro bya CARAES Ndera."
                : "If you are in immediate danger in Rwanda, call 112 right now. You can also visit CARAES Ndera Hospital or speak to a trusted adult or counselor."}
            </p>

            <div className="flex justify-center gap-4 pt-2">
              <a
                href="tel:112"
                className="bg-red-500 text-white px-4 py-2 rounded-full text-sm"
              >
                Call 112
              </a>

              <button
                onClick={() => setShowEmergency(false)}
                className="text-gray-600 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-xl font-semibold text-gray-700">
          Healing Space
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#e7d4c8] self-end text-gray-800"
                : "bg-white shadow-sm self-start text-gray-700"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="bg-white shadow-sm p-4 rounded-3xl text-sm w-fit">
            typing...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-[#f6f1ea] border-t border-gray-200">
        <div className="flex items-center bg-white rounded-full shadow-sm px-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === "rw"
                ? "Sangira ibyo uri gutekereza..."
                : "Share what’s on your mind..."
            }
            className="flex-1 py-3 outline-none text-sm bg-transparent"
          />
          <button
            onClick={sendMessage}
            className="text-[#c47a5a] font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}