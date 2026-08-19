import React, { useState, useEffect, useRef } from 'react';
import { 
  ContractMessage, ManagedProject, ContractMilestone, 
  ContractDeliverable, ContractFile, KanbanTask, ContractMeeting 
} from '../../types';
import { dbService } from '../../lib/firebaseService';
import { 
  Send, Paperclip, Mic, Square, Smile, Pin, Search, Code, 
  Trash2, CornerDownRight, Check, CheckCheck, FileText, X, Sparkles,
  Video, Phone, LayoutDashboard, Kanban, PackageCheck, FolderGit2, Calendar,
  ShieldAlert, Star, Briefcase, ChevronRight, ChevronLeft, PanelRightClose,
  PanelRightOpen, Clock, Target, MessageSquare, ExternalLink, ShieldCheck,
  Zap, AlertCircle, ArrowLeft
} from 'lucide-react';
import { CallOverlay } from './CallOverlay';
import { VoiceNotePlayer } from './VoiceNotePlayer';

interface RealtimeChatProps {
  projectId: string;
  projectTitle: string;
  project?: ManagedProject;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer';
  isReadOnly?: boolean;
  allProjects?: ManagedProject[];
  onSelectProject?: (proj: ManagedProject) => void;
  onNavigateTab?: (tab: string) => void;
  onBack?: () => void;
  milestones?: ContractMilestone[];
  deliverables?: ContractDeliverable[];
  files?: ContractFile[];
  tasks?: KanbanTask[];
  meetings?: ContractMeeting[];
}

