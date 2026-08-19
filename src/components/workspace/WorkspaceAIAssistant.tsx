import React, { useState } from 'react';
import { ManagedProject, ContractMessage, ContractMilestone } from '../../types';
import { 
  Sparkles, Send, Bot, Copy, Check, MessageSquare, AlertTriangle, 
  Lightbulb, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

interface WorkspaceAIAssistantProps {
  project: ManagedProject;
  userRole: 'employer' | 'developer';
  messages: ContractMessage[];
  milestones: ContractMilestone[];
}

export const WorkspaceAIAssistant: React.FC<WorkspaceAIAssistantProps> = ({
  project,
  userRole,
  messages,
  milestones,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunCopilot = async (actionType: string, customPrompt?: string) => {
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/ai/workspace-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          projectTitle: project.title,
          userRole,
          promptText: customPrompt || prompt,
          chatHistory: messages.slice(-10).map((m) => `${m.senderName}: ${m.text}`).join('\n'),
          milestonesContext: milestones.map((m) => `${m.title} (${m.status})`).join(', '),
        }),
      });

      const data = await res.json();
      if (data.result) {
        setResponse(data.result);
      } else {
        setResponse('AI Workspace Copilot generated a response, but returned no text.');
      }
    } catch (err) {
      console.error('Error contacting AI Workspace Copilot:', err);
      setResponse('Failed to communicate with AI Workspace Copilot endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-brand-midnight to-slate-900 text-white dark:from-brand-teal dark:to-emerald-400 dark:text-brand-midnight font-bold text-xs shadow-2xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer border border-brand-teal/30"
        >
          <Sparkles className="w-4 h-4 text-brand-teal dark:text-brand-midnight animate-spin-slow" />
          <span>AI Workspace Copilot</span>
        </button>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl w-80 md:w-96 shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-brand-midnight to-slate-900 text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-brand-teal" />
              <div>
                <h4 className="text-xs font-bold font-display">AI Workspace Copilot</h4>
                <p className="text-[10px] text-slate-300">Powered by Gemini 2.5 Flash</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
          </div>

          {/* Body Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {/* Quick Action Preset Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Quick Copilot Actions
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleRunCopilot('summarize_chat')}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-brand-teal/10 hover:text-brand-teal text-gray-700 dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer border border-brand-border/60 dark:border-slate-700"
                >
                  📝 Summarize Chat
                </button>
                <button
                  onClick={() => handleRunCopilot('draft_update')}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-brand-teal/10 hover:text-brand-teal text-gray-700 dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer border border-brand-border/60 dark:border-slate-700"
                >
                  💬 Draft Progress Update
                </button>
                <button
                  onClick={() => handleRunCopilot('milestone_breakdown')}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-brand-teal/10 hover:text-brand-teal text-gray-700 dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer border border-brand-border/60 dark:border-slate-700"
                >
                  🎯 Breakdown Milestones
                </button>
              </div>
            </div>

            {/* AI Response Output */}
            {loading ? (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-brand-border/60 text-center space-y-2">
                <RefreshCw className="w-5 h-5 text-brand-teal animate-spin mx-auto" />
                <div className="text-[11px] font-bold text-brand-midnight dark:text-white">Analyzing workspace context...</div>
              </div>
            ) : response ? (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-brand-border/60 dark:border-slate-700 space-y-3 relative group">
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white dark:bg-slate-700 text-gray-500 hover:text-brand-teal transition-colors cursor-pointer shadow-xs"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <div className="text-[10px] uppercase font-bold text-brand-teal flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Copilot Recommendation
                </div>
                <div className="text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {response}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 space-y-2">
                <Bot className="w-8 h-8 text-gray-300 dark:text-slate-700 mx-auto" />
                <p className="text-[11px]">Ask Copilot to draft messages, review risks, or break down milestone deliverables.</p>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (prompt.trim()) handleRunCopilot('custom', prompt);
            }}
            className="p-3 bg-gray-50 dark:bg-slate-900 border-t border-brand-border/60 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Copilot a question..."
              className="flex-1 p-2.5 rounded-xl border border-brand-border dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-midnight dark:text-white text-xs outline-none focus:ring-1 focus:ring-brand-teal"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight font-bold cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
