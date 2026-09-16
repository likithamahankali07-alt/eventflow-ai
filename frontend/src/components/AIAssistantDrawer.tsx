import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, RefreshCw, BarChart2, Megaphone, CheckCircle2 } from 'lucide-react';
import { aiAgentApi } from '../lib/api';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  eventName?: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: eventName
        ? `Hello! I'm your EventFlow Gemini Operations Agent for **${eventName}**. Ask me for real-time attendance analytics, feedback sentiment summaries, or custom marketing copy!`
        : "Hello! I'm your EventFlow Gemini AI Agent. Select an event from your dashboard or ask me general event operations questions.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(newMessages);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await aiAgentApi.chat(eventId, newMessages);
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '⚠️ Unable to connect to Gemini API. Please ensure the backend is running at http://localhost:8000 and GEMINI_API_KEY is configured.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                EventFlow Copilot
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">Gemini 2.5</span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                {eventName ? `Active: ${eventName}` : 'Global Operations Intelligence'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Chips */}
        {eventId && (
          <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex gap-2 overflow-x-auto text-xs no-scrollbar">
            <button
              onClick={() => handleSend("Summarize total registrations, attendance rate, and ratings from the database.")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Analytics</span>
            </button>
            <button
              onClick={() => handleSend("Analyze participant department and college demographics.")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Demographics</span>
            </button>
            <button
              onClick={() => handleSend("Generate a professional WhatsApp/Email announcement copy for this event.")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Announcement</span>
            </button>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-400">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              </div>
              <span className="animate-pulse">Gemini DB tools executing...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gemini AI Copilot..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
