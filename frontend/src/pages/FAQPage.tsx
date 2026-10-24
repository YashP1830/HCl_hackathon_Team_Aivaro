import { useState, useRef, useEffect } from 'react';
import { MessageCircleQuestion, Send, Bot, User, LifeBuoy, Mail } from 'lucide-react';
import type { FAQResponse } from '../types';
import { askFAQ } from '../api/endpoints';
import { mockApi } from '../api/mock';
import { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: FAQResponse['status'];
  supportContact?: string | null;
  sources?: FAQResponse['sources'];
}

export default function FAQPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm the library FAQ assistant. Ask me anything about borrowing, membership, policies, or library services.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = USE_MOCK
        ? await mockApi.askFAQ(question)
        : await askFAQ({ question });

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        status: result.status,
        supportContact: result.support_contact,
        sources: result.sources,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: getErrorMessage(err),
          status: 'error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircleQuestion className="w-6 h-6 text-indigo-500" />
          FAQ Assistant
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions about library policies, borrowing, and services.
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-100' : 'bg-gray-100'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-indigo-600" />
              ) : (
                <Bot className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : msg.status === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : msg.status === 'fallback'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-gray-50 text-gray-800 border border-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Support contact fallback */}
              {msg.status === 'fallback' && msg.supportContact && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-100 rounded-lg p-2">
                  <LifeBuoy className="w-4 h-4" />
                  <span>Contact support: </span>
                  <a
                    href={`mailto:${msg.supportContact}`}
                    className="inline-flex items-center gap-1 font-medium underline"
                  >
                    <Mail className="w-3 h-3" />
                    {msg.supportContact}
                  </a>
                </div>
              )}

              {/* FAQ sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  Sources: {msg.sources.map((s) => s.question).join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-500">Searching FAQs...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
