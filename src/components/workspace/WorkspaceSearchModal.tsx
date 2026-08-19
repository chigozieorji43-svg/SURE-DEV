import React, { useState, useMemo } from 'react';
import { 
  ManagedProject, ContractMessage, ContractFile, ContractMilestone, 
  ContractDeliverable, KanbanTask, ContractMeeting, ContractDispute, GlobalSearchResult 
} from '../../types';
import { 
  Search, FileText, MessageSquare, Kanban, Target, PackageCheck, 
  FolderGit2, Video, Star, ShieldAlert, ArrowRight, X, Calendar, Filter
} from 'lucide-react';

interface WorkspaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ManagedProject;
  messages: ContractMessage[];
  files: ContractFile[];
  milestones: ContractMilestone[];
  deliverables: ContractDeliverable[];
  tasks: KanbanTask[];
  meetings: ContractMeeting[];
  disputes: ContractDispute[];
  onNavigateTab: (tabId: string) => void;
}

export const WorkspaceSearchModal: React.FC<WorkspaceSearchModalProps> = ({
  isOpen,
  onClose,
  project,
  messages,
  files,
  milestones,
  deliverables,
  tasks,
  meetings,
  disputes,
  onNavigateTab,
}) => {
  const [queryText, setQueryText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const searchResults = useMemo(() => {
    if (!queryText.trim()) return [];

    const q = queryText.toLowerCase();
    const results: GlobalSearchResult[] = [];

    // 1. Search Messages
    messages.forEach((m) => {
      if (m.text.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q)) {
        results.push({
          id: m.id,
          itemType: 'message',
          title: `Chat from ${m.senderName}`,
          snippet: m.text,
          date: m.timestamp,
          authorName: m.senderName,
          tabId: 'chat',
        });
      }
    });

    // 2. Search Vault Files
    files.forEach((f) => {
      if (f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q))) {
        results.push({
          id: f.id,
          itemType: 'file',
          title: f.name,
          snippet: f.description || `Vault file (${f.category}) - ${(f.size / 1024 / 1024).toFixed(2)} MB`,
          date: f.uploadedAt,
          authorName: f.uploadedByName,
          tabId: 'files',
        });
      }
    });

    // 3. Search Milestones
    milestones.forEach((ms) => {
      if (ms.title.toLowerCase().includes(q) || ms.description.toLowerCase().includes(q)) {
        results.push({
          id: ms.id,
          itemType: 'milestone',
          title: `Milestone: ${ms.title}`,
          snippet: `${ms.description} • Status: ${ms.status} • Amount: $${ms.amount}`,
          date: ms.dueDate,
          tabId: 'milestones',
        });
      }
    });

    // 4. Search Deliverables
    deliverables.forEach((d) => {
      if (d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)) {
        results.push({
          id: d.id,
          itemType: 'deliverable',
          title: `Deliverable: ${d.title}`,
          snippet: d.description,
          date: d.submittedAt,
          authorName: d.submittedByName,
          tabId: 'deliverables',
        });
      }
    });

    // 5. Search Tasks
    tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))) {
        results.push({
          id: t.id,
          itemType: 'task',
          title: `Task: ${t.title}`,
          snippet: `${t.description || 'No detailed description'} • Priority: ${t.priority}`,
          date: t.updatedAt,
          authorName: t.assigneeName,
          tabId: 'kanban',
        });
      }
    });

    // 6. Search Meetings
    meetings.forEach((m) => {
      if (m.title.toLowerCase().includes(q) || (m.notes && m.notes.toLowerCase().includes(q))) {
        results.push({
          id: m.id,
          itemType: 'meeting',
          title: `Call: ${m.title}`,
          snippet: m.notes || `Scheduled video meeting on ${m.scheduledAt}`,
          date: m.scheduledAt,
          tabId: 'meeting',
        });
      }
    });

    // 7. Search Contract
    if (project.title.toLowerCase().includes(q) || project.scopeDescription.toLowerCase().includes(q)) {
      results.push({
        id: project.id,
        itemType: 'contract',
        title: `Contract Spec: ${project.title}`,
        snippet: project.scopeDescription,
        date: project.createdAt,
        tabId: 'contract',
      });
    }

    if (selectedCategory === 'all') return results;
    return results.filter((r) => r.itemType === selectedCategory);
  }, [queryText, selectedCategory, messages, files, milestones, deliverables, tasks, meetings, project]);

  if (!isOpen) return null;

  const handleSelectResult = (res: GlobalSearchResult) => {
    onNavigateTab(res.tabId);
    onClose();
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'file': return <FolderGit2 className="w-4 h-4 text-indigo-500" />;
      case 'milestone': return <Target className="w-4 h-4 text-brand-teal" />;
      case 'deliverable': return <PackageCheck className="w-4 h-4 text-emerald-500" />;
      case 'task': return <Kanban className="w-4 h-4 text-amber-500" />;
      case 'meeting': return <Video className="w-4 h-4 text-purple-500" />;
      case 'contract': return <FileText className="w-4 h-4 text-rose-500" />;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-fade-in max-h-[80vh] flex flex-col">
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-gray-400 absolute left-4" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search messages, files, tasks, milestones, deliverables, call notes... (Cmd+K)"
            autoFocus
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-brand-border/60 dark:border-slate-700 text-sm font-bold text-brand-midnight dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
          {queryText && (
            <button
              onClick={() => setQueryText('')}
              className="absolute right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'message', label: 'Chat Messages' },
            { id: 'file', label: 'Vault Files' },
            { id: 'task', label: 'Kanban Tasks' },
            { id: 'milestone', label: 'Milestones' },
            { id: 'deliverable', label: 'Deliverables' },
            { id: 'meeting', label: 'Video Calls' },
            { id: 'contract', label: 'Contract Spec' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {!queryText.trim() ? (
            <div className="text-center py-12 text-xs text-gray-400 space-y-2">
              <Search className="w-8 h-8 text-gray-300 dark:text-slate-700 mx-auto" />
              <p>Type keywords to search across all workspace modules</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400">
              No matching workspace items found for "{queryText}"
            </div>
          ) : (
            searchResults.map((res, idx) => (
              <div
                key={`${res.itemType}-${res.id || idx}-${idx}`}
                onClick={() => handleSelectResult(res)}
                className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-brand-teal/5 dark:hover:bg-slate-800 border border-brand-border/60 dark:border-slate-800 flex items-start justify-between gap-3 cursor-pointer group transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-brand-border/40 mt-0.5">
                    {getItemIcon(res.itemType)}
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-xs text-brand-midnight dark:text-white group-hover:text-brand-teal transition-colors flex items-center gap-2">
                      <span>{res.title}</span>
                      {res.authorName && (
                        <span className="text-[10px] text-gray-400 font-normal">
                          by {res.authorName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2">
                      {res.snippet}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-400 whitespace-nowrap">
                  <span>{new Date(res.date).toLocaleDateString()}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
