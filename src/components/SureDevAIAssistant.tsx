import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
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
  AlertCircle,
  GripHorizontal,
  Move
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
  const dragControls = useDragControls();
  const [positionKey, setPositionKey] = useState(0); // key to reset position when requested

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
    <motion.div 
      key={`ai-assistant-wrapper-${positionKey}`}
      drag
      dragMomentum={false}
      dragElastic={0.05}
      dragControls={dragControls}
      dragListener={false}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none select-none"
    >
      
      {/* 1. Chat Widget Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className={`pointer-events-auto flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 mb-3 select-text ${
              isMaximized 
                ? 'w-[calc(100vw-32px)] sm:w-[600px] md:w-[650px] h-[75vh] max-h-[calc(100vh-120px)] md:h-[700px] md:max-h-[85vh]' 
                : 'w-[calc(100vw-32px)] sm:w-[380px] md:w-[420px] h-[65vh] max-h-[520px] md:h-[550px] md:max-h-[600px]'
            }`}
          >
            {/* Draggable Window Header Bar */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-brand-midnight dark:bg-slate-950 border-b border-gray-200/20 dark:border-slate-800 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-xs sm:text-sm text-white leading-tight">SureDev AI</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[10px] text-gray-400 font-mono">Guild Copilot</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">Automated Ecosystem Help</p>
                </div>
              </div>

              {/* Drag Handle Indicator & Action Toolbar */}
              <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400">
                {/* Drag Grip Pill */}
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono cursor-grab active:cursor-grabbing mr-1"
                  title="Drag anywhere from header to move window"
                >
                  <GripHorizontal size={13} className="text-emerald-400" />
                  <span className="hidden sm:inline text-[9px] text-gray-400">Move</span>
                </div>

                <button 
                  onClick={() => setPositionKey(prev => prev + 1)}
                  title="Reset window position"
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw size={14} />
                </button>
                <button 
                  onClick={handleClearHistory}
                  title="Clear conversation"
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "Standard view" : "Maximize view"}
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer hidden sm:block"
                >
                  {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-gray-50/90 dark:bg-slate-950/60 scroll-smooth overscroll-contain scrollbar-thin scrollbar-thumb-emerald-500/30 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div 
                  key={msg.id ? `${msg.id}-${idx}` : idx}
                  className={`flex gap-2.5 sm:gap-3 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    msg.sender === 'user'
                      ? 'bg-brand-midnight text-white border-white/10 dark:bg-emerald-600 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-gray-200 dark:border-slate-800'
                  }`}>
                    {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  {/* Bubble Content */}
                  <div className="space-y-1 text-left">
                    <div className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-[18px] text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-midnight text-white rounded-tr-none dark:bg-emerald-600 dark:text-white font-medium shadow-xs'
                        : 'bg-white text-gray-800 border border-gray-200 dark:bg-slate-800 dark:text-gray-200 dark:border-slate-700 rounded-tl-none shadow-xs'
                    }`}>
                      {msg.sender === 'user' ? (
                        <p className="text-xs sm:text-sm">{msg.text}</p>
                      ) : (
                        renderFormattedMessage(msg.text)
                      )}
                    </div>
                    {/* Timestamp */}
                    <p className={`text-[9px] font-mono text-gray-400 dark:text-slate-500 mt-0.5 px-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Loader */}
              {isLoading && (
                <div className="flex gap-2.5 sm:gap-3 max-w-[85%]">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-slate-800">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-[18px] rounded-tl-none shadow-xs">
                    <div className="flex items-center gap-1 py-1 px-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Drawer */}
            <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mb-2 font-medium flex items-center gap-1.5 px-1">
                <HelpCircle size={11} className="text-emerald-500" /> Suggested questions:
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-h-[85px] scrollbar-none">
                {SUGGESTED_QUESTIONS.map((question, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => handleSendMessage(question)}
                    disabled={isLoading}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-100 hover:bg-emerald-500/10 border border-gray-200 text-[10px] sm:text-[11px] font-medium text-gray-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700/80 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input Form */}
            <form 
              onSubmit={handleSubmit}
              className="p-3 sm:p-4 bg-gray-100 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask SureDev AI anything..."
                disabled={isLoading}
                className="flex-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500 transition-colors disabled:opacity-75"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-midnight hover:bg-brand-midnight/90 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 text-white flex items-center justify-center transition-colors shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Action Bubble with Draggable Capability */}
      <motion.div
        onPointerDown={(e) => !isOpen && dragControls.start(e)}
        className="pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-midnight dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shadow-lg hover:shadow-xl cursor-pointer transition-all focus:outline-none relative group"
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
                <X size={20} />
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
                <MessageSquareCode size={20} />
                {/* Pulsating unread badge dot */}
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-slate-950 border-2 border-brand-midnight dark:border-emerald-500 animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-slate-950 border-2 border-brand-midnight dark:border-emerald-500" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Tooltip on Hover */}
          {!isOpen && (
            <span className="absolute right-16 bg-brand-midnight dark:bg-slate-800 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-250 shadow-md border border-white/5 pointer-events-none mr-1.5 hidden sm:block">
              Chat with SureDev AI • Drag to reposition
            </span>
          )}
        </motion.button>
      </motion.div>

    </motion.div>
  );
};
