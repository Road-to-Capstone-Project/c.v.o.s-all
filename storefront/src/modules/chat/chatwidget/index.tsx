"use client"
import { useState } from "react"

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<string[]>([])

  const handleSendMessage = async () => {
    if (!message.trim()) return

    setMessages((prev) => [...prev, `You: ${message}`])
    const aiResponse = `AI: I received: "${message}"`
    setMessage("")

    setTimeout(() => {
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      <div
        className={`w-[500px] h-[600px] bg-white rounded-lg shadow-xl flex flex-col mb-4 absolute bottom-[2.5rem] right-[0.5rem] transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Chat Header */}
        <div className="bg-black text-white p-4 rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg font-semibold">AI Assistant</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:text-gray-300 transition-colors text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 bg-gray-50 overflow-y-auto flex flex-col gap-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.startsWith("You: ") ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-[80%] break-words whitespace-pre-wrap ${
                  msg.startsWith("You: ")
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {msg.replace(/^(You|AI): /, "")} {/* Remove the prefix */}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask me anything..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
