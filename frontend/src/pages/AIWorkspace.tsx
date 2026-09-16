import React, { useEffect, useState } from 'react';
import { Bot, User, Send, CheckCircle2, Sparkles, AlertCircle, RefreshCw, BarChart2, ShieldAlert, ArrowRight, Table, Layers } from 'lucide-react';
import { eventApi, api } from '../lib/api';

export const AIWorkspace: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    executedTools?: string[];
    groundedData?: any;
    pendingAction?: any;
  }>>([]);

  const [input, setInput] = useState('');
  const [agentThinking, setAgentThinking] = useState(false);
  const [activeToolTrace, setActiveToolTrace] = useState<string[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await eventApi.getEvents();
      const list = res.data || [];
      setEvents(list);
      if (list.length > 0) {
        setSelectedEventId(list[0].id);
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Welcome to the EventFlow AI Workspace for **${list[0].name}**! Ask me questions like "How many people registered?", "Who hasn't checked in?", or "What is the feedback score?".`,
            executedTools: ['get_event', 'get_registration_statistics'],
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const currentEvent = events.find((e) => e.id === selectedEventId);

  const handleSendPrompt = async (customText?: string) => {
    const query = customText || input;
    if (!query.trim() || !selectedEventId || agentThinking) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setAgentThinking(true);
    setActiveToolTrace(['Analyzing user intent...']);

    try {
      const history = messages.concat(userMsg).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post('/api/ai/agent/chat', {
        event_id: selectedEventId,
        messages: history,
      });

      const data = res.data;
      setActiveToolTrace(data.executed_tools || []);

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.reply,
        executedTools: data.executed_tools,
        groundedData: data.grounded_data,
        pendingAction: data.pending_action,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⚠️ Failed to execute AI tool queries against Supabase. Please ensure backend is running at http://localhost:8000.',
        },
      ]);
    } finally {
      setAgentThinking(false);
    }
  };

  const handleConfirmAction = async (msgId: string, actionType: string, params: any) => {
    try {
      const res = await api.post('/api/ai/agent/action/confirm', {
        event_id: selectedEventId,
        action_type: actionType,
        params: params,
      });

      // Update message to remove pendingAction and show success reply
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                pendingAction: null,
                content: `${m.content}\n\n✅ **Action Executed Successfully**:\n${res.data.message}`,
              }
            : m
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Action execution failed');
    }
  };

  return (
    <div className="h-[85vh] flex gap-4 pb-6 overflow-hidden">
      
      {/* LEFT COLUMN: Event Selector & History */}
      <div className="w-64 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Active Event</h3>
            {loadingEvents ? (
              <div className="text-xs text-slate-500 py-2">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-xs text-slate-500 py-2">No events available</div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  const selected = events.find((x) => x.id === e.target.value);
                  setMessages([
                    {
                      id: Date.now().toString(),
                      role: 'assistant',
                      content: `Active event changed to **${selected?.name}**. Ask me any operational query!`,
                      executedTools: ['get_event'],
                    },
                  ]);
                }}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            <h4 className="text-[11px] font-semibold text-slate-400">Quick Prompt Shortcuts</h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => handleSendPrompt('How many people registered?')}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800 truncate"
              >
                📊 Total Registrations
              </button>
              <button
                onClick={() => handleSendPrompt("Who hasn't checked in?")}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800 truncate"
              >
                ⚠️ Find Absentees
              </button>
              <button
                onClick={() => handleSendPrompt('What is the current attendance rate?')}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800 truncate"
              >
                ✅ Attendance Rate
              </button>
              <button
                onClick={() => handleSendPrompt('What did students dislike in feedback?')}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800 truncate"
              >
                ⭐ Feedback Insights
              </button>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Grounded Gemini 2.5 API</span>
        </div>
      </div>

      {/* CENTER COLUMN: Main Workspace Feed */}
      <div className="flex-1 glass-panel rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden">
        
        {/* Workspace Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                EventFlow AI Workspace
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  Grounded DB Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {currentEvent ? `Active Event: ${currentEvent.name}` : 'No event selected'}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Grounded Data Tables when available */}
                {msg.groundedData?.absentees?.absentees?.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto space-y-2">
                    <div className="font-semibold text-amber-400 flex items-center gap-1.5 text-[11px]">
                      <Table className="w-3.5 h-3.5" /> Absentees Database Records ({msg.groundedData.absentees.total_absentees})
                    </div>
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-1.5">Name</th>
                          <th className="p-1.5">Email</th>
                          <th className="p-1.5">College</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {msg.groundedData.absentees.absentees.slice(0, 5).map((a: any, i: number) => (
                          <tr key={i}>
                            <td className="p-1.5 font-medium text-slate-100">{a.name}</td>
                            <td className="p-1.5">{a.email}</td>
                            <td className="p-1.5">{a.college}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Interactive Write Action Confirmation Buttons */}
                {msg.pendingAction && (
                  <div className="mt-4 p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/80 space-y-3">
                    <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                      <ShieldAlert className="w-4 h-4 text-cyan-400" />
                      <span>Organizer Action Required</span>
                    </div>
                    <p className="text-xs text-slate-300">{msg.pendingAction.prompt_text}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmAction(msg.id, msg.pendingAction.action_type, msg.pendingAction.params)}
                        className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md"
                      >
                        Confirm Action
                      </button>
                      <button
                        onClick={() =>
                          setMessages((prev) =>
                            prev.map((m) => (m.id === msg.id ? { ...m, pendingAction: null } : m))
                          )
                        }
                        className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          ))}

          {agentThinking && (
            <div className="flex gap-3 items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <span className="animate-pulse">Gemini function calling & SQL queries executing...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask EventFlow AI (e.g. 'Who hasn't checked in?', 'Summarize feedback')..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={agentThinking || !input.trim()}
              className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: Agent Tool Execution Trace */}
      <div className="w-64 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col space-y-4 shrink-0 hidden lg:flex">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Agent Activity Trace
          </h3>
          <p className="text-[10px] text-slate-500">Live function calling pipeline</p>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto">
          {activeToolTrace.length === 0 ? (
            <div className="text-xs text-slate-500 py-4 text-center">No tools executed yet.</div>
          ) : (
            activeToolTrace.map((tool, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs font-mono text-cyan-300 flex items-center gap-2 animate-in fade-in duration-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{tool}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
