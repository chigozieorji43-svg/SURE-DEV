import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquareCode, 
  Send, 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Sparkles, 
  HelpCircle, 
  User, 
  Bot, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { aiService, ChatMessage } from '../services/aiService';

export const SureDevAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const savedHistory = aiService.getChatHistory();
    if (savedHistory && savedHistory.length > 0) {
      setMessages(savedHistory);
    } else {
      // Add default welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome-msg',
        sender: 'assistant',
        text: "Welcome to **SureDev AI**! I am your ecosystem copilot, designed by the Abia Tech Guild to help you navigate profiles, local/global hiring, peer-to-peer collaboration, and general platform features.\n\nHow can I help you build, hire, or connect today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Save history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      aiService.saveChatHistory(messages);
    }
  }, [messages]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await aiService.sendMessage(textToSend, [...messages, userMessage]);
      
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: "I apologize, but I encountered an issue communicating with the backend. Please check your internet connection or try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      aiService.clearChatHistory();
      const welcomeMessage: ChatMessage = {
        id: 'welcome-msg',
        sender: 'assistant',
        text: "Welcome to **SureDev AI**! I am your ecosystem copilot, designed by the Abia Tech Guild to help you navigate profiles, local/global hiring, peer-to-peer collaboration, and general platform features.\n\nHow can I help you build, hire, or connect today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
    }
  };

  const SUGGESTED_QUESTIONS = [
    "How do I setup a profile?",
    "How can employers find developers?",
    "How does Google Sync work?",
    "What is the Collaboration Hub?",
    "How do I hire a developer?",
    "Password recovery help"
  ];

  const renderFormattedMessage = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      let isBullet = false;
      let cleanLine = line;
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        isBullet = true;
        cleanLine = line.trim().substring(2);
      }

      // Replace bold formatting **text** with JSX <strong>text</strong>
      const parts = [];
      let currentIdx = 0;
      while (currentIdx < cleanLine.length) {
        const startIdx = cleanLine.indexOf('**', currentIdx);
        if (startIdx === -1) {
          parts.push(cleanLine.substring(currentIdx));
          break;
        }
        parts.push(cleanLine.substring(currentIdx, startIdx));
        const endIdx = cleanLine.indexOf('**', startIdx + 2);
        if (endIdx === -1) {
          parts.push(cleanLine.substring(startIdx));
          break;
        }
        parts.push(
          <strong key={startIdx} className="font-bold text-gray-900 dark:text-emerald-400">
            {cleanLine.substring(startIdx + 2, endIdx)}
          </strong>
        );
        currentIdx = endIdx + 2;
      }

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex gap-2 ml-1.5 my-1 leading-relaxed text-[13px] md:text-sm text-gray-700 dark:text-gray-300">
            <span className="text-brand-green font-bold select-none">•</span>
            <span className="flex-1">{parts}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} className="my-1.5 leading-relaxed text-[13px] md:text-sm text-gray-700 dark:text-gray-300 min-h-[0.75rem]">
          {parts}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* 1. Chat Widget Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className={`pointer-events-auto flex flex-col bg-white dark:bg-[#0B1311] border border-brand-border dark:border-white/10 rounded-[24px] shadow-premium-hover overflow-hidden transition-all duration-300 fixed bottom-[88px] left-4 right-4 md:left-auto md:right-6 md:bottom-24 ${
              isMaximized 
                ? 'w-auto md:w-[650px] h-[75vh] max-h-[calc(100vh-140px)] md:h-[700px] md:max-h-[85vh]' 
                : 'w-auto md:w-[400px] h-[60vh] max-h-[500px] md:h-[550px] md:max-h-[600px]'
            }`}
          >
            {/* Window Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-brand-midnight dark:bg-[#040E0B] border-b border-brand-border dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-white leading-tight">SureDev AI</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping" />
                      <span className="text-[10px] text-gray-400 font-mono">Guild Copilot</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">Automated Ecosystem Help</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 text-gray-400">
                <button 
                  onClick={handleClearHistory}
                  title="Clear conversation"
                  className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "Standard view" : "Maximize view"}
                  className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer hidden md:block"
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-brand-warm-white/40 dark:bg-[#060D0B]/40 scroll-smooth overscroll-contain scrollbar-thin scrollbar-thumb-brand-green/30 scrollbar-track-transparent">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    msg.sender === 'user'
                      ? 'bg-brand-midnight text-white border-white/10 dark:bg-brand-green dark:border-brand-green/20'
                      : 'bg-white dark:bg-[#0B1311] text-brand-green border-brand-border dark:border-white/10'
                  }`}>
                    {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
                  </div>

                  {/* Bubble Content */}
                  <div className="space-y-1 text-left">
                    <div className={`px-4 py-3 rounded-[18px] text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-midnight text-white rounded-tr-none dark:bg-[#101D1A] dark:text-gray-100'
                        : 'bg-white text-gray-800 border border-brand-border dark:bg-[#0D1815] dark:text-gray-300 dark:border-brand-green/10 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.sender === 'user' ? (
                        <p className="text-[13px] md:text-sm">{msg.text}</p>
                      ) : (
                        renderFormattedMessage(msg.text)
                      )}
                    </div>
                    {/* Timestamp */}
                    <p className={`text-[9px] font-mono text-gray-400 mt-0.5 px-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Loader */}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#0B1311] text-brand-green border border-brand-border dark:border-white/10">
                    <Bot size={15} />
                  </div>
                  <div className="bg-white border border-brand-border dark:bg-[#0D1815] dark:border-brand-green/10 px-4 py-3 rounded-[18px] rounded-tl-none shadow-sm">
                    <div className="flex items-center gap-1 py-1 px-0.5">
                      <span className="w-2 h-2 rounded-full bg-brand-green animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-brand-green animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-brand-green animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Drawer */}
            <div className="px-4 py-3 bg-white dark:bg-[#0B1311] border-t border-brand-border dark:border-white/5">
              <p className="text-[10px] text-gray-400 dark:text-gray-400 mb-2 font-medium flex items-center gap-1.5 px-1">
                <HelpCircle size={11} className="text-brand-green" /> Suggested questions:
              </p>
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-h-[85px] scrollbar-none">
                {SUGGESTED_QUESTIONS.map((question, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => handleSendMessage(question)}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-full bg-brand-warm-white hover:bg-brand-green/10 border border-brand-border hover:border-brand-green/30 text-[11px] font-medium text-gray-600 dark:bg-[#0D1815] dark:text-gray-300 dark:border-white/5 dark:hover:bg-brand-green/10 dark:hover:border-brand-green/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input Form */}
            <form 
              onSubmit={handleSubmit}
              className="p-4 bg-brand-warm-white dark:bg-[#060D0B] border-t border-brand-border dark:border-white/5 flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask SureDev AI anything..."
                disabled={isLoading}
                className="flex-1 bg-white dark:bg-[#0B1311] border border-brand-border dark:border-white/10 rounded-xl px-4 py-3 text-sm text-brand-midnight dark:text-white placeholder-gray-400 outline-none focus:border-brand-green transition-colors disabled:opacity-75"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-11 h-11 rounded-xl bg-brand-midnight hover:bg-brand-midnight/90 dark:bg-brand-green dark:hover:bg-emerald-600 text-white flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Action Bubble */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto w-14 h-14 rounded-full bg-brand-midnight dark:bg-brand-green text-white flex items-center justify-center shadow-premium hover:shadow-premium-hover cursor-pointer transition-all focus:outline-none relative group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="chat-icon"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquareCode size={22} />
              {/* Pulsating unread badge dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-green dark:bg-white border-2 border-brand-midnight dark:border-brand-green animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-green dark:bg-white border-2 border-brand-midnight dark:border-brand-green" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Tooltip on Hover */}
        {!isOpen && (
          <span className="absolute right-16 bg-brand-midnight text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-250 shadow-md border border-white/5 pointer-events-none mr-1.5">
            Chat with SureDev AI
          </span>
        )}
      </motion.button>

    </div>
  );
};