export const RealtimeChat: React.FC<RealtimeChatProps> = ({
  projectId,
  projectTitle,
  project,
  userId,
  userName,
  userRole,
  isReadOnly = false,
  allProjects = [],
  onSelectProject,
  onNavigateTab,
  onBack,
  milestones = [],
  deliverables = [],
  files = [],
  tasks = [],
  meetings = [],
}) => {
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ContractMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState({ language: 'typescript', code: '' });
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  
  // Layout sidebars state
  const [showRoomSidebar, setShowRoomSidebar] = useState(true);

  // Projects list state
  const [userProjects, setUserProjects] = useState<ManagedProject[]>(allProjects);
  const currentProject = project || userProjects.find(p => p.id === projectId);

  // Real-time Calling State
  const [outgoingCall, setOutgoingCall] = useState<{
    projectId: string;
    projectTitle: string;
    callType: 'audio' | 'video';
    receiverId: string;
    receiverName: string;
    receiverRole: 'employer' | 'developer';
  } | null>(null);

  // Audio Voice Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // File Upload state
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; url: string; type: string; size: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to user projects if not provided
  useEffect(() => {
    if (allProjects.length > 0) {
      setUserProjects(allProjects);
    } else {
      const unsub = dbService.subscribeManagedProjects((projs) => {
        const filtered = projs.filter(p => userRole === 'employer' ? p.employerId === userId : p.developerId === userId);
        setUserProjects(filtered);
      });
      return () => unsub();
    }
  }, [allProjects, userId, userRole]);

  // Subscribe to contract messages
  useEffect(() => {
    const unsub = dbService.subscribeContractMessages(projectId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Note Handler
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const actualType = mediaRecorder.mimeType || mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await dbService.sendContractMessage({
            projectId,
            senderId: userId,
            senderName: userName,
            senderRole: userRole,
            text: `🎙️ Voice Note (${recordingDuration}s)`,
            voiceNoteUrl: base64Audio,
          });
        };

        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission or recording error:', err);
      alert('Microphone access is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            url: dataUrl,
            type: file.type || 'application/octet-stream',
            size: file.size,
          },
        ]);
      };
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachedFiles.length === 0 && !codeSnippet.code) return;
    if (isReadOnly) return;

    const textToSend = input;
    const filesToSend = attachedFiles;
    const replyToSend = replyTo;
    const snippetToSend = codeSnippet;

    // Reset input fields immediately for snappy UI feel
    setInput('');
    setAttachedFiles([]);
    setReplyTo(null);
    setShowCodeInput(false);
    setCodeSnippet({ language: 'typescript', code: '' });

    try {
      await dbService.sendContractMessage({
        projectId,
        senderId: userId,
        senderName: userName,
        senderRole: userRole,
        text: textToSend,
        attachments: filesToSend.length > 0 ? filesToSend : undefined,
        replyToId: replyToSend?.id,
        codeSnippet: snippetToSend.code ? snippetToSend : undefined,
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    await dbService.toggleMessageReaction(messageId, projectId, emoji, userId);
    setShowEmojiPicker(null);
  };

  const handleTogglePin = async (msg: ContractMessage) => {
    await dbService.pinContractMessage(msg.id, projectId, !msg.isPinned);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      await dbService.deleteContractMessage(messageId, projectId);
    }
  };

  // Quick Action Prompt Templates (Upwork Chat Style)
  const applyPromptTemplate = (type: 'milestone' | 'meeting' | 'deliverable' | 'review') => {
    if (isReadOnly) return;
    let templateText = '';
    switch (type) {
      case 'milestone':
        templateText = `🎯 PROPOSAL: I'd like to propose a new milestone:\n• Deliverable: [Name/Task]\n• Due Date: [Target Date]\n• Amount: [Budget/Escrow Amount]`;
        break;
      case 'meeting':
        templateText = `📅 MEETING REQUEST: Let's schedule a video call to align on project requirements.\n• Proposed Time: [Date & Time]\n• Agenda: [Key Topics]`;
        break;
      case 'deliverable':
        templateText = `📦 WORK SUBMISSION: Milestone deliverable is ready for review!\n• Milestone: [Milestone Title]\n• Details: [Summary of completed work]`;
        break;
      case 'review':
        templateText = `💬 FEEDBACK REQUEST: Please review the latest updates uploaded in the workspace and share your feedback.`;
        break;
    }
    setInput(templateText);
  };

  const filteredMessages = messages.filter((m) =>
    m.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedMessages = messages.filter((m) => m.isPinned);

  const filteredRooms = userProjects.filter((p) =>
    p.title.toLowerCase().includes(roomSearch.toLowerCase()) ||
    p.employerName.toLowerCase().includes(roomSearch.toLowerCase()) ||
    p.developerName.toLowerCase().includes(roomSearch.toLowerCase())
  );

  // Milestones Progress Calculation
  const totalMilestonesCount = milestones.length;
  const completedMilestonesCount = milestones.filter(m => m.status === 'completed' || m.status === 'approved').length;
  const milestoneProgressPct = totalMilestonesCount > 0 
    ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100) 
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-none border-0 shadow-none overflow-hidden flex flex-col md:flex-row h-full w-full flex-1 relative font-sans">
      
      {/* 1. LEFT SIDEBAR: CONVERSATIONS & ACTIVE CONTRACTS DIRECTORY */}
      <div 
        className={`${
          showRoomSidebar 
            ? 'w-full flex-1 md:flex-none md:w-72 xl:w-80 border-r border-gray-200 dark:border-slate-800' 
            : 'hidden md:flex md:w-16 border-r border-gray-200 dark:border-slate-800'
        } shrink-0 bg-slate-50 dark:bg-slate-900/95 flex flex-col transition-all duration-300 relative z-20`}
      >
        {/* Rooms Header */}
        <div className="p-3.5 sm:p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-white/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2 overflow-hidden">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700/80 text-xs font-bold transition-all cursor-pointer shrink-0"
                title="Back to Dashboard"
              >
                <ArrowLeft size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-sm shrink-0">
              💬
            </div>
            {showRoomSidebar && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white truncate">
                  SureDev Workspaces
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate">
                  {userProjects.length} Active Contracts
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowRoomSidebar(!showRoomSidebar)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors"
            title={showRoomSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {showRoomSidebar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Room Search Box */}
        {showRoomSidebar && (
          <div className="p-3.5 border-b border-gray-200 dark:border-slate-800 shrink-0 bg-white/40 dark:bg-slate-950/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search contracts..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700/80 bg-white dark:bg-slate-950 text-xs text-gray-900 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 dark:placeholder-slate-500"
              />
            </div>
          </div>
        )}

        {/* Project Channels List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-gray-500 dark:text-slate-500 font-medium">
              No matching contracts found in workspace.
            </div>
          ) : (
            filteredRooms.map((proj, idx) => {
              const isActive = proj.id === projectId;
              const counterpartyName = userRole === 'employer' ? proj.developerName : proj.employerName;

              return (
                <button
                  key={proj.id ? `${proj.id}-${idx}` : idx}
                  onClick={() => {
                    if (onSelectProject) onSelectProject(proj);
                    if (window.innerWidth < 768) {
                      setShowRoomSidebar(false);
                    }
                  }}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 cursor-pointer group ${
                    isActive
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/40 text-gray-900 dark:text-white shadow-xs'
                      : 'hover:bg-gray-200/60 dark:hover:bg-slate-800/80 border border-transparent text-gray-700 dark:text-slate-300'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                      isActive ? 'bg-brand-green text-white dark:bg-emerald-500 dark:text-slate-950' : 'bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-300 dark:border-slate-700'
                    }`}>
                      {counterpartyName?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute -bottom-0.5 -right-0.5 shadow-xs" />
                  </div>

                  {showRoomSidebar && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{proj.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold shrink-0 ${
                          proj.status === 'Completed' ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/30' : 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {proj.status || 'Active'}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-500 dark:text-slate-400'}`}>
                        With {counterpartyName}
                      </p>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CENTER PANEL: MAIN CHAT FEED & PROMPT COMPOSER */}
      <div 
        className={`${
          showRoomSidebar ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col min-w-0 bg-gray-50 dark:bg-slate-950 relative h-full`}
      >
        {/* Chat Main Header */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900/90 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Conversations Toggle Button */}
            <button
              onClick={() => setShowRoomSidebar(true)}
              className="p-1.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 md:hidden cursor-pointer shrink-0 flex items-center gap-1 text-xs font-bold"
              title="View Conversations"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Rooms</span>
            </button>

            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white truncate">
                {currentProject?.title || (projectTitle && projectTitle !== 'SureDev Main Chat System' ? projectTitle : 'Workspace Channel')}
              </h3>
              {(currentProject?.developerName || currentProject?.employerName) && (
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                  Participant: <strong className="text-gray-800 dark:text-slate-200 font-semibold">{userRole === 'employer' ? currentProject?.developerName : currentProject?.employerName}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Filter input on desktop */}
            <div className="relative w-36 sm:w-40 hidden sm:block">
              <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-900 text-xs text-gray-900 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Functional Audio Call Button */}
            <button
              onClick={() => {
                const otherMsg = messages.slice().reverse().find(m => m.senderId && m.senderId !== userId);
                const receiverId = otherMsg?.senderId || (userRole === 'employer' ? (currentProject?.developerId || 'dev_target') : (currentProject?.employerId || 'emp_target'));
                const receiverName = otherMsg?.senderName || (userRole === 'employer' ? (currentProject?.developerName || 'Developer Lead') : (currentProject?.employerName || 'Employer Client'));
                const receiverRole = userRole === 'employer' ? 'developer' : 'employer';
                setOutgoingCall({
                  projectId: currentProject?.id || projectId,
                  projectTitle: currentProject?.title || projectTitle,
                  callType: 'audio',
                  receiverId,
                  receiverName,
                  receiverRole
                });
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Start Real-time WebRTC Audio Call"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Audio</span>
            </button>

            {/* Functional Video Call Button */}
            <button
              onClick={() => {
                const otherMsg = messages.slice().reverse().find(m => m.senderId && m.senderId !== userId);
                const receiverId = otherMsg?.senderId || (userRole === 'employer' ? (currentProject?.developerId || 'dev_target') : (currentProject?.employerId || 'emp_target'));
                const receiverName = otherMsg?.senderName || (userRole === 'employer' ? (currentProject?.developerName || 'Developer Lead') : (currentProject?.employerName || 'Employer Client'));
                const receiverRole = userRole === 'employer' ? 'developer' : 'employer';
                setOutgoingCall({
                  projectId: currentProject?.id || projectId,
                  projectTitle: currentProject?.title || projectTitle,
                  callType: 'video',
                  receiverId,
                  receiverName,
                  receiverRole
                });
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Start Real-time WebRTC HD Video Call"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Video Call</span>
            </button>
          </div>
        </div>

        {/* Pinned Messages Bar */}
        {pinnedMessages.length > 0 && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-2 shrink-0 font-bold">
              <Pin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Pinned Message ({pinnedMessages.length}):</span>
            </div>
            <div className="truncate text-gray-700 dark:text-slate-300 italic">
              "{pinnedMessages[pinnedMessages.length - 1].text}"
            </div>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 bg-gray-50/80 dark:bg-slate-950/60">
          
          {/* PROMINENT CONTRACT ACCEPTANCE CARD */}
          <div className="my-3 sm:my-4 flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-gray-900 dark:text-slate-100 shadow-md space-y-3 sm:space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-emerald-500/20 dark:border-emerald-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    ✓
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                    CONTRACT ACCEPTED & ACTIVATED
                  </span>
                </div>
                <span className="text-[11px] font-mono text-gray-500 dark:text-slate-400">
                  {currentProject?.acceptedAt ? new Date(currentProject.acceptedAt).toLocaleDateString() : 'Aug 9, 2026'}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase">
                  {currentProject?.title || projectTitle}
                </h3>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:gap-3 text-xs bg-gray-50 dark:bg-slate-950/90 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-800">
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Employer</span>
                    <strong className="text-gray-900 dark:text-white font-semibold">{currentProject?.employerName || 'Client Employer'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Developer</span>
                    <strong className="text-gray-900 dark:text-white font-semibold">{currentProject?.developerName || 'Michael Stitches'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Status</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 uppercase">
                      {currentProject?.status || 'ACCEPTED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Budget / Escrow</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{currentProject?.budget || '$1,500.00'}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400 block">
                  AGREEMENT & SCOPE OF WORK
                </span>
                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-sans max-h-32 overflow-y-auto">
                  {currentProject?.description || "Contractual agreement accepted by both parties. Deliverables, escrow milestone payments, and intellectual property terms are active."}
                </div>
              </div>

              {onNavigateTab && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onNavigateTab('contract')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>VIEW FULL AGREEMENT</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-slate-500 space-y-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-slate-400">No additional message history yet.</p>
              <p className="text-[11px] max-w-sm mx-auto text-gray-500 dark:text-slate-500">
                Send a message or use quick prompts below to coordinate work on this contract.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isMe = msg.senderId === userId;
              const replyTarget = messages.find((m) => m.id === msg.replyToId);
              const messageKey = msg.id ? `${msg.id}-${idx}` : `msg-${idx}`;

              if (msg.isSystemMessage || msg.senderRole === 'system') {
                return (
                  <div key={messageKey} className="my-3 sm:my-4 flex flex-col items-center justify-center w-full">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 text-gray-900 dark:text-slate-100 shadow-md space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 dark:border-emerald-500/30">
                        <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" /> SYSTEM NOTIFICATION
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-slate-200">{msg.text}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={messageKey}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 group relative`}
                >
                  {/* Meta Header */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400 px-1">
                    <span className="font-bold text-gray-700 dark:text-slate-300">{msg.senderName}</span>
                    <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-400 font-mono text-[9px] uppercase border border-gray-300 dark:border-slate-700">
                      {msg.senderRole}
                    </span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Reply Target */}
                  {replyTarget && (
                    <div className="text-xs p-2.5 bg-gray-100 dark:bg-slate-800/90 rounded-xl border-l-2 border-emerald-500 text-gray-700 dark:text-slate-300 max-w-md flex items-center gap-2">
                      <CornerDownRight className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-gray-900 dark:text-white">{replyTarget.senderName}:</span>
                      <span className="truncate">{replyTarget.text}</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-3 sm:p-4 rounded-2xl max-w-[88%] sm:max-w-lg text-xs sm:text-sm leading-relaxed shadow-xs relative ${
                      isMe
                        ? 'bg-brand-green text-white dark:bg-emerald-600 font-medium rounded-tr-xs'
                        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-tl-xs'
                    }`}
                  >
                    {msg.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-amber-300 absolute top-2.5 right-2.5" />
                    )}

                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Code Snippet */}
                    {msg.codeSnippet && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                        <div className="text-[10px] uppercase text-slate-400 border-b border-slate-800 pb-1 mb-2 font-sans font-bold flex items-center justify-between">
                          <span>{msg.codeSnippet.language}</span>
                          <span className="text-[9px] text-emerald-400">Snippet</span>
                        </div>
                        <pre>{msg.codeSnippet.code}</pre>
                      </div>
                    )}

                    {/* Voice Note Player */}
                    {msg.voiceNoteUrl && (
                      <div className="mt-2.5">
                        <VoiceNotePlayer src={msg.voiceNoteUrl} />
                      </div>
                    )}

                    {/* File Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 border-t border-white/20 dark:border-white/15 pt-2">
                        {msg.attachments.map((att, i) => (
                          <a
                            key={`${att.name}-${i}`}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-2 rounded-xl bg-black/10 dark:bg-black/20 hover:bg-black/20 text-xs font-semibold truncate transition-colors"
                          >
                            <FileText className="w-4 h-4 shrink-0 text-emerald-300" />
                            <span className="truncate">{att.name}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Reactions */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5 pt-1 border-t border-white/20 dark:border-white/15">
                        {Object.entries(msg.reactions).map(([emoji, uids], rIdx) => (
                          <button
                            key={`${emoji}-${rIdx}`}
                            onClick={() => handleAddReaction(msg.id, emoji)}
                            className="px-2 py-0.5 rounded-lg bg-black/10 dark:bg-black/25 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{emoji}</span>
                            <span>{(uids as string[]).length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover Actions */}
                  {!isReadOnly && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 z-10">
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                        className="hover:text-emerald-600 dark:hover:text-emerald-400 p-1 cursor-pointer"
                        title="Add Reaction"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setReplyTo(msg)}
                        className="hover:text-emerald-600 dark:hover:text-emerald-400 p-1 cursor-pointer"
                        title="Reply"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTogglePin(msg)}
                        className="hover:text-amber-500 dark:hover:text-amber-400 p-1 cursor-pointer"
                        title={msg.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      {isMe && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="hover:text-rose-500 dark:hover:text-rose-400 p-1 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Emoji Picker Popup */}
                  {showEmojiPicker === msg.id && (
                    <div className="flex gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 z-20">
                      {['👍', '❤️', '🚀', '🎉', '👀'].map((emoji, eIdx) => (
                        <button
                          key={`${emoji}-${eIdx}`}
                          onClick={() => handleAddReaction(msg.id, emoji)}
                          className="hover:scale-125 transition-transform text-lg p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Code Snippet Box */}
        {showCodeInput && (
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
              <span className="flex items-center gap-1.5"><Code className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Attach Code Snippet</span>
              <button onClick={() => setShowCodeInput(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              rows={3}
              value={codeSnippet.code}
              onChange={(e) => setCodeSnippet({ ...codeSnippet, code: e.target.value })}
              placeholder="Paste code snippet here..."
              className="w-full p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Reply Banner */}
        {replyTo && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-xs flex items-center justify-between text-gray-900 dark:text-white border-t border-emerald-200 dark:border-emerald-500/20 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Replying to <strong className="text-emerald-700 dark:text-emerald-300">{replyTo.senderName}</strong>:</span>
              <span className="italic truncate text-gray-600 dark:text-slate-300">"{replyTo.text}"</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="px-4 py-2 bg-gray-100 dark:bg-slate-900 text-xs flex flex-wrap gap-2 border-t border-gray-200 dark:border-slate-800 shrink-0">
            {attachedFiles.map((f, i) => (
              <span key={i} className="px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-2 font-bold text-gray-800 dark:text-slate-200">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {f.name}
                <button onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))} className="text-rose-500 cursor-pointer hover:text-rose-600">✕</button>
              </span>
            ))}
          </div>
        )}

        {/* Input Composer Footer */}
        {!isReadOnly ? (
          <form onSubmit={handleSendMessage} className="p-2.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer hidden sm:block"
              title="Attach Code Snippet"
            >
              <Code className="w-4 h-4" />
            </button>

            {/* Voice Note */}
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="px-2.5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse cursor-pointer shrink-0"
              >
                <Square className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Rec</span> ({recordingDuration}s)
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Record Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message, proposal..."
              className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400 dark:placeholder-slate-500"
            />

            <button
              type="submit"
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        ) : (
          <div className="p-4 bg-white dark:bg-slate-900 text-center text-xs text-gray-500 dark:text-slate-400 font-bold shrink-0 border-t border-gray-200 dark:border-slate-800">
            Contract Completed. Messaging is locked in Read-Only mode.
          </div>
        )}
      </div>

      {/* Real-time WebRTC Audio & Video Calling Overlay */}
      <CallOverlay
        currentUserId={userId}
        currentUserName={userName}
        currentUserRole={userRole}
        activeProject={currentProject}
        outgoingCallData={outgoingCall}
        onCloseCall={() => setOutgoingCall(null)}
      />

    </div>
  );
};
